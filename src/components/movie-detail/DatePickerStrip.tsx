'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface DatePickerStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  availableDates?: string[];
  daysCount?: number;
}

export function DatePickerStrip({
  selectedDate,
  onSelectDate,
  availableDates = [],
  daysCount = 14,
}: DatePickerStripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate date items for the next `daysCount` days
  const dateItems = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Chinese Day of Week
    const dayIndex = d.getDay();
    const weekdaysZh = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const isToday = i === 0;
    const isTomorrow = i === 1;

    let dayLabelZh = weekdaysZh[dayIndex];
    if (isToday) dayLabelZh = '今天';
    else if (isTomorrow) dayLabelZh = '明天';

    return {
      dateStr,
      dayLabelZh,
      weekdaysEn: weekdaysEn[dayIndex],
      dateDisplay: `${month}/${day}`,
      hasScreenings: availableDates.length === 0 || availableDates.includes(dateStr),
    };
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full select-none py-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs sm:text-sm font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
          <CalendarDays className="w-4 h-4 text-white" />
          選擇放映日期 / Select Date
        </span>
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Previous Dates"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Next Dates"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-2 scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {dateItems.map((item) => {
          const isSelected = item.dateStr === selectedDate;

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              style={{ scrollSnapAlign: 'start' }}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-[74px] sm:w-[82px] py-3 rounded-xl border transition-all duration-200 active:scale-95 ${
                isSelected
                  ? 'bg-white text-zinc-950 font-bold border-white shadow-lg shadow-white/10 ring-2 ring-white/30'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/90'
              }`}
            >
              {/* Day Label */}
              <span
                className={`text-xs font-semibold ${
                  isSelected ? 'text-zinc-950' : 'text-zinc-400'
                }`}
              >
                {item.dayLabelZh}
              </span>

              {/* Month/Day */}
              <span className="text-sm sm:text-base font-extrabold tracking-tight mt-0.5">
                {item.dateDisplay}
              </span>

              {/* Indicator Dot */}
              <div className="mt-1.5 flex items-center justify-center">
                {item.hasScreenings ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-zinc-950' : 'bg-emerald-400'
                    }`}
                  />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 opacity-40" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
