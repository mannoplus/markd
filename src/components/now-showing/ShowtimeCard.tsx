'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { Film } from 'lucide-react';
import { sanitizeTitle } from '../movie-card';

interface MovieData {
    id: string;
    tmdbId?: number | null;
    title: string;
    link: string | null;
    poster: string;
}

interface Props {
    movie: MovieData;
    onShowtimesClick: (id: string, title: string) => void;
}

export default function ShowtimeCard({ movie, onShowtimesClick }: Props) {
    const t = useTranslations('nowShowing');
    const locale = useLocale();
    const [imgError, setImgError] = useState(false);

    const sanitizedTitle = sanitizeTitle(movie.title, locale);

    const content = (
        <>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10 opacity-80"></div>
            
            {movie.poster && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                    src={movie.poster} 
                    alt={sanitizedTitle}
                    className="object-cover w-full h-full opacity-80 transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black border border-border/20 z-0">
                    <div className="text-center p-4">
                        <Film className="h-10 w-10 text-purple-500/60 mx-auto mb-2" />
                        <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-sans">
                            {t('posterUnavailable') || 'Poster Unavailable'}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                <h3 className="font-bold text-white text-lg line-clamp-2 leading-tight drop-shadow-md">
                    {sanitizedTitle}
                </h3>
            </div>
        </>
    );

    return (
        <div className="group relative rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 transition-colors flex flex-col h-full">
            {movie.link ? (
                <Link href={movie.link as never} className="relative w-full overflow-hidden block" style={{ aspectRatio: '2/3' }}>
                    {content}
                </Link>
            ) : (
                <div className="relative w-full overflow-hidden block" style={{ aspectRatio: '2/3' }}>
                    {content}
                </div>
            )}
            
            <div className="p-4 flex flex-col flex-grow justify-end bg-gray-900 border-t border-gray-800">
                <button 
                    onClick={() => onShowtimesClick(movie.id, sanitizedTitle)}
                    className="w-full py-2.5 px-4 bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg text-sm font-semibold text-center transition-all duration-300 ring-1 ring-inset ring-purple-500/20 hover:ring-purple-600"
                >
                    {t('viewShowtimes')}
                </button>
            </div>
        </div>
    );
}
