"""Tests for database models, migrations, and session management."""

from datetime import datetime, timezone
import pytest
from sqlalchemy import select
from cinema_scraper.database.models import Movie, Screening, SeatSnapshot, Theater
from cinema_scraper.database.session import (
    close_db,
    get_database_summary,
    get_db_session,
    init_db,
    save_screening_with_seats,
)
from cinema_scraper.schemas.cinema import (
    ScreeningSchema,
    SeatSchema,
    SeatStatus,
    SeatType,
)

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.mark.asyncio
async def test_database_init_and_crud():
    await init_db(TEST_DB_URL)

    # 1. Test Saving Screening with Seats
    screening_dto = ScreeningSchema(
        theater_chain="Showtime",
        theater_name="今日秀泰影城",
        theater_city="台北市",
        movie_title="黑天鵝 (4K修復版)",
        hall_name="2廳",
        format="2D",
        showtime=datetime(2026, 10, 5, 10, 0, tzinfo=timezone.utc),
        booking_url="https://www.showtimes.com.tw/ticketing/12345",
        seats=[
            SeatSchema(row_label="A", seat_number="1", status=SeatStatus.AVAILABLE),
            SeatSchema(row_label="A", seat_number="2", status=SeatStatus.OCCUPIED),
            SeatSchema(row_label="A", seat_number="3", status=SeatStatus.RESERVED),
            SeatSchema(row_label="B", seat_number="1", seat_type=SeatType.VIP, status=SeatStatus.AVAILABLE),
        ],
    )

    async with get_db_session(TEST_DB_URL) as session:
        screening = await save_screening_with_seats(session, screening_dto)
        assert screening.id is not None
        assert screening.hall_name == "2廳"

    # 2. Query and verify relations
    async with get_db_session(TEST_DB_URL) as session:
        t_res = await session.execute(select(Theater).where(Theater.name == "今日秀泰影城"))
        theater = t_res.scalar_one()
        assert theater.chain_name == "Showtime"

        m_res = await session.execute(select(Movie))
        movie = m_res.scalar_one()
        assert "黑天鵝" in movie.title

        summary = await get_database_summary(session)
        assert summary["theaters_count"] == 1
        assert summary["movies_count"] == 1
        assert summary["screenings_count"] == 1
        assert summary["total_seats"] == 4
        assert summary["available_seats"] == 2
        assert summary["occupied_seats"] == 2
        assert summary["occupancy_rate"] == 50.0

    await close_db()


@pytest.mark.asyncio
async def test_screening_seat_snapshot_refresh():
    await init_db(TEST_DB_URL)

    dto_v1 = ScreeningSchema(
        theater_chain="VieShow",
        theater_name="台北信義威秀影城",
        movie_title="星際效應",
        hall_name="IMAX廳",
        format="IMAX",
        showtime=datetime(2026, 10, 5, 20, 0, tzinfo=timezone.utc),
        seats=[
            SeatSchema(row_label="C", seat_number="1", status=SeatStatus.AVAILABLE),
            SeatSchema(row_label="C", seat_number="2", status=SeatStatus.AVAILABLE),
        ],
    )

    async with get_db_session(TEST_DB_URL) as session:
        await save_screening_with_seats(session, dto_v1)

    # Now refresh with updated real-time status (seat 1 became occupied)
    dto_v2 = dto_v1.model_copy(deep=True)
    dto_v2.seats = [
        SeatSchema(row_label="C", seat_number="1", status=SeatStatus.OCCUPIED),
        SeatSchema(row_label="C", seat_number="2", status=SeatStatus.AVAILABLE),
    ]

    async with get_db_session(TEST_DB_URL) as session:
        await save_screening_with_seats(session, dto_v2)

    async with get_db_session(TEST_DB_URL) as session:
        summary = await get_database_summary(session)
        assert summary["total_seats"] == 2
        assert summary["available_seats"] == 1
        assert summary["occupied_seats"] == 1
        assert summary["occupancy_rate"] == 50.0

    await close_db()
