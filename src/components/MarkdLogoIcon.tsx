import React from 'react';

interface MarkdLogoIconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

/**
 * Custom MARKD "M" Emblem SVG Icon
 * Designed to replace star/sparkle icons with brand-aligned typography and geometry.
 */
export function MarkdLogoIcon({ className = 'h-4 w-4', ...props }: MarkdLogoIconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className={`inline-block shrink-0 ${className}`}
            {...props}
        >
            <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h2.6a1.5 1.5 0 0 1 1.25.68L12 9.55l3.65-5.87A1.5 1.5 0 0 1 16.9 3h2.6A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5V9.75l-3.2 4.95a1.5 1.5 0 0 1-2.6 0L7 9.75V19.5A1.5 1.5 0 0 1 5.5 21h-2A1.5 1.5 0 0 1 2 19.5v-15H3z" />
        </svg>
    );
}
