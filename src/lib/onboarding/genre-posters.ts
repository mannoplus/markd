'use client';

import { useEffect, useState } from 'react';
import { getTrendingGenrePostersAction } from '@/app/actions/onboarding';

/**
 * Dynamic genre-poster fetcher with a 24h LocalStorage TTL cache.
 * Posters reflect the most popular/trending movie in each genre and
 * refresh once the cache entry expires.
 */
const GENRE_POSTER_CACHE_KEY = 'cc_genre_poster_cache_v1';
const GENRE_POSTER_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface GenrePosterCache {
  [genreId: string]: {
    posterPath: string;
    fetchedAt: number;
  };
}

function readCache(): GenrePosterCache {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GENRE_POSTER_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as GenrePosterCache) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: GenrePosterCache): void {
  try {
    localStorage.setItem(GENRE_POSTER_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to persist genre poster cache:', e);
  }
}

function isValidEntry(entry: GenrePosterCache[string] | undefined): entry is GenrePosterCache[string] {
  return (
    !!entry &&
    typeof entry.posterPath === 'string' &&
    entry.posterPath.length > 0 &&
    typeof entry.fetchedAt === 'number' &&
    Date.now() - entry.fetchedAt < GENRE_POSTER_TTL_MS
  );
}

/**
 * Fetches trending posters for the given genre ids. Returns a map of
 * genreId -> posterPath for genres that resolved, plus a loading flag.
 * Individual genre failures never break the other genres.
 */
export function useGenrePosters(genreIds: number[]): {
  posters: Record<number, string>;
  loading: boolean;
} {
  const idsKey = genreIds.join(',');

  // Initialize synchronously from the valid (non-expired) cache so posters
  // render on the first client render without any effect-driven setState.
  // (The requested genre set is a module-level constant per mount, so the
  // cache is only evaluated once.)
  const [initial] = useState(() => {
    if (typeof window === 'undefined') return { cached: {} as Record<number, string>, stale: [] as number[] };
    const cache = readCache();
    const cached: Record<number, string> = {};
    const stale: number[] = [];
    for (const id of idsKey ? idsKey.split(',').map(Number).filter(Number.isFinite) : []) {
      const entry = cache[String(id)];
      if (isValidEntry(entry)) cached[id] = entry.posterPath;
      else stale.push(id);
    }
    return { cached, stale };
  });

  const [posters, setPosters] = useState<Record<number, string>>(initial.cached);
  const [loading, setLoading] = useState(initial.stale.length > 0);

  useEffect(() => {
    if (initial.stale.length === 0) return;
    let cancelled = false;

    // Fetch only the stale/missing genres from the API.
    getTrendingGenrePostersAction(initial.stale)
      .then((result) => {
        if (cancelled) return;
        const nextCache = readCache();
        const next = { ...initial.cached };
        for (const [idStr, posterPath] of Object.entries(result)) {
          const id = Number(idStr);
          if (!Number.isFinite(id) || typeof posterPath !== 'string') continue;
          next[id] = posterPath;
          nextCache[String(id)] = { posterPath, fetchedAt: Date.now() };
        }
        writeCache(nextCache);
        setPosters(next);
      })
      .catch((e) => {
        // Non-fatal: the UI falls back to static poster paths per genre.
        console.warn('Genre poster fetch failed:', e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initial.cached, initial.stale]);

  return { posters, loading };
}
