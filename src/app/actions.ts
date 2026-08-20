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

// ============================================================================
// SEARCH ACTIONS
// ============================================================================

export async function searchMediaAction(query: string) {
    if (!query || query.trim().length === 0) return null;

    // Importing dynamically to avoid bringing tmdb client code into Edge/Client
    // if this file gets imported in specific ways
    const { searchMulti } = await import('@/lib/tmdb');

    try {
        const results = await searchMulti(query, 1);
        return results;
    } catch (error) {
        console.error('Error performing live search:', error);
        return null;
    }
}

// ============================================================================
// BOX OFFICE ACTIONS
// ============================================================================

export async function getBoxOfficeModalAction(movieId: number) {
    const { getBoxOfficeModalDetails } = await import('@/lib/tmdb');
    try {
        const data = await getBoxOfficeModalDetails(movieId);
        return data;
    } catch (error) {
        console.error('Error fetching box office modal details:', error);
        return null;
    }
}

// ============================================================================
// CACHE / REVALIDATION ACTIONS
// ============================================================================

export async function revalidateHomeAction() {
    revalidatePath('/', 'layout');
    return { success: true };
}

// ============================================================================
// TASTE FEEDBACK ACTIONS
// ============================================================================

export async function getTasteFeedbackAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: [], error: null };
    }

    const { data, error } = await supabase
        .from('taste_feedback')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching taste feedback:', error);
        return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
}

export async function submitTasteFeedbackAction({
    tmdb_id,
    media_type,
    signal_type,
}: {
    tmdb_id: number;
    media_type: MediaType;
    signal_type: 'not_interested' | 'already_watched' | 'not_my_type' | 'less_like_this';
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { error } = await supabase
        .from('taste_feedback')
        .upsert(
            {
                user_id: user.id,
                tmdb_id,
                media_type,
                signal_type,
            },
            { onConflict: 'user_id,tmdb_id,media_type,signal_type' }
        );

    if (error) {
        console.error('Error recording taste feedback:', error);
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    return { error: null };
}

// ============================================================================
// CUSTOM LISTS ACTIONS
// ============================================================================

export async function getUserCustomListsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: [], error: null };
    }

    const { data, error } = await supabase
        .from('custom_lists')
        .select(`
            *,
            items:custom_list_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching custom lists:', error);
        return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
}

export async function createCustomListAction({
    title,
    description,
    is_public = true,
}: {
    title: string;
    description?: string;
    is_public?: boolean;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated', data: null };
    }

    const { data, error } = await supabase
        .from('custom_lists')
        .insert({
            user_id: user.id,
            title,
            description,
            is_public,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating custom list:', error);
        return { error: error.message, data: null };
    }

    revalidatePath('/library');
    return { error: null, data };
}

export async function addCustomListItemAction({
    list_id,
    tmdb_id,
    media_type,
    title,
    poster_path,
}: {
    list_id: string;
    tmdb_id: number;
    media_type: MediaType;
    title: string;
    poster_path: string | null;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { error } = await supabase
        .from('custom_list_items')
        .insert({
            list_id,
            tmdb_id,
            media_type,
            title,
            poster_path,
        });

    if (error) {
        console.error('Error adding item to custom list:', error);
        return { error: error.message };
    }

    revalidatePath('/library');
    return { error: null };
}


