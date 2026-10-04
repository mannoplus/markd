"""Custom scraper and parser exceptions for the cinema aggregation engine."""


class CinemaScraperError(Exception):
    """Base exception for all cinema crawler and scraper operations."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ParserNotFoundError(CinemaScraperError):
    """Raised when an unknown theater chain identifier is requested."""
    pass


class NavigationTimeoutError(CinemaScraperError):
    """Raised when page navigation or element waiting exceeds allowed threshold."""
    pass


class AntiBotBlockedError(CinemaScraperError):
    """Raised when bot detection triggers HTTP 403, Cloudflare challenge, or Akamai block."""
    pass


class SeatMapExtractionError(CinemaScraperError):
    """Raised when seat map layout or status parsing fails."""
    pass


class SoldOutScreeningError(CinemaScraperError):
    """Raised or handled when a screening is completely sold out or disabled."""
    pass


class LobbyQueueError(CinemaScraperError):
    """Raised when a ticket vendor redirects to a virtual waiting room or queue."""
    pass


class SessionReleaseError(CinemaScraperError):
    """Raised when an active checkout or temporary seat hold fails to release."""
    pass
