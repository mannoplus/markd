'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { MediaType, WatchStatus } from '@/types';

// ============================================================================
// MEDIA ITEMS CRUD ACTIONS
// ============================================================================

export async function getUserMediaItems() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated', data: null };
    }

    const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching media items:', error);
        return { error: error.message, data: null };
    }

    return { error: null, data };
}

export async function getUserMediaItem(tmdbId: number, mediaType: MediaType) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated', data: null };
    }

    const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching single media item:', error);
        return { error: error.message, data: null };
    }

    return { error: null, data };
}

export async function upsertMediaItem({
    tmdb_id,
    media_type,
    title,
    poster_path,
    status,
    rating,
    season_progress,
    episode_progress,
}: {
    tmdb_id: number;
    media_type: MediaType;
    title: string;
    poster_path: string | null;
    status: WatchStatus;
    rating: number | null;
    season_progress: number | null;
    episode_progress: number | null;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { error } = await supabase
        .from('media_items')
        .upsert(
            {
                user_id: user.id,
                tmdb_id,
                media_type,
                title,
                poster_path,
                status,
                rating,
                season_progress,
                episode_progress,
            },
            {
                onConflict: 'user_id,tmdb_id,media_type',
            }
        );

    if (error) {
        console.error('Error upserting media item:', error);
        return { error: error.message };
    }

    // Revalidate paths that might display this data
    revalidatePath('/library');
    revalidatePath('/dashboard');
    revalidatePath(`/${media_type}/${tmdb_id}`);

    return { error: null };
}

export async function deleteMediaItem(tmdbId: number, mediaType: MediaType) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType);

    if (error) {
        console.error('Error deleting media item:', error);
        return { error: error.message };
    }

    revalidatePath('/library');
    revalidatePath('/dashboard');
    revalidatePath(`/${mediaType}/${tmdbId}`);

    return { error: null };
}
