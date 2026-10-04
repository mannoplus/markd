"""Global configuration, timeouts, browser settings, and user agents."""

from dataclasses import dataclass, field
import os
from pathlib import Path
from typing import List, Tuple

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "cinema_data.db"
DEFAULT_DB_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DEFAULT_DB_PATH}")


@dataclass
class BrowserConfig:
    """Browser launch and context configuration."""
    headless: bool = True
    viewport_width: int = 1920
    viewport_height: int = 1080
    locale: str = "zh-TW"
    timezone_id: str = "Asia/Taipei"
    navigation_timeout_ms: int = 35000
    action_timeout_ms: int = 15000
    default_user_agent: str = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/130.0.0.0 Safari/537.36"
    )
    fallback_user_agents: List[str] = field(default_factory=lambda: [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    ])
    chromium_args: List[str] = field(default_factory=lambda: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-size=1920,1080",
        "--disable-dev-shm-usage",
    ])


@dataclass
class RateLimitConfig:
    """Rate limiter configuration."""
    rate: float = 2.0  # requests per second
    capacity: float = 5.0  # token bucket burst capacity
    min_jitter_sec: float = 2.0  # minimum randomized jitter (Section 6.3)
    max_jitter_sec: float = 4.5  # maximum randomized jitter (Section 6.3)


@dataclass
class RetryConfig:
    """Tenacity retry parameters."""
    max_attempts: int = 3
    multiplier: float = 1.5
    min_wait_sec: float = 2.0
    max_wait_sec: float = 10.0


@dataclass
class Settings:
    """Central scraper system settings."""
    db_url: str = DEFAULT_DB_URL
    default_concurrency: int = 2
    browser: BrowserConfig = field(default_factory=BrowserConfig)
    rate_limit: RateLimitConfig = field(default_factory=RateLimitConfig)
    retry: RetryConfig = field(default_factory=RetryConfig)


# Global singleton settings instance
settings = Settings()
