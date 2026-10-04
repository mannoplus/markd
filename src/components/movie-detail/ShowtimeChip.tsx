'use client';

import React from 'react';
import { ShowtimeSlot } from '@/types/cinema';
import { SCREEN_FORMATS } from '@/lib/constants/regions';

interface ShowtimeChipProps {
  slot: ShowtimeSlot;
  onClick: (slot: ShowtimeSlot) => void;
}

export function ShowtimeChip({ slot, onClick }: ShowtimeChipProps) {
  const isSoldOut = slot.occupancyStatus === 'sold_out' || slot.availableSeats === 0;

  // Format styling
  const formatMeta = SCREEN_FORMATS.find((f) => f.value === slot.format);

  // Seat Availability Status Indicator
  let statusBadge = {
    dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    textColor: 'text-emerald-400',
    label: '熱賣中',
  };

  if (isSoldOut) {
    statusBadge = {
      dotColor: 'bg-zinc-600',
      textColor: 'text-zinc-500',
      label: '已售完',
    };
  } else if (slot.occupancyStatus === 'almost_full') {
    statusBadge = {
      dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
      textColor: 'text-rose-400',
      label: '即將滿座',
    };
  } else if (slot.occupancyStatus === 'filling') {
    statusBadge = {
      dotColor: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
      textColor: 'text-amber-400',
      label: '剩餘座位不多',
    };
  }

  return (
    <button
      type="button"
      disabled={isSoldOut}
      onClick={() => onClick(slot)}
      className={`group relative flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all duration-200 select-none ${
        isSoldOut
          ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60 cursor-not-allowed'
          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-500 hover:bg-zinc-800/90 hover:shadow-lg active:scale-95'
      }`}
    >
      {/* Format Badge */}
      <div className="w-full flex items-center justify-between gap-1 text-[11px] mb-1">
        <span className="font-semibold text-zinc-400 truncate max-w-[70px]">
          {slot.hallName}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            formatMeta?.badgeStyle || 'bg-zinc-800 text-zinc-300'
          }`}
        >
          {slot.format}
        </span>
      </div>

      {/* Showtime Large Text */}
      <span
        className={`text-xl sm:text-2xl font-black tracking-tight ${
          isSoldOut ? 'text-zinc-500 line-through' : 'text-white group-hover:text-amber-300 transition-colors'
        }`}
      >
        {slot.time}
      </span>

      {/* Availability Status Dot & Count */}
      <div className="w-full mt-2 pt-1.5 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px]">
        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
        <span className={`font-medium ${statusBadge.textColor}`}>
          {isSoldOut ? '客滿' : `餘 ${slot.availableSeats} 位`}
        </span>
      </div>
    </button>
  );
}
