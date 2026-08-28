import type { FavoriteTitleItem } from './types';

/**
 * Shadow Profile — silently captures onboarding selections for
 * unauthenticated visitors. Persisted indefinitely (no expiry) until the
 * user authenticates and the data is successfully merged into their
 * account. Never contains PII — taste/preference data only.
 */
export interface ShadowProfile {
  genres: number[];
  likedTitles: FavoriteTitleItem[];
  dislikedTitles: FavoriteTitleItem[];
  preferences: Record<string, string>;
  lastUpdated: string;
}

export const SHADOW_PROFILE_KEY = 'cc_shadow_profile';

export const EMPTY_SHADOW_PROFILE: ShadowProfile = {
  genres: [],
  likedTitles: [],
  dislikedTitles: [],
  preferences: {},
  lastUpdated: '',
};

function sanitizeShadowProfile(raw: unknown): ShadowProfile {
  if (typeof window === 'undefined' || !raw || typeof raw !== 'object') {
    return { ...EMPTY_SHADOW_PROFILE };
  }
  const p = raw as Partial<ShadowProfile>;

  const cleanPrefs: Record<string, string> = {};
  if (p.preferences && typeof p.preferences === 'object') {
    for (const [k, v] of Object.entries(p.preferences as Record<string, unknown>).slice(0, 50)) {
      if (typeof k === 'string' && k.length <= 100 && typeof v === 'string' && v.length <= 100) {
        cleanPrefs[k] = v;
      }
    }
  }

  return {
    genres: Array.isArray(p.genres)
      ? p.genres.filter((g): g is number => typeof g === 'number' && Number.isFinite(g)).slice(0, 50)
      : [],
    likedTitles: Array.isArray(p.likedTitles)
      ? p.likedTitles
          .filter(
            (t): t is FavoriteTitleItem =>
              !!t && typeof t === 'object' && typeof t.id === 'number' && typeof t.title === 'string'
          )
          .map((t) => ({
            id: t.id,
            title: t.title.slice(0, 300),
            type: t.type === 'tv' ? ('tv' as const) : ('movie' as const),
            year: typeof t.year === 'string' ? t.year : undefined,
            posterPath: typeof t.posterPath === 'string' ? t.posterPath : null,
            voteAverage: typeof t.voteAverage === 'number' ? t.voteAverage : undefined,
          }))
          .slice(0, 100)
      : [],
    dislikedTitles: Array.isArray(p.dislikedTitles)
      ? (p.dislikedTitles as ShadowProfile['dislikedTitles']).slice(0, 100)
      : [],
    preferences: cleanPrefs,
    lastUpdated: typeof p.lastUpdated === 'string' ? p.lastUpdated : '',
  };
}

export function getShadowProfile(): ShadowProfile {
  if (typeof window === 'undefined') return { ...EMPTY_SHADOW_PROFILE };
  try {
    const raw = localStorage.getItem(SHADOW_PROFILE_KEY);
    if (!raw) return { ...EMPTY_SHADOW_PROFILE };
    return sanitizeShadowProfile(JSON.parse(raw));
  } catch {
    return { ...EMPTY_SHADOW_PROFILE };
  }
}

/**
 * Incrementally updates the shadow profile. Merges the partial into the
 * existing profile (union for arrays keyed by id, last-write-wins for
 * preferences) so every interaction is captured — even if the user skips
 * onboarding midway through.
 */
export function updateShadowProfile(
  partial: Partial<Omit<ShadowProfile, 'lastUpdated'>>
): ShadowProfile {
  if (typeof window === 'undefined') return { ...EMPTY_SHADOW_PROFILE };
  const current = getShadowProfile();

  const genres = partial.genres
    ? Array.from(new Set([...current.genres, ...partial.genres]))
    : current.genres;

  const likedTitles = partial.likedTitles
    ? (() => {
        const byId = new Map(current.likedTitles.map((t) => [t.id, t]));
        for (const t of partial.likedTitles) byId.set(t.id, t);
        return Array.from(byId.values());
      })()
    : current.likedTitles;

  const dislikedTitles = partial.dislikedTitles
    ? (() => {
        const byId = new Map(current.dislikedTitles.map((t) => [t.id, t]));
        for (const t of partial.dislikedTitles) byId.set(t.id, t);
        return Array.from(byId.values());
      })()
    : current.dislikedTitles;

  const preferences = partial.preferences
    ? { ...current.preferences, ...partial.preferences }
    : current.preferences;

  const next: ShadowProfile = {
    genres,
    likedTitles,
    dislikedTitles,
    preferences,
    lastUpdated: new Date().toISOString(),
  };

  try {
    localStorage.setItem(SHADOW_PROFILE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to persist shadow profile:', e);
  }
  return next;
}

/** Clears the shadow profile — only called after a confirmed successful merge. */
export function clearShadowProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SHADOW_PROFILE_KEY);
  } catch (e) {
    console.error('Failed to clear shadow profile:', e);
  }
}

export function hasShadowProfileData(profile: ShadowProfile): boolean {
  return (
    profile.genres.length > 0 ||
    profile.likedTitles.length > 0 ||
    profile.dislikedTitles.length > 0 ||
    Object.keys(profile.preferences).length > 0
  );
}
