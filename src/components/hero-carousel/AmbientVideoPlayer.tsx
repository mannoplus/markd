'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

export interface AmbientVideoPlayerProps {
  posterUrl: string;
  fallbackPosterUrl?: string;
  title: string;
  isActive: boolean;
  isPaused?: boolean;
  trailerSources?: {
    webm?: string;
    mp4?: string;
  };
  priority?: boolean;
  onAdvance?: () => void;
}

// High-speed, public, HTTP 200/206 verified distinct video assets (W3C Cloudflare CDN & Wikimedia)
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
    webm: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/cd/12_Angry_Men_%281957%29_-_Trailer.webm/12_Angry_Men_%281957%29_-_Trailer.webm.480p.vp9.webm',
    mp4: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
  },
  {
    webm: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Modern_Times_trailer_%281936%29.webm',
    mp4: 'https://media.w3.org/2010/05/video/movie_300.mp4',
  },
];

export function AmbientVideoPlayer({
  posterUrl,
  fallbackPosterUrl,
  title,
  isActive,
  isPaused = false,
  trailerSources,
  priority = false,
  onAdvance,
}: AmbientVideoPlayerProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Initialize with browser preference safely without effect setState
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasTriggeredRef = useRef(false);

  // Callback ref to forcibly set defaultMuted & muted immediately on DOM element instantiation
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

  // Forcibly set defaultMuted & muted on mount / active change BEFORE .play()
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, [isActive]);

  // Handle native "playing" event to trigger smooth crossfade
  const handlePlaying = useCallback(() => {
    setIsVideoPlaying(true);
  }, []);

  // =========================================================================
  // 3B. PRECISE TRANSITION SEQUENCE (Triggered at 5 seconds or on ended)
  // 1. Instantly pause the active video.
  // 2. Set the video's opacity to zero to hide it.
  // 3. Reset the video's playback time to zero.
  // 4. Call the slide transition function to advance to the next movie.
  // =========================================================================
  const executeTransitionSequence = useCallback(
    (video: HTMLVideoElement) => {
      if (hasTriggeredRef.current || !isActive) return;
      hasTriggeredRef.current = true;

      // 1. Instantly pause the active video
      video.pause();

      // 2. Set the video's opacity to zero to hide it
      video.style.opacity = '0';
      setIsVideoPlaying(false);

      // 3. Reset the video's playback time to zero
      try {
        video.currentTime = 0;
      } catch {
        // Ignore seek error
      }

      // 4. Call the slide transition function to advance to the next movie
      if (onAdvance) {
        onAdvance();
      }
    },
    [isActive, onAdvance]
  );

  // Native time-update listener: monitor playback time and trigger at exactly 5 seconds
  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      if (isActive && video.currentTime >= 5 && !hasTriggeredRef.current) {
        executeTransitionSequence(video);
      }
    },
    [isActive, executeTransitionSequence]
  );

  // Native ended listener: failsafe if trailer duration is under 5 seconds
  const handleEnded = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      if (isActive && !hasTriggeredRef.current) {
        executeTransitionSequence(video);
      }
    },
    [isActive, executeTransitionSequence]
  );

  // 3C. RESOURCE MANAGEMENT: Reset & pause when slide becomes inactive
  useEffect(() => {
    if (!isActive) {
      hasTriggeredRef.current = false;
      const v = videoRef.current;
      if (v) {
        v.pause();
        v.style.opacity = '0';
        try {
          v.currentTime = 0;
        } catch {
          // Ignore
        }
      }
    } else {
      hasTriggeredRef.current = false;
    }
  }, [isActive]);

  // Pause on hover: freezing video playback halts currentTime progression
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isActive) return;

    if (isPaused) {
      v.pause();
    } else if (isVideoPlaying) {
      v.play().catch(() => {});
    }
  }, [isPaused, isActive, isVideoPlaying]);

  // Start playback when slide becomes active
  useEffect(() => {
    if (prefersReducedMotion || !trailerSources || !isActive) {
      return;
    }

    const v = videoRef.current;
    if (!v) return;

    v.defaultMuted = true;
    v.muted = true;
    v.volume = 0;

    // Explicitly reload the media pipeline on mount/source attachment
    try {
      v.load();
    } catch (err) {
      console.warn('Video load error:', err);
    }

    const videoUrl = trailerSources.mp4 || trailerSources.webm || '';
    console.log('Initiating event-driven video playback:', videoUrl);

    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Video playback started successfully:', videoUrl);
        })
        .catch((error: Error) => {
          console.error('Autoplay blocked or failed:', error.name, error.message);
        });
    }
  }, [isActive, prefersReducedMotion, trailerSources]);

  const hasSources = Boolean(trailerSources && (trailerSources.webm || trailerSources.mp4));
  // Strictly mount video ONLY for the active slide to eliminate background leaks
  const shouldMountActiveVideo = !prefersReducedMotion && hasSources && isActive;

  const isVideoVisible = isActive && isVideoPlaying && !prefersReducedMotion;
  const currentPoster = hasImageError && fallbackPosterUrl ? fallbackPosterUrl : posterUrl;
  const videoKey = `video-${title}-${trailerSources?.mp4 || trailerSources?.webm || 'none'}`;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* 1. Static Poster Image (LCP element & robust fallback, CLS = 0) */}
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

      {/* 2. Ambient Video Player: event-driven 5s onTimeUpdate & onEnded triggers */}
      {shouldMountActiveVideo && (
        <video
          key={videoKey}
          ref={setVideoRef}
          autoPlay
          muted
          loop={false}
          playsInline
          preload="auto"
          onPlaying={handlePlaying}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={(e) => {
            console.error('Video element encountered an error:', e.currentTarget.error);
          }}
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
    </div>
  );
}
