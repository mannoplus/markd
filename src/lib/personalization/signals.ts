/**
 * MARKD — Continuous Learning & Interaction Signal System
 * Personal Cinema Companion Architecture
 */

export type SignalType =
  // Positive Explicit Signals
  | 'movie.liked'
  | 'movie.rated'
  | 'movie.rated_high' // 8-10
  | 'movie.watchlist_added'
  | 'movie.favorited'
  | 'movie.completed'
  | 'movie.rewatched'
  | 'movie.status_changed'
  // Neutral / Exploratory Implicit Signals
  | 'movie.opened'
  | 'movie.page_viewed'
  | 'movie.card_clicked'
  | 'movie.trailer_watched'
  | 'movie.details_expanded'
  | 'person.viewed'
  | 'search.submitted'
  | 'recommendation.clicked'
  | 'mood.selected'
  | 'mood.cleared'
  // Negative / Corrective Feedback Signals
  | 'movie.rated_low' // 1-5
  | 'movie.watchlist_removed'
  | 'movie.abandoned'
  | 'recommendation.dismissed'
  | 'feedback.not_interested'
  | 'feedback.less_like_this'
  | 'feedback.not_my_type'
  | 'feedback.already_watched';

export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'explicit';

export type SignalDirection =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'temporary_exclusion'
  | 'permanent_exclusion'
  | 'curiosity'
  | 'completion';

export type SignalPermanence = 'session' | 'persistent';

export interface InteractionSignal {
  id?: string;
  type: SignalType;
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  title?: string;
  strength: SignalStrength;
  direction: SignalDirection;
  permanence: SignalPermanence;
  timestamp?: number;
  context?: {
    surface?: 'home' | 'dashboard' | 'media_details' | 'details_page' | 'movie_card' | 'search' | 'ask_markd' | 'mood_bar' | string;
    activeMood?: string;
    ratingValue?: number;
    query?: string;
    personName?: string;
    traits?: string[];
    [key: string]: any;
  };
}

export const SIGNAL_WEIGHT_MAP: Record<SignalStrength, number> = {
  weak: 0.2,
  moderate: 0.5,
  strong: 0.8,
  explicit: 1.0,
};

/**
 * Maps interaction events to structured learning signals
 */
export function createSignal(
  type: SignalType,
  data: {
    tmdbId?: number;
    mediaType?: 'movie' | 'tv';
    title?: string;
    context?: InteractionSignal['context'];
  }
): InteractionSignal {
  switch (type) {
    case 'feedback.not_my_type':
      return {
        type,
        ...data,
        strength: 'explicit',
        direction: 'permanent_exclusion',
        permanence: 'persistent',
        timestamp: Date.now(),
      };

    case 'feedback.not_interested':
      return {
        type,
        ...data,
        strength: 'strong',
        direction: 'negative',
        permanence: 'persistent',
        timestamp: Date.now(),
      };

    case 'feedback.less_like_this':
      return {
        type,
        ...data,
        strength: 'moderate',
        direction: 'negative',
        permanence: 'persistent',
        timestamp: Date.now(),
      };

    case 'feedback.already_watched':
      return {
        type,
        ...data,
        strength: 'moderate',
        direction: 'neutral',
        permanence: 'persistent',
        timestamp: Date.now(),
      };

    case 'movie.rated_high':
    case 'movie.liked':
    case 'movie.favorited':
      return {
        type,
        ...data,
        strength: 'explicit',
        direction: 'positive',
        permanence: 'persistent',
        timestamp: Date.now(),
      };

    case 'movie.completed':
    case 'movie.rewatched':
      return {
        type,
        ...data,
        strength: 'strong',
        direction: 'positive',
        permanence: 'persistent',
        timestamp: Date.now(),
      };

    case 'movie.watchlist_added':
      return {
        type,
        ...data,
        strength: 'moderate',
        direction: 'positive',
        permanence: 'persistent',
        timestamp: Date.now(),
      };

    case 'movie.watchlist_removed':
      return {
        type,
        ...data,
        strength: 'moderate',
        direction: 'temporary_exclusion',
        permanence: 'session',
        timestamp: Date.now(),
      };

    case 'mood.selected':
      return {
        type,
        ...data,
        strength: 'strong',
        direction: 'positive',
        permanence: 'session',
        timestamp: Date.now(),
      };

    case 'mood.cleared':
      return {
        type,
        ...data,
        strength: 'weak',
        direction: 'neutral',
        permanence: 'session',
        timestamp: Date.now(),
      };

    case 'movie.trailer_watched':
    case 'movie.details_expanded':
    case 'movie.opened':
    case 'movie.page_viewed':
    case 'movie.card_clicked':
      return {
        type,
        ...data,
        strength: 'weak',
        direction: 'curiosity',
        permanence: 'session',
        timestamp: Date.now(),
      };

    default:
      return {
        type,
        ...data,
        strength: 'weak',
        direction: 'neutral',
        permanence: 'session',
        timestamp: Date.now(),
      };
  }
}

/**
 * Client-side safe signal dispatcher with debouncing
 */
const signalQueue: InteractionSignal[] = [];
let dispatchTimeout: NodeJS.Timeout | null = null;

export function emitClientSignal(signal: InteractionSignal) {
  if (typeof window === 'undefined') return;

  signalQueue.push(signal);

  if (dispatchTimeout) clearTimeout(dispatchTimeout);

  dispatchTimeout = setTimeout(async () => {
    const toSend = [...signalQueue];
    signalQueue.length = 0;

    try {
      // Lazy import server action or POST route
      const { recordSignalsAction } = await import('@/app/actions/personalization');
      await recordSignalsAction(toSend);
    } catch {
      // Gracefully ignore local network telemetry errors
    }
  }, 1000);
}
