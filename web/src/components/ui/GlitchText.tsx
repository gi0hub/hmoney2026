'use client';

interface GlitchTextProps {
    text: string;
    className?: string; // Allow passing external styles (size, font, etc)
}

export function GlitchText({ text, className = '' }: GlitchTextProps) {
    return (
        <div
            className={`glitch-wrapper relative inline-block text-white ${className}`}
            data-text={text}
        >
            {text}
        </div>
    );
}
