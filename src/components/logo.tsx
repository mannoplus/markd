import Image from 'next/image';

/**
 * MARKD Logo — the brand wordmark.
 *
 * Renders the pre-rendered white-on-transparent asset directly, so the
 * identity stays crisp on every dark surface without CSS filter tricks.
 */

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    priority?: boolean;
}

const SIZES = {
    sm: { width: 96, height: 46 },
    md: { width: 132, height: 64 },
    lg: { width: 184, height: 89 },
} as const;

export function Logo({ className = '', size = 'md', priority = false }: LogoProps) {
    const { width, height } = SIZES[size];

    return (
        <Image
            src="/logo-white.png"
            alt="MARKD"
            width={width}
            height={height}
            className={className}
            style={{
                height: 'auto',
                maxWidth: '100%',
            }}
            priority={priority}
            draggable={false}
        />
    );
}