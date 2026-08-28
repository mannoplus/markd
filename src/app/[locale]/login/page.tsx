'use client';

import { useState, useEffect } from 'react';
import { login, signup } from './actions';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
    getOnboardingState,
    clearOnboardingState,
    setOnboardingCompleted,
} from '@/lib/onboarding/storage';
import { mergeOnboardingPreferencesAction } from '@/app/actions/onboarding';

export default function LoginPage() {
    const t = useTranslations('Login');
    const tOnboarding = useTranslations('Onboarding');
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [hasOnboardingData, setHasOnboardingData] = useState(false);

    useEffect(() => {
        const state = getOnboardingState();
        if (
            state.favoriteTitles.length > 0 ||
            state.genres.movie.length > 0 ||
            state.tasteAnswers.length > 0
        ) {
            setHasOnboardingData(true);
        }
    }, []);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setPending(true);

        const action = isLogin ? login : signup;
        const result = await action(formData);

        if (result?.error) {
            setError(result.error);
            setPending(false);
            return;
        }

        // If login/signup succeeds and we have pending onboarding preferences, merge them
        const state = getOnboardingState();
        if (
            state.favoriteTitles.length > 0 ||
            state.genres.movie.length > 0 ||
            state.tasteAnswers.length > 0
        ) {
            try {
                await mergeOnboardingPreferencesAction(state);
            } catch (e) {
                console.warn('Failed to merge onboarding preferences on login:', e);
            }
        }

        setOnboardingCompleted(true);
        clearOnboardingState();
        router.push('/dashboard');
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center fade-in">
            <div className="w-full max-w-md p-8 glass border border-border rounded-2xl shadow-2xl relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

                {/* Onboarding Calibrated Banner */}
                {hasOnboardingData && (
                    <div className="relative z-10 mb-6 p-3 rounded-xl bg-accent/15 border border-accent/30 flex items-center gap-2.5 text-xs text-accent">
                        <CheckCircle2 className="h-4 w-4 shrink-0 stroke-[2.5]" />
                        <div className="space-y-0.5">
                            <p className="font-bold">{tOnboarding('authPromptTitle')}</p>
                            <p className="text-[11px] opacity-80">{tOnboarding('savedLocally')}</p>
                        </div>
                    </div>
                )}

                <div className="relative z-10 text-center mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        {isLogin ? t('welcomeBack') : t('createAccount')}
                    </h1>
                    <p className="text-sm text-foreground-muted mt-2">
                        {isLogin ? t('loginDesc') : t('signupDesc')}
                    </p>
                </div>

                <form action={handleSubmit} className="relative z-10 space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg fade-in">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 text-left">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-foreground-subtle">
                                {t('emailLabel')}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder={t('emailPlaceholder')}
                                className="w-full px-4 py-2.5 bg-background-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm placeholder:text-foreground-muted/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-foreground-subtle">
                                {t('passwordLabel')}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder={t('passwordPlaceholder')}
                                className="w-full px-4 py-2.5 bg-background-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm placeholder:text-foreground-muted/50"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full py-2.5 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {pending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {isLogin ? t('signingIn') : t('creatingAccount')}
                            </>
                        ) : (
                            isLogin ? t('signInBtn') : t('signUpBtn')
                        )}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background-card text-foreground-muted">{t('continueWith')}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            setPending(true);
                            const { createClient } = await import('@/lib/supabase/client');
                            const supabase = createClient();

                            const getRedirectUrl = () => {
                                const origin = window.location.origin;
                                return `${origin}/auth/callback`;
                            };

                            await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: getRedirectUrl(),
                                },
                            });
                        }}
                        disabled={pending}
                        className="w-full py-2.5 bg-background text-foreground font-semibold rounded-lg border border-border hover:bg-background-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                        </svg>
                        Google
                    </button>

                    <div className="pt-4 text-center text-sm text-foreground-muted">
                        {isLogin ? t('noAccount') : t('hasAccount')}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                            }}
                            className="font-semibold text-accent hover:underline focus:outline-none ml-1"
                        >
                            {isLogin ? t('signUpBtn') : t('signInBtn')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
