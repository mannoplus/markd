/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CompanionCard } from './CompanionCard';
import type { PersonalizedShelfItem } from '@/app/actions/personalization';

interface CompanionShelfProps {
  title: string;
  subtitle?: string;
  items: PersonalizedShelfItem[];
  surface?: 'home' | 'dashboard' | 'ask_markd';
  icon?: React.ReactNode;
  badgeText?: string;
}

export function CompanionShelf({
  title,
  subtitle,
  items = [],
  surface = 'home',
  icon,
  badgeText,
}: CompanionShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-4 relative select-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Shelf Header */}
      <div className="flex items-end justify-between px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {icon && icon}
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{title}</span>
              {badgeText && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 tracking-wider">
                  {badgeText}
                </span>
              )}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-foreground-muted max-w-xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Scroll Arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            className="p-2 rounded-full bg-background-elevated/70 border border-border/40 hover:bg-accent hover:text-background hover:border-accent text-foreground-muted transition-colors cursor-pointer shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-2 rounded-full bg-background-elevated/70 border border-border/40 hover:bg-accent hover:text-background hover:border-accent text-foreground-muted transition-colors cursor-pointer shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x scroll-smooth -mx-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <div
            key={`${item.mediaType}-${item.id}`}
            className="min-w-[180px] sm:min-w-[210px] max-w-[210px] shrink-0 snap-start"
          >
            <CompanionCard item={item} surface={surface} />
          </div>
        ))}
      </div>
    </section>
  );
}
