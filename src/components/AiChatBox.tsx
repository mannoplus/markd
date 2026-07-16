/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { 
    Sparkles, X, Send, Trash2, Minimize2, Loader2 
} from 'lucide-react';
import { Link } from '@/i18n/routing';

interface AiChatBoxProps {
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    overview: string;
    locale: string;
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

export function AiChatBox({ 
    mediaId, mediaType, title, overview, locale, isOpen, setIsOpen 
}: AiChatBoxProps) {
    const t = useTranslations('AiChat');
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const chatRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const savedScrollTop = useRef<number>(0);

    const getActiveProviderKey = () => {
        const providers = ['openai', 'anthropic', 'mistral', 'kimi', 'qwen', 'meta', 'glm', 'deepseek', 'grok', 'minimax'];
        for (const p of providers) {
            const key = localStorage.getItem(`markd_apikey_${p}`);
            if (key) return { provider: p, apiKey: key };
        }
        return null;
    };

    const config = getActiveProviderKey();

    // Fetch dynamic context suggested queries using dual-completion logic
    const fetchSuggestions = useCallback(async (currentMessages: typeof messages) => {
        if (!config) return;
        setIsLoadingSuggestions(true);
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: config.provider,
                    apiKey: config.apiKey,
                    isSuggestions: true,
                    messages: currentMessages,
                    language: locale,
                    contextInfo: { id: mediaId, type: mediaType, title, overview }
                })
            });
            if (res.ok) {
                const data = await res.json();
                const text = data.text || '';
                try {
                    const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
                    const parsed = JSON.parse(cleanJson);
                    if (Array.isArray(parsed)) {
                        setSuggestions(parsed.slice(0, 4));
                    }
                } catch {
                    // Fallback parse if not perfect JSON
                    const match = text.match(/\[[\s\S]*\]/);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        if (Array.isArray(parsed)) setSuggestions(parsed.slice(0, 4));
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load suggestions:', e);
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, [mediaId, mediaType, title, overview, locale, config]);

    // Initial suggestions generation
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            fetchSuggestions([]);
        }
    }, [isOpen, messages.length, fetchSuggestions]);

    // Click outside handler -> Minimize (do not destroy state/history)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen && 
                !isMinimized && 
                chatRef.current && 
                !chatRef.current.contains(event.target as Node)
            ) {
                // Ensure we don't capture the trigger button clicks
                const target = event.target as HTMLElement;
                if (target.closest('[data-ai-trigger="true"]')) {
                    return;
                }
                
                // Save current scroll position
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
            // Scroll to bottom on new messages
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isMinimized, messages, isOpen]);

    const handleSend = async (textToSend: string) => {
        const trimmed = textToSend.trim();
        if (!trimmed) return;

        if (!config) {
            setErrorMsg(t('noApiKey'));
            return;
        }

        setErrorMsg(null);
        const userMsg = { role: 'user' as const, content: trimmed };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputValue('');
        setIsLoading(true);

        // Scroll to bottom
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: config.provider,
                    apiKey: config.apiKey,
                    messages: updatedMessages,
                    language: locale,
                    contextInfo: { id: mediaId, type: mediaType, title, overview }
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to complete assistant request.');
            }

            const data = await res.json();
            const assistantMsg = { role: 'assistant' as const, content: data.text || '' };
            const nextMessages = [...updatedMessages, assistantMsg];
            setMessages(nextMessages);
            
            // Re-fetch context dynamic suggestions
            fetchSuggestions(nextMessages);
        } catch (e: any) {
            setErrorMsg(e.message || 'An error occurred during communication.');
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

    if (!isOpen) return null;

    // Render Minimized Floating Dock (Preserves chat messages and input values)
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-accent text-background hover:bg-accent-hover shadow-2xl hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-accent/30 shadow-[0_0_15px_rgba(20,240,240,0.3)] animate-bounce-slow"
                title={t('restore')}
            >
                <Sparkles className="h-6 w-6 animate-pulse" />
                {messages.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border border-[#07070a]">
                        {messages.length}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div 
            ref={chatRef}
            className="fixed bottom-6 right-6 z-50 w-96 h-[520px] rounded-2xl bg-[#0c0c12] border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans"
        >
            {/* Chat Box Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 bg-background-elevated/40 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                    <span className="text-sm font-black tracking-wider text-foreground">{t('title')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleClear}
                        className="p-1.5 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title={t('clear')}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors cursor-pointer"
                        title={t('minimize')}
                    >
                        <Minimize2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Messages Body */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <Sparkles className="h-10 w-10 text-accent/40" />
                        <h3 className="text-sm font-bold text-foreground">Ask anything about &ldquo;{title}&rdquo;</h3>
                        <p className="text-xs text-foreground-muted leading-relaxed max-w-[240px]">
                            Get cast trivia, plot insights, watch guides, or review summaries immediately.
                        </p>
                    </div>
                ) : (
                    messages.map((m, idx) => (
                        <div 
                            key={idx} 
                            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-wider mb-1">
                                {m.role === 'user' ? 'You' : 'AI Assistant'}
                            </span>
                            <div 
                                className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap border ${
                                    m.role === 'user' 
                                        ? 'bg-accent/10 border-accent/20 text-foreground' 
                                        : 'bg-background-elevated/40 border-border/20 text-foreground-muted'
                                }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                        <span>AI is typing...</span>
                    </div>
                )}
                {errorMsg && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-xs">
                        {errorMsg}
                        {!config && (
                            <Link 
                                href="/settings" 
                                onClick={() => setIsOpen(false)}
                                className="block mt-1 text-accent hover:underline font-bold"
                            >
                                Go to Settings →
                            </Link>
                        )}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Dynamic Suggestions & Text Input Form */}
            <div className="p-3 border-t border-border/20 bg-[#0c0c12]/80 backdrop-blur-md space-y-3">
                {/* Suggestions Row */}
                {suggestions.length > 0 && !isLoadingSuggestions && (
                    <div className="space-y-1.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-foreground-muted">
                            {t('suggestions')}
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 snap-x">
                            {suggestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(q)}
                                    className="shrink-0 snap-start px-3 py-1 rounded-full bg-background-elevated/80 border border-border/20 text-[10px] text-foreground-muted hover:text-accent hover:border-accent/40 transition-all cursor-pointer font-medium"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Box */}
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }} 
                    className="flex gap-2"
                >
                    <div className="flex-1 relative rounded-xl overflow-hidden border border-border/25 bg-background focus-within:border-accent/40 transition-colors">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={t('inputPlaceholder')}
                            className="w-full bg-transparent px-4 py-2.5 text-xs focus:outline-none text-foreground pr-8"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="p-2.5 rounded-xl bg-accent text-background hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
