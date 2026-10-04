"""Command-line interface entry point for Cinema Scraper engine."""

import asyncio
from datetime import date, datetime
import logging
from typing import Optional
from zoneinfo import ZoneInfo
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from cinema_scraper.config import settings
from cinema_scraper.database.session import (
    close_db,
    get_database_summary,
    get_db_session,
    init_db,
)
from cinema_scraper.engine import CinemaScraperEngine

app = typer.Typer(
    name="cinema-scraper",
    help="Autonomous aggregation engine for Taiwan cinema showtimes and seat availability.",
    add_completion=False,
)
console = Console()
TAIPEI_TZ = ZoneInfo("Asia/Taipei")


def setup_logging(verbose: bool = False):
    """Sets standard logging format."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


@app.command()
def run(
    chain: str = typer.Option(
        "showtime",
        "--chain",
        "-c",
        help="Cinema chain to scrape ('showtime', 'vieshow', or 'all')",
    ),
    date_str: str = typer.Option(
        None,
        "--date",
        "-d",
        help="Target screening date in YYYY-MM-DD format (defaults to current date)",
    ),
    headless: bool = typer.Option(
        True,
        "--headless/--headed",
        help="Run browser in headless or headed visual mode",
    ),
    concurrency: int = typer.Option(
        2,
        "--concurrency",
        "-n",
        help="Concurrent browser context workers (default: 2)",
    ),
    limit: Optional[int] = typer.Option(
        None,
        "--limit",
        "-l",
        help="Maximum screenings to process for seat maps (useful for quick checks)",
    ),
    no_jitter: bool = typer.Option(
        False,
        "--no-jitter",
        help="Disable randomized jitter delays (faster execution in test environments)",
    ),
    db_url: Optional[str] = typer.Option(
        None,
        "--db-url",
        help="Custom SQLAlchemy database URL (default: sqlite+aiosqlite:///./cinema_data.db)",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Enable debug logging output",
    ),
):
    """Executes scraping cycle to aggregate showtimes and seat availability."""
    setup_logging(verbose)

    # Default to current date in Taipei timezone
    if not date_str:
        now_taipei = datetime.now(TAIPEI_TZ).date()
        date_str = now_taipei.strftime("%Y-%m-%d")

    console.print(
        Panel(
            f"[bold green]Starting Cinema Scraper Pipeline[/bold green]\n"
            f"[cyan]Chain:[/cyan] {chain.upper()}  |  "
            f"[cyan]Date:[/cyan] {date_str}  |  "
            f"[cyan]Headless:[/cyan] {headless}  |  "
            f"[cyan]Concurrency:[/cyan] {concurrency}\n"
            f"[cyan]DB URL:[/cyan] {db_url or settings.db_url}",
            title="Engine Configuration",
            border_style="green",
        )
    )

    async def _async_run():
        engine = CinemaScraperEngine(
            concurrency=concurrency,
            db_url=db_url,
            headless=headless,
            rate_limit_enabled=not no_jitter,
        )

        chains_to_run = ["showtime", "vieshow"] if chain.lower() == "all" else [chain.lower()]

        for ch in chains_to_run:
            console.print(f"\n[bold yellow]>>> Processing chain: {ch.upper()}[/bold yellow]")
            summary = await engine.run(
                chain_name=ch,
                target_date=date_str,
                max_screenings=limit,
            )

            # Render Summary Table
            table = Table(title=f"Extraction Results - {summary.chain_name}")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="bold white")

            table.add_row("Target Date", summary.target_date)
            table.add_row("Screenings Found", str(summary.screenings_found))
            table.add_row("Screenings Processed", str(summary.screenings_processed))
            table.add_row("Total Seats Captured", str(summary.total_seats_captured))
            table.add_row("Available Seats", f"[green]{summary.total_available_seats}[/green]")
            table.add_row("Occupied Seats", f"[red]{summary.total_occupied_seats}[/red]")
            table.add_row("Overall Occupancy Rate", f"[yellow]{summary.overall_occupancy_rate}%[/yellow]")
            table.add_row("Elapsed Time", f"{summary.elapsed_seconds}s")

            console.print(table)

        # Trigger automatic verification table
        console.print("\n[bold green]Database Verification Summary:[/bold green]")
        await _print_db_verification(db_url)
        await close_db()

    asyncio.run(_async_run())


@app.command()
def verify(
    db_url: Optional[str] = typer.Option(
        None,
        "--db-url",
        help="Database URL to verify",
    ),
):
    """Verifies persisted database records and displays occupancy metrics."""
    async def _async_verify():
        await init_db(db_url)
        await _print_db_verification(db_url)
        await close_db()

    asyncio.run(_async_verify())


async def _print_db_verification(db_url: Optional[str] = None):
    """Renders formatted database verification table matching acceptance criteria."""
    async with get_db_session(db_url) as session:
        data = await get_database_summary(session)

    # 1. High-level Summary Panel
    console.print(
        Panel(
            f"Total Theaters: [bold]{data['theaters_count']}[/bold] | "
            f"Total Movies: [bold]{data['movies_count']}[/bold] | "
            f"Total Screenings: [bold]{data['screenings_count']}[/bold]\n"
            f"Total Seats: [bold]{data['total_seats']}[/bold] | "
            f"Available: [bold green]{data['available_seats']}[/bold green] | "
            f"Occupied: [bold red]{data['occupied_seats']}[/bold red] | "
            f"Occupancy Rate: [bold yellow]{data['occupancy_rate']:.2f}%[/bold yellow]",
            title="Database Aggregate Metrics",
            border_style="blue",
        )
    )

    # 2. Detailed Screenings Table
    screenings = data.get("screenings", [])
    if not screenings:
        console.print("[dim]No screening records found in database.[/dim]")
        return

    table = Table(title="Persisted Screenings & Real-Time Seat Snapshots")
    table.add_column("ID", justify="right", style="dim")
    table.add_column("Theater", style="cyan")
    table.add_column("Movie Title", style="bold white")
    table.add_column("Hall / Format", style="magenta")
    table.add_column("Showtime (Local)", style="green")
    table.add_column("Total Seats", justify="right")
    table.add_column("Available", justify="right", style="green")
    table.add_column("Occupied", justify="right", style="red")
    table.add_column("Occupancy %", justify="right", style="yellow")

    for s in screenings[:50]:  # Show top 50 in CLI
        time_str = s["showtime"].strftime("%Y-%m-%d %H:%M") if isinstance(s["showtime"], (datetime, date)) else str(s["showtime"])
        table.add_row(
            str(s["id"]),
            f"{s['chain_name']} - {s['theater_name']}",
            s["movie_title"][:22],
            f"{s['hall_name']} ({s['format']})",
            time_str,
            str(s["seat_count"]),
            str(s["available_count"]),
            str(s["occupied_count"]),
            f"{s['occupancy_rate']:.1f}%",
        )

    console.print(table)
    if len(screenings) > 50:
        console.print(f"[dim]... and {len(screenings) - 50} more screenings in database.[/dim]")


def main():
    """Main CLI entrypoint."""
    app()


if __name__ == "__main__":
    main()
