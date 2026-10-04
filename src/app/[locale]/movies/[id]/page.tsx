import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMovieDetail, getMovieShowtimes } from '@/lib/api';
import { MovieHero } from '@/components/movie-detail/MovieHero';
import { MovieSynopsis } from '@/components/movie-detail/MovieSynopsis';
import { ShowtimeSection } from '@/components/movie-detail/ShowtimeSection';

interface MoviePageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
  searchParams: Promise<{
    date?: string;
    region?: string;
    chains?: string;
    formats?: string;
  }>;
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieDetail(id);

  if (!movie) {
    return {
      title: '電影不存在 | MARKD',
    };
  }

  const title = `${movie.titleZh} (${movie.titleEn}) - 全台放映時刻表與即時空位 | MARKD`;
  const description = `查詢《${movie.titleZh}》全台威秀、秀泰、國賓、新光等影城放映場次、IMAX/4DX/ScreenX 規格與即時剩餘空位分佈。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: movie.backdropUrl || movie.posterUrl,
          width: 1200,
          height: 630,
          alt: movie.titleZh,
        },
      ],
    },
  };
}

export default async function MovieDetailPage({ params, searchParams }: MoviePageProps) {
  const { id } = await params;
  const { date } = await searchParams;

  const movie = await getMovieDetail(id);
  if (!movie) {
    notFound();
  }

  // Today's date string in Asia/Taipei timezone
  const todayStr = date || new Date().toISOString().split('T')[0];
  const initialTheaters = await getMovieShowtimes(id, todayStr);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Immersive Hero Section */}
      <MovieHero movie={movie} />

      {/* 2. Story Synopsis & Cast/Crew */}
      <MovieSynopsis movie={movie} />

      {/* 3. Interactive Showtime Discovery Engine */}
      <ShowtimeSection
        movie={movie}
        initialTheaters={initialTheaters}
        initialDate={todayStr}
      />
    </div>
  );
}
