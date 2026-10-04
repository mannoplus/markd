'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

export interface AmbientVideoPlayerProps {
  posterUrl: string;
  fallbackPosterUrl?: string;
  title: string;
  isActive: boolean;
  isInViewport: boolean;
  trailerSources?: {
    webm?: string;
    mp4?: string;
  };
  priority?: boolean;
  isPrefetch?: boolean;
}

export const AMBIENT_TRAILER_FALLBACKS: Array<{ webm?: string; mp4?: string }> = [
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  },
];

export function AmbientVideoPlayer({
  posterUrl,
  fallbackPosterUrl,
  title,
  isActive,
  isInViewport,
  trailerSources,
  priority = false,
  isPrefetch = false,
}: AmbientVideoPlayerProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  // Initialize with browser preference safely without effect setState
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Ensure permanently muted audio policy on the video DOM element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, [isActive]);

  // Handle native "playing" event
  const handlePlaying = useCallback(() => {
    setIsVideoPlaying(true);
  }, []);

  // Handle native "error" event (network failure, format unsupported, etc.)
  const handleError = useCallback(() => {
    setHasVideoError(true);
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.style.opacity = '0';
    }
  }, []);

  // Playback lifecycle & state machine
  useEffect(() => {
    // If reduced motion is active, or video errored, or no trailer sources, suppress playback
    if (prefersReducedMotion || hasVideoError || !trailerSources) {
      return;
    }

    const videoEl = videoRef.current;

    // Slide Deactivation
    if (!isActive) {
      // 1. Immediately cancel pending grace delay timers
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      // 2. Pause playback, reset timeline, reset opacity
      if (videoEl) {
        videoEl.pause();
        try {
          videoEl.currentTime = 0;
        } catch {
          // Ignore if video element cannot seek
        }
        videoEl.style.opacity = '0';
      }
      return;
    }

    // Slide Activation
    if (isActive && isInViewport) {
      // Keep poster visible (0ms)
      // Start 600ms grace timer to allow viewing high-res key art before video starts
      graceTimerRef.current = setTimeout(() => {
        const v = videoRef.current;
        if (!v) return;

        v.muted = true;
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay rejection / low power mode
            // Fail silently: retain poster opacity 1, video opacity 0
            if (v) v.style.opacity = '0';
          });
        }
      }, 600);
    } else if (isActive && !isInViewport) {
      // Viewport visibility dropped below threshold: pause playback
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      if (videoEl) {
        videoEl.pause();
      }
    }

    return () => {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    };
  }, [isActive, isInViewport, prefersReducedMotion, hasVideoError, trailerSources]);

  const hasSources = Boolean(trailerSources && (trailerSources.webm || trailerSources.mp4));
  const shouldMountActiveVideo = !prefersReducedMotion && !hasVideoError && hasSources && isActive;
  const shouldMountPrefetch = !prefersReducedMotion && !hasVideoError && hasSources && isPrefetch && !isActive;

  // Video is only visible when active, actually playing, within viewport, and not reduced-motion
  const isVideoVisible = isActive && isVideoPlaying && isInViewport && !hasVideoError && !prefersReducedMotion;
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

      {/* 2. Ambient Video Player (Mounted only for active slide) */}
      {shouldMountActiveVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onPlaying={handlePlaying}
          onError={handleError}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-800 ease-in-out ${
            isVideoVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            opacity: isVideoVisible ? 1 : 0,
            transition: 'opacity 800ms ease-in-out',
          }}
          aria-hidden="true"
          tabIndex={-1}
        >
          {trailerSources?.webm && <source src={trailerSources.webm} type="video/webm" />}
          {trailerSources?.mp4 && <source src={trailerSources.mp4} type="video/mp4" />}
        </video>
      )}

      {/* 3. Optional Metadata Prefetch for Next Slide (Free GPU/decoding while pre-caching metadata) */}
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
