'use client';

import React from 'react';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: () => void;
    label: string;
}

/**
 * Shared accessible switch. Inactive track uses an explicit mid-tone grey
 * (`bg-zinc-700` + `border-zinc-600`) so it never blends into the dark card
 * background; active track uses the bright monochrome accent (`bg-foreground`).
 */
export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
            className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                checked
                    ? 'border-transparent bg-foreground'
                    : 'border-zinc-600 bg-zinc-700'
            }`}
        >
            <span
                className={`absolute top-0.5 left-0 h-5 w-5 rounded-full transition-all duration-200 ease-in-out ${
                    checked
                        ? 'translate-x-[22px] bg-white shadow-sm'
                        : 'translate-x-0.5 bg-zinc-400'
                }`}
            />
        </button>
    );
}
