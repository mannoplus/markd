'use client';

import { useState } from 'react';
import { ChevronDown, RefreshCw, Info, Calendar, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DiscoverFilterState } from './utils/buildDiscoverQuery';
import { searchKeywordsAction } from '@/app/actions/discover';
import { MobileDatePickerModal } from './MobileDatePickerModal';

interface Genre {
    id: number;
    name: string;
}

interface FiltersSectionProps {
    genresList: Genre[];
    state: DiscoverFilterState;
    onChange: (updatedState: Partial<DiscoverFilterState>) => void;
    isUserLoggedIn: boolean;
    mediaType: 'movie' | 'tv';
}

export function FiltersSection({
    genresList,
    state,
    onChange,
    isUserLoggedIn,
    mediaType,
}: FiltersSectionProps) {
    const t = useTranslations('Discover');

    // Accordion state
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        show_me: false,
        availability: false,
        dates: true, // open by default
        genres: true, // open by default
        score: false,
        runtime: false,
        votes: false,
        keywords: false,
    });

    const toggleSection = (section: string) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // Mobile date picker states
    const [isFromPickerOpen, setIsFromPickerOpen] = useState(false);
    const [isToPickerOpen, setIsToPickerOpen] = useState(false);

    // Keyword Filter Local State and Submit
    const [keywordInput, setKeywordInput] = useState(state.keywords);
    const [prevKeywords, setPrevKeywords] = useState(state.keywords);

    if (state.keywords !== prevKeywords) {
        setPrevKeywords(state.keywords);
        setKeywordInput(state.keywords);
    }

    const handleKeywordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keywordInput.trim()) {
            onChange({ keywords: '', keyword_id: '' });
            return;
        }

        try {
            const results = await searchKeywordsAction(keywordInput.trim());
            if (results && results.length > 0) {
                onChange({
                    keywords: keywordInput.trim(),
                    keyword_id: String(results[0].id)
                });
            } else {
                onChange({
                    keywords: keywordInput.trim(),
                    keyword_id: '99999999' // fallback ID resulting in empty results
                });
            }
        } catch (err) {
            console.error('Failed to search keywords:', err);
        }
    };

    // Date range validation
    const [dateError, setDateError] = useState<string | null>(null);

    const handleDateChange = (type: 'from_date' | 'to_date', value: string) => {
        const nextFrom = type === 'from_date' ? value : state.from_date;
        const nextTo = type === 'to_date' ? value : state.to_date;

        if (nextFrom && nextTo && nextFrom > nextTo) {
            setDateError(t('dateValidationError'));
            // Still update state but mark error
            onChange({ [type]: value });
        } else {
            setDateError(null);
            onChange({ [type]: value });
        }
    };

    const handleGenreToggle = (genreId: string) => {
        if (state.genres.includes(genreId)) {
            onChange({ genres: state.genres.filter((g) => g !== genreId) });
        } else {
            onChange({ genres: [...state.genres, genreId] });
        }
    };

    const handleReset = () => {
        setDateError(null);
        onChange({
            region: state.region, // Keep region when resetting other filters per TMDB standard
            release_types: [],
            genres: [],
            from_date: '',
            to_date: '',
            min_score: 0,
            max_score: 10,
            min_runtime: 0,
            max_runtime: 400,
            min_votes: 0,
            availability: 'any',
            show_me: 'everything',
            keywords: '',
            keyword_id: '',
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    {t('filtersTitle')}
                </h3>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors"
                >
                    <RefreshCw className="h-3 w-3" />
                    {t('resetFilters')}
                </button>
            </div>

            {/* Show Me Section */}
            <div className="border border-border rounded-xl bg-background-card overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('show_me')}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold text-foreground text-left focus:outline-none"
                >
                    <span>{t('filterShowMe')}</span>
                    <ChevronDown className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${openSections.show_me ? 'rotate-180' : ''}`} />
                </button>
                {openSections.show_me && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/40">
                        <label className="flex items-center gap-3 cursor-pointer select-none text-sm text-foreground-muted hover:text-foreground transition-colors">
                            <input
                                type="radio"
                                name="show_me"
                                value="everything"
                                checked={state.show_me === 'everything'}
                                onChange={() => onChange({ show_me: 'everything' })}
                                className="h-4 w-4 border-border text-accent focus:ring-accent"
                            />
                            <span className={state.show_me === 'everything' ? 'text-foreground font-semibold' : ''}>
                                {t('showEverything')}
                            </span>
                        </label>

                        {isUserLoggedIn ? (
                            <label className="flex items-center gap-3 cursor-pointer select-none text-sm text-foreground-muted hover:text-foreground transition-colors">
                                <input
                                    type="radio"
                                    name="show_me"
                                    value="unseen"
                                    checked={state.show_me === 'unseen'}
                                    onChange={() => onChange({ show_me: 'unseen' })}
                                    className="h-4 w-4 border-border text-accent focus:ring-accent"
                                />
                                <span className={state.show_me === 'unseen' ? 'text-foreground font-semibold' : ''}>
                                    {t('showUnseenOnly')}
                                </span>
                            </label>
                        ) : (
                            <div className="flex gap-2 rounded-lg bg-background/50 border border-border/40 p-2.5 text-xs text-foreground-subtle">
                                <Info className="h-4 w-4 text-foreground-subtle flex-shrink-0" />
                                <span>{t('unseenAuthNotice')}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Availability Section */}
            <div className="border border-border rounded-xl bg-background-card overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('availability')}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold text-foreground text-left focus:outline-none"
                >
                    <span>{t('filterAvailability')}</span>
                    <ChevronDown className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${openSections.availability ? 'rotate-180' : ''}`} />
                </button>
                {openSections.availability && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/40">
                        {['any', 'streaming', 'theaters', 'tv'].map((type) => {
                            // Only show In Theaters for Movies and On TV for TV shows
                            if (type === 'theaters' && mediaType !== 'movie') return null;
                            if (type === 'tv' && mediaType !== 'tv') return null;

                            return (
                                <label
                                    key={type}
                                    className="flex items-center gap-3 cursor-pointer select-none text-sm text-foreground-muted hover:text-foreground transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="availability"
                                        value={type}
                                        checked={state.availability === type}
                                        onChange={() => onChange({ availability: type })}
                                        className="h-4 w-4 border-border text-accent focus:ring-accent"
                                    />
                                    <span className={state.availability === type ? 'text-foreground font-semibold' : ''}>
                                        {t(`avail_${type}`)}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Release Date Range */}
            <div className={`border border-border rounded-xl bg-background-card ${openSections.dates ? 'overflow-visible' : 'overflow-hidden'}`}>
                <button
                    type="button"
                    onClick={() => toggleSection('dates')}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold text-foreground text-left focus:outline-none"
                >
                    <span>{t('filterReleaseDates')}</span>
                    <ChevronDown className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${openSections.dates ? 'rotate-180' : ''}`} />
                </button>
                {openSections.dates && (
                    <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border/40 overflow-visible">
                        <div className="space-y-1.5">
                            <label className="text-xs text-foreground-muted font-semibold block">{t('dateFrom')}</label>
                            <div className="relative flex items-center overflow-visible">
                                {/* Desktop Input */}
                                <div className="hidden md:flex relative items-center overflow-visible w-full">
                                    <input
                                        type="date"
                                        value={state.from_date}
                                        onChange={(e) => handleDateChange('from_date', e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background pl-3 pr-10 py-2.5 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer relative z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                    <Calendar className="absolute right-3 h-4 w-4 text-foreground-muted pointer-events-none z-20" />
                                </div>
                                {/* Mobile Trigger */}
                                <button
                                    type="button"
                                    onClick={() => setIsFromPickerOpen(true)}
                                    className="flex md:hidden w-full text-left rounded-lg border border-border bg-background pl-3 pr-10 py-2.5 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer relative items-center justify-between"
                                >
                                    <span className={state.from_date ? 'text-foreground font-semibold' : 'text-foreground-muted'}>
                                        {state.from_date || 'YYYY-MM-DD'}
                                    </span>
                                    <Calendar className="absolute right-3 h-4 w-4 text-foreground-muted pointer-events-none" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-foreground-muted font-semibold block">{t('dateTo')}</label>
                            <div className="relative flex items-center overflow-visible">
                                {/* Desktop Input */}
                                <div className="hidden md:flex relative items-center overflow-visible w-full">
                                    <input
                                        type="date"
                                        value={state.to_date}
                                        onChange={(e) => handleDateChange('to_date', e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background pl-3 pr-10 py-2.5 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer relative z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                    <Calendar className="absolute right-3 h-4 w-4 text-foreground-muted pointer-events-none z-20" />
                                </div>
                                {/* Mobile Trigger */}
                                <button
                                    type="button"
                                    onClick={() => setIsToPickerOpen(true)}
                                    className="flex md:hidden w-full text-left rounded-lg border border-border bg-background pl-3 pr-10 py-2.5 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer relative items-center justify-between"
                                >
                                    <span className={state.to_date ? 'text-foreground font-semibold' : 'text-foreground-muted'}>
                                        {state.to_date || 'YYYY-MM-DD'}
                                    </span>
                                    <Calendar className="absolute right-3 h-4 w-4 text-foreground-muted pointer-events-none" />
                                </button>
                            </div>
                        </div>
                        {dateError && (
                            <p className="text-xs font-semibold text-error">{dateError}</p>
                        )}
                    </div>
                )}

                {/* Mobile Modals Render */}
                <MobileDatePickerModal
                    isOpen={isFromPickerOpen}
                    onClose={() => setIsFromPickerOpen(false)}
                    initialDate={state.from_date}
                    onSelect={(date) => handleDateChange('from_date', date)}
                    title={t('dateFrom')}
                />
                <MobileDatePickerModal
                    isOpen={isToPickerOpen}
                    onClose={() => setIsToPickerOpen(false)}
                    initialDate={state.to_date}
                    onSelect={(date) => handleDateChange('to_date', date)}
                    title={t('dateTo')}
                />
            </div>

            {/* Genres */}
            <div className="border border-border rounded-xl bg-background-card overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('genres')}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold text-foreground text-left focus:outline-none"
                >
                    <span>{t('filterGenres')}</span>
                    <ChevronDown className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${openSections.genres ? 'rotate-180' : ''}`} />
                </button>
                {openSections.genres && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/40">
                        <div className="flex flex-wrap gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
                            {genresList.map((genre) => {
                                const isSelected = state.genres.includes(String(genre.id));
                                return (
                                    <button
                                        key={genre.id}
                                        type="button"
                                        onClick={() => handleGenreToggle(String(genre.id))}
                                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all duration-[var(--transition-fast)] cursor-pointer select-none ${
                                            isSelected
                                                ? 'bg-accent border-accent text-background font-bold shadow-sm'
                                                : 'bg-background/40 border-border text-foreground-muted hover:border-border-hover hover:text-foreground'
                                        }`}
                                    >
                                        {genre.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* User Score Range Slider */}
            <div className="border border-border rounded-xl bg-background-card overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('score')}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold text-foreground text-left focus:outline-none"
                >
                    <span>{t('filterUserScore')}</span>
                    <ChevronDown className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${openSections.score ? 'rotate-180' : ''}`} />
                </button>
                {openSections.score && (
                    <div className="px-4 pb-5 pt-2 border-t border-border/40">
                        <DualRangeSlider
                            min={0}
                            max={10}
                            step={0.5}
                            value={[state.min_score, state.max_score]}
                            onChange={([min, max]) => onChange({ min_score: min, max_score: max })}
                        />
                    </div>
                )}
            </div>

            {/* Runtime Slider */}
            <div className="border border-border rounded-xl bg-background-card overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('runtime')}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold text-foreground text-left focus:outline-none"
                >
                    <span>{mediaType === 'movie' ? t('filterRuntime') : t('filterEpisodeRuntime')}</span>
                    <ChevronDown className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${openSections.runtime ? 'rotate-180' : ''}`} />
                </button>
                {openSections.runtime && (
                    <div className="px-4 pb-5 pt-2 border-t border-border/40">
                        <DualRangeSlider
                            min={0}
                            max={400}
                            step={15}
                            value={[state.min_runtime, state.max_runtime]}
                            onChange={([min, max]) => onChange({ min_runtime: min, max_runtime: max })}
                            labelSuffix="m"
                        />
                    </div>
                )}
            </div>

            {/* Minimum User Votes Slider */}
            <div className="border border-border rounded-xl bg-background-card overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('votes')}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold text-foreground text-left focus:outline-none"
                >
                    <span>{t('filterMinVotes')}</span>
                    <ChevronDown className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${openSections.votes ? 'rotate-180' : ''}`} />
                </button>
                {openSections.votes && (
                    <div className="px-4 pb-5 pt-2 border-t border-border/40 space-y-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-foreground-muted">
                            <span>{state.min_votes}</span>
                            <span>500+</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={500}
                            step={10}
                            value={state.min_votes}
                            onChange={(e) => onChange({ min_votes: Number(e.target.value) })}
                            aria-valuenow={state.min_votes}
                            className="w-full cursor-pointer h-2 bg-background-elevated rounded-full border border-border appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-md"
                        />
                    </div>
                )}
            </div>

            {/* Keywords Filter */}
            <div className="border border-border rounded-xl bg-background-card overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('keywords')}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold text-foreground text-left focus:outline-none"
                >
                    <span>{t('filterKeywords') || 'Keywords'}</span>
                    <ChevronDown className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${openSections.keywords ? 'rotate-180' : ''}`} />
                </button>
                {openSections.keywords && (
                    <form onSubmit={handleKeywordSubmit} className="px-4 pb-4 pt-2 border-t border-border/40 space-y-3">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                placeholder={t('keywordsPlaceholder') || 'Filter by keywords...'}
                                className="w-full rounded-lg border border-border bg-background pl-3 pr-10 py-2.5 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                            />
                            <Search className="absolute right-3 h-4 w-4 text-foreground-muted pointer-events-none" />
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-accent text-background hover:bg-accent-hover font-bold py-2 text-xs transition-colors cursor-pointer select-none"
                        >
                            {t('keywordsSearchButton') || 'Search'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

// Reusable Dual Range Slider component
interface DualRangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    labelSuffix?: string;
}

export function DualRangeSlider({
    min,
    max,
    step = 1,
    value,
    onChange,
    labelSuffix = '',
}: DualRangeSliderProps) {
    const [minVal, maxVal] = value;

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.min(Number(e.target.value), maxVal - step);
        onChange([val, maxVal]);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(Number(e.target.value), minVal + step);
        onChange([minVal, val]);
    };

    const minPercent = ((minVal - min) / (max - min)) * 100;
    const maxPercent = ((maxVal - min) / (max - min)) * 100;

    return (
        <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground-muted">
                <span>{minVal}{labelSuffix}</span>
                <span>{maxVal}{labelSuffix}</span>
            </div>
            <div className="relative h-2 w-full select-none">
                <div className="absolute inset-0 rounded-full bg-background-elevated border border-border" />
                <div
                    className="absolute h-full rounded-full bg-accent"
                    style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                />

                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={minVal}
                    onChange={handleMinChange}
                    aria-label="Minimum limit"
                    aria-valuenow={minVal}
                    className="absolute inset-0 w-full pointer-events-none appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-lg"
                />

                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={maxVal}
                    onChange={handleMaxChange}
                    aria-label="Maximum limit"
                    aria-valuenow={maxVal}
                    className="absolute inset-0 w-full pointer-events-none appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:shadow-lg"
                />
            </div>
        </div>
    );
}
