import { OnboardingState, ONBOARDING_STORAGE_KEY, ONBOARDING_COMPLETED_KEY } from './types';

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  genres: {
    movie: [],
    tv: [],
  },
  genreNames: {
    movie: [],
    tv: [],
  },
  favoriteTitles: [],
  tasteAnswers: [],
  currentStep: 1,
};

export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') return DEFAULT_ONBOARDING_STATE;
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_ONBOARDING_STATE;
    const parsed = JSON.parse(raw);
    return {
      genres: {
        movie: Array.isArray(parsed?.genres?.movie) ? parsed.genres.movie : [],
        tv: Array.isArray(parsed?.genres?.tv) ? parsed.genres.tv : [],
      },
      genreNames: {
        movie: Array.isArray(parsed?.genreNames?.movie) ? parsed.genreNames.movie : [],
        tv: Array.isArray(parsed?.genreNames?.tv) ? parsed.genreNames.tv : [],
      },
      favoriteTitles: Array.isArray(parsed?.favoriteTitles) ? parsed.favoriteTitles : [],
      tasteAnswers: Array.isArray(parsed?.tasteAnswers) ? parsed.tasteAnswers : [],
      currentStep: typeof parsed?.currentStep === 'number' ? parsed.currentStep : 1,
    };
  } catch (e) {
    console.error('Failed to parse onboarding state from localStorage:', e);
    return DEFAULT_ONBOARDING_STATE;
  }
}

export function saveOnboardingState(state: Partial<OnboardingState>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getOnboardingState();
    const merged = { ...current, ...state };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save onboarding state to localStorage:', e);
  }
}

export function clearOnboardingState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear onboarding state from localStorage:', e);
  }
}

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOnboardingCompleted(completed: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    if (completed) {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } else {
      localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    }
  } catch (e) {
    console.error('Failed to set onboarding completed flag:', e);
  }
}
