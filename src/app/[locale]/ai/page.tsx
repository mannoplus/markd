'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { upsertMediaItem } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Array<{
    id: number;
    title: string;
    year?: string;
    matchScore: number;
    matchReason: string;
    posterPath?: string;
    overview?: string;
    mediaType?: 'movie' | 'tv';
  }>;
}

export default function AiCompanionPage() {
  const t = useTranslations('AiCompanion');
  const tCommon = useTranslations('Common');
  const tChat = useTranslations('AiChat');
  const locale = useLocale();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('welcomeMessage'),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setSavedIds] = useState<Set<number>>(new Set());

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

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!userPrompt) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          language: locale,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('AI service response error');
      }

      const data = await res.json();
      const aiResponse = data.text || t('unableToGenerate');

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
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

  const handleSaveToWatchlist = async (tmdbId: number, title: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/${locale}/login`;
      return;
    }

    setSavedIds((prev) => new Set([...prev, tmdbId]));
    try {
      await upsertMediaItem({
        tmdb_id: tmdbId,
        media_type: 'movie',
        title,
        poster_path: null,
        status: 'plan_to_watch',
        rating: null,
        season_progress: null,
        episode_progress: null,
      });
    } catch (e) {
      console.error(e);
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
                  className="rounded-xl border border-border/40 bg-background-elevated/60 p-3 text-left text-xs font-semibold text-foreground-muted hover:border-accent/50 hover:text-foreground hover:bg-background-elevated transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="space-y-6 min-h-[380px] rounded-2xl bg-[#0c0c14] border border-border/40 p-5 sm:p-6 shadow-2xl">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-accent text-background font-medium shadow-lg'
                    : 'bg-background-elevated/90 text-foreground border border-border/30 shadow-md'
                }`}
              >
                {m.content}
              </div>

              {m.role === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-foreground shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
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
            className="absolute right-2.5 rounded-xl bg-accent p-2 text-background hover:bg-accent-hover transition-all disabled:opacity-30 cursor-pointer shadow-md"
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
