"""Tests for cinema Pydantic data schemas and validation rules."""

from datetime import datetime, timezone
import pytest
from cinema_scraper.schemas.cinema import (
    ScreeningSchema,
    SeatSchema,
    SeatStatus,
    SeatType,
)


def test_seat_schema_defaults():
    seat = SeatSchema(
        row_label="A",
        seat_number="12",
        status=SeatStatus.AVAILABLE,
    )
    assert seat.row_label == "A"
    assert seat.seat_number == "12"
    assert seat.seat_type == SeatType.STANDARD
    assert seat.status == SeatStatus.AVAILABLE
    assert seat.raw_seat_code is None


def test_screening_schema_computations():
    seats = [
        SeatSchema(row_label="A", seat_number="1", status=SeatStatus.AVAILABLE),
        SeatSchema(row_label="A", seat_number="2", status=SeatStatus.AVAILABLE),
        SeatSchema(row_label="A", seat_number="3", status=SeatStatus.OCCUPIED),
        SeatSchema(row_label="A", seat_number="4", status=SeatStatus.RESERVED),
    ]
    screening = ScreeningSchema(
        theater_chain="Showtime",
        theater_name="台北欣欣秀泰影城",
        movie_title="復仇者聯盟",
        hall_name="1廳",
        format="2D",
        showtime=datetime(2026, 10, 5, 14, 30, tzinfo=timezone.utc),
        seats=seats,
    )

    assert screening.total_seats == 4
    assert screening.available_seats_count == 2
    assert screening.occupied_seats_count == 2
    assert screening.occupancy_rate == 50.0


def test_sold_out_occupancy():
    screening = ScreeningSchema(
        theater_chain="VieShow",
        theater_name="台北信義威秀影城",
        movie_title="沙丘",
        hall_name="TITAN廳",
        showtime=datetime(2026, 10, 5, 19, 0, tzinfo=timezone.utc),
        sold_out=True,
    )
    assert screening.total_seats == 0
    assert screening.occupancy_rate == 100.0
