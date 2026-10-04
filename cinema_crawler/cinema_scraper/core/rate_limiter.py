"""Token bucket and randomized jitter rate limiter for anti-bot compliance."""

import asyncio
import random
import time
from typing import Optional


class TokenBucket:
    """Asynchronous token bucket rate limiter with smooth burst control."""

    def __init__(self, rate: float = 2.0, capacity: float = 5.0):
        """
        Args:
            rate: Tokens added per second.
            capacity: Maximum burst capacity in tokens.
        """
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self, tokens: float = 1.0) -> None:
        """Waits asynchronously until enough tokens are available."""
        async with self._lock:
            while True:
                now = time.monotonic()
                elapsed = now - self.last_update
                self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
                self.last_update = now

                if self.tokens >= tokens:
                    self.tokens -= tokens
                    return

                # Calculate required sleep duration for token replenishment
                needed = tokens - self.tokens
                sleep_time = needed / self.rate
                await asyncio.sleep(sleep_time)


class AsyncRateLimiter:
    """Combines token-bucket rate limiting with humanized randomized jitter."""

    def __init__(
        self,
        rate: float = 2.0,
        capacity: float = 5.0,
        min_jitter: float = 2.0,
        max_jitter: float = 4.5,
    ):
        """
        Args:
            rate: Base tokens added per second.
            capacity: Token burst capacity.
            min_jitter: Lower bound for randomized pause in seconds (Section 6.3).
            max_jitter: Upper bound for randomized pause in seconds (Section 6.3).
        """
        self.bucket = TokenBucket(rate=rate, capacity=capacity)
        self.min_jitter = min_jitter
        self.max_jitter = max_jitter

    async def throttle(self, with_jitter: bool = True) -> float:
        """
        Acquires a token and optionally sleeps for a random human-like duration.
        Returns the jitter sleep duration in seconds.
        """
        await self.bucket.acquire(1.0)
        delay = 0.0
        if with_jitter and self.max_jitter > 0:
            delay = random.uniform(self.min_jitter, self.max_jitter)
            await asyncio.sleep(delay)
        return delay

    async def __aenter__(self):
        await self.throttle(with_jitter=True)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass
