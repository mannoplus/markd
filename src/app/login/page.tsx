'use client';

import { useState } from 'react';
import { login, signup } from './actions';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function handleSubmit(formData: FormData) {
        setError(null);
        setPending(true);

        const action = isLogin ? login : signup;
        const result = await action(formData);

        if (result?.error) {
            setError(result.error);
            setPending(false);
        }
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center fade-in">
            <div className="w-full max-w-md p-8 glass border border-border rounded-2xl shadow-2xl relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 text-center mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-sm text-foreground-muted mt-2">
                        {isLogin
                            ? 'Enter your credentials to access your library.'
                            : 'Sign up to start tracking your favorite movies and shows.'}
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
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 bg-background-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm placeholder:text-foreground-muted/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-foreground-subtle">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
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
                                {isLogin ? 'Signing in...' : 'Creating account...'}
                            </>
                        ) : (
                            isLogin ? 'Sign In' : 'Sign Up'
                        )}
                    </button>

                    <div className="pt-4 text-center text-sm text-foreground-muted">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                            }}
                            className="font-semibold text-accent hover:underline focus:outline-none"
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </form >
            </div >
        </div >
    );
}
