/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
    X, Send, Trash2, Minimize2,
    ExternalLink, ThumbsDown, SlidersHorizontal
} from 'lucide-react';
import { MarkdLogoIcon } from '@/components/MarkdLogoIcon';
import { AiMarkdownMessage } from '@/components/AiMarkdownMessage';
import { Link } from '@/i18n/routing';
import { upsertMediaItem, submitTasteFeedbackAction } from '@/app/actions';
import { IMAGE_SIZES } from '@/lib/tmdb';
import { MediaActionButtons } from '@/components/media-action-buttons';
import type { AiChatMessage, AiRecommendationItem } from '@/lib/ai/types';

interface AiChatBoxProps {
    mediaId?: number;
    mediaType?: 'movie' | 'tv';
    title?: string;
    overview?: string;
    locale: string;
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

export function AiChatBox({ 
    mediaId, mediaType = 'movie', title, overview, locale, isOpen, setIsOpen 
}: AiChatBoxProps) {
    const t = useTranslations('AiChat');
    const tCommon = useTranslations('Common');
    
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // State for tracking inline actions
    const [addedIds, setAddedIds] = useState<Record<number, 'watchlist' | 'watched'>>({});
    const [feedbackGiven, setFeedbackGiven] = useState<Record<number, string>>({});

    const chatRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const savedScrollTop = useRef<number>(0);

    // Fetch context suggestions
    const fetchSuggestions = useCallback(async (currentMessages: AiChatMessage[]) => {
        setIsLoadingSuggestions(true);
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isSuggestions: true,
                    messages: currentMessages,
                    language: locale,
                    contextInfo: mediaId ? { id: mediaId, type: mediaType, title, overview } : undefined,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
                    setSuggestions(data.suggestions.slice(0, 4));
                } else if (data.text) {
                    try {
                        const cleanJson = data.text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
                        const parsed = JSON.parse(cleanJson);
                        if (Array.isArray(parsed)) setSuggestions(parsed.slice(0, 4));
                    } catch {
                        // Fallback suggestions
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load suggestions:', e);
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, [mediaId, mediaType, title, overview, locale]);

    // Initial suggestions on mount
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            fetchSuggestions([]);
        }
    }, [isOpen, messages.length, fetchSuggestions]);

    // Click outside handler -> Minimize
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen && 
                !isMinimized && 
                chatRef.current && 
                !chatRef.current.contains(event.target as Node)
            ) {
                const target = event.target as HTMLElement;
                if (target.closest('[data-ai-trigger="true"]')) {
                    return;
                }
                
                if (scrollContainerRef.current) {
                    savedScrollTop.current = scrollContainerRef.current.scrollTop;
                }
                setIsMinimized(true);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, isMinimized]);

    // Restore scroll position after expanding
    useEffect(() => {
        if (isOpen && !isMinimized && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = savedScrollTop.current;
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isMinimized, messages, isOpen]);

    const handleSend = async (textToSend: string) => {
        const trimmed = textToSend.trim();
        if (!trimmed || isLoading) return;

        setErrorMsg(null);
        const userMsg: AiChatMessage = { role: 'user', content: trimmed };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputValue('');
        setIsLoading(true);

        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    language: locale,
                    contextInfo: mediaId ? { id: mediaId, type: mediaType, title, overview } : undefined,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || t('failedRequest'));
            }

            const data = await res.json();
            const assistantMsg: AiChatMessage = { 
                role: 'assistant', 
                content: data.text || '',
                recommendations: data.recommendations,
            };
            const nextMessages = [...updatedMessages, assistantMsg];
            setMessages(nextMessages);
            fetchSuggestions(nextMessages);
        } catch (e: any) {
            setErrorMsg(e.message || t('failedRequest'));
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const handleClear = () => {
        setMessages([]);
        setSuggestions([]);
        setErrorMsg(null);
        fetchSuggestions([]);
    };

    const handleAddToWatchlist = async (rec: AiRecommendationItem) => {
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

    const handleFeedback = async (rec: AiRecommendationItem, signalType: 'not_interested' | 'less_like_this' | 'already_watched') => {
        try {
            await submitTasteFeedbackAction({
                tmdb_id: rec.id,
                media_type: rec.mediaType || 'movie',
                signal_type: signalType,
            });
            setFeedbackGiven((prev) => ({ ...prev, [rec.id]: signalType }));
        } catch (e) {
            console.error('Failed to submit feedback:', e);
        }
    };

    if (!isOpen) return null;

    // Render Minimized Floating Dock
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 z-50 p-3.5 rounded-full bg-accent text-background hover:bg-accent-hover shadow-2xl hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-accent/30 shadow-[0_0_20px_rgba(255,255,255,0.25)] md:bottom-6 md:right-6"
                title={t('restore')}
                aria-label={t('restore')}
            >
                <MarkdLogoIcon className="h-5 w-5 animate-pulse" />
                {messages.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border border-[#07070a]">
                        {messages.length}
                    </span>
                )}
            </button>
        );
    }

    const defaultSuggestions = title ? [
        t('contextSuggestion1'),
        t('contextSuggestion2'),
        t('contextSuggestion3'),
        t('contextSuggestion4'),
    ] : [
        t('suggestion1'),
        t('suggestion2'),
        t('suggestion3'),
        t('suggestion4'),
    ];

    const activeSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

    return (
        <div 
            ref={chatRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-chat-title"
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-2 left-2 z-50 h-[min(65dvh,580px)] max-w-[420px] rounded-3xl bg-[#0a0a10]/95 backdrop-blur-xl border border-border/40 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans select-none md:bottom-6 md:left-auto md:right-6 md:h-[580px]"
        >
            {/* Header: Pure, Cinematic & Balanced */}
            <div className="px-5 py-3.5 border-b border-border/20 bg-background-elevated/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                        <MarkdLogoIcon className="h-4 w-4 animate-pulse" />
                    </div>
                    <div>
                        <h2 id="ai-chat-title" className="text-sm font-extrabold tracking-wide text-foreground">
                            {t('title')}
                        </h2>
                        <p className="text-[10px] text-foreground-muted leading-tight">
                            {title ? `Context: ${title}` : t('subtitle')}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleClear}
                        className="p-2 rounded-xl text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title={t('clear')}
                        aria-label={t('clear')}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors cursor-pointer"
                        title={t('minimize')}
                        aria-label={t('minimize')}
                    >
                        <Minimize2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors cursor-pointer"
                        title={t('close')}
                        aria-label={t('close')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Messages Body */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin select-text"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                        <div className="h-16 w-16 rounded-3xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shadow-xl">
                            <MarkdLogoIcon className="h-8 w-8 animate-pulse" />
                        </div>
                        <div className="space-y-1 max-w-xs">
                            <h3 className="text-base font-extrabold text-foreground">
                                {title ? t('emptyContextHeading', { title }) : t('emptyHeading')}
                            </h3>
                            <p className="text-xs text-foreground-muted leading-relaxed">
                                {t('emptySubtext')}
                            </p>
                        </div>

                        {/* Initial Quick Suggestion Chips */}
                        <div className="w-full pt-2 flex flex-col gap-2">
                            {activeSuggestions.slice(0, 3).map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(prompt)}
                                    className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-background-elevated/60 hover:bg-accent/15 border border-border/30 hover:border-accent/40 text-xs text-foreground-muted hover:text-foreground transition-all cursor-pointer shadow-sm group flex items-center justify-between"
                                >
                                    <span className="truncate">{prompt}</span>
                                    <MarkdLogoIcon className="h-3 w-3 text-accent/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1.5" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((m, idx) => (
                        <div 
                            key={idx} 
                            className={`flex flex-col space-y-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider px-1">
                                {m.role === 'user' ? 'You' : t('assistantName')}
                            </span>
                            
                            {/* Message Text Bubble */}
                            <div 
                                className={`rounded-2xl px-4.5 py-3.5 text-xs leading-relaxed max-w-[92%] border shadow-md transition-all ${
                                    m.role === 'user' 
                                        ? 'bg-accent/15 border-accent/30 text-foreground font-medium' 
                                        : 'bg-background-elevated/80 border-border/30 text-foreground/90 backdrop-blur-sm'
                                }`}
                            >
                                <AiMarkdownMessage content={m.content} role={m.role} />
                            </div>

                            {/* Structured Recommendation Cards */}
                            {m.recommendations && m.recommendations.length > 0 && (
                                <div className="w-full space-y-2.5 pt-2">
                                    {m.recommendations.map((rec) => {
                                        const isSaved = addedIds[rec.id];
                                        const isDismissed = feedbackGiven[rec.id];

                                        if (isDismissed) {
                                            return (
                                                <div key={rec.id} className="p-2.5 rounded-xl bg-background-elevated/40 border border-border/20 text-[10px] text-foreground-muted text-center italic">
                                                    {t('feedbackRecorded')}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div 
                                                key={rec.id}
                                                className="p-3 rounded-2xl bg-[#11111a]/90 border border-border/40 hover:border-accent/40 transition-all space-y-2.5 shadow-lg"
                                            >
                                                <div className="flex gap-3 items-start">
                                                    {/* Poster thumbnail */}
                                                    <div className="relative h-18 w-12 rounded-lg overflow-hidden shrink-0 bg-background-elevated border border-border/30">
                                                        {rec.posterPath ? (
                                                            <Image
                                                                src={`${IMAGE_SIZES.poster.small}${rec.posterPath}`}
                                                                alt={rec.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-[8px] text-foreground-muted uppercase text-center p-0.5">
                                                                {rec.title.slice(0, 3)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Title & Metadata */}
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <h4 className="text-xs font-bold text-foreground truncate" title={rec.title}>
                                                                {rec.title}
                                                            </h4>
                                                            <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                                                                {t('matchScore', { score: rec.matchScore })}
                                                            </span>
                                                        </div>

                                                        {rec.year && (
                                                            <p className="text-[10px] text-foreground-muted">
                                                                {rec.year} • <span className="capitalize">{rec.mediaType}</span>
                                                            </p>
                                                        )}

                                                        <p className="text-[10px] text-foreground-muted/90 leading-snug line-clamp-2">
                                                            {rec.matchReason}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Bar */}
                                                <div className="flex items-center justify-between pt-1 border-t border-border/15 gap-1.5">
                                                    <MediaActionButtons
                                                        savedState={isSaved ?? null}
                                                        onAddToWatchlist={() => handleAddToWatchlist(rec)}
                                                        onMarkWatched={() => handleMarkWatched(rec)}
                                                        disabled={Boolean(isSaved)}
                                                        watchlistLabel={t('addToWatchlist')}
                                                        watchlistActiveLabel={t('addedToWatchlist')}
                                                        watchedLabel={t('markWatched')}
                                                        watchedActiveLabel={t('markedWatched')}
                                                    />

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleFeedback(rec, 'not_interested')}
                                                            title={t('notInterested')}
                                                            aria-label={t('notInterested')}
                                                            className="p-1 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                        >
                                                            <ThumbsDown className="h-3 w-3" />
                                                        </button>
                                                        <Link
                                                            href={`/${rec.mediaType || 'movie'}/${rec.id}`}
                                                            target="_blank"
                                                            title={t('viewDetails')}
                                                            aria-label={t('viewDetails')}
                                                            className="p-1 rounded-lg text-foreground-muted hover:text-accent hover:bg-accent/10 transition-colors"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isLoading && (
                    <div 
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-background-elevated/80 border border-border/40 w-fit shadow-md animate-in fade-in duration-200"
                    >
                        <div className="h-5 w-5 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                            <MarkdLogoIcon className="h-3 w-3 animate-pulse" />
                        </div>
                        <span className="text-xs font-semibold text-foreground/90 tracking-wide">
                            {t('loading')}
                        </span>
                        <span className="flex items-center gap-1 ml-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent/80 animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-accent/80 animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-accent/80 animate-bounce" />
                        </span>
                    </div>
                )}

                {errorMsg && (
                    <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-xs leading-relaxed">
                        {errorMsg}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions & Input Area */}
            <div className="p-3.5 border-t border-border/20 bg-[#0c0c14]/90 backdrop-blur-md space-y-2.5">
                {/* Interactive Suggestion Chips */}
                {messages.length > 0 && activeSuggestions.length > 0 && !isLoadingSuggestions && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 snap-x">
                        {activeSuggestions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(q)}
                                className="shrink-0 snap-start px-3 py-1 rounded-full bg-background-elevated/80 border border-border/30 text-[10px] text-foreground-muted hover:text-accent hover:border-accent/40 hover:bg-background-elevated transition-all cursor-pointer font-medium"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Form */}
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }} 
                    className="flex gap-2"
                >
                    <div className="flex-1 relative rounded-2xl overflow-hidden border border-border/30 bg-background-elevated/60 focus-within:border-accent/50 focus-within:bg-background-elevated transition-all">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={title ? t('inputPlaceholder') : t('inputPlaceholderGeneral')}
                            className="w-full bg-transparent px-4 py-2.5 text-xs focus:outline-none text-foreground placeholder:text-foreground-subtle pr-4"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="p-2.5 rounded-2xl bg-accent text-background hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-md shadow-accent/20"
                        title={t('sendButton')}
                        aria-label={t('sendButton')}
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
