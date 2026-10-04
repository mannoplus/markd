'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Info } from 'lucide-react';
import { TheaterWithShowtimes, ShowtimeSlot, SeatMapLayout } from '@/types/cinema';
import { getSeatMapSnapshot } from '@/lib/api';

interface SeatPreviewModalProps {
  theater: TheaterWithShowtimes;
  slot: ShowtimeSlot;
  onClose: () => void;
}

export function SeatPreviewModal({ theater, slot, onClose }: SeatPreviewModalProps) {
  const [layout, setLayout] = useState<SeatMapLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getSeatMapSnapshot(slot.id).then((data) => {
      if (mounted) {
        setLayout(data);
        setLoading(false);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      mounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [slot.id, onClose]);

  const bookingUrl = slot.bookingUrl || 'https://www.vscinemas.com.tw/';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-start justify-between border-b border-zinc-800 bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-zinc-950 uppercase">
                {slot.format}
              </span>
              <span className="text-xs font-semibold text-zinc-400">
                {slot.hallName}
              </span>
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-tight">
              {theater.theaterNameZh} • {slot.time} 場次
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              即時座位圖預覽 (Real-time Seat Map Snapshot)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Seat Map */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading || !layout ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <p className="text-sm">載入即時座位分佈中...</p>
            </div>
          ) : (
            <>
              {/* Screen Indicator */}
              <div className="flex flex-col items-center pt-2 pb-6">
                <div className="w-3/4 h-2 rounded-full bg-gradient-to-r from-transparent via-zinc-400 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                <span className="mt-2 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                  SCREEN 銀幕方向
                </span>
              </div>

              {/* Seat Matrix Grid */}
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[480px] mx-auto flex flex-col items-center gap-1.5 select-none">
                  {layout.rows.map((row) => {
                    const rowSeats = layout.seats.filter((s) => s.row === row);

                    return (
                      <div key={row} className="flex items-center gap-2">
                        {/* Row Label */}
                        <span className="w-5 text-xs font-bold text-zinc-500 text-center">
                          {row}
                        </span>

                        {/* Seat Row */}
                        <div className="flex items-center gap-1.5">
                          {rowSeats.map((seat) => {
                            const isAvailable = seat.status === 'available';
                            const isSelected = selectedSeat === seat.id;

                            let seatStyle = 'bg-zinc-800 border-zinc-700 text-zinc-500';
                            if (isSelected) {
                              seatStyle = 'bg-amber-400 border-amber-300 text-zinc-950 font-bold scale-110 shadow-lg';
                            } else if (isAvailable) {
                              if (seat.type === 'vip') {
                                seatStyle = 'bg-purple-950/80 border-purple-500 text-purple-200 hover:bg-purple-800';
                              } else if (seat.type === 'wheelchair') {
                                seatStyle = 'bg-sky-950/80 border-sky-500 text-sky-200 hover:bg-sky-800';
                              } else {
                                seatStyle = 'bg-zinc-900 border-zinc-600 text-zinc-200 hover:border-white hover:bg-zinc-800';
                              }
                            }

                            return (
                              <button
                                key={seat.id}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => setSelectedSeat(isSelected ? null : seat.id)}
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border text-[10px] flex items-center justify-center transition-all ${seatStyle} ${
                                  !isAvailable ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
                                }`}
                                title={`${seat.row}排 ${seat.col}號 (${seat.type}) - ${
                                  isAvailable ? `可選購 NT$${seat.price}` : '已售出'
                                }`}
                              >
                                {seat.col}
                              </button>
                            );
                          })}
                        </div>

                        {/* Row Label Right */}
                        <span className="w-5 text-xs font-bold text-zinc-500 text-center">
                          {row}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seat Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 py-3 px-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-zinc-600 bg-zinc-900" />
                  <span>空位可選</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-purple-500 bg-purple-950/80" />
                  <span>VIP 尊享位</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-sky-500 bg-sky-950/80" />
                  <span>無障礙輪椅位</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-zinc-800 bg-zinc-800 opacity-40" />
                  <span>已售出 / 鎖定</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-amber-300 bg-amber-400" />
                  <span>目前預覽</span>
                </div>
              </div>

              {/* Stats Notice */}
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span>
                  本場總座位數: <strong className="text-white">{slot.totalSeats}</strong> 席
                </span>
                <span>
                  即時剩餘空位: <strong className="text-emerald-400 font-bold">{slot.availableSeats}</strong> 席
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer with Primary Booking Link */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <span>實際劃位與票價以該影城官方購票系統最終結帳為準。</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-sm font-semibold transition-colors"
            >
              關閉
            </button>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm shadow-lg transition-transform active:scale-95"
            >
              <span>前往影城官網訂票</span>
              <ExternalLink className="w-4 h-4 text-zinc-950" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
