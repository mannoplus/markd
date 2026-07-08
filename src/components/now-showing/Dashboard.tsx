'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import BoxOfficeCard from './BoxOfficeCard';
import ShowtimeCard from './ShowtimeCard';
import ComingSoonCard from './ComingSoonCard';
import ShowtimeModal from './ShowtimeModal';

interface MovieData {
    id: string; // ATM id
    tmdbId?: number | null; // TMDB id
    title: string;
    link: string | null;
    poster: string;
    rank?: number;
}

interface DashboardData {
    boxOffice: MovieData[];
    thisWeekNew: MovieData[];
    comingSoon: MovieData[];
}

export default function Dashboard() {
    const searchParams = useSearchParams();
    const region = searchParams.get('region') || 'TW';
    const t = useTranslations('nowShowing');
    const locale = useLocale();

    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
    const [selectedMovieTitle, setSelectedMovieTitle] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/now-showing?lang=${locale}`);
                if (!res.ok) throw new Error('Failed to fetch data');
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    throw new Error(json.error || 'Failed to parse data');
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [locale]);

    const handleShowtimesClick = (id: string, title: string) => {
        setSelectedMovieId(id);
        setSelectedMovieTitle(title);
        setModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-indigo-400 font-medium tracking-widest uppercase text-sm">{t('loading') || 'Loading Dashboard...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
                <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl text-center max-w-md">
                    <h2 className="text-xl font-bold text-red-400 mb-2">{t('error') || 'Error Loading Data'}</h2>
                    <p className="text-gray-300">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-6">
                        {t('title')}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl font-light">
                        {t('description')}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-24">
                {/* Box Office Section */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-bold tracking-tight border-l-4 border-indigo-500 pl-4">{t('boxOffice')}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {data?.boxOffice.map((movie) => (
                            <BoxOfficeCard key={movie.id} movie={movie} />
                        ))}
                    </div>
                </section>

                {/* This Week New Releases Section */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-bold tracking-tight border-l-4 border-purple-500 pl-4">{t('newReleases')}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {data?.thisWeekNew.map((movie) => (
                            <ShowtimeCard key={movie.id} movie={movie} onShowtimesClick={handleShowtimesClick} />
                        ))}
                    </div>
                </section>

                {/* Coming Soon Section */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-bold tracking-tight border-l-4 border-pink-500 pl-4">{t('comingSoon')}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {data?.comingSoon.map((movie) => (
                            <ComingSoonCard key={movie.id} movie={movie} />
                        ))}
                    </div>
                </section>
            </div>

            <ShowtimeModal 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)} 
                movieId={selectedMovieId} 
                movieTitle={selectedMovieTitle}
                region={region}
            />
        </div>
    );
}
