import { Link } from '@/i18n/routing';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    /** Optional "See more" link target */
    actionHref?: string;
    actionLabel?: string;
    /** Optional trailing controls rendered on the right */
    children?: React.ReactNode;
    className?: string;
}

/**
 * The MARKD editorial section header — eyebrow, title and a quiet
 * "See more" action. Gives every home rail a consistent, calm rhythm
 * without turning each section into a card.
 */
export function SectionHeader({
    eyebrow,
    title,
    description,
    actionHref,
    actionLabel,
    children,
    className = '',
}: SectionHeaderProps) {
    return (
        <div className={`flex flex-col gap-3 md:flex-row md:items-end md:justify-between ${className}`}>
            <div className="space-y-1">
                {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                <h2 className="section-title">{title}</h2>
                {description && <p className="lede pt-0.5">{description}</p>}
            </div>

            {(actionHref || children) && (
                <div className="flex shrink-0 items-center gap-3">
                    {children}
                    {actionHref && actionLabel && (
                        <Link
                            href={actionHref as Parameters<typeof Link>[0]['href']}
                            className="group inline-flex items-center gap-1 text-sm font-semibold text-foreground-muted transition-colors hover:text-foreground"
                        >
                            {actionLabel}
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}