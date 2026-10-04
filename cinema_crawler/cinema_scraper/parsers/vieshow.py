"""Vie Show Cinemas (威秀影城) parser implementation."""

import asyncio
from datetime import datetime
import logging
import re
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


class VieShowParser(BaseCinemaParser):
    """
    Parser adapter for Vie Show Cinemas (威秀影城) - https://www.vscinemas.com.tw/
    Handles multi-step ticketing, Akamai bot detection mitigation, and dual-mode
    seat map extraction (Network API interception with DOM/SVG fallback).
    """

    BASE_URL = "https://www.vscinemas.com.tw"
    SCHEDULE_URL = "https://www.vscinemas.com.tw/vsweb/theater/detail.aspx"
    TICKETING_GATEWAY = "https://www.vscinemas.com.tw/vsTicketing/"

    @property
    def chain_name(self) -> str:
        return "VieShow"

    async def get_schedule(self, page: Page, date_str: str) -> List[ScreeningSchema]:
        """
        Extracts screenings from Vie Show for the given date.
        Navigates theater listing pages and extracts showtimes, halls, and formats.
        """
        logger.info(f"[{self.chain_name}] Fetching schedule for date: {date_str}")
        screenings: List[ScreeningSchema] = []

        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError as e:
            raise ValueError(f"Invalid date_str format '{date_str}', expected YYYY-MM-DD") from e

        # Intercept background timetable / JSON APIs
        intercepted_api_data: List[Dict[str, Any]] = []

        async def on_response(response: Response):
            if "api" in response.url.lower() and ("session" in response.url.lower() or "showtime" in response.url.lower()):
                try:
                    data = await response.json()
                    if isinstance(data, list):
                        intercepted_api_data.extend(data)
                    elif isinstance(data, dict):
                        intercepted_api_data.append(data)
                except Exception:
                    pass

        page.on("response", on_response)

        try:
            response = await page.goto(
                f"{self.BASE_URL}/vsweb/",
                wait_until="domcontentloaded",
                timeout=30000,
            )

            # Check for Akamai or Cloudflare bot blocks
            if response and response.status in (403, 429):
                body = await page.content()
                if "Access Denied" in body or "Reference #" in body:
                    raise AntiBotBlockedError(
                        f"[{self.chain_name}] Access blocked by Akamai WAF (HTTP {response.status}). "
                        "Residential proxy or session cookie authorization required."
                    )

            await page.wait_for_timeout(2000)
            await self._dismiss_popups(page)

            # Extract from DOM timetable if rendered
            movie_blocks = page.locator(".cinema-box, .movie-item, .cinemaList .item")
            count = await movie_blocks.count()

            for i in range(count):
                block = movie_blocks.nth(i)
                title_el = block.locator("h2, .movieTitle, .title").first
                title = (await title_el.text_content() if await title_el.count() > 0 else "").strip()
                if not title:
                    continue

                session_links = block.locator("ul.timeList li a, .time-item a, a[href*='vsTicketing']")
                s_count = await session_links.count()

                for j in range(s_count):
                    s_link = session_links.nth(j)
                    raw_time = (await s_link.text_content() or "").strip()
                    href = await s_link.get_attribute("href") or ""

                    # Parse time format like "14:30"
                    time_match = re.search(r"(\d{1,2}):(\d{2})", raw_time)
                    if not time_match:
                        continue

                    hour, minute = int(time_match.group(1)), int(time_match.group(2))
                    show_dt = datetime(
                        target_date.year, target_date.month, target_date.day,
                        hour, minute, tzinfo=TAIPEI_TZ
                    )

                    # Extract format (IMAX, 4DX, TITAN, etc.)
                    format_tag = "2D"
                    parent_text = await s_link.locator("..").text_content() or ""
                    if "IMAX" in parent_text:
                        format_tag = "IMAX"
                    elif "4DX" in parent_text:
                        format_tag = "4DX"
                    elif "TITAN" in parent_text:
                        format_tag = "TITAN"

                    full_url = href if href.startswith("http") else f"{self.BASE_URL}{href}"

                    screenings.append(
                        ScreeningSchema(
                            theater_chain=self.chain_name,
                            theater_name="台北信義威秀影城",
                            theater_city="台北市",
                            movie_title=title,
                            hall_name="1廳",
                            format=format_tag,
                            showtime=show_dt,
                            booking_url=full_url,
                        )
                    )

        except AntiBotBlockedError:
            raise
        except Exception as e:
            logger.warning(f"[{self.chain_name}] DOM schedule extraction error: {e}")

        logger.info(f"[{self.chain_name}] Extracted {len(screenings)} screenings")
        return screenings

    async def extract_seat_map(
        self,
        context: BrowserContext,
        screening: ScreeningSchema,
    ) -> ScreeningSchema:
        """
        Navigates to VieShow's ticketing funnel and captures real-time seat availability.
        Uses network response interception (priority) and falls back to DOM/SVG parsing.
        """
        logger.info(f"[{self.chain_name}] Accessing seat map for '{screening.movie_title}' at {screening.theater_name}")
        page = await context.new_page()
        intercepted_json: Optional[Dict[str, Any]] = None

        # 1. Register Network Interception Listener (Priority)
        async def on_response(response: Response):
            nonlocal intercepted_json
            url = response.url
            if any(k in url.lower() for k in ["getseats", "seatmap", "seatlayout", "/api/booking/seats"]):
                try:
                    intercepted_json = await response.json()
                    logger.debug(f"[{self.chain_name}] Intercepted seat map JSON: {url}")
                except Exception:
                    pass

        page.on("response", on_response)

        try:
            target_url = screening.booking_url or self.TICKETING_GATEWAY
            response = await page.goto(target_url, wait_until="domcontentloaded", timeout=25000)

            if response and response.status in (403, 429):
                raise AntiBotBlockedError(f"[{self.chain_name}] Seat booking flow blocked with HTTP {response.status}")

            await self._dismiss_popups(page)

            # If ticket quantity is required before loading seat map, select minimum 1 ticket
            await self._select_minimum_tickets(page)

            # Wait briefly for layout container
            try:
                await page.wait_for_selector(
                    ".seat-map, #seatPlan, svg.seat-layout, table.seat-table",
                    timeout=5000,
                )
            except Exception:
                pass

            # 2. Check Intercepted JSON
            if intercepted_json:
                seats = self._parse_intercepted_seats(intercepted_json)
                if seats:
                    screening.seats = seats
                    logger.info(f"[{self.chain_name}] Extracted {len(seats)} seats via API response")
                    return screening

            # 3. Fallback: Parse DOM / SVG Nodes
            dom_seats = await self._parse_dom_seats(page)
            if dom_seats:
                screening.seats = dom_seats
                logger.info(f"[{self.chain_name}] Extracted {len(dom_seats)} seats via DOM elements")
                return screening

        except AntiBotBlockedError:
            raise
        except Exception as e:
            logger.warning(f"[{self.chain_name}] Seat map extraction error: {e}")
        finally:
            # Non-Locking Invariant: Cleanly release session
            try:
                cancel_btn = page.locator("button:has-text('取消'), button:has-text('返回'), .btn-cancel").first
                if await cancel_btn.is_visible(timeout=1000):
                    await cancel_btn.click()
            except Exception:
                pass

            try:
                await page.close()
            except Exception:
                pass

        return screening

    def _parse_intercepted_seats(self, data: Dict[str, Any]) -> List[SeatSchema]:
        """Parses VieShow JSON seat map structure."""
        seats: List[SeatSchema] = []
        raw_list = data.get("seats") or data.get("Seats") or data.get("seatList") or []
        for s in raw_list:
            row = str(s.get("row") or s.get("RowName") or s.get("r") or "A")
            num = str(s.get("number") or s.get("SeatNo") or s.get("c") or "1")
            raw_status = str(s.get("status") or s.get("Status") or s.get("state") or "").lower()

            status = SeatStatus.AVAILABLE
            if any(k in raw_status for k in ["sold", "occupied", "1", "false", "taken"]):
                status = SeatStatus.OCCUPIED
            elif "reserved" in raw_status or "locked" in raw_status:
                status = SeatStatus.RESERVED
            elif "wheelchair" in raw_status:
                status = SeatStatus.WHEELCHAIR

            seat_type = SeatType.WHEELCHAIR if status == SeatStatus.WHEELCHAIR else SeatType.STANDARD

            seats.append(
                SeatSchema(
                    row_label=row,
                    seat_number=num,
                    seat_type=seat_type,
                    status=status,
                    raw_seat_code=f"{row}{num}",
                )
            )
        return seats

    async def _parse_dom_seats(self, page: Page) -> List[SeatSchema]:
        """DOM / SVG fallback traversal for VieShow seat layout."""
        seats: List[SeatSchema] = []
        try:
            # Query SVG rects or HTML seat elements
            seat_nodes = page.locator("svg rect[class*='seat'], .seat-map .seat, table.seat-table td[data-seat]")
            count = await seat_nodes.count()

            for i in range(count):
                node = seat_nodes.nth(i)
                cls = await node.get_attribute("class") or ""
                data_row = await node.get_attribute("data-row") or ""
                data_col = await node.get_attribute("data-col") or ""
                title_attr = await node.get_attribute("title") or ""

                status = SeatStatus.AVAILABLE
                if "sold" in cls or "disabled" in cls or "occupied" in cls or "unavailable" in cls:
                    status = SeatStatus.OCCUPIED
                elif "reserved" in cls or "locked" in cls:
                    status = SeatStatus.RESERVED

                seat_type = SeatType.WHEELCHAIR if "wheelchair" in cls or "輪椅" in title_attr else SeatType.STANDARD

                row_label = data_row or "A"
                seat_num = data_col or str(i + 1)

                seats.append(
                    SeatSchema(
                        row_label=row_label,
                        seat_number=seat_num,
                        seat_type=seat_type,
                        status=status,
                        raw_seat_code=f"{row_label}{seat_num}",
                    )
                )
        except Exception as e:
            logger.debug(f"[{self.chain_name}] DOM seat parsing error: {e}")

        return seats

    async def _select_minimum_tickets(self, page: Page) -> None:
        """Selects 1 standard ticket if required by the booking funnel before entering seat layout."""
        try:
            plus_btn = page.locator(".ticket-qty-plus, button:has-text('+'), input[type='number']").first
            if await plus_btn.is_visible(timeout=2000):
                tag = await plus_btn.evaluate("el => el.tagName")
                if tag.lower() == "input":
                    await plus_btn.fill("1")
                else:
                    await plus_btn.click()

                next_btn = page.locator("button:has-text('下一步'), button:has-text('選擇座位'), .btn-next").first
                if await next_btn.is_visible(timeout=2000):
                    await next_btn.click()
                    await page.wait_for_timeout(1000)
        except Exception:
            pass

    async def _dismiss_popups(self, page: Page) -> None:
        """Dismisses promotional modals, rating alerts, or privacy notices."""
        selectors = [
            "button:has-text('同意')",
            "button:has-text('確定')",
            "button:has-text('關閉')",
            ".fancybox-close",
            ".pop-close",
            "[aria-label='Close']",
        ]
        for sel in selectors:
            try:
                el = page.locator(sel).first
                if await el.is_visible(timeout=1000):
                    await el.click()
                    await page.wait_for_timeout(300)
            except Exception:
                pass
