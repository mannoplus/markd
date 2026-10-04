import React from 'react';

export default function MovieDetailLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[480px] sm:h-[580px] bg-zinc-900/60 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12">
          {/* Poster Skeleton */}
          <div className="w-52 sm:w-64 aspect-[2/3] rounded-2xl bg-zinc-800/80 shadow-2xl flex-shrink-0" />

          {/* Details Skeleton */}
          <div className="flex-1 w-full space-y-4 pt-4">
            <div className="h-10 sm:h-12 w-3/4 rounded-xl bg-zinc-800/80" />
            <div className="h-5 w-1/2 rounded-lg bg-zinc-800/60" />
            <div className="flex gap-3 pt-2">
              <div className="h-6 w-16 rounded-md bg-zinc-800/80" />
              <div className="h-6 w-20 rounded-md bg-zinc-800/80" />
              <div className="h-6 w-28 rounded-md bg-zinc-800/80" />
            </div>
            <div className="h-20 w-full rounded-xl bg-zinc-800/40 mt-4" />
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-48 rounded-xl bg-zinc-700/80" />
              <div className="h-12 w-36 rounded-xl bg-zinc-800/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes Container Skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-8 w-64 rounded-lg bg-zinc-800/80" />

        {/* Date strip pills */}
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-800/60 flex-shrink-0" />
          ))}
        </div>

        {/* Filter bar */}
        <div className="h-24 w-full rounded-2xl bg-zinc-900/60 border border-white/5" />

        {/* Theater Cards */}
        <div className="space-y-4 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 w-full rounded-2xl bg-zinc-900/50 border border-white/5 p-5 space-y-4">
              <div className="h-6 w-48 rounded-md bg-zinc-800" />
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-20 rounded-xl bg-zinc-800/60" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
