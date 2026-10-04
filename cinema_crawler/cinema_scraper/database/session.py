"""Async engine and session lifecycle management using SQLAlchemy 2.0+."""

import re
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict, List, Optional, Tuple, Any
from sqlalchemy import case, delete, func, select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from cinema_scraper.config import settings
from cinema_scraper.database.models import Base, Movie, Screening, SeatSnapshot, Theater
from cinema_scraper.schemas.cinema import ScreeningSchema, SeatStatus


_engine: Optional[AsyncEngine] = None
_current_db_url: Optional[str] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def normalize_movie_title(title: str) -> str:
    """Canonicalize movie title for deduplication."""
    clean = re.sub(r"[\s\-_:：·・—–\(\)\[\]（）]+", " ", title).strip().lower()
    return clean if clean else title.strip().lower()


def get_async_engine(db_url: Optional[str] = None) -> AsyncEngine:
    """Creates or retrieves the singleton async SQLAlchemy engine."""
    global _engine, _current_db_url
    target_url = db_url or settings.db_url
    if _engine is None or _current_db_url != target_url:
        _current_db_url = target_url
        engine_kwargs: Dict[str, Any] = {
            "echo": False,
            "future": True,
        }
        if ":memory:" in target_url or target_url.endswith("://"):
            from sqlalchemy.pool import StaticPool
            engine_kwargs["poolclass"] = StaticPool
            engine_kwargs["connect_args"] = {"check_same_thread": False}

        _engine = create_async_engine(
            target_url,
            **engine_kwargs,
        )
    return _engine


def get_session_factory(db_url: Optional[str] = None) -> async_sessionmaker[AsyncSession]:
    """Creates or retrieves the async sessionmaker factory."""
    global _session_factory
    engine = get_async_engine(db_url)
    if _session_factory is None or _session_factory.kw.get("bind") != engine:
        _session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _session_factory


@asynccontextmanager
async def get_db_session(db_url: Optional[str] = None) -> AsyncGenerator[AsyncSession, None]:
    """Async context manager providing a transactional database session."""
    factory = get_session_factory(db_url)
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db(db_url: Optional[str] = None) -> None:
    """Initializes tables in the target database."""
    engine = get_async_engine(db_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Disposes active database engine connections."""
    global _engine, _session_factory, _current_db_url
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        _current_db_url = None


from sqlalchemy.exc import IntegrityError


async def save_screening_with_seats(
    session: AsyncSession,
    screening_data: ScreeningSchema,
) -> Screening:
    """
    Persists or updates a Screening record, upserts Theater and Movie,
    and replaces seat snapshots for the screening session.
    Handles concurrent worker race conditions safely.
    """
    # 1. Upsert Theater (concurrency-safe)
    stmt_t = select(Theater).where(
        Theater.chain_name == screening_data.theater_chain,
        Theater.name == screening_data.theater_name,
    )
    result_t = await session.execute(stmt_t)
    theater = result_t.scalar_one_or_none()
    if theater is None:
        theater = Theater(
            chain_name=screening_data.theater_chain,
            name=screening_data.theater_name,
            city=screening_data.theater_city,
        )
        session.add(theater)
        try:
            await session.flush()
        except IntegrityError:
            # Another concurrent worker inserted it
            result_t = await session.execute(stmt_t)
            theater = result_t.scalar_one()

    # 2. Upsert Movie (concurrency-safe)
    norm_title = normalize_movie_title(screening_data.movie_title)
    stmt_m = select(Movie).where(Movie.normalized_title == norm_title)
    result_m = await session.execute(stmt_m)
    movie = result_m.scalar_one_or_none()
    if movie is None:
        movie = Movie(
            title=screening_data.movie_title,
            normalized_title=norm_title,
        )
        session.add(movie)
        try:
            await session.flush()
        except IntegrityError:
            # Another concurrent worker inserted it
            result_m = await session.execute(stmt_m)
            movie = result_m.scalar_one()

    # 3. Upsert Screening
    stmt_s = select(Screening).where(
        Screening.theater_id == theater.id,
        Screening.hall_name == screening_data.hall_name,
        Screening.showtime == screening_data.showtime,
    )
    result_s = await session.execute(stmt_s)
    screening = result_s.scalar_one_or_none()

    if screening is None:
        screening = Screening(
            theater_id=theater.id,
            movie_id=movie.id,
            hall_name=screening_data.hall_name,
            format=screening_data.format,
            showtime=screening_data.showtime,
            booking_url=screening_data.booking_url,
        )
        session.add(screening)
        try:
            await session.flush()
        except IntegrityError:
            result_s = await session.execute(stmt_s)
            screening = result_s.scalar_one()
    else:
        screening.movie_id = movie.id
        screening.format = screening_data.format
        if screening_data.booking_url:
            screening.booking_url = screening_data.booking_url
        await session.flush()

    # 4. Upsert / Refresh Seat Snapshots
    if screening_data.seats:
        # Clear previous seat snapshot records for this screening to ensure latest real-time status
        await session.execute(
            delete(SeatSnapshot).where(SeatSnapshot.screening_id == screening.id)
        )
        snapshots = [
            SeatSnapshot(
                screening_id=screening.id,
                row_label=seat.row_label,
                seat_number=seat.seat_number,
                seat_type=seat.seat_type if isinstance(seat.seat_type, str) else seat.seat_type.value,
                status=seat.status if isinstance(seat.status, str) else seat.status.value,
            )
            for seat in screening_data.seats
        ]
        session.add_all(snapshots)
        await session.flush()

    return screening


async def get_database_summary(session: AsyncSession) -> Dict[str, Any]:
    """Computes high-level aggregated database metrics for verification and reporting."""
    screenings_count = (await session.execute(select(func.count(Screening.id)))).scalar_one() or 0
    theaters_count = (await session.execute(select(func.count(Theater.id)))).scalar_one() or 0
    movies_count = (await session.execute(select(func.count(Movie.id)))).scalar_one() or 0
    total_seats = (await session.execute(select(func.count(SeatSnapshot.id)))).scalar_one() or 0

    available_seats = (
        await session.execute(
            select(func.count(SeatSnapshot.id)).where(
                SeatSnapshot.status == SeatStatus.AVAILABLE.value
            )
        )
    ).scalar_one() or 0

    occupied_seats = (
        await session.execute(
            select(func.count(SeatSnapshot.id)).where(
                SeatSnapshot.status.in_([
                    SeatStatus.OCCUPIED.value,
                    SeatStatus.RESERVED.value,
                    SeatStatus.BLOCKED.value,
                ])
            )
        )
    ).scalar_one() or 0

    occupancy_rate = (occupied_seats / total_seats * 100.0) if total_seats > 0 else 0.0

    # Query detailed screenings for verification view
    stmt = (
        select(
            Screening.id,
            Theater.chain_name,
            Theater.name.label("theater_name"),
            Movie.title.label("movie_title"),
            Screening.hall_name,
            Screening.format,
            Screening.showtime,
            func.count(SeatSnapshot.id).label("seat_count"),
            func.sum(
                case(
                    (SeatSnapshot.status == SeatStatus.AVAILABLE.value, 1),
                    else_=0,
                )
            ).label("available_count"),
            func.sum(
                case(
                    (
                        SeatSnapshot.status.in_([
                            SeatStatus.OCCUPIED.value,
                            SeatStatus.RESERVED.value,
                            SeatStatus.BLOCKED.value,
                        ]),
                        1,
                    ),
                    else_=0,
                )
            ).label("occupied_count"),
        )
        .join(Theater, Screening.theater_id == Theater.id)
        .join(Movie, Screening.movie_id == Movie.id)
        .outerjoin(SeatSnapshot, Screening.id == SeatSnapshot.screening_id)
        .group_by(Screening.id, Theater.chain_name, Theater.name, Movie.title, Screening.hall_name, Screening.format, Screening.showtime)
        .order_by(Screening.showtime.asc())
    )
    rows = (await session.execute(stmt)).all()

    screenings_detail = []
    for r in rows:
        sc = r.seat_count or 0
        oc = r.occupied_count or 0
        ac = r.available_count or 0
        rate = (oc / sc * 100.0) if sc > 0 else 0.0
        screenings_detail.append({
            "id": r.id,
            "chain_name": r.chain_name,
            "theater_name": r.theater_name,
            "movie_title": r.movie_title,
            "hall_name": r.hall_name,
            "format": r.format,
            "showtime": r.showtime,
            "seat_count": sc,
            "available_count": ac,
            "occupied_count": oc,
            "occupancy_rate": rate,
        })

    return {
        "screenings_count": screenings_count,
        "theaters_count": theaters_count,
        "movies_count": movies_count,
        "total_seats": total_seats,
        "available_seats": available_seats,
        "occupied_seats": occupied_seats,
        "occupancy_rate": occupancy_rate,
        "screenings": screenings_detail,
    }
