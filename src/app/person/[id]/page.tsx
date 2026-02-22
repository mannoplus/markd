import Image from 'next/image';
import { getPersonDetails, IMAGE_SIZES } from '@/lib/tmdb';
import { MovieCard } from '@/components/movie-card';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const person = await getPersonDetails(Number(id));
    return {
        title: `${person.name} - MARKD`,
        description: person.biography?.substring(0, 160) || `Details for ${person.name}`,
    };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const person = await getPersonDetails(Number(id));

    // Dedup and sort credits by release date (descending)
    const uniqueCredits = Array.from(
        new Map(person.combined_credits.cast.map(c => [c.id, c])).values()
    ).sort((a, b) => {
        const dateA = a.release_date || a.first_air_date || '1900-01-01';
        const dateB = b.release_date || b.first_air_date || '1900-01-01';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mt-16 md:mt-24 fade-in">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr]">
                {/* Left Column: Image and Info */}
                <div className="space-y-6">
                    {/* Profile Image */}
                    <div className="relative aspect-[2/3] w-full max-w-[300px] overflow-hidden rounded-xl shadow-[var(--shadow-card)] mx-auto lg:mx-0">
                        {person.profile_path ? (
                            <Image
                                src={`${IMAGE_SIZES.profile.original}${person.profile_path}`}
                                alt={person.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-background-elevated text-foreground-muted">
                                No Image
                            </div>
                        )}
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Personal Info</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <h3 className="font-semibold text-foreground-muted">Known For</h3>
                                <p>{person.known_for_department}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground-muted">Born</h3>
                                <p>{person.birthday ? new Date(person.birthday).toLocaleDateString() : '-'}</p>
                            </div>
                            {person.deathday && (
                                <div>
                                    <h3 className="font-semibold text-foreground-muted">Died</h3>
                                    <p>{new Date(person.deathday).toLocaleDateString()}</p>
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-foreground-muted">Place of Birth</h3>
                                <p>{person.place_of_birth || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Bio and Known For */}
                <div className="space-y-12">
                    {/* Biography */}
                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold tracking-tight">{person.name}</h1>
                        <h2 className="text-xl font-bold">Biography</h2>
                        <div className="prose prose-invert max-w-none text-foreground-muted">
                            {person.biography ? (
                                <p className="whitespace-pre-wrap">{person.biography}</p>
                            ) : (
                                <p>We don&apos;t have a biography for {person.name}.</p>
                            )}
                        </div>
                    </div>

                    {/* Known For (Filmography) */}
                    {uniqueCredits.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Known For</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
                                {uniqueCredits.map((credit) => (
                                    <MovieCard
                                        key={credit.id}
                                        id={credit.id}
                                        title={credit.title || credit.name || ''}
                                        posterPath={credit.poster_path}
                                        voteAverage={credit.vote_average}
                                        releaseDate={credit.release_date || credit.first_air_date}
                                        mediaType={credit.media_type}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
