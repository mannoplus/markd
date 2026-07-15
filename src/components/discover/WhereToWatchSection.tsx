'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { sortWithPinned } from './utils/sortWithPinned';

interface Region {
    iso_3166_1: string;
    english_name: string;
    native_name: string;
}

interface WhereToWatchSectionProps {
    regions: Region[];
    selectedRegion: string;
    onRegionChange: (region: string) => void;
    selectedReleaseTypes: string[];
    onReleaseTypesChange: (types: string[]) => void;
    mediaType: 'movie' | 'tv';
}

export function WhereToWatchSection({
    regions,
    selectedRegion,
    onRegionChange,
    selectedReleaseTypes,
    onReleaseTypesChange,
    mediaType,
}: WhereToWatchSectionProps) {
    const t = useTranslations('Discover');
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const sortedRegions = sortWithPinned(regions);
    const selectedRegionDetails = regions.find((r) => r.iso_3166_1 === selectedRegion);

    const filteredRegions = sortedRegions.filter(
        (r) =>
            r.english_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.native_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.iso_3166_1.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Release types checkboxes config
    const RELEASE_TYPES = [
        { label: t('releaseTypeTheatricalLimited'), value: '2' },
        { label: t('releaseTypeTheatrical'), value: '3' },
        { label: t('releaseTypePremiere'), value: '1' },
        { label: t('releaseTypeDigital'), value: '4' },
        { label: t('releaseTypePhysical'), value: '5' },
        { label: t('releaseTypeTV'), value: '6' },
    ];

    const handleReleaseTypeToggle = (val: string) => {
        if (selectedReleaseTypes.includes(val)) {
            onReleaseTypesChange(selectedReleaseTypes.filter((t) => t !== val));
        } else {
            onReleaseTypesChange([...selectedReleaseTypes, val]);
        }
    };

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6">
            {/* Country Selector */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted block">
                    {t('whereToWatchCountry')}
                </label>
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        className="flex items-center justify-between w-full rounded-xl border border-border bg-background-card px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-background-elevated hover:border-border-hover focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                        <span className="flex items-center gap-2 truncate">
                            <Globe className="h-4 w-4 text-foreground-muted flex-shrink-0" />
                            {selectedRegionDetails ? (
                                <span className="truncate">
                                    {selectedRegionDetails.english_name} ({selectedRegionDetails.iso_3166_1})
                                </span>
                            ) : (
                                <span className="text-foreground-muted">{t('selectCountry')}</span>
                            )}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-foreground-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <div className="absolute left-0 mt-2 w-full max-h-72 rounded-xl border border-border bg-background-elevated p-2 shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                            {/* Search bar inside country picker */}
                            <div className="relative flex items-center mb-2 px-2 pt-1 flex-shrink-0">
                                <Search className="absolute left-5 h-4 w-4 text-foreground-subtle" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('searchCountries')}
                                    className="w-full rounded-lg border border-border bg-background px-9 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-foreground focus:outline-none"
                                />
                            </div>

                            <ul role="listbox" className="overflow-y-auto flex-1 divide-y divide-border/20">
                                <li role="option" aria-selected={!selectedRegion}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onRegionChange('');
                                            setSearchQuery('');
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left rounded-lg px-3 py-2 text-sm text-foreground-muted hover:bg-background hover:text-foreground flex items-center justify-between"
                                    >
                                        <span>{t('allCountries')}</span>
                                        {!selectedRegion && <Check className="h-4 w-4 text-accent" />}
                                    </button>
                                </li>
                                {filteredRegions.map((region) => {
                                    const isSelected = region.iso_3166_1 === selectedRegion;
                                    return (
                                        <li key={region.iso_3166_1} role="option" aria-selected={isSelected}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onRegionChange(region.iso_3166_1);
                                                    setSearchQuery('');
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-background hover:text-foreground flex items-center justify-between ${
                                                    isSelected ? 'text-accent font-semibold' : 'text-foreground-muted'
                                                }`}
                                            >
                                                <span className="truncate">
                                                    {region.english_name} ({region.iso_3166_1})
                                                </span>
                                                {isSelected && <Check className="h-4 w-4 text-accent" />}
                                            </button>
                                        </li>
                                    );
                                })}
                                {filteredRegions.length === 0 && (
                                    <div className="p-3 text-center text-xs text-foreground-subtle">
                                        {t('noCountriesFound')}
                                    </div>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Release Types Checkboxes - Only for Movie media type */}
            {mediaType === 'movie' && (
                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted block">
                        {t('releaseTypes')}
                    </label>
                    <div className="space-y-2.5">
                        {RELEASE_TYPES.map((type) => {
                            const isChecked = selectedReleaseTypes.includes(type.value);
                            return (
                                <label
                                    key={type.value}
                                    className="flex items-center gap-3 cursor-pointer group text-sm text-foreground-muted hover:text-foreground transition-colors select-none"
                                >
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleReleaseTypeToggle(type.value)}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`h-5 w-5 rounded-[6px] border transition-all duration-[var(--transition-fast)] flex items-center justify-center ${
                                                isChecked
                                                    ? 'bg-accent border-accent text-background'
                                                    : 'border-border bg-background-card group-hover:border-border-hover'
                                            }`}
                                        >
                                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                        </div>
                                    </div>
                                    <span className={isChecked ? 'text-foreground font-semibold' : ''}>
                                        {type.label}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
