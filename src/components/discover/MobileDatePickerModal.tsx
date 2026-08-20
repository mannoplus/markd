'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/formatters';

interface MobileDatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate: string; // YYYY-MM-DD
    onSelect: (date: string) => void;
    title: string;
}

export function MobileDatePickerModal({
    isOpen,
    onClose,
    initialDate,
    onSelect,
    title
}: MobileDatePickerModalProps) {
    const t = useTranslations('DatePicker');
    const tCommon = useTranslations('Common');
    const tAccessibility = useTranslations('Accessibility');
    const locale = useLocale();

    // Current date being viewed
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
    const [tempSelectedDate, setTempSelectedDate] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            let y = new Date().getFullYear();
            let m = new Date().getMonth();
            if (initialDate) {
                const parts = initialDate.split('-');
                if (parts.length === 3) {
                    const parsedY = parseInt(parts[0], 10);
                    const parsedM = parseInt(parts[1], 10) - 1; // 0-indexed
                    if (!isNaN(parsedY) && !isNaN(parsedM)) {
                        y = parsedY;
                        m = parsedM;
                    }
                }
            }
            setTimeout(() => {
                setTempSelectedDate(initialDate);
                setCurrentYear(y);
                setCurrentMonth(m);
            }, 0);
        }
    }, [isOpen, initialDate]);

    if (!isOpen) return null;

    // Month calculations
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const handleDaySelect = (day: number) => {
        const mm = String(currentMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const formatted = `${currentYear}-${mm}-${dd}`;
        setTempSelectedDate(formatted);
    };

    const handleApply = () => {
        onSelect(tempSelectedDate);
        onClose();
    };

    const handleClear = () => {
        setTempSelectedDate('');
    };

    // Helper to format text shown on header
    const getFormattedHeaderDate = () => {
        if (!tempSelectedDate) return t('noDateSelected');
        try {
            return formatDate(tempSelectedDate, locale, { dateStyle: 'medium' });
        } catch {
            return tempSelectedDate;
        }
    };

    const monthDisplay = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
    }).format(new Date(currentYear, currentMonth, 1));

    const weekdays = [
        t('weekdaySun'),
        t('weekdayMon'),
        t('weekdayTue'),
        t('weekdayWed'),
        t('weekdayThu'),
        t('weekdayFri'),
        t('weekdaySat'),
    ];

    return (
        <div 
            className="md:hidden fixed inset-0 z-[2000] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* Backdrop blur */}
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Dialog Card */}
            <div className="relative w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0c0c12] border border-border p-5 shadow-2xl flex flex-col space-y-4 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/20 pb-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-accent" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{title}</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        aria-label={tAccessibility('closeModal')}
                        className="text-foreground-muted hover:text-foreground p-1 rounded-lg hover:bg-background-elevated transition-all cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Sub-Header Showing Currently Selected Value */}
                <div className="bg-[#12121a] border border-border/15 p-3 rounded-xl flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-foreground-muted font-bold block uppercase tracking-wider">{t('selectedDate')}</span>
                        <span className="text-xs font-extrabold text-foreground">{getFormattedHeaderDate()}</span>
                    </div>
                    {tempSelectedDate && (
                        <button 
                            onClick={handleClear}
                            className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider px-2 py-1 rounded bg-red-500/10 border border-red-500/20 cursor-pointer"
                        >
                            {t('clear')}
                        </button>
                    )}
                </div>

                {/* Month/Year Navigation Header */}
                <div className="flex items-center justify-between">
                    <button 
                        onClick={handlePrevMonth}
                        aria-label="Previous month"
                        className="p-1.5 rounded-lg border border-border/25 bg-background-elevated hover:bg-background-elevated-hover text-foreground cursor-pointer"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                        {monthDisplay}
                    </span>
                    <button 
                        onClick={handleNextMonth}
                        aria-label="Next month"
                        className="p-1.5 rounded-lg border border-border/25 bg-background-elevated hover:bg-background-elevated-hover text-foreground cursor-pointer"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Day Columns Header */}
                <div className="grid grid-cols-7 text-center gap-1.5 text-[9px] font-black uppercase text-foreground-muted tracking-wider">
                    {weekdays.map((w, i) => (
                        <span key={i}>{w}</span>
                    ))}
                </div>

                {/* Grid Calendar body */}
                <div className="grid grid-cols-7 gap-1.5 text-center">
                    {/* Padding blocks for previous month overflow */}
                    {Array.from({ length: firstDayIndex }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="h-7" />
                    ))}

                    {/* Active days */}
                    {Array.from({ length: totalDays }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const mm = String(currentMonth + 1).padStart(2, '0');
                        const dd = String(dayNum).padStart(2, '0');
                        const formatted = `${currentYear}-${mm}-${dd}`;
                        const isSelected = tempSelectedDate === formatted;

                        return (
                            <button
                                key={`day-${dayNum}`}
                                type="button"
                                onClick={() => handleDaySelect(dayNum)}
                                className={`h-7 w-7 rounded-lg text-[10px] font-bold transition-all mx-auto flex items-center justify-center cursor-pointer ${
                                    isSelected
                                        ? 'bg-accent text-background scale-105 font-black shadow-lg shadow-accent/20'
                                        : 'text-foreground hover:bg-background-elevated'
                                }`}
                            >
                                {dayNum}
                            </button>
                        );
                    })}
                </div>

                {/* Bottom Action buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold uppercase tracking-wider text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-all cursor-pointer text-center"
                    >
                        {tCommon('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="px-4 py-2.5 rounded-xl bg-accent text-background text-xs font-black uppercase tracking-wider hover:bg-accent-hover transition-all cursor-pointer text-center"
                    >
                        {t('apply')}
                    </button>
                </div>
            </div>
        </div>
    );
}
