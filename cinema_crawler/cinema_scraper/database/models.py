"""SQLAlchemy 2.0 async declarative models for cinema aggregation engine."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""
    pass


class Theater(Base):
    """Represents a cinema chain location/branch."""
    __tablename__ = "theaters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chain_name: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    screenings: Mapped[List["Screening"]] = relationship(
        "Screening",
        back_populates="theater",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_theaters_chain_name", "chain_name"),
        Index("ix_theaters_name", "name"),
        Index("ix_theaters_chain_name_name", "chain_name", "name", unique=True),
        Index("ix_theaters_external_id", "external_id"),
    )

    def __repr__(self) -> str:
        return f"<Theater(id={self.id}, chain={self.chain_name!r}, name={self.name!r})>"


class Movie(Base):
    """Represents a canonical movie title."""
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    normalized_title: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    screenings: Mapped[List["Screening"]] = relationship(
        "Screening",
        back_populates="movie",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_movies_title", "title"),
        Index("ix_movies_normalized_title", "normalized_title", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Movie(id={self.id}, title={self.title!r})>"


class Screening(Base):
    """Represents a single movie screening session in a specific hall."""
    __tablename__ = "screenings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    theater_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("theaters.id", ondelete="CASCADE"),
        nullable=False,
    )
    movie_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("movies.id", ondelete="CASCADE"),
        nullable=False,
    )
    hall_name: Mapped[str] = mapped_column(String(64), nullable=False)
    format: Mapped[str] = mapped_column(String(32), nullable=False, default="2D")
    showtime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    booking_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    theater: Mapped["Theater"] = relationship("Theater", back_populates="screenings")
    movie: Mapped["Movie"] = relationship("Movie", back_populates="screenings")
    seat_snapshots: Mapped[List["SeatSnapshot"]] = relationship(
        "SeatSnapshot",
        back_populates="screening",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_screenings_theater_id", "theater_id"),
        Index("ix_screenings_movie_id", "movie_id"),
        Index("ix_screenings_showtime", "showtime"),
        Index(
            "ix_screenings_unique_session",
            "theater_id",
            "hall_name",
            "showtime",
            unique=True,
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Screening(id={self.id}, theater_id={self.theater_id}, "
            f"hall={self.hall_name!r}, showtime={self.showtime})>"
        )


class SeatSnapshot(Base):
    """Represents a captured seat availability snapshot for a screening."""
    __tablename__ = "seat_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    screening_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("screenings.id", ondelete="CASCADE"),
        nullable=False,
    )
    row_label: Mapped[str] = mapped_column(String(16), nullable=False)
    seat_number: Mapped[str] = mapped_column(String(16), nullable=False)
    seat_type: Mapped[str] = mapped_column(String(32), nullable=False, default="standard")
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    screening: Mapped["Screening"] = relationship(
        "Screening",
        back_populates="seat_snapshots",
    )

    __table_args__ = (
        Index("ix_seat_snapshots_screening_id", "screening_id"),
        Index(
            "ix_seat_snapshots_screening_row_num",
            "screening_id",
            "row_label",
            "seat_number",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<SeatSnapshot(id={self.id}, screening_id={self.screening_id}, "
            f"seat={self.row_label}{self.seat_number}, status={self.status})>"
        )
