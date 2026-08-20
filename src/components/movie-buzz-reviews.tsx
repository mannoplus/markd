'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { 
    TrendingUp, 
    MessageSquare, 
    Calendar, 
    Users, 
    Star, 
    ChevronRight,
    Loader2
} from 'lucide-react';
import { IMAGE_SIZES } from '@/lib/tmdb';
import { useTranslations, useLocale } from 'next-intl';
import { formatNumber } from '@/lib/formatters';

type TabType = 'trending' | 'reviews' | 'anticipated';

export function MovieBuzzReviews() {
    const [activeTab, setActiveTab] = useState<TabType>('trending');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const t = useTranslations('MovieBuzz');
    const tHome = useTranslations('Home');
    const tNav = useTranslations('Navigation');
    const locale = useLocale();

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (type: TabType) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/movie-buzz?type=${type}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'trending', label: tNav('popular'), icon: TrendingUp },
        { id: 'reviews', label: t('tabLetterboxd'), icon: MessageSquare },
        { id: 'anticipated', label: tHome('upcomingShort'), icon: Calendar },
    ];

    return (
        <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-background-elevated/50 border border-border rounded-2xl w-fit mx-auto sm:mx-0">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                activeTab === tab.id
                                    ? 'bg-foreground text-background shadow-lg scale-[1.02]'
                                    : 'text-foreground-muted hover:text-foreground hover:bg-background-elevated'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Display */}
            <div className="relative min-h-[400px]">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-foreground-muted">
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        <p className="text-sm font-medium animate-pulse">{t('scanningMultiverse')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {data.length > 0 ? (
                            data.map((item, index) => (
                                <BuzzCard key={index} type={activeTab} item={item} locale={locale} />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl bg-background-card/30">
                                <p className="text-foreground-muted">{t('noBuzzTitle')}</p>
                                <p className="text-xs text-foreground-subtle mt-1">{t('noBuzzDesc')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function BuzzCard({ type, item, locale }: { type: TabType; item: any; locale: string }) {
    const movie = item.movie || item;
    const tmdbId = movie.ids?.tmdb;
    const posterPath = movie.poster_path || null;
    const t = useTranslations('MovieBuzz');
    
    const watchers = item.watchers;
    const anticipated = item.list_count;
    const comment = item.comment?.comment;
    const user = item.comment?.user;

    return (
        <Link 
            href={tmdbId ? `/movie/${tmdbId}` : '#'}
            className="group relative flex flex-col bg-background-card border border-border rounded-3xl overflow-hidden hover:border-accent/40 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-1.5"
        >
            {/* Poster Section */}
            <div className="relative aspect-[2/3] overflow-hidden">
                {posterPath ? (
                    <Image
                        src={`${IMAGE_SIZES.poster.medium}${posterPath}`}
                        alt={movie.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-background-elevated to-background-card flex items-center justify-center p-6 text-center">
                        <span className="text-xs font-medium text-foreground-subtle opacity-50 uppercase tracking-widest">{movie.title}</span>
                    </div>
                )}
                
                {/* Overlay with details */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
                
                {/* Floating Badge */}
                <div className="absolute top-4 right-4">
                    {type === 'anticipated' && anticipated && (
                        <div className="px-3 py-1.5 rounded-full bg-purple-500/90 text-white text-[10px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-xl">
                            <Star className="h-3 w-3" />
                            <span>{formatNumber(anticipated, locale)} {t('likes')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-accent transition-colors line-clamp-1">
                        {movie.title}
                    </h3>
                    
                    {/* Watcher Count */}
                    {type === 'trending' && watchers && (
                        <div className="flex items-center gap-2 mt-2 text-[15px] font-extrabold text-foreground border-l-2 border-accent pl-2">
                            <Users className="h-4 w-4 text-accent" />
                            <span>{formatNumber(watchers, locale)} {t('watchingNow')}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-foreground-muted font-medium">
                        <span>{movie.year}</span>
                        {movie.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                <span>{movie.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {type === 'reviews' && comment && (
                    <div className="mt-4 space-y-4">
                        <div className="relative">
                            <div className="absolute -top-2 -left-2 text-accent/20 text-3xl font-serif">&ldquo;</div>
                            <p className="text-xs text-foreground-subtle line-clamp-3 italic leading-relaxed pl-2 relative z-10">
                                {comment}
                            </p>
                        </div>
                        {user && (
                            <div className="flex items-center gap-2.5 border-t border-border/50 pt-3">
                                <div className="h-6 w-6 rounded-full overflow-hidden bg-background-elevated border border-border/50 shrink-0">
                                    {user.images?.avatar?.full ? (
                                        <Image src={user.images.avatar.full} alt={user.username} width={24} height={24} className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-accent">{user.username[0].toUpperCase()}</div>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">{user.username}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 group/btn">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-subtle opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-1 group-hover:translate-x-0">
                        {t('viewDetails')}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-background-elevated border border-border flex items-center justify-center transition-all duration-500 group-hover:bg-accent group-hover:border-accent">
                        <ChevronRight className="h-4 w-4 text-foreground transition-colors group-hover:text-background" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
