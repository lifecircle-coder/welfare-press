import { NextRequest, NextResponse } from 'next/server';
import { optimizeImage } from '@/lib/imageOptimizer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase Admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const { imageUrl, articleId } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
        }

        console.log(`Optimizing image for article ${articleId || 'unknown'}: ${imageUrl}`);

        // 1. Optimize image
        const buffer = await optimizeImage(imageUrl);

        // 2. Generate unique filename for the thumbnail
        const fileName = `thumb-${articleId || Math.random().toString(36).substring(7)}.webp`;
        const filePath = `articles/${fileName}`;

        // 3. Upload to Supabase Storage (partnership_files bucket)
        const { data, error: uploadError } = await supabaseAdmin.storage
            .from('partnership_files')
            .upload(filePath, buffer, {
                contentType: 'image/webp',
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload optimized image' }, { status: 500 });
        }

        // 4. Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('partnership_files')
            .getPublicUrl(filePath);

        return NextResponse.json({ optimizedUrl: publicUrl });

    } catch (error: any) {
        console.error('Optimization error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
