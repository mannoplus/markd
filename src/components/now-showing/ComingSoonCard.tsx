import { Link } from '@/i18n/routing';

interface MovieData {
    id: string;
    title: string;
    link: string;
    poster: string;
}

export default function ComingSoonCard({ movie }: { movie: MovieData }) {
    return (
        <div className="group relative rounded-xl overflow-hidden bg-gray-900 border border-pink-500/10 hover:border-pink-500/40 transition-colors flex flex-col h-full shadow-lg">
            <div className="relative aspect-[4/5] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10 opacity-90"></div>
                
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={movie.poster} 
                    alt={movie.title}
                    className="object-cover w-full h-full opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                    loading="lazy"
                />
                
                <div className="absolute inset-x-0 bottom-0 p-4 z-20 flex flex-col items-center text-center">
                    <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest text-pink-300 bg-pink-500/20 rounded-full border border-pink-500/30 backdrop-blur-md">
                        Coming Soon
                    </span>
                    <h3 className="font-bold text-white text-md line-clamp-2 leading-snug drop-shadow-md">
                        {movie.title}
                    </h3>
                </div>
            </div>
            
            <div className="p-4 flex flex-col flex-grow justify-end bg-gray-900 border-t border-gray-800">
                {movie.link && (
                    <Link 
                        href={movie.link as any} 
                        className="w-full py-2 px-4 text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 rounded-lg text-sm font-medium text-center transition-colors block"
                    >
                        More Info
                    </Link>
                )}
            </div>
        </div>
    );
}
