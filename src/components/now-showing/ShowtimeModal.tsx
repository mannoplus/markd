'use client';

import { useState, useEffect } from 'react';

interface ShowtimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    movieId: string | null;
    movieTitle: string;
    region: string;
}

interface TheaterData {
    theater: string;
    version: string;
    times: string[];
}

export default function ShowtimeModal({ isOpen, onClose, movieId, movieTitle, region }: ShowtimeModalProps) {
    const [data, setData] = useState<TheaterData[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !movieId) return;
        
        const fetchShowtimes = async () => {
            setLoading(true);
            setError(null);
            setData(null);
            try {
                // If region is US or others, atmovies might not have it, but we'll try anyway.
                // The region toggle in atmovies uses a01..a89. 
                // We'll map 'TW' to 'a02' (Taipei) by default if it's TW, otherwise just use 'a02' as fallback.
                const mappedRegion = region === 'TW' ? 'a02' : 'a02'; 
                
                const res = await fetch(`/api/showtimes?movieId=${movieId}&region=${mappedRegion}`);
                if (!res.ok) throw new Error('Failed to fetch showtimes');
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    throw new Error(json.error || 'Failed to parse showtimes');
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchShowtimes();
    }, [isOpen, movieId, region]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white">
                        Showtimes: <span className="text-indigo-400">{movieTitle}</span>
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-[#0a0a0a]">
                    {loading && (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="text-center py-12 text-red-400">
                            {error}
                        </div>
                    )}

                    {!loading && !error && data && data.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            No showtimes available for this region.
                        </div>
                    )}

                    {!loading && !error && data && data.length > 0 && (
                        <div className="space-y-6">
                            {data.map((theater, idx) => (
                                <div key={idx} className="bg-gray-800/30 border border-gray-800/50 rounded-xl p-5">
                                    <h3 className="font-bold text-lg text-gray-100 mb-1">{theater.theater}</h3>
                                    {theater.version && (
                                        <p className="text-sm text-gray-400 mb-4">{theater.version}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {theater.times.map((time, tIdx) => (
                                            <div 
                                                key={tIdx} 
                                                className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-md border border-indigo-500/20 text-sm font-medium"
                                            >
                                                {time}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
