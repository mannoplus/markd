'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2, ArrowRight, Clock, Eye, ExternalLink, Check, CheckCircle2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { upsertMediaItem } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { AiChatMessage, AiRecommendationItem } from '@/lib/ai/types';

export default function AiCompanionPage() {
  const t = useTranslations('AiCompanion');
  const tCommon = useTranslations('Common');
  const tChat = useTranslations('AiChat');
  const locale = useLocale();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('welcomeMessage'),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<number, 'watchlist' | 'watched'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSend,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    if (!userPrompt) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          language: locale,
        }),
      });

      if (!res.ok) {
        throw new Error('AI service response error');
      }

      const data = await res.json();
      const assistantMessage: AiChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.text || t('unableToGenerate'),
        recommendations: data.recommendations,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: t('aiServiceBusy'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWatchlist = async (rec: AiRecommendationItem) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/${locale}/login`;
      return;
    }

    try {
      await upsertMediaItem({
        tmdb_id: rec.id,
        media_type: rec.mediaType || 'movie',
        title: rec.title,
        poster_path: rec.posterPath || null,
        status: 'plan_to_watch',
        rating: null,
        season_progress: null,
        episode_progress: null,
      });
      setAddedIds((prev) => ({ ...prev, [rec.id]: 'watchlist' }));
    } catch (e) {
      console.error('Failed to add to watchlist:', e);
    }
  };

  const handleMarkWatched = async (rec: AiRecommendationItem) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/${locale}/login`;
      return;
    }

    try {
      await upsertMediaItem({
        tmdb_id: rec.id,
        media_type: rec.mediaType || 'movie',
        title: rec.title,
        poster_path: rec.posterPath || null,
        status: 'completed',
        rating: 8,
        season_progress: null,
        episode_progress: null,
      });
      setAddedIds((prev) => ({ ...prev, [rec.id]: 'watched' }));
    } catch (e) {
      console.error('Failed to mark watched:', e);
    }
  };

  const PROMPT_SUGGESTIONS = [
    t('suggestedPrompt1'),
    t('suggestedPrompt2'),
    t('suggestedPrompt3'),
    t('suggestedPrompt4'),
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] pt-8 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-border/30 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3.5 py-1 text-xs font-black uppercase text-accent border border-accent/25 tracking-wider">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>{tCommon('brandName')} {tChat('assistantName')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t('title')}
          </h1>
          <p className="text-sm text-foreground-muted max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider">
              {t('recommendedPromptsHeading')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PROMPT_SUGGESTIONS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="rounded-2xl border border-border/40 bg-background-elevated/60 p-3.5 text-left text-xs font-semibold text-foreground-muted hover:border-accent/50 hover:text-foreground hover:bg-background-elevated transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="space-y-6 min-h-[380px] rounded-3xl bg-[#0c0c14] border border-border/40 p-5 sm:p-7 shadow-2xl">
          {messages.map((m, idx) => (
            <div
              key={m.id || idx}
              className={`flex flex-col space-y-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                {m.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5 shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-accent text-background font-medium shadow-lg'
                      : 'bg-background-elevated/90 text-foreground border border-border/30 shadow-md'
                  }`}
                >
                  {m.content}
                </div>

                {m.role === 'user' && (
                  <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-foreground shrink-0 mt-0.5 shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Actionable Movie Recommendation Cards */}
              {m.recommendations && m.recommendations.length > 0 && (
                <div className="w-full pl-0 sm:pl-11 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {m.recommendations.map((rec) => {
                    const isSaved = addedIds[rec.id];

                    return (
                      <div
                        key={rec.id}
                        className="rounded-2xl border border-border/40 bg-background-elevated/70 p-4 space-y-3 hover:border-accent/40 transition-all shadow-lg flex flex-col justify-between"
                      >
                        <div className="flex gap-3.5 items-start">
                          <div className="relative h-20 w-14 rounded-xl overflow-hidden shrink-0 bg-background border border-border/30 shadow-sm">
                            {rec.posterPath ? (
                              <Image
                                src={`${IMAGE_SIZES.poster.small}${rec.posterPath}`}
                                alt={rec.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground-muted font-bold uppercase">
                                {rec.title.slice(0, 2)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs sm:text-sm font-bold text-foreground truncate" title={rec.title}>
                                {rec.title}
                              </h4>
                              <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                                {tChat('matchScore', { score: rec.matchScore })}
                              </span>
                            </div>

                            {rec.year && (
                              <p className="text-[11px] text-foreground-muted">
                                {rec.year} • <span className="capitalize">{rec.mediaType}</span>
                              </p>
                            )}

                            <p className="text-[11px] text-foreground-muted/90 leading-snug line-clamp-2">
                              {rec.matchReason}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/20 gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAddToWatchlist(rec)}
                              disabled={Boolean(isSaved)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/40 text-[11px] font-bold text-foreground hover:bg-accent hover:text-background hover:border-accent transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isSaved === 'watchlist' ? <Check className="h-3.5 w-3.5 text-accent" /> : <Clock className="h-3.5 w-3.5" />}
                              <span>{isSaved === 'watchlist' ? tChat('addedToWatchlist') : tChat('addToWatchlist')}</span>
                            </button>

                            <button
                              onClick={() => handleMarkWatched(rec)}
                              disabled={Boolean(isSaved)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/40 text-[11px] font-bold text-foreground hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isSaved === 'watched' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Eye className="h-3.5 w-3.5" />}
                              <span>{isSaved === 'watched' ? tChat('markedWatched') : tChat('markWatched')}</span>
                            </button>
                          </div>

                          <Link
                            href={`/${rec.mediaType || 'movie'}/${rec.id}`}
                            className="p-1.5 rounded-xl text-foreground-muted hover:text-accent hover:bg-accent/10 transition-colors"
                            title={tChat('viewDetails')}
                            aria-label={tChat('viewDetails')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3.5 justify-start">
              <div className="h-8 w-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-background-elevated/90 px-4 py-3 border border-border/30 flex items-center gap-2 text-xs text-foreground-muted">
                <Loader2 className="h-3.5 w-3.5 text-accent animate-spin" />
                <span>{t('aiThinking')}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('inputPlaceholder')}
            className="w-full rounded-2xl border border-border/40 bg-background-elevated px-5 py-3.5 pr-14 text-xs sm:text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none shadow-xl"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 rounded-xl bg-accent p-2.5 text-background hover:bg-accent-hover transition-all disabled:opacity-30 cursor-pointer shadow-md"
            title={tChat('sendButton')}
            aria-label={tChat('sendButton')}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
