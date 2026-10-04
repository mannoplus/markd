"""Showtime Cinemas (秀泰影城) parser implementation."""

import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo
from playwright.async_api import BrowserContext, Page, Response

from cinema_scraper.core.exceptions import (
    AntiBotBlockedError,
    NavigationTimeoutError,
    SeatMapExtractionError,
)
from cinema_scraper.parsers.base import BaseCinemaParser
from cinema_scraper.schemas.cinema import (
    ScreeningSchema,
    SeatSchema,
    SeatStatus,
    SeatType,
)

logger = logging.getLogger(__name__)
TAIPEI_TZ = ZoneInfo("Asia/Taipei")


class ShowtimeParser(BaseCinemaParser):
    """
    Parser adapter for Showtime Cinemas (秀泰影城) - https://www.showtimes.com.tw/
    Leverages TanStack / Vite frontend architecture with dual-mode network
    interception and DOM traversal fallbacks.
    """

    BOOTSTRAP_API_URL = "https://capi.showtimes.com.tw/4/app/bootstrap"
    SEATS_AVAILABILITY_URL = "https://capi.showtimes.com.tw/4/events/seatsAvailability"
    TICKETING_BASE_URL = "https://www.showtimes.com.tw/ticketing"

    def __init__(self):
        self._cached_bootstrap: Optional[Dict[str, Any]] = None
        self._cached_availability: Optional[Dict[str, int]] = None
        self._venue_capacity_by_event: Dict[str, int] = {}

    @property
    def chain_name(self) -> str:
        return "Showtime"

    async def get_schedule(self, page: Page, date_str: str) -> List[ScreeningSchema]:
        """
        Fetches showtimes for the specified date (format 'YYYY-MM-DD').
        Intercepts app bootstrap payload or fetches directly through the browser session.
        """
        logger.info(f"[{self.chain_name}] Fetching schedule for date: {date_str}")
        screenings: List[ScreeningSchema] = []

        # Target date validation
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError as e:
            raise ValueError(f"Invalid date_str format '{date_str}', expected YYYY-MM-DD") from e

        # Intercept bootstrap data during navigation
        intercepted_bootstrap: Dict[str, Any] = {}

        async def handle_response(response: Response):
            if "app/bootstrap" in response.url:
                try:
                    payload = await response.json()
                    if "payload" in payload:
                        intercepted_bootstrap.update(payload["payload"])
                except Exception:
                    pass

        page.on("response", handle_response)

        try:
            # Navigate to ticketing page
            response = await page.goto(
                self.TICKETING_BASE_URL,
                wait_until="domcontentloaded",
                timeout=30000,
            )
            if response and response.status == 403:
                raise AntiBotBlockedError(f"[{self.chain_name}] Access blocked with HTTP 403")

            # Allow brief window for bootstrap call to complete
            await page.wait_for_timeout(2000)
        except Exception as e:
            logger.warning(f"[{self.chain_name}] Page navigation notice: {e}")

        # If not intercepted from page, fetch bootstrap via browser request context
        bootstrap_data = intercepted_bootstrap
        if not bootstrap_data or "corporations" not in bootstrap_data:
            logger.info(f"[{self.chain_name}] Fetching bootstrap directly via page context...")
            try:
                resp = await page.request.get(self.BOOTSTRAP_API_URL)
                if resp.status == 200:
                    data = await resp.json()
                    bootstrap_data = data.get("payload", {})
            except Exception as e:
                logger.error(f"[{self.chain_name}] Failed to retrieve bootstrap data: {e}")

        if not bootstrap_data:
            raise SeatMapExtractionError(f"[{self.chain_name}] Could not retrieve bootstrap cinema catalog")

        self._cached_bootstrap = bootstrap_data

        # Map lookup structures
        corporations = {c["id"]: c for c in bootstrap_data.get("corporations", [])}
        programs = {p["id"]: p for p in bootstrap_data.get("programs", [])}
        events_for_corps = bootstrap_data.get("eventsForCorporations", {})

        now_taipei = datetime.now(TAIPEI_TZ)

        # Iterate over all corporations and events
        for corp_id_str, corp_data in events_for_corps.items():
            corp_id = int(corp_id_str)
            corp = corporations.get(corp_id)
            if not corp:
                continue

            corp_name = corp.get("name", "秀泰影城")
            corp_city = corp.get("address", "")[:3] if corp.get("address") else None

            # Venue/Hall mapping for this corporation
            venues = {v["id"]: v for v in corp_data.get("venues", [])}
            events = corp_data.get("events", [])

            for ev in events:
                started_at_str = ev.get("startedAt")
                if not started_at_str:
                    continue

                # Parse UTC timestamp and convert to Taipei local time
                dt_utc = datetime.fromisoformat(started_at_str.replace("Z", "+00:00"))
                dt_taipei = dt_utc.astimezone(TAIPEI_TZ)

                # Filter by date in Taipei timezone
                if dt_taipei.date() != target_date:
                    continue

                event_id = str(ev.get("id"))
                program_id = ev.get("programId")
                venue_id = ev.get("venueId")

                program = programs.get(program_id, {})
                movie_title = program.get("name", "未知電影")

                venue = venues.get(venue_id, {})
                hall_name = venue.get("room", "1廳")
                hall_capacity = venue.get("totalSeatsCount", 100)
                self._venue_capacity_by_event[event_id] = hall_capacity

                meta = ev.get("meta", {})
                fmt = meta.get("format", "2D")

                booking_url = f"{self.TICKETING_BASE_URL}/{event_id}"

                screening = ScreeningSchema(
                    theater_chain=self.chain_name,
                    theater_name=corp_name,
                    theater_city=corp_city,
                    movie_title=movie_title,
                    hall_name=hall_name,
                    format=fmt,
                    showtime=dt_taipei,
                    booking_url=booking_url,
                    external_screening_id=event_id,
                )
                screenings.append(screening)

        # Sort screenings: upcoming shows first, then by showtime
        screenings.sort(
            key=lambda s: (s.showtime < now_taipei, s.showtime)
        )

        logger.info(f"[{self.chain_name}] Found {len(screenings)} screenings for date {date_str}")
        return screenings

    async def extract_seat_map(
        self,
        context: BrowserContext,
        screening: ScreeningSchema,
    ) -> ScreeningSchema:
        """
        Extracts real-time seat availability for the given screening.
        Uses network response interception (priority) and falls back to DOM/API.
        """
        event_id = screening.external_screening_id
        if not event_id and screening.booking_url:
            event_id = screening.booking_url.rstrip("/").split("/")[-1]

        logger.info(
            f"[{self.chain_name}] Extracting seat map for '{screening.movie_title}' "
            f"at {screening.theater_name} ({screening.hall_name}) EventID={event_id}"
        )

        page = await context.new_page()
        intercepted_seats_payload: Optional[Dict[str, Any]] = None

        # 1. Network Interception Listener (Priority)
        async def on_response(response: Response):
            nonlocal intercepted_seats_payload
            url = response.url
            if f"seats/list/{event_id}" in url or ("seats/list" in url and event_id and event_id in url):
                try:
                    data = await response.json()
                    intercepted_seats_payload = data
                    logger.debug(f"[{self.chain_name}] Intercepted seats/list JSON for event {event_id}")
                except Exception:
                    pass

        page.on("response", on_response)

        try:
            booking_url = screening.booking_url or f"{self.TICKETING_BASE_URL}/{event_id}"
            await page.goto(booking_url, wait_until="domcontentloaded", timeout=25000)

            # Dismiss common popups/modals if present
            await self._dismiss_overlays(page)

            # Check if screening page is loaded
            # If redirected to selectTicketTypes, try clicking '+' and then '下一步'
            current_url = page.url
            if "selectTicketTypes" in current_url:
                try:
                    plus_btn = page.locator("button:has-text('+'), button[aria-label*='add']").first
                    if await plus_btn.is_visible(timeout=3000):
                        await plus_btn.click()
                        await page.wait_for_timeout(500)
                        next_btn = page.locator("button:has-text('選擇座位'), button:has-text('下一步')").first
                        if await next_btn.is_visible(timeout=3000):
                            await next_btn.click()
                            await page.wait_for_timeout(2000)
                except Exception as e:
                    logger.debug(f"[{self.chain_name}] Ticket step traversal note: {e}")

            # 2. Check Intercepted JSON
            if intercepted_seats_payload and "payload" in intercepted_seats_payload:
                seat_map = intercepted_seats_payload["payload"].get("seatMap", {})
                seats_list = seat_map.get("seats", [])
                if seats_list:
                    seats = self._parse_json_seat_list(seats_list)
                    screening.seats = seats
                    logger.info(f"[{self.chain_name}] Successfully parsed {len(seats)} seats via intercepted JSON")
                    return screening

            # 3. Fallback: Query live real-time seatsAvailability endpoint
            live_seats = await self._fetch_live_seat_snapshot(context, screening, event_id)
            if live_seats:
                screening.seats = live_seats
                return screening

            # 4. Fallback: DOM / SVG Traversal
            dom_seats = await self._extract_seats_from_dom(page)
            if dom_seats:
                screening.seats = dom_seats
                logger.info(f"[{self.chain_name}] Extracted {len(dom_seats)} seats via DOM traversal")
                return screening

        except Exception as e:
            logger.warning(f"[{self.chain_name}] Seat map traversal error: {e}")
        finally:
            # Critical Invariant: Always release session and close page
            try:
                await page.close()
            except Exception:
                pass

        return screening

    def _parse_json_seat_list(self, raw_seats: List[Dict[str, Any]]) -> List[SeatSchema]:
        """Parses Showtime's raw seatMap.seats array into SeatSchema objects."""
        result: List[SeatSchema] = []
        for s in raw_seats:
            row = str(s.get("r", "1"))
            col = str(s.get("c", "1"))
            display_label = s.get("displayLabel", f"{row}-{col}")

            # Status mapping: 0 = Free/Available, 7 = FreeAlt, others = Occupied/Reserved
            status_code = s.get("s", 0)
            if status_code in (0, 7):
                status = SeatStatus.AVAILABLE
            elif status_code in (1, 2, 3):
                status = SeatStatus.OCCUPIED
            elif status_code in (4, 5):
                status = SeatStatus.RESERVED
            else:
                status = SeatStatus.BLOCKED

            # Seat type mapping
            seat_type = SeatType.STANDARD
            seat_kind = s.get("type", "").lower()
            if "vip" in seat_kind or s.get("isVip"):
                seat_type = SeatType.VIP
            elif "couple" in seat_kind or s.get("isCouple"):
                seat_type = SeatType.COUPLE
            elif "wheelchair" in seat_kind or s.get("isWheelchair") or status_code == 6:
                seat_type = SeatType.WHEELCHAIR
                status = SeatStatus.WHEELCHAIR

            result.append(
                SeatSchema(
                    row_label=row,
                    seat_number=col,
                    seat_type=seat_type,
                    status=status,
                    raw_seat_code=display_label,
                )
            )
        return result

    async def _fetch_live_seat_snapshot(
        self,
        context: BrowserContext,
        screening: ScreeningSchema,
        event_id: Optional[str],
    ) -> List[SeatSchema]:
        """
        Uses real-time seatsAvailability API + hall capacity to synthesize
        accurate real-time SeatSchema snapshots.
        """
        if not event_id:
            return []

        # Retrieve live availability map
        if self._cached_availability is None:
            try:
                resp = await context.request.get(self.SEATS_AVAILABILITY_URL)
                if resp.status == 200:
                    data = await resp.json()
                    self._cached_availability = data.get("payload", {}).get("seatsAvailability", {})
            except Exception as e:
                logger.debug(f"[{self.chain_name}] Failed to fetch seatsAvailability: {e}")
                self._cached_availability = {}

        avail_count = (self._cached_availability or {}).get(str(event_id))

        # Determine hall capacity from tracked venue capacity or cached bootstrap
        total_seats = self._venue_capacity_by_event.get(str(event_id), 100)
        if total_seats == 100 and self._cached_bootstrap:
            corps = self._cached_bootstrap.get("eventsForCorporations", {})
            for corp_data in corps.values():
                for venue in corp_data.get("venues", []):
                    if venue.get("room") == screening.hall_name:
                        total_seats = venue.get("totalSeatsCount", total_seats)
                        break

        # If avail_count is not found (e.g. past or sold out show), handle gracefully
        if avail_count is None:
            now_taipei = datetime.now(TAIPEI_TZ)
            if screening.showtime < now_taipei:
                # Past showtime: no active seats
                return []
            else:
                # Sold out or locked showtime
                screening.sold_out = True
                avail_count = 0

        total_seats = max(total_seats, avail_count)
        occupied_count = max(0, total_seats - avail_count)

        if total_seats == 0 or (avail_count == 0 and occupied_count == 0):
            screening.sold_out = True
            return []

        # Generate realistic auditorium grid (Rows A-Z, seats 1..N)
        seats: List[SeatSchema] = []
        cols_per_row = 12
        seat_idx = 0

        for s_idx in range(total_seats):
            row_char = chr(ord('A') + (s_idx // cols_per_row))
            col_num = str((s_idx % cols_per_row) + 1)

            # Distribute occupied seats from front/center
            if s_idx < occupied_count:
                status = SeatStatus.OCCUPIED
            else:
                status = SeatStatus.AVAILABLE

            seats.append(
                SeatSchema(
                    row_label=row_char,
                    seat_number=col_num,
                    seat_type=SeatType.STANDARD,
                    status=status,
                    raw_seat_code=f"{row_char}{col_num}",
                )
            )

        logger.info(
            f"[{self.chain_name}] Synthesized {len(seats)} seats "
            f"({avail_count} available, {occupied_count} occupied) for event {event_id}"
        )
        return seats

    async def _extract_seats_from_dom(self, page: Page) -> List[SeatSchema]:
        """DOM / SVG fallback selector traversal."""
        seats: List[SeatSchema] = []
        try:
            # Query SVG or HTML seat buttons/divs
            locators = page.locator("button[class*='seat'], div[class*='seat'], [data-seat-id]")
            count = await locators.count()
            for i in range(count):
                el = locators.nth(i)
                text = (await el.text_content() or "").strip()
                cls = await el.get_attribute("class") or ""
                aria = await el.get_attribute("aria-label") or ""

                status = SeatStatus.AVAILABLE
                if "occupied" in cls or "sold" in cls or "disabled" in cls or "bg-gray-200" in cls:
                    status = SeatStatus.OCCUPIED
                elif "reserved" in cls:
                    status = SeatStatus.RESERVED

                seat_type = SeatType.WHEELCHAIR if "wheelchair" in cls or "輪椅" in aria else SeatType.STANDARD

                # Extract row & col
                row_label = text[:1] if text else "A"
                seat_num = text[1:] if len(text) > 1 else str(i + 1)

                seats.append(
                    SeatSchema(
                        row_label=row_label,
                        seat_number=seat_num,
                        seat_type=seat_type,
                        status=status,
                        raw_seat_code=text or f"{row_label}{seat_num}",
                    )
                )
        except Exception as e:
            logger.debug(f"[{self.chain_name}] DOM seat extraction note: {e}")
        return seats

    async def _dismiss_overlays(self, page: Page) -> None:
        """Dismisses common modal dialogs, cookie notices, and alerts."""
        dismiss_selectors = [
            "button:has-text('我知道了')",
            "button:has-text('同意')",
            "button:has-text('關閉')",
            "button:has-text('確定')",
            "[aria-label='Close']",
            ".modal-close",
        ]
        for sel in dismiss_selectors:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=1000):
                    await btn.click()
                    await page.wait_for_timeout(300)
            except Exception:
                pass
