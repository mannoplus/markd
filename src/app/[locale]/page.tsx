import { getTrending, getNowPlaying, getUpcomingMovies, getUpcomingTVShows } from '@/lib/tmdb';
import { MovieCard } from '@/components/movie-card';
import { HeroCarousel } from '@/components/hero-carousel';
import { getTranslations } from 'next-intl/server';
import { RegionToggle } from '@/components/region-toggle';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations('Home');
  const resolvedParams = await searchParams;
  const region = typeof resolvedParams.region === 'string' ? resolvedParams.region : 'US';

  // Fetch data in parallel
  const [nowPlaying, trendingMovies, trendingShows, upcomingMovies, upcomingShows] = await Promise.all([
    getNowPlaying(region),
    getTrending('movie', 'day'),
    getTrending('tv', 'day'),
    getUpcomingMovies(region),
    getUpcomingTVShows(region)
  ]);

  // Pass top 5 movies to carousel
  const carouselMovies = nowPlaying.slice(0, 5);

  return (
    <div className="pb-16 -mt-16 sm:-mt-20"> {/* Negative margin to push hero behind transparent navbar */}
      {/* Hero Section Carousel */}
      <HeroCarousel movies={carouselMovies} />

      {/* Content Sections */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 mt-12 relative z-20">

        {/* Toggle Controls Section */}
        <div className="flex justify-end">
          <RegionToggle currentRegion={region} />
        </div>

        {/* Now Playing Row */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">{t('nowPlaying')}</h2>
          </div>
          {/* Horizontal scroll container */}
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {nowPlaying.slice(1).map((movie) => (
              <div key={movie.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start fade-in">
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
          <h2 className="text-2xl font-bold tracking-tight">{t('trendingMovies')}</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {trendingMovies.map((movie) => (
              <div key={movie.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start fade-in">
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
          <h2 className="text-2xl font-bold tracking-tight">{t('trendingTvShows')}</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {trendingShows.map((tv) => (
              <div key={tv.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start fade-in">
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

        {/* Upcoming Movies */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">{t('upcomingMovies')}</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {upcomingMovies.map((movie) => (
              <div key={movie.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start fade-in">
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

        {/* Upcoming TV Shows */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">{t('upcomingTvShows')}</h2>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {upcomingShows.map((tv) => (
              <div key={tv.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start fade-in">
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
