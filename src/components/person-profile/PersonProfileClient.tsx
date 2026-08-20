'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { 
    Instagram, Facebook, Twitter, MapPin, Calendar, 
    ChevronDown, ChevronUp
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { TMDBPersonDetails } from '@/types';
import { formatDate } from '@/lib/formatters';

interface PersonProfileClientProps {
    person: TMDBPersonDetails;
    locale: string;
}

export function PersonProfileClient({ person, locale }: PersonProfileClientProps) {
    const t = useTranslations('Person');
    const tViews = useTranslations('LibraryViews');
    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const [activeRoleTab, setActiveRoleTab] = useState<'all' | 'acting' | 'directing' | 'producing'>('all');

    // Dedup and sort credits for "Known For" (sorted by vote average or popularity)
    const knownForCredits = Array.from(
        new Map((person.combined_credits?.cast || []).map(c => [c.id, c])).values()
    )
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, 12);

    // Dedup and format all career credits (cast + crew) ordered by year (descending)
    const allCreditsRaw = [
        ...(person.combined_credits?.cast || []).map(c => ({ ...c, roleType: 'cast' as const })),
        ...(person.combined_credits?.crew || []).map(c => ({ ...c, roleType: 'crew' as const }))
    ];

    const timelineCredits = allCreditsRaw.map(c => {
        const dateStr = c.release_date || c.first_air_date || '';
        const year = dateStr ? parseInt(dateStr.split('-')[0], 10) : null;
        return { ...c, year };
    })
    .sort((a, b) => {
        if (a.year === null && b.year === null) return 0;
        if (a.year === null) return 1;
        if (b.year === null) return -1;
        return b.year - a.year;
    });

    // Detect valid roles dynamically
    const hasActing = timelineCredits.some(c => c.roleType === 'cast');
    const hasDirecting = timelineCredits.some(c => c.roleType === 'crew' && c.job === 'Director');
    const hasProducing = timelineCredits.some(c => c.roleType === 'crew' && c.job === 'Producer');

    // Filtered timeline based on active tab
    const filteredCredits = timelineCredits.filter(c => {
        if (activeRoleTab === 'all') return true;
        if (activeRoleTab === 'acting') return c.roleType === 'cast';
        if (activeRoleTab === 'directing') return c.roleType === 'crew' && c.job === 'Director';
        if (activeRoleTab === 'producing') return c.roleType === 'crew' && c.job === 'Producer';
        return true;
    });

    const hasLongBio = person.biography && person.biography.length > 350;
    const displayedBio = isBioExpanded || !hasLongBio
        ? person.biography 
        : person.biography.substring(0, 350) + '...';

    // Social accounts
    const ext = person.external_ids || {};
    const socialLinks = [
        { id: ext.instagram_id, url: (id: string) => `https://instagram.com/${id}`, icon: Instagram },
        { id: ext.twitter_id, url: (id: string) => `https://x.com/${id}`, icon: Twitter },
        { id: ext.facebook_id, url: (id: string) => `https://facebook.com/${id}`, icon: Facebook },
    ].filter(s => s.id);

    // Gender translation lookup
    const getGenderLabel = (gNum?: number) => {
        switch (gNum) {
            case 1: return t('female');
            case 2: return t('male');
            case 3: return t('nonBinary');
            default: return t('notSpecified');
        }
    };

    // Find English name if primary name is Chinese
    const findEnglishName = () => {
        if (/^[a-zA-Z\s\-\.\,\'\’]+$/.test(person.name)) {
            return null;
        }
        if (person.also_known_as) {
            for (const alias of person.also_known_as) {
                if (/^[a-zA-Z\s\-\.\,\'\’]+$/.test(alias)) {
                    return alias;
                }
            }
        }
        return null;
    };

    const englishName = findEnglishName();
    const isChinese = locale === 'zh-TW' || locale === 'zh';

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mt-16 md:mt-24 fade-in font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-end border-b border-border/20 pb-8 mb-8">
                {/* Profile Picture Optimized */}
                <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-2xl overflow-hidden border border-border/30 shadow-2xl shrink-0 bg-background-elevated">
                    {person.profile_path ? (
                        <Image
                            src={`https://image.tmdb.org/t/p/h632${person.profile_path}`}
                            alt={person.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-foreground-muted font-black text-4xl uppercase">
                            {person.name.slice(0, 2)}
                        </div>
                    )}
                </div>
                <div className="space-y-2 text-center md:text-left md:mb-2">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight">{person.name}</h1>
                    {isChinese && englishName && (
                        <h2 className="text-xl md:text-2xl font-bold text-foreground-muted/80 tracking-normal mt-1">
                            {englishName}
                        </h2>
                    )}
                    <p className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-accent/85">
                        {person.known_for_department}
                    </p>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
                
                {/* Left Column: Personal Info Sidebar */}
                <div className="space-y-6 lg:border-r lg:border-border/15 lg:pr-8">
                    
                    {/* Social Media Links */}
                    {socialLinks.length > 0 && (
                        <div className="flex items-center gap-3 pb-2 border-b border-border/10 justify-center lg:justify-start">
                            {socialLinks.map((s, idx) => {
                                const Icon = s.icon;
                                return (
                                    <a
                                        key={idx}
                                        href={s.url(s.id!)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-full bg-background-elevated border border-border/40 text-foreground-muted hover:text-accent hover:border-accent/40 transition-colors shadow-sm"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    {/* Metadata attributes */}
                    <div className="space-y-4 text-xs">
                        <h2 className="text-sm font-extrabold uppercase tracking-widest text-foreground/80 mb-2">
                            {t('personalInfo')}
                        </h2>
                        
                        <div className="space-y-3">
                            <div>
                                <span className="text-[10px] font-bold text-foreground-muted uppercase block tracking-wider">
                                    {t('gender')}
                                </span>
                                <span className="text-sm font-semibold text-foreground">
                                    {getGenderLabel(person.gender)}
                                </span>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold text-foreground-muted uppercase block tracking-wider">
                                    {t('born')}
                                </span>
                                <span className="text-sm font-semibold text-foreground flex items-center gap-1 mt-0.5">
                                    <Calendar className="h-3 w-3 text-accent" />
                                    {person.birthday ? formatDate(person.birthday, locale) : '—'}
                                </span>
                            </div>

                            {person.deathday && (
                                <div>
                                    <span className="text-[10px] font-bold text-foreground-muted uppercase block tracking-wider">
                                        {t('died')}
                                    </span>
                                    <span className="text-sm font-semibold text-foreground flex items-center gap-1 mt-0.5">
                                        <Calendar className="h-3 w-3 text-red-400" />
                                        {formatDate(person.deathday, locale)}
                                    </span>
                                </div>
                            )}

                            <div>
                                <span className="text-[10px] font-bold text-foreground-muted uppercase block tracking-wider">
                                    {t('placeOfBirth')}
                                </span>
                                <span className="text-sm font-semibold text-foreground flex items-start gap-1 mt-0.5">
                                    <MapPin className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                                    <span>{person.place_of_birth || '—'}</span>
                                </span>
                            </div>

                            {person.also_known_as && person.also_known_as.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-bold text-foreground-muted uppercase block tracking-wider">
                                        {t('alsoKnownAs')}
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {person.also_known_as.slice(0, 5).map((name, idx) => (
                                            <span 
                                                key={idx}
                                                className="px-2 py-0.5 rounded bg-background-elevated border border-border/20 text-[10px] text-foreground-subtle"
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Bio, Known For, and Career Timeline */}
                <div className="space-y-10 min-w-0">
                    
                    {/* Biography */}
                    <div className="space-y-3 bg-[#0c0c12]/40 border border-border/15 p-5 rounded-2xl">
                        <h2 className="text-lg font-bold border-b border-border/20 pb-2">{t('biography')}</h2>
                        <div className="text-foreground-muted text-sm md:text-base leading-relaxed space-y-2">
                            {person.biography ? (
                                <>
                                    <p className="whitespace-pre-wrap">{displayedBio}</p>
                                    {hasLongBio && (
                                        <button
                                            onClick={() => setIsBioExpanded(!isBioExpanded)}
                                            className="inline-flex items-center gap-1 text-xs font-black uppercase text-accent hover:text-accent-hover transition-colors mt-2 cursor-pointer"
                                        >
                                            {isBioExpanded ? (
                                                <>
                                                    <span>{t('readLess')}</span>
                                                    <ChevronUp className="h-3 w-3" />
                                                </>
                                            ) : (
                                                <>
                                                    <span>{t('readMore')}</span>
                                                    <ChevronDown className="h-3 w-3" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="italic">{t('noBio', { name: person.name })}</p>
                            )}
                        </div>
                    </div>

                    {/* Known For */}
                    {knownForCredits.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold border-b border-border/20 pb-2">{t('knownForTitle')}</h2>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                                {knownForCredits.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.media_type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`}
                                        className="w-36 shrink-0 snap-start group space-y-2 block"
                                    >
                                        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-border/30 group-hover:border-accent/40 transition-colors bg-background-elevated shadow-md">
                                            {item.poster_path ? (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                                                    alt={item.title || item.name || ''}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-foreground-subtle text-[10px] uppercase font-bold">
                                                    —
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-0.5 px-0.5">
                                            <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors truncate" title={item.title || item.name}>
                                                {item.title || item.name}
                                            </p>
                                            <p className="text-[10px] text-foreground-muted truncate" title={item.character}>
                                                {item.character || '—'}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Career Timeline */}
                    {timelineCredits.length > 0 && (
                        <div className="space-y-4 bg-[#0c0c12]/20 border border-border/10 p-5 rounded-2xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/20 pb-3 gap-3">
                                <h2 className="text-lg font-bold">{t('careerTimeline')}</h2>
                                
                                {/* Dynamic Multi-Role Tabs */}
                                <div className="flex items-center gap-1 bg-[#12121a] p-1 rounded-xl border border-border/20 overflow-x-auto max-w-full">
                                    <button
                                        onClick={() => setActiveRoleTab('all')}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer whitespace-nowrap ${
                                            activeRoleTab === 'all' 
                                                ? 'bg-accent text-background shadow-md' 
                                                : 'text-foreground-muted hover:text-foreground'
                                        }`}
                                    >
                                        {t('allCredits', { count: timelineCredits.length })}
                                    </button>
                                    {hasActing && (
                                        <button
                                            onClick={() => setActiveRoleTab('acting')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer whitespace-nowrap ${
                                                activeRoleTab === 'acting' 
                                                    ? 'bg-accent text-background shadow-md' 
                                                    : 'text-foreground-muted hover:text-foreground'
                                            }`}
                                        >
                                            {t('acting')}
                                        </button>
                                    )}
                                    {hasDirecting && (
                                        <button
                                            onClick={() => setActiveRoleTab('directing')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer whitespace-nowrap ${
                                                activeRoleTab === 'directing' 
                                                    ? 'bg-accent text-background shadow-md' 
                                                    : 'text-foreground-muted hover:text-foreground'
                                            }`}
                                        >
                                            {t('directing')}
                                        </button>
                                    )}
                                    {hasProducing && (
                                        <button
                                            onClick={() => setActiveRoleTab('producing')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer whitespace-nowrap ${
                                                activeRoleTab === 'producing' 
                                                    ? 'bg-accent text-background shadow-md' 
                                                    : 'text-foreground-muted hover:text-foreground'
                                            }`}
                                        >
                                            {t('producing')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                                {filteredCredits.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-foreground-muted italic">
                                        {t('noCreditsFound')}
                                    </div>
                                ) : (
                                    filteredCredits.map((credit, idx) => (
                                        <div key={idx} className="flex gap-4 items-start border-l-2 border-border/20 pl-4 py-1 relative hover:border-accent/40 transition-colors">
                                            <div className="absolute -left-[6px] top-2.5 h-[10px] w-[10px] rounded-full bg-accent/30 border border-background-elevated" />
                                            <div className="w-16 shrink-0 text-xs font-bold text-foreground-muted mt-0.5 font-sans">
                                                {credit.year || '—'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={credit.media_type === 'movie' ? `/movie/${credit.id}` : `/tv/${credit.id}`}
                                                    className="font-bold text-foreground hover:text-accent transition-colors text-sm hover:underline"
                                                >
                                                    {credit.title || credit.name}
                                                </Link>
                                                <p className="text-[11px] text-foreground-muted mt-0.5">
                                                    {credit.roleType === 'cast' 
                                                        ? (credit.character ? `as ${credit.character}` : t('acting'))
                                                        : (credit.job ? `${credit.job}` : 'Crew')
                                                    } • <span className="capitalize">{credit.media_type === 'movie' ? tViews('movies') : tViews('tv')}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
