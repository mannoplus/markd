import Image from 'next/image';
import { IMAGE_SIZES } from '@/lib/tmdb';
import type { TMDBWatchProvider } from '@/types';

interface ProviderBadgeProps {
    provider: TMDBWatchProvider;
    /** Optional size — small for inline, large for detail pages */
    size?: 'sm' | 'lg';
    /** Optional link to redirect to the provider's page via JustWatch */
    link?: string;
    /** The title of the movie/show for search fallbacks */
    title?: string;
}

export function ProviderBadge({ provider, size = 'sm', link, title }: ProviderBadgeProps) {
    const dimension = size === 'sm' ? 36 : 48;

    const tooltipText = `Watch on ${provider.provider_name} via JustWatch`;

    const content = (
        <div
            className="group/badge relative flex flex-col items-center gap-1.5 cursor-pointer hover:scale-110 transition-transform duration-[var(--transition-fast)]"
            title={link ? tooltipText : provider.provider_name}
        >
            <div
                className={`overflow-hidden rounded-[var(--radius-md)] border border-border bg-background-elevated transition-all duration-[var(--transition-fast)] group-hover/badge:border-accent group-hover/badge:shadow-[var(--shadow-card)] ${size === 'sm' ? 'p-0.5' : 'p-1'
                    }`}
            >
                <Image
                    src={`${IMAGE_SIZES.logo.medium}${provider.logo_path}`}
                    alt={provider.provider_name}
                    width={dimension}
                    height={dimension}
                    className="rounded-[6px]"
                />
            </div>
            {size === 'lg' && (
                <span className="max-w-[64px] truncate text-center text-[10px] text-foreground-muted">
                    {provider.provider_name}
                </span>
            )}
        </div>
    );

    if (link) {
        return (
            <a href={link} target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[var(--radius-md)]">
                {content}
            </a>
        );
    }

    return content;
}

/* ---- Provider Section ---- */

interface ProviderSectionProps {
    label: string;
    providers: TMDBWatchProvider[];
    size?: 'sm' | 'lg';
    title?: string;
}

export function ProviderSection({ label, providers, size = 'lg', title }: ProviderSectionProps) {
    if (!providers || providers.length === 0) return null;

    return (
        <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                {label}
            </p>
            <div className="flex flex-wrap gap-3">
                {providers.map((p) => (
                    <ProviderBadge key={p.provider_id} provider={p} size={size} title={title} />
                ))}
            </div>
        </div>
    );
}
