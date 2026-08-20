'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Trophy, Film, Clock, Heart, Award, Share2, Download, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

interface WrappedStats {
  totalMovies: number;
  totalHours: number;
  topGenre: string;
  topDirector: string;
  topActor: string;
  highestRatedTitle: string;
  highestRatedScore: number;
  archetype: {
    titleKey: string;
    descKey: string;
    badge: string;
  };
}

export default function WrappedPage() {
  const t = useTranslations('Wrapped');
  const locale = useLocale();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlayingStory, setIsPlayingStory] = useState(false);
  const [copied, setCopied] = useState(false);

  const stats: WrappedStats = {
    totalMovies: 124,
    totalHours: 268,
    topGenre: 'Science Fiction',
    topDirector: 'Christopher Nolan',
    topActor: 'Timothée Chalamet',
    highestRatedTitle: 'Interstellar',
    highestRatedScore: 10,
    archetype: {
      titleKey: 'archetypeMindBender',
      descKey: 'archetypeMindBenderDesc',
      badge: '🌌',
    },
  };

  const totalSlides = 6;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        setIsPlayingStory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-20 flex flex-col items-center justify-center">
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 space-y-8">
        {/* Intro Banner if not full screen */}
        {!isPlayingStory ? (
          <div className="rounded-3xl border border-border/40 bg-[#0d0d16] p-8 sm:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 h-72 w-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 text-xs font-black uppercase text-accent border border-accent/25 tracking-widest">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>MARKD ANNUAL REWIND</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                {t('title')}
              </h1>
              <p className="text-base text-foreground-muted max-w-lg mx-auto">
                {t('subtitle')}
              </p>
            </div>

            {/* Teaser Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              <div className="rounded-2xl border border-border/30 bg-background-elevated/60 p-4">
                <span className="text-3xl font-black font-mono text-foreground">{stats.totalMovies}</span>
                <p className="text-[11px] font-bold text-foreground-muted uppercase mt-1">{t('totalMovies')}</p>
              </div>
              <div className="rounded-2xl border border-border/30 bg-background-elevated/60 p-4">
                <span className="text-3xl font-black font-mono text-emerald-400">{stats.totalHours}h</span>
                <p className="text-[11px] font-bold text-foreground-muted uppercase mt-1">{t('totalHours')}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border/30 bg-background-elevated/60 p-4">
                <span className="text-3xl font-black text-yellow-400">{stats.archetype.badge}</span>
                <p className="text-[11px] font-bold text-foreground-muted uppercase mt-1">{locale === 'zh-TW' ? '觀影原型' : 'Archetype'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsPlayingStory(true);
                setCurrentSlide(0);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-8 py-4 text-sm font-black uppercase tracking-wider text-background hover:bg-accent-hover transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 fill-current" />
              <span>{t('startStory')}</span>
            </button>
          </div>
        ) : (
          /* ====================================================
             FULLSCREEN STORY SLIDE DECK
             ==================================================== */
          <div className="fixed inset-0 z-50 bg-[#06060a] flex flex-col justify-between p-6 sm:p-10 select-none">
            {/* Top Multi-Segment Progress Bars */}
            <div className="w-full max-w-xl mx-auto flex gap-1.5 pt-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all duration-300 ${
                      i <= currentSlide ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsPlayingStory(false)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Slide Content Area */}
            <div className="w-full max-w-md mx-auto my-auto text-center space-y-8 fade-in">
              {/* SLIDE 0: Total Movies */}
              {currentSlide === 0 && (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="h-20 w-20 rounded-3xl bg-accent/20 border border-accent/30 mx-auto flex items-center justify-center text-4xl shadow-xl">
                    🎬
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">
                    {t('totalMovies')}
                  </span>
                  <h2 className="text-6xl sm:text-7xl font-black font-mono text-white tracking-tight">
                    {stats.totalMovies}
                  </h2>
                  <p className="text-sm text-foreground-muted max-w-xs mx-auto">
                    {locale === 'zh-TW'
                      ? '在過去的一年裡，您一共標記並觀賞了 124 部扣人心弦的電影作品。'
                      : 'You explored and tracked 124 captivating cinematic stories this year.'}
                  </p>
                </div>
              )}

              {/* SLIDE 1: Total Hours */}
              {currentSlide === 1 && (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="h-20 w-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-4xl shadow-xl">
                    ⏱️
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    {t('totalHours')}
                  </span>
                  <h2 className="text-6xl sm:text-7xl font-black font-mono text-emerald-400 tracking-tight">
                    {stats.totalHours}h
                  </h2>
                  <p className="text-sm text-foreground-muted max-w-xs mx-auto">
                    {t('hoursEquiv', { days: (stats.totalHours / 24).toFixed(1) })}
                  </p>
                </div>
              )}

              {/* SLIDE 2: Favorite Genre */}
              {currentSlide === 2 && (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="h-20 w-20 rounded-3xl bg-blue-500/20 border border-blue-500/30 mx-auto flex items-center justify-center text-4xl shadow-xl">
                    🚀
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                    {t('favoriteGenre')}
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {stats.topGenre}
                  </h2>
                  <p className="text-sm text-foreground-muted max-w-xs mx-auto">
                    {locale === 'zh-TW'
                      ? '前瞻科幻、時空哲理與高概念世界觀是您最常沉浸的電影領域。'
                      : 'High-concept sci-fi and philosophical storytelling dominated your screen time.'}
                  </p>
                </div>
              )}

              {/* SLIDE 3: Top Director & Actor */}
              {currentSlide === 3 && (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="h-20 w-20 rounded-3xl bg-purple-500/20 border border-purple-500/30 mx-auto flex items-center justify-center text-4xl shadow-xl">
                    🎥
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-foreground-subtle">{t('topDirector')}</span>
                      <h3 className="text-2xl font-bold text-white">{stats.topDirector}</h3>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-[11px] font-bold uppercase text-foreground-subtle">{t('topActor')}</span>
                      <h3 className="text-2xl font-bold text-white">{stats.topActor}</h3>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 4: Highest Rated Film */}
              {currentSlide === 4 && (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="h-20 w-20 rounded-3xl bg-yellow-500/20 border border-yellow-500/30 mx-auto flex items-center justify-center text-4xl shadow-xl">
                    ⭐
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">
                    {t('highestRated')}
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {stats.highestRatedTitle}
                  </h2>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-black text-yellow-400">
                    ★ {stats.highestRatedScore} / 10 Masterpiece
                  </div>
                </div>
              )}

              {/* SLIDE 5: Archetype & Share Card */}
              {currentSlide === 5 && (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-accent to-emerald-400 mx-auto flex items-center justify-center text-5xl shadow-2xl">
                    {stats.archetype.badge}
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-accent">
                      {t('archetypeTitle')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                      {t(stats.archetype.titleKey as any)}
                    </h2>
                    <p className="text-xs text-foreground-muted leading-relaxed max-w-sm mx-auto">
                      {t(stats.archetype.descKey as any)}
                    </p>
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black uppercase text-black hover:bg-white/90 transition-colors shadow-lg cursor-pointer"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                      <span>{copied ? t('copied') : t('shareCard')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Controls */}
            <div className="w-full max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-all disabled:opacity-20 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="text-xs font-mono font-bold text-white/50">
                {currentSlide + 1} / {totalSlides}
              </span>

              <button
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
                className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-all disabled:opacity-20 cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
