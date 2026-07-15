'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface Category {
    labelKey: string;
    value: string;
}

interface CategoryDropdownProps {
    categories: Category[];
    activeValue: string;
    onChange: (value: string) => void;
}

export function CategoryDropdown({
    categories,
    activeValue,
    onChange,
}: CategoryDropdownProps) {
    const t = useTranslations('Discover');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeCategory = categories.find((c) => c.value === activeValue) || categories[0];

    // Handle clicks outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle Escape key
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    className="flex items-center gap-2 rounded-xl border border-border bg-background-elevated px-5 py-3 text-lg font-bold text-foreground transition-all hover:bg-background-card hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-accent shadow-lg glass"
                >
                    <span>{t(activeCategory.labelKey)}</span>
                    <ChevronDown className={`h-5 w-5 text-foreground-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute left-0 mt-2 w-56 rounded-xl border border-border bg-background-elevated p-2 shadow-2xl glass z-50 origin-top-left transition-all duration-150 animate-in fade-in zoom-in-95"
                    role="listbox"
                    aria-label="Filter category"
                >
                    {categories.map((category) => {
                        const isSelected = category.value === activeValue;
                        return (
                            <button
                                key={category.value}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    onChange(category.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                                    isSelected
                                        ? 'bg-accent-muted text-accent'
                                        : 'text-foreground-muted hover:bg-background hover:text-foreground'
                                }`}
                            >
                                <span>{t(category.labelKey)}</span>
                                {isSelected && (
                                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
