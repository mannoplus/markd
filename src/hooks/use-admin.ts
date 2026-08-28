'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to securely check if the current user has the 'admin' role in their app_metadata.
 * This is meant for frontend gating only; actual security must be enforced via RLS/Backend.
 */
export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const supabase = createClient();
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Error fetching session for admin check:', error);
                    setIsAdmin(false);
                    return;
                }

                if (session?.user) {
                    // Check if role is admin in app_metadata
                    // Depending on how roles are configured, it could be in user_metadata or app_metadata
                    const role = session.user.app_metadata?.role || session.user.user_metadata?.role;
                    setIsAdmin(role === 'admin');
                } else {
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error('Unexpected error during admin check:', error);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

    return { isAdmin, isLoading };
}
