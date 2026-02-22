import { getTrending, getNowPlaying } from '@/lib/tmdb';
import { MovieCard } from '@/components/movie-card';
import { HeroCarousel } from '@/components/hero-carousel';

export default async function Home() {
  // Fetch now playing in TW, trending movies, and trending TV shows in parallel
  const [nowPlaying, trendingMovies, trendingShows] = await Promise.all([
    getNowPlaying('TW'),
    getTrending('movie', 'day'),
    getTrending('tv', 'day'),
  ]);

  // Pass top 5 movies to carousel
  const carouselMovies = nowPlaying.slice(0, 5);

  return (
    <div className="pb-16 -mt-16 sm:-mt-20"> {/* Negative margin to push hero behind transparent navbar */}
      {/* Hero Section Carousel */}
      <HeroCarousel movies={carouselMovies} />

      {/* Content Sections */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 mt-12 relative z-20">
        {/* Now Playing Row */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Now Playing in Cinemas</h2>
            <span className="text-sm font-medium text-foreground-muted px-2 py-1 rounded bg-background-elevated border border-border">TW</span>
          </div>
          {/* Horizontal scroll container */}
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {nowPlaying.slice(1).map((movie) => (
              <div key={movie.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start">
                <MovieCard
                  id={movie.id}
                  title={movie.title || movie.name || ''}
                  posterPath={movie.poster_path}
                  voteAverage={movie.vote_average}
                  releaseDate={movie.release_date || movie.first_air_date}
                  mediaType="movie"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Trending Movies */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Trending Movies</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {trendingMovies.map((movie) => (
              <div key={movie.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start">
                <MovieCard
                  id={movie.id}
                  title={movie.title || movie.name || ''}
                  posterPath={movie.poster_path}
                  voteAverage={movie.vote_average}
                  releaseDate={movie.release_date || movie.first_air_date}
                  mediaType="movie"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Trending TV Shows */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Trending TV Shows</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {trendingShows.map((tv) => (
              <div key={tv.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start">
                <MovieCard
                  id={tv.id}
                  title={tv.title || tv.name || ''}
                  posterPath={tv.poster_path}
                  voteAverage={tv.vote_average}
                  releaseDate={tv.release_date || tv.first_air_date}
                  mediaType="tv"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
