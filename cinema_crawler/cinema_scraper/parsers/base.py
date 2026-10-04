"""Abstract Base Parser (ABC) defining standard cinema adapter interface."""

from abc import ABC, abstractmethod
from typing import List
from playwright.async_api import BrowserContext, Page

from cinema_scraper.schemas.cinema import ScreeningSchema


class BaseCinemaParser(ABC):
    """
    Abstract interface for cinema chain parsers.
    Each theater chain (e.g. VieShow, Showtime) implements this contract.
    """

    @property
    @abstractmethod
    def chain_name(self) -> str:
        """Returns the chain name, e.g., 'VieShow' or 'Showtime'."""
        pass

    @abstractmethod
    async def get_schedule(self, page: Page, date_str: str) -> List[ScreeningSchema]:
        """
        Navigates to the schedule page and collects available screenings for a date.

        Args:
            page: Stealth-configured Playwright Page.
            date_str: Target date in 'YYYY-MM-DD' format.

        Returns:
            List of ScreeningSchema objects with showtimes and booking URLs.
        """
        pass

    @abstractmethod
    async def extract_seat_map(
        self,
        context: BrowserContext,
        screening: ScreeningSchema,
    ) -> ScreeningSchema:
        """
        Navigates into the booking flow for a screening, accesses the seat map,
        extracts real-time seat availability, and cleanly exits the session.

        Critical Invariant:
        Must never finalize payment or permanently lock seats. Temporary holds
        must be released or the BrowserContext discarded.

        Args:
            context: Isolated BrowserContext for this extraction session.
            screening: Target screening schema to populate with SeatSchema records.

        Returns:
            The mutated or newly populated ScreeningSchema with its seats list.
        """
        pass
