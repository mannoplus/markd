'use client';

import React, { createContext, useContext, useState } from 'react';

export const CINEMA_COUNTRIES = [
    { name: 'Taiwan', code: 'TW' },
    { name: 'United States', code: 'US' },
    { name: 'China', code: 'CN' },
    { name: 'Japan', code: 'JP' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'South Korea', code: 'KR' },
    { name: 'Australia', code: 'AU' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Mexico', code: 'MX' },
    { name: 'Spain', code: 'ES' },
    { name: 'Italy', code: 'IT' },
    { name: 'Russia', code: 'RU' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'India', code: 'IN' },
    { name: 'Canada', code: 'CA' },
    { name: 'New Zealand', code: 'NZ' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Hong Kong', code: 'HK' },
    { name: 'Malaysia', code: 'MY' },
];

type RegionContextType = {
    region: string;
    setRegion: (region: string) => void;
};

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: React.ReactNode }) {
    const [region, setRegionState] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('global_region');
            if (stored) return stored;
            
            const params = new URLSearchParams(window.location.search);
            const urlRegion = params.get('region');
            if (urlRegion && CINEMA_COUNTRIES.some(c => c.code === urlRegion)) {
                localStorage.setItem('global_region', urlRegion);
                return urlRegion;
            }
        }
        return 'TW';
    });

    const setRegion = (newRegion: string) => {
        setRegionState(newRegion);
        localStorage.setItem('global_region', newRegion);
        
        // Dispatch custom event to notify external listeners
        window.dispatchEvent(new CustomEvent('regionchange', { detail: newRegion }));
    };

    return (
        <RegionContext.Provider value={{ region, setRegion }}>
            {children}
        </RegionContext.Provider>
    );
}

export function useRegion() {
    const context = useContext(RegionContext);
    if (!context) {
        throw new Error('useRegion must be used within a RegionProvider');
    }
    return context;
}
