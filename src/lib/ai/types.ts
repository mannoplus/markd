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

export interface AiChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  recommendations?: AiRecommendationItem[];
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
}

export interface AiChatRequest {
  message?: string;
  messages?: AiChatMessage[];
  conversationId?: string;
  language?: string;
  contextInfo?: AiChatContext;
  isSuggestions?: boolean;
}

export interface AiChatResponse {
  text: string;
  recommendations?: AiRecommendationItem[];
  suggestions?: string[];
  provider?: string;
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
