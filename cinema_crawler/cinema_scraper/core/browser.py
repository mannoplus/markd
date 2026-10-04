"""Playwright browser manager with stealth context builder and anti-detection hooks."""

import asyncio
from typing import Optional
from playwright.async_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    async_playwright,
)
from playwright_stealth import Stealth

from cinema_scraper.config import BrowserConfig, settings


STEALTH_INIT_SCRIPT = """
// Override webdriver flag
Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
});

// Provide realistic plugins
Object.defineProperty(navigator, 'plugins', {
    get: () => [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' }
    ],
});

// Languages matching Taiwan locale
Object.defineProperty(navigator, 'languages', {
    get: () => ['zh-TW', 'zh', 'en-US', 'en'],
});

// Provide standard window.chrome
if (!window.chrome) {
    window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
    };
}
"""


class BrowserManager:
    """Manages Playwright lifecycle, stealth context generation, and clean teardown."""

    def __init__(self, config: Optional[BrowserConfig] = None):
        self.config = config or settings.browser
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._stealth = Stealth()
        self._lock = asyncio.Lock()

    async def initialize(self) -> None:
        """Launches the underlying Chromium browser instance."""
        async with self._lock:
            if self._playwright is None:
                self._playwright = await async_playwright().start()

            if self._browser is None:
                # Launch Chromium with anti-bot evasion arguments
                self._browser = await self._playwright.chromium.launch(
                    headless=self.config.headless,
                    args=self.config.chromium_args,
                )

    async def create_isolated_context(self) -> BrowserContext:
        """
        Creates an isolated browser context equipped with stealth properties,
        realistic viewport, Taiwan locale, and cookie isolation.
        """
        if self._browser is None:
            await self.initialize()

        context = await self._browser.new_context(
            viewport={
                "width": self.config.viewport_width,
                "height": self.config.viewport_height,
            },
            user_agent=self.config.default_user_agent,
            locale=self.config.locale,
            timezone_id=self.config.timezone_id,
            ignore_https_errors=True,
            extra_http_headers={
                "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
                "Sec-Ch-Ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"macOS"',
            },
        )

        # Inject anti-detection scripts on document creation
        await context.add_init_script(STEALTH_INIT_SCRIPT)
        context.set_default_navigation_timeout(self.config.navigation_timeout_ms)
        context.set_default_timeout(self.config.action_timeout_ms)

        return context

    async def create_stealth_page(self, context: Optional[BrowserContext] = None) -> tuple[BrowserContext, Page]:
        """Creates a new page with stealth applied and context returned for cleanup."""
        ctx = context or await self.create_isolated_context()
        page = await ctx.new_page()
        await self._stealth.apply_stealth_async(page)
        return ctx, page

    async def release_context(self, context: Optional[BrowserContext]) -> None:
        """
        Cleanly closes the isolated context, clearing cookies, localStorage,
        and temporary holds without lingering sessions.
        """
        if context:
            try:
                await context.close()
            except Exception:
                pass

    async def close(self) -> None:
        """Completely terminates browser and playwright processes."""
        async with self._lock:
            if self._browser:
                try:
                    await self._browser.close()
                except Exception:
                    pass
                self._browser = None

            if self._playwright:
                try:
                    await self._playwright.stop()
                except Exception:
                    pass
                self._playwright = None

    async def __aenter__(self):
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
