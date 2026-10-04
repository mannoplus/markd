"""Pydantic schemas and enums matching the specification."""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SeatStatus(str, Enum):
    """Normalized status of an individual auditorium seat."""
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    WHEELCHAIR = "wheelchair"
    BLOCKED = "blocked"
    UNKNOWN = "unknown"


class SeatType(str, Enum):
    """Categorized seat classification."""
    STANDARD = "standard"
    VIP = "vip"
    COUPLE = "couple"
    WHEELCHAIR = "wheelchair"


class SeatSchema(BaseModel):
    """Schema representing an individual seat state within an auditorium layout."""
    model_config = ConfigDict(use_enum_values=True)

    row_label: str = Field(description="Row identifier (e.g. 'A', '12')")
    seat_number: str = Field(description="Seat identifier within the row (e.g. '1', '14')")
    seat_type: SeatType = Field(default=SeatType.STANDARD, description="Seat tier/type")
    status: SeatStatus = Field(description="Real-time availability status")
    raw_seat_code: Optional[str] = Field(default=None, description="Original venue seat code/ID")


class ScreeningSchema(BaseModel):
    """Schema representing a movie screening event and its associated seat snapshot."""
    model_config = ConfigDict(use_enum_values=True)

    theater_chain: str = Field(description="Theater chain name (e.g. 'Showtime', 'VieShow')")
    theater_name: str = Field(description="Specific cinema branch (e.g. '台北欣欣秀泰影城')")
    movie_title: str = Field(description="Movie title in native language")
    hall_name: str = Field(description="Auditorium / Hall designation (e.g. '1廳', 'IMAX 2廳')")
    format: str = Field(default="2D", description="Screening tech format (e.g. '2D', 'IMAX', '4DX')")
    showtime: datetime = Field(description="Screening start datetime (UTC or Asia/Taipei)")
    booking_url: Optional[str] = Field(default=None, description="Direct URL into booking flow")
    seats: List[SeatSchema] = Field(default_factory=list, description="Extracted seat snapshot list")

    # Additional metadata for convenience & resilience
    theater_city: Optional[str] = Field(default=None, description="Cinema city (e.g. '台北市')")
    external_screening_id: Optional[str] = Field(default=None, description="Chain-specific event identifier")
    sold_out: bool = Field(default=False, description="Whether screening is flagged sold-out without seats")

    @property
    def total_seats(self) -> int:
        return len(self.seats)

    @property
    def available_seats_count(self) -> int:
        return sum(1 for s in self.seats if s.status == SeatStatus.AVAILABLE)

    @property
    def occupied_seats_count(self) -> int:
        return sum(1 for s in self.seats if s.status in (SeatStatus.OCCUPIED, SeatStatus.RESERVED))

    @property
    def occupancy_rate(self) -> float:
        if not self.seats:
            return 100.0 if self.sold_out else 0.0
        return (self.occupied_seats_count / len(self.seats)) * 100.0


class TheaterSchema(BaseModel):
    """Metadata representation of a theater branch."""
    chain_name: str
    name: str
    city: Optional[str] = None
    external_id: Optional[str] = None


class MovieSchema(BaseModel):
    """Metadata representation of a movie title."""
    title: str
    normalized_title: str


class ScrapingResultSummary(BaseModel):
    """Summary metrics of a scraping execution pass."""
    chain_name: str
    target_date: str
    screenings_found: int = 0
    screenings_processed: int = 0
    total_seats_captured: int = 0
    total_available_seats: int = 0
    total_occupied_seats: int = 0
    overall_occupancy_rate: float = 0.0
    elapsed_seconds: float = 0.0
