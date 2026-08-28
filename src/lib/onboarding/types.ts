export interface FavoriteTitleItem {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  year?: string;
  posterPath?: string | null;
  voteAverage?: number;
}

export interface TasteAnswerItem {
  questionId: string;
  answerId: string;
}

export interface OnboardingState {
  genres: {
    movie: number[];
    tv: number[];
  };
  genreNames?: {
    movie: string[];
    tv: string[];
  };
  favoriteTitles: FavoriteTitleItem[];
  tasteAnswers: TasteAnswerItem[];
  currentStep: number;
}

export const ONBOARDING_STORAGE_KEY = 'markd_onboarding_state';
export const ONBOARDING_COMPLETED_KEY = 'markd_onboarding_completed';
