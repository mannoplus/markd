import { getPersonDetails } from '@/lib/tmdb';
import { notFound } from 'next/navigation';
import { PersonProfileClient } from '@/components/person-profile/PersonProfileClient';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const person = await getPersonDetails(Number(id));
        return {
            title: `${person.name} - MARKD`,
            description: person.biography?.substring(0, 160) || `Details for ${person.name}`,
        };
    } catch {
        return {
            title: 'Person Details - MARKD',
        };
    }
}

export default async function PersonPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id, locale } = await params;

    if (!id || isNaN(Number(id))) {
        notFound();
    }

    let person = null;
    try {
        person = await getPersonDetails(Number(id));
    } catch (error) {
        console.error('Error fetching person details:', error);
        notFound();
    }

    if (!person) {
        notFound();
    }

    return (
        <PersonProfileClient person={person} locale={locale} />
    );
}
