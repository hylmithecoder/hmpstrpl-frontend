'use client';

import React, { useEffect, useState } from 'react';
import type { InstagramChild } from '../utils/api';

interface InstagramCoverProps {
    slides: InstagramChild[];
    alt: string;
    intervalMs?: number;
}

function slideSrc(slide: InstagramChild): string {
    if (slide.media_type === 'VIDEO') return slide.thumbnail_url || slide.media_url || '';
    return slide.media_url || slide.thumbnail_url || '';
}

// Cover for a feed card. A carousel post cycles through its slides on its own
// so the card previews the whole album; controls are deliberately omitted —
// the card is one big link, and a nested button would break that.
export default function InstagramCover({ slides, alt, intervalMs = 3500 }: InstagramCoverProps) {
    const [index, setIndex] = useState(0);
    const count = slides.length;

    useEffect(() => {
        if (count < 2) return;
        const timer = setInterval(() => setIndex(i => (i + 1) % count), intervalMs);
        return () => clearInterval(timer);
    }, [count, intervalMs]);

    if (count === 0) return null;

    return (
        <>
            {slides.map((slide, i) => {
                const src = slideSrc(slide);
                if (!src) return null;
                return (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        key={slide.id}
                        src={src}
                        alt={count > 1 ? `${alt} — slide ${i + 1}` : alt}
                        loading="lazy"
                        aria-hidden={i !== index}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
                    />
                );
            })}

            {count > 1 && (
                <>
                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white">
                        {index + 1}/{count}
                    </span>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {slides.map((slide, i) => (
                            <span
                                key={slide.id}
                                className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
                            />
                        ))}
                    </span>
                </>
            )}
        </>
    );
}
