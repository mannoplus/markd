'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Film,
  CalendarX2,
  BellRing,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  MovieDetail,
  TheaterWithShowtimes,
  ShowtimeSlot,
  TaiwanRegion,
  TheaterChain,
  ScreenFormat,
} from '@/types/cinema';
import { DatePickerStrip } from './DatePickerStrip';
import { FilterToolbar } from './FilterToolbar';
import { TheaterShowtimeCard } from './TheaterShowtimeCard';
import { SeatPreviewModal } from './SeatPreviewModal';

interface ShowtimeSectionProps {
  movie: MovieDetail;
  initialTheaters: TheaterWithShowtimes[];
  initialDate: string;
}

export function ShowtimeSection({
  movie,
  initialTheaters,
  initialDate,
}: ShowtimeSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read initial filter values from URL or defaults
  const dateParam = searchParams.get('date') || initialDate;
  const regionParam = (searchParams.get('region') as TaiwanRegion | 'all') || 'all';
  const chainsParam = searchParams.get('chains')
    ? (searchParams.get('chains')!.split(',') as TheaterChain[])
    : [];
  const formatsParam = searchParams.get('formats')
    ? (searchParams.get('formats')!.split(',') as ScreenFormat[])
    : [];

  const [selectedDate, setSelectedDate] = useState<string>(dateParam);
  const [selectedRegion, setSelectedRegion] = useState<TaiwanRegion | 'all'>(regionParam);
  const [selectedChains, setSelectedChains] = useState<TheaterChain[]>(chainsParam);
  const [selectedFormats, setSelectedFormats] = useState<ScreenFormat[]>(formatsParam);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active seat preview state
  const [activeModal, setActiveModal] = useState<{
    theater: TheaterWithShowtimes;
    slot: ShowtimeSlot;
  } | null>(null);

  // Synchronize state with URL query parameters
  const updateUrlParams = (
    newDate: string,
    newRegion: TaiwanRegion | 'all',
    newChains: TheaterChain[],
    newFormats: ScreenFormat[]
  ) => {
    const params = new URLSearchParams();
    if (newDate) params.set('date', newDate);
    if (newRegion && newRegion !== 'all') params.set('region', newRegion);
    if (newChains.length > 0) params.set('chains', newChains.join(','));
    if (newFormats.length > 0) params.set('formats', newFormats.join(','));

    const queryString = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      });
    });
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    updateUrlParams(date, selectedRegion, selectedChains, selectedFormats);
  };

  const handleSelectRegion = (region: TaiwanRegion | 'all') => {
    setSelectedRegion(region);
    updateUrlParams(selectedDate, region, selectedChains, selectedFormats);
  };

  const handleToggleChain = (chain: TheaterChain) => {
    const nextChains = selectedChains.includes(chain)
      ? selectedChains.filter((c) => c !== chain)
      : [...selectedChains, chain];
    setSelectedChains(nextChains);
    updateUrlParams(selectedDate, selectedRegion, nextChains, selectedFormats);
  };

  const handleToggleFormat = (format: ScreenFormat) => {
    const nextFormats = selectedFormats.includes(format)
      ? selectedFormats.filter((f) => f !== format)
      : [...selectedFormats, format];
    setSelectedFormats(nextFormats);
    updateUrlParams(selectedDate, selectedRegion, selectedChains, nextFormats);
  };

  const handleResetFilters = () => {
    setSelectedRegion('all');
    setSelectedChains([]);
    setSelectedFormats([]);
    setSearchQuery('');
    updateUrlParams(selectedDate, 'all', [], []);
  };

  const hasActiveFilters =
    selectedRegion !== 'all' ||
    selectedChains.length > 0 ||
    selectedFormats.length > 0 ||
    searchQuery.trim().length > 0;

  // Pre-release detection
  const todayStr = new Date().toISOString().split('T')[0];
  const isPreRelease = movie.releaseDate > todayStr && movie.id === '3';

  // Filtered theaters computation
  const filteredTheaters = useMemo(() => {
    if (isPreRelease) return [];

    return initialTheaters
      .filter((t) => {
        // Region filter
        if (selectedRegion !== 'all' && t.region !== selectedRegion) {
          return false;
        }

        // Chain filter
        if (selectedChains.length > 0 && !selectedChains.includes(t.chain)) {
          return false;
        }

        // Keyword Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = t.theaterNameZh.toLowerCase().includes(q) || t.theaterNameEn.toLowerCase().includes(q);
          const matchAddress = t.address.toLowerCase().includes(q);
          if (!matchName && !matchAddress) return false;
        }

        return true;
      })
      .map((t) => {
        // Formats filter inside theater showtimes
        if (selectedFormats.length === 0) return t;
        const matchingSlots = t.showtimes.filter((s) => selectedFormats.includes(s.format));
        return {
          ...t,
          showtimes: matchingSlots,
        };
      })
      .filter((t) => t.showtimes.length > 0);
  }, [initialTheaters, selectedRegion, selectedChains, selectedFormats, searchQuery, isPreRelease]);

  // Total available screening slots across filtered theaters
  const totalShowtimeCount = useMemo(() => {
    return filteredTheaters.reduce((acc, t) => acc + t.showtimes.length, 0);
  }, [filteredTheaters]);

  return (
    <section id="showtimes" className="w-full py-12 scroll-mt-6 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Film className="w-7 h-7 text-white" />
              全台影城場次時刻表 / Showtimes
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              即時整合威秀、秀泰、國賓、新光等台灣各大影城場次及剩餘座位分佈
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋影城名稱或地址..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-zinc-900/80 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        {/* Pre-Release Banner Edge Case */}
        {isPreRelease ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/50 border border-amber-500/20 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              即將上映 / Coming Soon
            </h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              本片預計於 <strong className="text-amber-400">{movie.releaseDate}</strong> 全台盛大上映。
              目前影城尚未開放預售劃位，敬請持續關注！
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => alert(`已成功訂閱《${movie.titleZh}》開賣提醒！`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-zinc-950 font-bold text-sm hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/10 active:scale-95"
              >
                <BellRing className="w-4 h-4" />
                提醒我開賣時間
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Date Picker Strip */}
            <DatePickerStrip
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            {/* 2. Filter Toolbar */}
            <FilterToolbar
              selectedRegion={selectedRegion}
              onSelectRegion={handleSelectRegion}
              selectedChains={selectedChains}
              onToggleChain={handleToggleChain}
              selectedFormats={selectedFormats}
              onToggleFormat={handleToggleFormat}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {/* Screenings Counter */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-400 px-1">
              <span>
                共找到 <strong className="text-white">{filteredTheaters.length}</strong> 間影城、
                <strong className="text-emerald-400 font-semibold">{totalShowtimeCount}</strong> 場次
              </span>
              {isPending && <span className="text-xs text-zinc-500 animate-pulse">更新中...</span>}
            </div>

            {/* 3. Theaters List or Empty State */}
            {filteredTheaters.length > 0 ? (
              <div className="space-y-4">
                {filteredTheaters.map((theater) => (
                  <TheaterShowtimeCard
                    key={theater.theaterId}
                    theater={theater}
                    onSelectSlot={(th, slot) => {
                      setActiveModal({ theater: th, slot });
                    }}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="py-16 px-4 rounded-3xl bg-zinc-950/40 border border-white/5 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                  <CalendarX2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  該日期或地區暫無場次資訊
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
                  目前所選條件下查無放映場次。請嘗試切換放映日期、放寬規格篩選，或查看其他縣市影城。
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重設所有篩選
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextD = new Date(selectedDate);
                      nextD.setDate(nextD.getDate() + 1);
                      const nextDateStr = nextD.toISOString().split('T')[0];
                      handleSelectDate(nextDateStr);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs sm:text-sm font-bold transition-colors shadow-md active:scale-95"
                  >
                    查看下一放映日場次
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Seat Preview Modal */}
      {activeModal && (
        <SeatPreviewModal
          theater={activeModal.theater}
          slot={activeModal.slot}
          onClose={() => setActiveModal(null)}
        />
      )}
    </section>
  );
}
