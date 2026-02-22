'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { TMDBTrendingResult } from '@/types';
import { useTranslations } from 'next-intl';

interface HeroCarouselProps {
    movies: TMDBTrendingResult[];
}

export function HeroCarousel({ movies }: HeroCarouselProps) {
    const t = useTranslations('Home');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, [movies.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
    }, [movies.length]);

    // Auto-play interval
    useEffect(() => {
        if (isHovered || movies.length <= 1) return;

        const timer = setInterval(() => {
            nextSlide();
        }, 6000); // 6 seconds

        return () => clearInterval(timer);
    }, [isHovered, movies.length, nextSlide]);

    if (!movies || movies.length === 0) return null;

    const currentMovie = movies[currentIndex];
    const backdropUrl = currentMovie.backdrop_path
        ? `${IMAGE_SIZES.backdrop.original}${currentMovie.backdrop_path}`
        : null;

    return (
        <div
            className="relative h-[60vh] md:h-[80vh] w-full flex items-end pb-12 overflow-hidden group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Images with Crossfade */}
            {movies.map((movie, index) => {
                const isActive = index === currentIndex;
                const url = movie.backdrop_path
                    ? `${IMAGE_SIZES.backdrop.original}${movie.backdrop_path}`
                    : null;

                if (!url) return null;

                return (
                    <div
                        key={movie.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                            }`}
                    >
                        <Image
                            src={url}
                            alt={movie.title || ''}
                            fill
                            className="object-cover object-top"
                            priority={isActive}
                        />
                    </div>
                );
            })}

            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent hidden md:block z-0 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-start gap-4 fade-in">
                <div className="inline-flex items-center rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-accent backdrop-blur-md border border-accent/20 transition-all duration-300">
                    {t('heroBadge')}
                </div>
                {/* Wrap text in a key'd div to animate slide changes */}
                <div key={currentMovie.id} className="fade-in max-w-4xl space-y-4">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-xl">
                        {currentMovie.title}
                    </h1>
                    <p className="text-foreground-muted text-base sm:text-lg max-w-2xl line-clamp-3 text-shadow-sm">
                        {currentMovie.overview}
                    </p>
                    <div className="mt-4 flex gap-4">
                        <Link
                            href={`/movie/${currentMovie.id}`}
                            className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all hover:bg-foreground-muted hover:scale-105"
                        >
                            {t('viewDetails')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            {movies.length > 1 && (
                <>
                    {/* Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/50 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background border border-border backdrop-blur-sm focus:outline-none"
                        aria-label="Previous Slide"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/50 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background border border-border backdrop-blur-sm focus:outline-none"
                        aria-label="Next Slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Dots indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {movies.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all focus:outline-none ${index === currentIndex ? 'bg-accent w-8' : 'bg-background-elevated hover:bg-foreground-muted'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
