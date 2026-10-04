"""Tests for token bucket and jitter rate limiter."""

import asyncio
import time
import pytest
from cinema_scraper.core.rate_limiter import AsyncRateLimiter, TokenBucket


@pytest.mark.asyncio
async def test_token_bucket_acquisition():
    bucket = TokenBucket(rate=100.0, capacity=10.0)
    # Should acquire without meaningful delay
    t0 = time.monotonic()
    await bucket.acquire(5.0)
    assert time.monotonic() - t0 < 0.1


@pytest.mark.asyncio
async def test_rate_limiter_jitter():
    limiter = AsyncRateLimiter(rate=50.0, capacity=10.0, min_jitter=0.05, max_jitter=0.1)
    t0 = time.monotonic()
    async with limiter:
        pass
    elapsed = time.monotonic() - t0
    assert 0.04 <= elapsed <= 0.25
