/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { 
    Sparkles, X, Send, Trash2, Minimize2, Loader2, ChevronDown, Check
} from 'lucide-react';
import { Link } from '@/i18n/routing';

// SVG Brand Logos matching Settings Page
const OpenAiLogo = () => (
    <svg className="w-4 h-4 text-[#10a37f] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.74 11.53c0-.62-.12-1.22-.36-1.78l-1.92 1.11c.02.22.04.44.04.67 0 2.2-1.2 4.14-3 5.17l1.11 1.92c2.51-1.45 4.13-4.14 4.13-7.09zm-8.8 8.8c.62 0 1.22-.12 1.78-.36l-1.11-1.92c-.22.02-.44.04-.67.04-2.2 0-4.14-1.2-5.17-3l-1.92 1.11c1.45 2.51 4.14 4.13 7.09 4.13zm-7.09-4.13c-.24-.56-.36-1.16-.36-1.78 0-2.95 1.62-5.64 4.13-7.09l-1.11-1.92c-3.52 2.03-5.22 5.92-4.52 9.87l1.86-1.08zm1.08-9.87c.56-.24 1.16-.36 1.78-.36 2.95 0 5.64 1.62 7.09 4.13l1.92-1.11C18.63 4.13 15.94 2.51 13 2.51c-.62 0-1.22.12-1.78.36l1.11 1.92c.22-.02.44-.04.67-.04zm9.87 1.08c.24.56.36 1.16.36 1.78 0 2.2-1.2 4.14-3 5.17l1.11 1.92c2.51-1.45 4.13-4.14 4.13-7.09 0-.62-.12-1.22-.36-1.78l-1.92 1.11c-.02-.22-.04-.44-.04-.67 0-2.2 1.2-4.14 3-5.17l-1.11-1.92c-2.51 1.45-4.13 4.14-4.13 7.09zm-8.8-8.8c-.62 0-1.22.12-1.78.36l1.11 1.92c.22-.02.44-.04.67-.04 2.2 0 4.14 1.2 5.17 3l1.92-1.11C18.63 4.13 15.94 2.51 13 2.51z"/>
    </svg>
);

const AnthropicLogo = () => (
    <svg className="w-4 h-4 text-[#cc785c] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.8 20.3h-3.4l-1.1-3.6H6.7l-1.1 3.6H2.2L8.5 3.7h3.1l6.2 16.6zm-5.4-7.2l-2.4-7.8h-.2l-2.4 7.8h5zM22.5 8.1c0 1.2-.9 2.2-2.2 2.2s-2.2-1-2.2-2.2.9-2.2 2.2-2.2 2.2 1 2.2 2.2z"/>
    </svg>
);

const MistralLogo = () => (
    <svg className="w-4 h-4 text-[#fd531e] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.7 3.7H15l-3 6.2-3-6.2H4.3v16.6H9V9.9l3 6.2 3-6.2v10.4h4.7V3.7z"/>
    </svg>
);

const KimiLogo = () => (
    <svg className="w-4 h-4 text-[#ff6b00] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M9 7.5v9h2v-3.5h2l2 3.5h2.5L15 12.5l2.5-5H15l-2.5 4h-1.5v-4H9z" />
    </svg>
);

const QwenLogo = () => (
    <svg className="w-4 h-4 text-[#6236ff] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
    </svg>
);

const MetaLogo = () => (
    <svg className="w-4 h-4 text-[#0064e0] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.25 12c0-2.82-1.92-5.4-4.83-5.4-1.97 0-3.37.95-4.42 2.45-1.05-1.5-2.45-2.45-4.42-2.45C5.67 6.6 3.75 9.18 3.75 12c0 2.82 1.92 5.4 4.83 5.4 1.97 0 3.37-.95 4.42-2.45 1.05 1.5 2.45 2.45 4.42 2.45 2.91 0 4.83-2.58 4.83-5.4zm-13.67 4.1c-2.12 0-3.53-1.8-3.53-4.1 0-2.3 1.41-4.1 3.53-4.1 1.41 0 2.45.83 3.19 2.15l.08.15c-.75 1.34-1.78 2.15-3.19 2.15l-.08-.15c-.74-1.32-1.78-2.15-3.19-2.15z"/>
    </svg>
);

const GlmLogo = () => (
    <svg className="w-4 h-4 text-[#3b82f6] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="4"/>
    </svg>
);

const DeepseekLogo = () => (
    <svg className="w-4 h-4 text-[#1b76ff] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3-9h6v2H9z"/>
    </svg>
);

const GrokLogo = () => (
    <svg className="w-4 h-4 text-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l16 16M4 20L20 4"/>
    </svg>
);

const MinimaxLogo = () => (
    <svg className="w-4 h-4 text-[#ff3b30] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="6" width="4" height="12" rx="1.5"/>
        <rect x="10" y="4" width="4" height="16" rx="1.5"/>
        <rect x="17" y="6" width="4" height="12" rx="1.5"/>
    </svg>
);

interface Provider {
    id: string;
    label: string;
    logo: React.ComponentType;
    model: string;
    desc: string;
}

const PROVIDERS: Provider[] = [
    { id: 'openai', label: 'OpenAI', logo: OpenAiLogo, model: 'gpt-4o-mini', desc: 'Fast reasoning & general answers' },
    { id: 'anthropic', label: 'Anthropic', logo: AnthropicLogo, model: 'claude-3-haiku-20240307', desc: 'Creative & detailed analysis' },
    { id: 'mistral', label: 'Mistral', logo: MistralLogo, model: 'open-mistral-7b', desc: 'Open-source speed & logic' },
    { id: 'kimi', label: 'Kimi (Moonshot)', logo: KimiLogo, model: 'moonshot-v1-8k', desc: 'Exceptional long-context tasking' },
    { id: 'qwen', label: 'Qwen (Alibaba)', logo: QwenLogo, model: 'qwen-turbo', desc: 'Strong bilingual & math tasking' },
    { id: 'meta', label: 'Meta AI (Groq)', logo: MetaLogo, model: 'llama3-8b-8192', desc: 'High-speed instruction compliance' },
    { id: 'glm', label: 'GLM (Zhipu)', logo: GlmLogo, model: 'glm-4-flash', desc: 'Fast Chinese reasoning & synthesis' },
    { id: 'deepseek', label: 'DeepSeek', logo: DeepseekLogo, model: 'deepseek-chat', desc: 'Coding tasks & advanced logic' },
    { id: 'grok', label: 'Grok (xAI)', logo: GrokLogo, model: 'grok-beta', desc: 'High wit & real-time lookup' },
    { id: 'minimax', label: 'MiniMax', logo: MinimaxLogo, model: 'abab6.5-chat', desc: 'Natural conversations & roleplay' }
];

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

    // Active Model States
    const [activeProviders, setActiveProviders] = useState<Provider[]>([]);
    const [selectedModel, setSelectedModel] = useState<Provider | null>(null);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

    const chatRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const savedScrollTop = useRef<number>(0);

    // Dynamic scan for active model keys
    const scanActiveProviders = useCallback(() => {
        const active = PROVIDERS.filter(p => localStorage.getItem(`markd_apikey_${p.id}`));
        setActiveProviders(active);

        // Load saved active model or fallback to first configured
        const savedId = localStorage.getItem('markd_active_model');
        const defaultModel = active.find(p => p.id === savedId) || active[0] || null;
        setSelectedModel(defaultModel);
    }, []);

    useEffect(() => {
        if (isOpen) {
            scanActiveProviders();
        }
    }, [isOpen, scanActiveProviders]);

    const handleSelectModel = (prov: Provider) => {
        setSelectedModel(prov);
        localStorage.setItem('markd_active_model', prov.id);
        setIsModelDropdownOpen(false);
        // Clear errors
        setErrorMsg(null);
    };

    // Fetch context suggestions using active model
    const fetchSuggestions = useCallback(async (currentMessages: typeof messages) => {
        if (!selectedModel) return;
        const apiKey = localStorage.getItem(`markd_apikey_${selectedModel.id}`);
        if (!apiKey) return;

        setIsLoadingSuggestions(true);
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: selectedModel.id,
                    apiKey,
                    model: selectedModel.model,
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
    }, [mediaId, mediaType, title, overview, locale, selectedModel]);

    // Re-fetch suggestions on mount or active model changes
    useEffect(() => {
        if (isOpen && selectedModel && messages.length === 0) {
            fetchSuggestions([]);
        }
    }, [isOpen, selectedModel, messages.length, fetchSuggestions]);

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

            // Close model dropdown
            if (
                isModelDropdownOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsModelDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, isMinimized, isModelDropdownOpen]);

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
        if (!trimmed) return;

        if (!selectedModel) {
            setErrorMsg(t('noApiKey'));
            return;
        }

        const apiKey = localStorage.getItem(`markd_apikey_${selectedModel.id}`);
        if (!apiKey) {
            setErrorMsg(t('noApiKey'));
            return;
        }

        setErrorMsg(null);
        const userMsg = { role: 'user' as const, content: trimmed };
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
                    provider: selectedModel.id,
                    apiKey,
                    model: selectedModel.model,
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

    // Render Minimized Floating Dock
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-accent text-background hover:bg-accent-hover shadow-2xl hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-accent/30 shadow-[0_0_15px_rgba(20,240,240,0.35)] animate-bounce-slow"
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

    const CurrentLogo = selectedModel ? selectedModel.logo : Sparkles;

    return (
        <div 
            ref={chatRef}
            className="fixed bottom-6 right-6 z-50 w-96 h-[530px] rounded-2xl bg-[#0c0c12] border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans"
        >
            {/* Chat Box Header */}
            <div className="px-4 py-3 border-b border-border/20 bg-background-elevated/40 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
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

                {/* Model Selector Dropdown & Capabilities Sync Header */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/10">
                    {selectedModel ? (
                        <div className="relative flex-1" ref={dropdownRef}>
                            <button
                                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                className="flex items-center gap-1.5 bg-[#12121a]/80 border border-border/20 rounded-lg px-2 py-1 text-[10px] text-foreground hover:border-accent/40 hover:bg-background-elevated transition-all cursor-pointer w-full text-left justify-between"
                            >
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <CurrentLogo />
                                    <span className="font-extrabold text-foreground truncate">{selectedModel.label}</span>
                                    <span className="text-foreground-muted truncate font-normal">({selectedModel.desc})</span>
                                </div>
                                <ChevronDown className="h-3.5 w-3.5 text-foreground-muted shrink-0 ml-1" />
                            </button>

                            {/* Dropdown Menu Option List */}
                            {isModelDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-[#0e0e16] p-1.5 shadow-2xl z-50 flex flex-col scrollbar-thin">
                                    <span className="text-[8px] font-black uppercase tracking-wider text-foreground-muted px-2 py-1">
                                        {t('selectModel')}
                                    </span>
                                    {activeProviders.length === 0 ? (
                                        <div className="px-2 py-2 text-[10px] text-foreground-muted italic">
                                            {t('noActiveModels')}
                                        </div>
                                    ) : (
                                        activeProviders.map((p) => {
                                            const ItemLogo = p.logo;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => handleSelectModel(p)}
                                                    className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-[10px] text-foreground-muted hover:bg-background-elevated hover:text-foreground transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <ItemLogo />
                                                        <span className="font-black text-foreground truncate">{p.label}</span>
                                                        <span className="text-[9px] text-foreground-muted truncate font-normal">({p.desc})</span>
                                                    </div>
                                                    {selectedModel.id === p.id && <Check className="h-3 w-3 text-accent shrink-0" />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-[10px] text-yellow-400/80 bg-yellow-500/5 border border-yellow-500/10 px-2 py-1 rounded-lg w-full font-bold flex items-center justify-between">
                            <span>No active LLMs configured.</span>
                            <Link href="/settings" onClick={() => setIsOpen(false)} className="text-accent hover:underline font-black">
                                Configure Keys →
                            </Link>
                        </div>
                    )}
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
                        {(!selectedModel || !localStorage.getItem(`markd_apikey_${selectedModel.id}`)) && (
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

                {/* Input Box with dynamic active model placeholder */}
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }} 
                    className="flex gap-2"
                >
                    <div className="flex-1 relative rounded-xl overflow-hidden border border-border/25 bg-background focus-within:border-accent/40 transition-colors">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={!selectedModel}
                            placeholder={
                                selectedModel 
                                    ? t('inputPlaceholderWithModel', { modelName: selectedModel.label }) 
                                    : t('inputPlaceholder')
                            }
                            className="w-full bg-transparent px-4 py-2.5 text-xs focus:outline-none text-foreground pr-8 disabled:opacity-50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim() || !selectedModel}
                        className="p-2.5 rounded-xl bg-accent text-background hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
