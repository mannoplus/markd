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

export default function ComingSoonCard({ movie }: { movie: MovieData }) {
    const t = useTranslations('nowShowing');
    const locale = useLocale();
    const [imgError, setImgError] = useState(false);

    const sanitizedTitle = sanitizeTitle(movie.title, locale);

    return (
        <div className="group relative rounded-xl overflow-hidden bg-gray-900 border border-pink-500/10 hover:border-pink-500/40 transition-colors flex flex-col h-full shadow-lg">
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '2/3' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10 opacity-90"></div>
                
                {movie.poster && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                        src={movie.poster} 
                        alt={sanitizedTitle}
                        className="object-cover w-full h-full opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black border border-border/20 z-0">
                        <div className="text-center p-4">
                            <Film className="h-10 w-10 text-pink-500/60 mx-auto mb-2" />
                            <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-sans">
                                {t('posterUnavailable') || 'Poster Unavailable'}
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="absolute inset-x-0 bottom-0 p-4 z-20 flex flex-col items-center text-center">
                    <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest text-pink-300 bg-pink-500/20 rounded-full border border-pink-500/30 backdrop-blur-md max-w-full truncate">
                        {t('comingSoonBadge')}
                    </span>
                    <h3 className="font-bold text-white text-md line-clamp-2 leading-snug drop-shadow-md">
                        {sanitizedTitle}
                    </h3>
                </div>
            </div>
            
            <div className="p-4 flex flex-col flex-grow justify-end bg-gray-900 border-t border-gray-800">
                {movie.link && (
                    <Link 
                        href={movie.link as never} 
                        className="w-full py-2 px-4 text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 rounded-lg text-sm font-medium text-center transition-colors block"
                    >
                        {t('moreInfo')}
                    </Link>
                )}
            </div>
        </div>
    );
}
