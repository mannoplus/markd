"""Theater chain parsers and adapter registry."""

from .base import BaseCinemaParser
from .showtime import ShowtimeParser
from .vieshow import VieShowParser

PARSER_REGISTRY = {
    "showtime": ShowtimeParser,
    "vieshow": VieShowParser,
}


def get_parser(chain_name: str) -> BaseCinemaParser:
    """Instantiates a parser adapter by chain identifier."""
    key = chain_name.strip().lower()
    parser_cls = PARSER_REGISTRY.get(key)
    if not parser_cls:
        available = ", ".join(PARSER_REGISTRY.keys())
        from cinema_scraper.core.exceptions import ParserNotFoundError
        raise ParserNotFoundError(
            f"Parser adapter for chain '{chain_name}' not found. Available parsers: {available}"
        )
    return parser_cls()


__all__ = [
    "BaseCinemaParser",
    "ShowtimeParser",
    "VieShowParser",
    "PARSER_REGISTRY",
    "get_parser",
]
