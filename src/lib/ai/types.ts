import type { MovieDnaTrait } from '@/lib/taste-engine';

export interface AiRecommendationItem {
  id: number;
  title: string;
  year?: string;
  runtime?: number;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
  matchScore: number;
  matchReason: string;
  primaryDna?: MovieDnaTrait | string;
  mediaType: 'movie' | 'tv';
  genres?: string[];
}

export interface AiMediaPoster {
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
  mediaType: 'movie' | 'tv';
  year?: string;
  rating?: number;
  overview?: string;
}

export interface AiMediaVideo {
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface AiWatchProvidersData {
  link?: string;
  flatrate?: { provider_name: string; logo_path: string }[];
  rent?: { provider_name: string; logo_path: string }[];
  buy?: { provider_name: string; logo_path: string }[];
  free?: { provider_name: string; logo_path: string }[];
  ads?: { provider_name: string; logo_path: string }[];
}

export interface AiChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  recommendations?: AiRecommendationItem[];
  posters?: AiMediaPoster[];
  videos?: AiMediaVideo[];
  watchProviders?: AiWatchProvidersData;
  provider?: 'direct-api' | 'openrouter' | 'gemini' | 'mock' | string;
  tier?: 1 | 2 | 3;
}

export interface AiChatContext {
  id?: number;
  type?: 'movie' | 'tv';
  title?: string;
  overview?: string;
  runtime?: number;
  genres?: string[];
  releaseDate?: string;
  director?: string;
  cast?: string[];
  posterPath?: string | null;
  region?: string;
}

export interface AiChatRequest {
  message?: string;
  messages?: AiChatMessage[];
  conversationId?: string;
  language?: string;
  region?: string;
  contextInfo?: AiChatContext;
  isSuggestions?: boolean;
}

export interface AiChatResponse {
  text: string;
  recommendations?: AiRecommendationItem[];
  posters?: AiMediaPoster[];
  videos?: AiMediaVideo[];
  watchProviders?: AiWatchProvidersData;
  suggestions?: string[];
  provider?: 'direct-api' | 'openrouter' | 'gemini' | 'mock' | string;
  tier?: 1 | 2 | 3;
}

export interface ParsedMovieIntent {
  genres: number[]; // TMDB genre IDs
  moods: string[];
  themes: string[];
  maxRuntime?: number;
  referenceTitles: string[];
  pacing?: 'fast' | 'slow' | 'balanced';
  isSeekingRecommendations: boolean;
}
