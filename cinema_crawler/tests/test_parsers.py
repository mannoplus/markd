"""Tests for parser adapters, json decoding, and status mappings."""

import pytest
from cinema_scraper.core.exceptions import ParserNotFoundError
from cinema_scraper.parsers import get_parser, ShowtimeParser, VieShowParser
from cinema_scraper.schemas.cinema import SeatStatus, SeatType


def test_parser_registry():
    st = get_parser("showtime")
    assert isinstance(st, ShowtimeParser)
    assert st.chain_name == "Showtime"

    vs = get_parser("vieshow")
    assert isinstance(vs, VieShowParser)
    assert vs.chain_name == "VieShow"

    with pytest.raises(ParserNotFoundError):
        get_parser("non_existent_cinema")


def test_showtime_json_seat_parsing():
    parser = ShowtimeParser()
    raw_seats = [
        {"r": "A", "c": "1", "s": 0, "displayLabel": "A1"},  # 0 = free
        {"r": "A", "c": "2", "s": 1, "displayLabel": "A2"},  # 1 = occupied
        {"r": "B", "c": "5", "s": 4, "displayLabel": "B5"},  # 4 = reserved
        {"r": "C", "c": "1", "s": 6, "displayLabel": "C1", "isWheelchair": True},
        {"r": "D", "c": "1", "s": 0, "displayLabel": "D1", "isVip": True},
    ]

    seats = parser._parse_json_seat_list(raw_seats)
    assert len(seats) == 5

    assert seats[0].status == SeatStatus.AVAILABLE
    assert seats[0].seat_type == SeatType.STANDARD

    assert seats[1].status == SeatStatus.OCCUPIED

    assert seats[2].status == SeatStatus.RESERVED

    assert seats[3].seat_type == SeatType.WHEELCHAIR
    assert seats[3].status == SeatStatus.WHEELCHAIR

    assert seats[4].seat_type == SeatType.VIP
    assert seats[4].status == SeatStatus.AVAILABLE


def test_vieshow_json_seat_parsing():
    parser = VieShowParser()
    data = {
        "seats": [
            {"row": "G", "number": "10", "status": "Available"},
            {"row": "G", "number": "11", "status": "Sold"},
            {"row": "G", "number": "12", "status": "Locked"},
            {"row": "H", "number": "1", "status": "Wheelchair"},
        ]
    }
    seats = parser._parse_intercepted_seats(data)
    assert len(seats) == 4
    assert seats[0].status == SeatStatus.AVAILABLE
    assert seats[1].status == SeatStatus.OCCUPIED
    assert seats[2].status == SeatStatus.RESERVED
    assert seats[3].status == SeatStatus.WHEELCHAIR
    assert seats[3].seat_type == SeatType.WHEELCHAIR
