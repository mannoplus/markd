import Image from 'next/image';

/**
 * MARKD Logo — uses the actual brand PNG image.
 *
 * The source image has dark text on a white background.
 * We use CSS `filter: invert(1)` to flip it (white text on black bg),
 * then `mix-blend-mode: screen` to make the now-black background
 * disappear against any dark surface, leaving just the white logo.
 */

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
    sm: { width: 90, height: 36 },
    md: { width: 140, height: 56 },
    lg: { width: 200, height: 80 },
} as const;

export function Logo({ className = '', size = 'md' }: LogoProps) {
    const { width, height } = SIZES[size];

    return (
        <Image
            src="/logo-transparent.png"
            alt="MARKD"
            width={width}
            height={height}
            className={className}
            style={{
                filter: 'brightness(0) invert(1)',
                height: 'auto',
                maxWidth: width,
            }}
            priority
        />
    );
}
