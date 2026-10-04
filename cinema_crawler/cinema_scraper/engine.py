"""Orchestration pipeline coordinating Fetch -> Parse -> Store workflows."""

import asyncio
from datetime import datetime
import logging
import time
from typing import List, Optional

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)
from playwright.async_api import TimeoutError as PlaywrightTimeoutError

from cinema_scraper.config import settings
from cinema_scraper.core.browser import BrowserManager
from cinema_scraper.core.exceptions import (
    AntiBotBlockedError,
    CinemaScraperError,
    NavigationTimeoutError,
)
from cinema_scraper.core.rate_limiter import AsyncRateLimiter
from cinema_scraper.database.session import (
    close_db,
    get_db_session,
    init_db,
    save_screening_with_seats,
)
from cinema_scraper.parsers import get_parser
from cinema_scraper.schemas.cinema import (
    ScreeningSchema,
    ScrapingResultSummary,
    SeatStatus,
)

logger = logging.getLogger(__name__)


class CinemaScraperEngine:
    """
    Main pipeline engine orchestrating concurrent crawling, seat map extraction,
    rate limiting, and persistent storage.
    """

    def __init__(
        self,
        concurrency: int = 2,
        db_url: Optional[str] = None,
        headless: bool = True,
        rate_limit_enabled: bool = True,
    ):
        self.concurrency = concurrency
        self.db_url = db_url or settings.db_url
        self.headless = headless
        self.rate_limit_enabled = rate_limit_enabled

        # Core utilities
        self.browser_manager = BrowserManager()
        self.browser_manager.config.headless = headless
        self.rate_limiter = AsyncRateLimiter(
            rate=settings.rate_limit.rate,
            capacity=settings.rate_limit.capacity,
            min_jitter=settings.rate_limit.min_jitter_sec,
            max_jitter=settings.rate_limit.max_jitter_sec,
        )
        self.semaphore = asyncio.Semaphore(self.concurrency)

    async def run(
        self,
        chain_name: str,
        target_date: str,
        max_screenings: Optional[int] = None,
    ) -> ScrapingResultSummary:
        """
        Executes full aggregation cycle for a given cinema chain and date.

        Args:
            chain_name: 'showtime', 'vieshow', etc.
            target_date: 'YYYY-MM-DD'
            max_screenings: Optional cap on screenings to process for quick testing.

        Returns:
            ScrapingResultSummary containing execution metrics.
        """
        start_time = time.monotonic()
        logger.info(f"Starting aggregation run: chain={chain_name}, date={target_date}")

        # Ensure database tables exist
        await init_db(self.db_url)

        parser = get_parser(chain_name)
        summary = ScrapingResultSummary(
            chain_name=parser.chain_name,
            target_date=target_date,
        )

        try:
            # 1. Initialize Browser
            await self.browser_manager.initialize()

            # 2. Fetch Screenings Timetable
            screenings = await self._fetch_schedule_with_retry(parser, target_date)
            summary.screenings_found = len(screenings)
            logger.info(f"Found {len(screenings)} total screenings for {target_date}")

            if not screenings:
                logger.warning(f"No screenings retrieved for {parser.chain_name} on {target_date}")
                summary.elapsed_seconds = round(time.monotonic() - start_time, 2)
                return summary

            # Apply max limit if requested
            target_screenings = screenings[:max_screenings] if max_screenings else screenings
            logger.info(f"Enqueueing {len(target_screenings)} screenings for seat extraction...")

            # 3. Process Seat Maps Concurrently with Semaphore
            tasks = [
                self._process_single_screening(parser, screening)
                for screening in target_screenings
            ]
            processed_screenings = await asyncio.gather(*tasks, return_exceptions=False)

            # 4. Compute Aggregate Statistics
            total_seats = 0
            total_avail = 0
            total_occ = 0

            for sc in processed_screenings:
                summary.screenings_processed += 1
                total_seats += sc.total_seats
                total_avail += sc.available_seats_count
                total_occ += sc.occupied_seats_count

            summary.total_seats_captured = total_seats
            summary.total_available_seats = total_avail
            summary.total_occupied_seats = total_occ
            if total_seats > 0:
                summary.overall_occupancy_rate = round((total_occ / total_seats) * 100.0, 2)
            elif summary.screenings_processed > 0:
                summary.overall_occupancy_rate = 0.0

        finally:
            # Clean teardown of browser resources
            await self.browser_manager.close()

        summary.elapsed_seconds = round(time.monotonic() - start_time, 2)
        logger.info(
            f"Run completed in {summary.elapsed_seconds}s. "
            f"Screenings: {summary.screenings_processed}/{summary.screenings_found}, "
            f"Seats: {summary.total_seats_captured}, Occupancy: {summary.overall_occupancy_rate}%"
        )
        return summary

    async def _fetch_schedule_with_retry(
        self,
        parser,
        target_date: str,
    ) -> List[ScreeningSchema]:
        """Navigates to schedule and extracts screenings list."""
        ctx, page = await self.browser_manager.create_stealth_page()
        try:
            return await parser.get_schedule(page, target_date)
        finally:
            try:
                await page.close()
            except Exception:
                pass
            await self.browser_manager.release_context(ctx)

    async def _process_single_screening(
        self,
        parser,
        screening: ScreeningSchema,
    ) -> ScreeningSchema:
        """Worker task processing a single screening under semaphore and rate limiting."""
        async with self.semaphore:
            if self.rate_limit_enabled:
                await self.rate_limiter.throttle(with_jitter=True)

            context = await self.browser_manager.create_isolated_context()
            try:
                # Extract seat map with resilient retry for network timeouts
                populated_screening = await self._extract_seat_map_with_retry(
                    parser, context, screening
                )

                # Persist to database
                async with get_db_session(self.db_url) as session:
                    await save_screening_with_seats(session, populated_screening)

                return populated_screening

            except AntiBotBlockedError as e:
                logger.error(f"AntiBot block encountered for screening: {e}")
                # Save screening metadata even if seat map is blocked
                async with get_db_session(self.db_url) as session:
                    await save_screening_with_seats(session, screening)
                return screening
            except Exception as e:
                logger.error(f"Failed processing screening '{screening.movie_title}': {e}")
                async with get_db_session(self.db_url) as session:
                    await save_screening_with_seats(session, screening)
                return screening
            finally:
                # Non-Locking Invariant: Cleanly discard isolated context
                await self.browser_manager.release_context(context)

    async def _extract_seat_map_with_retry(
        self,
        parser,
        context,
        screening: ScreeningSchema,
    ) -> ScreeningSchema:
        """Calls parser.extract_seat_map with retry on transient Playwright errors."""
        max_attempts = settings.retry.max_attempts
        last_error = None

        for attempt in range(1, max_attempts + 1):
            try:
                return await parser.extract_seat_map(context, screening)
            except (PlaywrightTimeoutError, NavigationTimeoutError) as e:
                last_error = e
                logger.warning(
                    f"Attempt {attempt}/{max_attempts} failed for '{screening.movie_title}': {e}. Retrying..."
                )
                if attempt < max_attempts:
                    await asyncio.sleep(settings.retry.min_wait_sec * attempt)
            except AntiBotBlockedError:
                raise
            except Exception as e:
                logger.warning(f"Unexpected error in extract_seat_map: {e}")
                return screening

        if last_error:
            logger.error(f"Exhausted {max_attempts} attempts for seat extraction: {last_error}")
        return screening
