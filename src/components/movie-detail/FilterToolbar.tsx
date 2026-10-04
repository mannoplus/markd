'use client';

import React from 'react';
import { MapPin, Building2, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { TaiwanRegion, TheaterChain, ScreenFormat } from '@/types/cinema';
import {
  TAIWAN_REGIONS,
  THEATER_CHAINS,
  SCREEN_FORMATS,
} from '@/lib/constants/regions';

interface FilterToolbarProps {
  selectedRegion: TaiwanRegion | 'all';
  onSelectRegion: (region: TaiwanRegion | 'all') => void;
  selectedChains: TheaterChain[];
  onToggleChain: (chain: TheaterChain) => void;
  selectedFormats: ScreenFormat[];
  onToggleFormat: (format: ScreenFormat) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterToolbar({
  selectedRegion,
  onSelectRegion,
  selectedChains,
  onToggleChain,
  selectedFormats,
  onToggleFormat,
  onResetFilters,
  hasActiveFilters,
}: FilterToolbarProps) {
  return (
    <div className="w-full space-y-4 py-3 bg-zinc-950/60 rounded-2xl border border-white/5 p-4 sm:p-5">
      {/* City/Region Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            縣市地區 / Region
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              重設篩選 / Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1">
          {TAIWAN_REGIONS.map((r) => {
            const isSelected = selectedRegion === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => onSelectRegion(r.value)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-zinc-200 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80'
                }`}
              >
                {r.labelZh}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
        {/* Theater Chain Multi-Select Chips */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
            影城品牌 / Chains
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {THEATER_CHAINS.map((chain) => {
              const isSelected = selectedChains.includes(chain.value);
              return (
                <button
                  key={chain.value}
                  type="button"
                  onClick={() => onToggleChain(chain.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-zinc-800 text-white border-white/30 shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: chain.color }}
                  />
                  <span>{chain.shortLabel}</span>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Screen Format Multi-Select Chips */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            放映規格 / Formats
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {SCREEN_FORMATS.map((fmt) => {
              const isSelected = selectedFormats.includes(fmt.value);
              return (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => onToggleFormat(fmt.value)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-white text-zinc-950 font-bold border-white shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                  title={fmt.description}
                >
                  <span>{fmt.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-zinc-950" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
