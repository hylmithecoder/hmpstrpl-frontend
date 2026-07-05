import fs from 'fs';
import path from 'path';

export type SlidePositionKey = 'top' | 'left' | 'right' | 'bottom' | 'width' | 'rotate' | 'radius';

export interface SlideImage {
    src: string;
    alt: string;
    // Overlay images pop in one-by-one on click before the slide advances.
    overlay?: boolean;
    // CSS placement parsed from the {top=… left=… width=… rotate=…} suffix.
    position?: Partial<Record<SlidePositionKey, string>>;
}

const POSITION_KEYS: SlidePositionKey[] = ['top', 'left', 'right', 'bottom', 'width', 'rotate', 'radius'];

export interface SlideData {
    id: string;
    badge: string;
    title: string;
    description: string;
    bullets: string[];
    images: SlideImage[];
}

// Parses one slide file: optional frontmatter (--- id: xxx ---) followed by
// a markdown body where `#` = title, `##` = badge, `-` = bullet,
// `![alt](src)` = image, and remaining lines join into the description.
// Images accept an optional attribute block, e.g.:
//   ![caption](/meme1.jpeg){overlay top=16% left=6% width=220px rotate=-4deg radius=24px}
// `overlay` makes the image a click-to-reveal popup; the rest position it.
function parseSlide(raw: string, fallbackId: string): SlideData {
    let body = raw;
    const meta: Record<string, string> = {};

    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (fmMatch) {
        body = raw.slice(fmMatch[0].length);
        fmMatch[1].split('\n').forEach(line => {
            const sep = line.indexOf(':');
            if (sep > -1) {
                meta[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
            }
        });
    }

    let title = '';
    let badge = '';
    const bullets: string[] = [];
    const images: SlideImage[] = [];
    const paragraphs: string[] = [];

    body.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
        const img = line.match(/^!\[(.*?)\]\((.*?)\)(?:\{(.*?)\})?$/);
        if (img) {
            const image: SlideImage = { alt: img[1], src: img[2] };
            if (img[3]) {
                const position: SlideImage['position'] = {};
                img[3].trim().split(/\s+/).forEach(token => {
                    if (token === 'overlay') {
                        image.overlay = true;
                        return;
                    }
                    const [key, value] = token.split('=');
                    if (value && POSITION_KEYS.includes(key as SlidePositionKey)) {
                        position[key as SlidePositionKey] = value;
                    }
                });
                if (Object.keys(position).length > 0) image.position = position;
            }
            images.push(image);
        } else if (line.startsWith('# ')) {
            title = line.slice(2);
        } else if (line.startsWith('## ')) {
            badge = line.slice(3);
        } else if (line.startsWith('- ')) {
            bullets.push(line.slice(2));
        } else {
            paragraphs.push(line);
        }
    });

    return {
        id: meta.id || fallbackId,
        badge,
        title,
        bullets,
        images,
        description: paragraphs.join(' ')
    };
}

// Reads content/slides/*.md; slide order follows the filename sort,
// so use numeric prefixes: 01-hero.md, 02-tentang.md, ...
export function loadSlides(): SlideData[] {
    const dir = path.join(process.cwd(), 'content', 'slides');
    return fs.readdirSync(dir)
        .filter(file => file.endsWith('.md'))
        .sort()
        .map(file => {
            const raw = fs.readFileSync(path.join(dir, file), 'utf8');
            const fallbackId = file.replace(/\.md$/, '').replace(/^\d+-/, '');
            return parseSlide(raw, fallbackId);
        });
}
