'use client';

import { useState, useEffect } from 'react';
import { login, signup } from './actions';
import { Loader2, CheckCircle2, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
    getOnboardingState,
    clearOnboardingState,
    setOnboardingCompleted,
} from '@/lib/onboarding/storage';
import { mergeOnboardingPreferencesAction } from '@/app/actions/onboarding';
import Link from 'next/link';

export default function LoginPage() {
    const t = useTranslations('Login');
    const router = useRouter();

    // Start with Sign Up flow active since user is landing from Onboarding
    const [isLogin, setIsLogin] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [hasOnboardingData, setHasOnboardingData] = useState(false);
    const [showBanner, setShowBanner] = useState(true);
    const [checklistVisible, setChecklistVisible] = useState(true);

    // Form states
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    // Rate limiting states (6 attempts, 30s lockout)
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<number>(0);

    // Password rules
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isPasswordValid = hasMinLength && hasUppercase && hasSpecialChar;
    const passwordsMatch = password === confirmPassword && password.length > 0;

    // Auto-dismiss banner after 1.5s
    useEffect(() => {
        const timer = setTimeout(() => setShowBanner(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    // Animate password checklist fade-out when all rules pass
    useEffect(() => {
        if (isPasswordValid && checklistVisible) {
            const timer = setTimeout(() => setChecklistVisible(false), 600);
            return () => clearTimeout(timer);
        }
        if (!isPasswordValid && !checklistVisible) {
            setChecklistVisible(true);
        }
    }, [isPasswordValid, checklistVisible]);

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

    // Handle Lockout Countdown
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (lockoutUntil && lockoutUntil > Date.now()) {
            timer = setInterval(() => {
                const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
                if (remaining <= 0) {
                    setLockoutUntil(null);
                    setFailedAttempts(0);
                    setCountdown(0);
                    clearInterval(timer);
                } else {
                    setCountdown(remaining);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [lockoutUntil]);

    async function handleSubmit(formData: FormData) {
        if (lockoutUntil && lockoutUntil > Date.now()) {
            setError(`Too many attempts. Please wait ${countdown} seconds.`);
            return;
        }

        setError(null);
        setPending(true);

        const action = isLogin ? login : signup;
        const result = await action(formData);

        if (result?.error) {
            setError(result.error);
            setPending(false);
            
            const newAttempts = failedAttempts + 1;
            setFailedAttempts(newAttempts);
            if (newAttempts >= 6) {
                setLockoutUntil(Date.now() + 30 * 1000); // 30 seconds
                setCountdown(30);
            }
            return;
        }

        // Server action succeeded — session cookie is now set
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
        setPending(false);
        router.push('/home');
    }

    const isSubmitDisabled = pending || (lockoutUntil !== null) || (!isLogin && (!isPasswordValid || !passwordsMatch));

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center relative px-6 py-12 overflow-hidden selection:bg-accent/20">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none" />

            <div className="w-full max-w-md z-10 flex flex-col">
                
                {/* Status Banner — auto-dismisses after 1.5s */}
                {showBanner && (
                    <div className="mb-10 fade-in slide-in-from-top-4 duration-500">
                        <div
                            className="mx-auto w-fit px-4 py-2 rounded-full bg-accent/10 border border-accent/20 flex items-center gap-2 text-sm text-accent shadow-[0_0_15px_rgba(var(--accent),0.15)] transition-opacity duration-500"
                            style={{ opacity: showBanner ? 1 : 0 }}
                        >
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span className="font-medium tracking-wide">Taste profile calibrated — preferences saved to this device.</span>
                        </div>
                    </div>
                )}

                {/* Main Auth Card */}
                <div className="w-full p-10 bg-background/60 backdrop-blur-3xl border border-border/50 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-500 ease-out">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/5 pointer-events-none" />

                    <div className="relative z-10 text-center mb-10">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            Welcome to MARKD.
                        </h1>
                        <p className="text-base text-foreground-muted mt-3">
                            {isLogin ? 'Sign in to sync your universe.' : 'Create an account to save your cinematic DNA.'}
                        </p>
                    </div>

                    <form action={handleSubmit} className="relative z-10 space-y-6">
                        {error && (
                            <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 fade-in">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <div className="leading-relaxed font-medium">
                                    {error}
                                </div>
                            </div>
                        )}

                        <div className="space-y-5 text-left">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-semibold text-foreground-subtle uppercase tracking-wider ml-1">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    className="w-full px-5 py-3.5 bg-background-elevated/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-base placeholder:text-foreground-muted/40"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-semibold text-foreground-subtle uppercase tracking-wider ml-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setIsPasswordFocused(true)}
                                    onBlur={() => setIsPasswordFocused(password.length > 0)}
                                    placeholder="••••••••"
                                    className="w-full px-5 py-3.5 bg-background-elevated/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-base placeholder:text-foreground-muted/40"
                                />
                            </div>

                            {!isLogin && (isPasswordFocused || password.length > 0) && checklistVisible && (
                                <div
                                    className={`space-y-2.5 px-1 py-1 text-sm transition-all duration-500 ${
                                        isPasswordValid ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
                                    }`}
                                >
                                    <div className={`flex items-center gap-2 transition-colors duration-300 ${hasMinLength ? 'text-green-500' : 'text-foreground-muted'}`}>
                                        <div className={`h-4 w-4 rounded-full flex items-center justify-center border ${hasMinLength ? 'border-green-500 bg-green-500/10' : 'border-border/80'}`}>
                                            {hasMinLength && <Check className="h-2.5 w-2.5" />}
                                        </div>
                                        <span>At least 8 characters</span>
                                    </div>
                                    <div className={`flex items-center gap-2 transition-colors duration-300 ${hasUppercase ? 'text-green-500' : 'text-foreground-muted'}`}>
                                        <div className={`h-4 w-4 rounded-full flex items-center justify-center border ${hasUppercase ? 'border-green-500 bg-green-500/10' : 'border-border/80'}`}>
                                            {hasUppercase && <Check className="h-2.5 w-2.5" />}
                                        </div>
                                        <span>At least 1 uppercase letter</span>
                                    </div>
                                    <div className={`flex items-center gap-2 transition-colors duration-300 ${hasSpecialChar ? 'text-green-500' : 'text-foreground-muted'}`}>
                                        <div className={`h-4 w-4 rounded-full flex items-center justify-center border ${hasSpecialChar ? 'border-green-500 bg-green-500/10' : 'border-border/80'}`}>
                                            {hasSpecialChar && <Check className="h-2.5 w-2.5" />}
                                        </div>
                                        <span>At least 1 special character (!@#$...)</span>
                                    </div>
                                </div>
                            )}

                            {!isLogin && (
                                <div className="space-y-2 pt-3 fade-in">
                                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground-subtle uppercase tracking-wider ml-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className={`w-full px-5 py-3.5 bg-background-elevated/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-base placeholder:text-foreground-muted/40 ${confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/30' : 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30') : 'border-border/50 focus:border-accent focus:ring-accent/50'}`}
                                        />
                                        {confirmPassword.length > 0 && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                {passwordsMatch ? <Check className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className="w-full py-4 mt-2 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                            {pending ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {isLogin ? 'Authenticating...' : 'Creating Account...'}
                                </>
                            ) : lockoutUntil ? (
                                `Locked out. Try again in ${countdown}s`
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/60"></div>
                            </div>
                            <div className="relative flex justify-center text-xs font-semibold uppercase tracking-widest">
                                <span className="px-4 bg-background/60 backdrop-blur-3xl text-foreground-muted">Or continue with</span>
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
                            disabled={pending || lockoutUntil !== null}
                            className="w-full py-3.5 bg-background-elevated text-foreground font-semibold rounded-xl border border-border/80 hover:bg-background hover:border-border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm hover:shadow"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="pt-6 text-center text-sm font-medium text-foreground-muted">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                    setPassword('');
                                    setConfirmPassword('');
                                    setIsPasswordFocused(false);
                                    setChecklistVisible(true);
                                }}
                                className="font-bold text-foreground hover:text-accent ml-2 transition-colors focus:outline-none"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Skip option */}
                <div className="mt-12 text-center fade-in slide-in-from-bottom-4 duration-700">
                    <Link 
                        href="/home"
                        className="text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors uppercase tracking-widest pb-1 border-b border-transparent hover:border-foreground/30"
                    >
                        Skip for now
                    </Link>
                </div>
            </div>
        </div>
    );
}
