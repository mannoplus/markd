/* eslint-disable @next/next/no-img-element */
interface MovieData {
    id: string;
    title: string;
    link: string;
    poster: string;
    rank?: number;
}

export default function BoxOfficeCard({ movie }: { movie: MovieData }) {
    return (
        <div className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 transition-all hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col h-full">
            <div className="relative aspect-[2/3] w-full overflow-hidden">
                {movie.rank && (
                    <div className="absolute top-3 left-3 z-20 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white font-bold text-lg rounded-full shadow-lg border-2 border-white/10 backdrop-blur-md">
                        {movie.rank}
                    </div>
                )}
                {/* Fallback image style with pseudo-element gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10 opacity-60"></div>
                
                {/* We use standard img with styling to look premium. Normally we would use Next/Image */}
                <img 
                    src={movie.poster} 
                    alt={movie.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
            </div>
            
            <div className="p-4 flex flex-col flex-grow justify-between relative z-20 bg-gray-900">
                <h3 className="font-semibold text-gray-100 line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors">
                    {movie.title}
                </h3>
                {movie.link && (
                    <a 
                        href={movie.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 text-xs font-medium uppercase tracking-wider text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 w-fit transition-colors"
                    >
                        View Details
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </a>
                )}
            </div>
        </div>
    );
}
