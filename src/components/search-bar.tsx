'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function SearchBarInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto">
            <div className="relative flex items-center">
                <Search className="absolute left-6 h-5 w-5 text-foreground-muted" />
                <input
                    type="text"
                    name="q"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search movies & TV shows..."
                    className="w-full rounded-full border-2 border-border bg-background-elevated py-4 pl-14 pr-24 text-lg text-foreground placeholder:text-foreground-muted focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all shadow-sm"
                />
                <button
                    type="submit"
                    className="absolute right-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background hover:bg-foreground-muted transition-colors"
                >
                    Search
                </button>
            </div>
        </form>
    );
}

export function SearchBar() {
    return (
        <Suspense
            fallback={
                <div className="h-16 w-full max-w-3xl mx-auto rounded-full bg-background-elevated animate-pulse border-2 border-border" />
            }
        >
            <SearchBarInner />
        </Suspense>
    );
}
