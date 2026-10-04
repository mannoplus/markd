export interface CarouselSlideItem {
  id: string | number;
  title: string;
  synopsis: string;
  posterUrl: string;             // High-resolution static image (LCP fallback)
  fallbackPosterUrl?: string;    // Low-bandwidth fallback image
  trailerSources?: {
    webm?: string;                // Preferred modern format
    mp4?: string;                 // Universal fallback
  };
}
