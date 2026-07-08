/* eslint-disable @next/next/no-img-element */
interface MovieData {
    id: string;
    title: string;
    link: string;
    poster: string;
}

export default function ShowtimeCard({ movie }: { movie: MovieData }) {
    return (
        <div className="group relative rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 transition-colors flex flex-col h-full">
            <div className="relative aspect-[4/5] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10 opacity-80"></div>
                
                <img 
                    src={movie.poster} 
                    alt={movie.title}
                    className="object-cover w-full h-full opacity-80 transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                />
                
                <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                    <h3 className="font-bold text-white text-lg line-clamp-2 leading-tight drop-shadow-md">
                        {movie.title}
                    </h3>
                </div>
            </div>
            
            <div className="p-4 flex flex-col flex-grow bg-gray-900 border-t border-gray-800">
                {movie.link && (
                    <a 
                        href={movie.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg text-sm font-semibold text-center transition-all duration-300 ring-1 ring-inset ring-purple-500/20 hover:ring-purple-600"
                    >
                        View Showtimes
                    </a>
                )}
            </div>
        </div>
    );
}
