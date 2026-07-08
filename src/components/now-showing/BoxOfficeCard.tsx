import { Link } from '@/i18n/routing';

interface MovieData {
    id: string;
    title: string;
    link: string;
    poster: string;
    rank?: number;
}

export default function BoxOfficeCard({ movie }: { movie: MovieData }) {
    const getBadgeStyle = (rank: number) => {
        switch (rank) {
            case 1: return 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 border-yellow-200';
            case 2: return 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-900 border-gray-100';
            case 3: return 'bg-gradient-to-br from-amber-600 to-amber-800 text-orange-50 border-amber-500';
            default: return 'bg-indigo-600 text-white border-white/10';
        }
    };

    return (
        <div className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col h-full">
            <div className="relative aspect-[2/3] w-full overflow-hidden">
                {movie.rank && (
                    <div className={`absolute top-3 left-3 z-20 w-12 h-12 flex items-center justify-center font-black text-xl rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-2 backdrop-blur-md ${getBadgeStyle(movie.rank)}`}>
                        {movie.rank}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10 opacity-60"></div>
                
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={movie.poster} 
                    alt={movie.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
            </div>
            
            <div className="p-4 flex flex-col flex-grow justify-between relative z-20 bg-gray-900">
                <h3 className="font-bold text-gray-100 line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors text-lg">
                    {movie.title}
                </h3>
                {movie.link && (
                    <Link 
                        href={movie.link as any} 
                        className="mt-4 text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 w-fit transition-colors"
                    >
                        View Details
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                )}
            </div>
        </div>
    );
}
