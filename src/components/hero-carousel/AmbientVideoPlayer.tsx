'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

export interface AmbientVideoPlayerProps {
  posterUrl: string;
  fallbackPosterUrl?: string;
  title: string;
  isActive: boolean;
  isInViewport?: boolean;
  trailerSources?: {
    webm?: string;
    mp4?: string;
  };
  priority?: boolean;
  isPrefetch?: boolean;
}

// STEP 5: High-speed, public, HTTP 200/206 verified video assets (W3C Cloudflare CDN & Wikimedia)
export const AMBIENT_TRAILER_FALLBACKS: Array<{ webm?: string; mp4?: string }> = [
  {
    mp4: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    webm: 'https://media.w3.org/2010/05/sintel/trailer.webm',
  },
  {
    mp4: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    webm: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.720p.vp9.webm',
  },
  {
    mp4: 'https://media.w3.org/2010/05/video/movie_300.mp4',
    webm: 'https://media.w3.org/2010/05/video/movie_300.webm',
  },
  {
    webm: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/1/10/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm.720p.vp9.webm',
    mp4: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  },
  {
    webm: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.720p.vp9.webm',
    mp4: 'https://media.w3.org/2010/05/video/movie_300.mp4',
  },
];

export function AmbientVideoPlayer({
  posterUrl,
  fallbackPosterUrl,
  title,
  isActive,
  trailerSources,
  priority = false,
  isPrefetch = false,
}: AmbientVideoPlayerProps) {
  const [hasImageError, setHasImageError] = useState(false);

  // Initialize with browser preference safely without effect setState
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // STEP 1: Callback ref to forcibly set defaultMuted & muted immediately on DOM element instantiation
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.defaultMuted = true;
      el.muted = true;
      el.volume = 0;
    }
  }, []);

  // Reduced motion preference live listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // STEP 1: Forcibly set defaultMuted & muted on mount / active change BEFORE .play()
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, [isActive]);

  // STEP 3 & STEP 4:
  // - Step 3.2: Removed 600ms grace timer, play immediately on active
  // - Step 4: Added verbose logging with try/catch and promise handlers
  useEffect(() => {
    if (prefersReducedMotion || !trailerSources) {
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!isActive) {
      videoEl.pause();
      try {
        videoEl.currentTime = 0;
      } catch {
        // Ignore seek errors on inactive
      }
      return;
    }

    // Step 1: Guarantee muted state right before calling play()
    videoEl.defaultMuted = true;
    videoEl.muted = true;
    videoEl.volume = 0;

    const videoUrl = trailerSources.mp4 || trailerSources.webm || '';

    // Step 4: Verbose console logging block
    console.log('Attempting to play video:', videoUrl);
    try {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playback started successfully.');
          })
          .catch((error: Error) => {
            console.error('Autoplay blocked or failed:', error.name, error.message);
          });
      }
    } catch (err) {
      console.error('Synchronous play error:', err);
    }
  }, [isActive, prefersReducedMotion, trailerSources]);

  const hasSources = Boolean(trailerSources && (trailerSources.webm || trailerSources.mp4));
  const shouldMountActiveVideo = !prefersReducedMotion && hasSources && isActive;
  const shouldMountPrefetch = !prefersReducedMotion && hasSources && isPrefetch && !isActive;

  const currentPoster = hasImageError && fallbackPosterUrl ? fallbackPosterUrl : posterUrl;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* 1. Static Poster Image (Largest Contentful Paint element & robust fallback) */}
      <Image
        key={currentPoster}
        src={currentPoster}
        alt={title}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover object-top"
        onError={() => setHasImageError(true)}
      />

      {/* 2. Ambient Video Player:
          - STEP 1 & 2: ref with defaultMuted, autoPlay, muted, loop, playsInline
          - STEP 3.3: Force opacity: 1 permanently for isolation test
      */}
      {shouldMountActiveVideo && (
        <video
          ref={setVideoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={(e) => {
            console.error('Video element encountered an error:', e.currentTarget.error);
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-100"
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            opacity: 1, // STEP 3: Forced to opacity: 1 permanently for isolation test
          }}
          aria-hidden="true"
          tabIndex={-1}
        >
          {trailerSources?.webm && <source src={trailerSources.webm} type="video/webm" />}
          {trailerSources?.mp4 && <source src={trailerSources.mp4} type="video/mp4" />}
        </video>
      )}

      {/* 3. Optional Metadata Prefetch for Next Slide */}
      {shouldMountPrefetch && (
        <video
          preload="metadata"
          muted
          playsInline
          className="hidden pointer-events-none absolute"
          aria-hidden="true"
          tabIndex={-1}
        >
          {trailerSources?.webm && <source src={trailerSources.webm} type="video/webm" />}
          {trailerSources?.mp4 && <source src={trailerSources.mp4} type="video/mp4" />}
        </video>
      )}
    </div>
  );
}
