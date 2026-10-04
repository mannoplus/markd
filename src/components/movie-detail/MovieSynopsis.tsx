'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, Clapperboard, Layers } from 'lucide-react';
import { MovieDetail } from '@/types/cinema';

interface MovieSynopsisProps {
  movie: MovieDetail;
}

export function MovieSynopsis({ movie }: MovieSynopsisProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="w-full py-8 border-y border-white/5 bg-zinc-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Story Synopsis */}
          <div className="lg:col-span-2 flex flex-col justify-start">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-zinc-400" />
              劇情簡介 / Synopsis
            </h2>
            <div className="mt-3 relative">
              <p
                className={`text-sm sm:text-base text-zinc-300 leading-relaxed transition-all ${
                  isExpanded ? '' : 'line-clamp-3'
                }`}
              >
                {movie.synopsis}
              </p>
              {movie.synopsis.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <span>收起內容 / Show Less</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>閱讀完整簡介 / Read More</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Cast & Crew Sidebar */}
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-zinc-900/40 border border-white/5">
            {movie.director && (
              <div>
                <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5 text-zinc-400" />
                  導演 / Director
                </span>
                <p className="mt-1 text-sm font-medium text-zinc-200">{movie.director}</p>
              </div>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <div>
                <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  主要演員 / Starring Cast
                </span>
                <p className="mt-1 text-sm text-zinc-300 leading-normal">
                  {movie.cast.join('、')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
