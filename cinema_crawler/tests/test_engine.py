"""Tests for pipeline engine orchestration and persistence."""

from datetime import datetime, timezone
from typing import List
from unittest.mock import AsyncMock, patch
import pytest
from cinema_scraper.engine import CinemaScraperEngine
from cinema_scraper.parsers.base import BaseCinemaParser
from cinema_scraper.schemas.cinema import (
    ScreeningSchema,
    SeatSchema,
    SeatStatus,
    SeatType,
)


class MockCinemaParser(BaseCinemaParser):
    @property
    def chain_name(self) -> str:
        return "MockChain"

    async def get_schedule(self, page, date_str: str) -> List[ScreeningSchema]:
        return [
            ScreeningSchema(
                theater_chain="MockChain",
                theater_name="測試影城一館",
                theater_city="台北市",
                movie_title="星際先鋒",
                hall_name="1廳",
                format="IMAX",
                showtime=datetime(2026, 10, 5, 13, 0, tzinfo=timezone.utc),
                booking_url="https://mock.cinema/book/1",
                external_screening_id="mock_1",
            ),
            ScreeningSchema(
                theater_chain="MockChain",
                theater_name="測試影城一館",
                theater_city="台北市",
                movie_title="黑夜降臨",
                hall_name="2廳",
                format="2D",
                showtime=datetime(2026, 10, 5, 15, 30, tzinfo=timezone.utc),
                booking_url="https://mock.cinema/book/2",
                external_screening_id="mock_2",
            ),
        ]

    async def extract_seat_map(self, context, screening: ScreeningSchema) -> ScreeningSchema:
        if screening.external_screening_id == "mock_1":
            screening.seats = [
                SeatSchema(row_label="A", seat_number="1", status=SeatStatus.AVAILABLE),
                SeatSchema(row_label="A", seat_number="2", status=SeatStatus.OCCUPIED),
                SeatSchema(row_label="A", seat_number="3", status=SeatStatus.OCCUPIED),
            ]
        else:
            screening.seats = [
                SeatSchema(row_label="B", seat_number="1", status=SeatStatus.AVAILABLE),
                SeatSchema(row_label="B", seat_number="2", status=SeatStatus.AVAILABLE),
            ]
        return screening


@pytest.mark.asyncio
async def test_engine_orchestration_flow():
    mock_db = "sqlite+aiosqlite:///:memory:"
    engine = CinemaScraperEngine(
        concurrency=2,
        db_url=mock_db,
        headless=True,
        rate_limit_enabled=False,
    )

    mock_parser = MockCinemaParser()

    with patch("cinema_scraper.engine.get_parser", return_value=mock_parser), \
         patch.object(engine.browser_manager, "initialize", new_callable=AsyncMock), \
         patch.object(engine.browser_manager, "close", new_callable=AsyncMock), \
         patch.object(engine.browser_manager, "create_stealth_page", new_callable=AsyncMock) as mock_stealth_page, \
         patch.object(engine.browser_manager, "create_isolated_context", new_callable=AsyncMock) as mock_iso_ctx, \
         patch.object(engine.browser_manager, "release_context", new_callable=AsyncMock):

        mock_page = AsyncMock()
        mock_ctx = AsyncMock()
        mock_stealth_page.return_value = (mock_ctx, mock_page)
        mock_iso_ctx.return_value = mock_ctx

        summary = await engine.run(
            chain_name="mockchain",
            target_date="2026-10-05",
            max_screenings=2,
        )

        assert summary.chain_name == "MockChain"
        assert summary.screenings_found == 2
        assert summary.screenings_processed == 2
        assert summary.total_seats_captured == 5
        assert summary.total_available_seats == 3
        assert summary.total_occupied_seats == 2
        assert summary.overall_occupancy_rate == 40.0
