import sharp from 'sharp';
import axios from 'axios';

/**
 * Optimizes an image from a URL or Buffer.
 * - Resizes to a maximum width
 * - Converts to WebP
 * - Compresses with quality setting
 */
export async function optimizeImage(
    source: string | Buffer,
    maxWidth: number = 800,
    quality: number = 80
): Promise<Buffer> {
    let input: Buffer;

    if (typeof source === 'string') {
        if (source.startsWith('data:image/')) {
            // Handle Base64
            const base64Data = source.split(',')[1];
            input = Buffer.from(base64Data, 'base64');
        } else {
            // Fetch from URL
            const response = await axios.get(source, { responseType: 'arraybuffer' });
            input = Buffer.from(response.data);
        }
    } else {
        input = source;
    }

    // Process with sharp
    const optimized = await sharp(input)
        .resize({
            width: maxWidth,
            withoutEnlargement: true,
            fit: 'inside'
        })
        .webp({ quality })
        .toBuffer();

    return optimized;
}

/**
 * Extracts the first image URL from HTML content.
 */
export function extractFirstImage(html: string): string | null {
    if (!html) return null;
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : null;
}
