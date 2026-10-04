'use client';

import React from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { TheaterWithShowtimes, ShowtimeSlot } from '@/types/cinema';
import { THEATER_CHAINS } from '@/lib/constants/regions';
import { ShowtimeChip } from './ShowtimeChip';

interface TheaterShowtimeCardProps {
  theater: TheaterWithShowtimes;
  onSelectSlot: (theater: TheaterWithShowtimes, slot: ShowtimeSlot) => void;
}

export function TheaterShowtimeCard({ theater, onSelectSlot }: TheaterShowtimeCardProps) {
  const chainMeta = THEATER_CHAINS.find((c) => c.value === theater.chain);
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${theater.theaterNameZh} ${theater.address}`
  )}`;

  return (
    <div className="w-full bg-zinc-950/70 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-xl">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 bg-zinc-900/30">
        <div className="flex items-start sm:items-center gap-3">
          {/* Chain Brand Badge */}
          {chainMeta && (
            <span
              className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: chainMeta.color }}
            >
              {chainMeta.shortLabel}
            </span>
          )}

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {theater.theaterNameZh}
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                {theater.address}
              </span>
              {theater.distanceKm && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400 flex items-center gap-0.5">
                    <Navigation className="w-3 h-3 text-zinc-500" />
                    約 {theater.distanceKm.toFixed(1)} km
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Map External Link */}
        <a
          href={mapSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start sm:self-center inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors py-1 px-2 rounded-lg bg-zinc-900 border border-zinc-800"
          title="在 Google 地圖開啟"
        >
          <span>導航地圖</span>
          <ExternalLink className="w-3 h-3 text-zinc-400" />
        </a>
      </div>

      {/* Showtimes Grid */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {theater.showtimes.map((slot) => (
            <ShowtimeChip
              key={slot.id}
              slot={slot}
              onClick={(clickedSlot) => onSelectSlot(theater, clickedSlot)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
