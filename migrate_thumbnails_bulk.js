const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const axios = require('axios');

// 1. Setup Supabase
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'partnership_files';
const TARGET_FOLDER = 'articles';

async function optimizeImage(source, maxWidth = 800, quality = 80) {
    let input;
    try {
        if (typeof source === 'string') {
            const response = await axios.get(source, { responseType: 'arraybuffer' });
            input = Buffer.from(response.data);
        } else {
            input = source;
        }

        return await sharp(input)
            .resize({ width: maxWidth, withoutEnlargement: true, fit: 'inside' })
            .webp({ quality })
            .toBuffer();
    } catch (err) {
        console.error(`- Error optimizing image: ${err.message}`);
        return null;
    }
}

function extractFirstImage(html) {
    if (!html) return null;
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : null;
}

async function migrate() {
    console.log('--- Starting Bulk Thumbnail Optimization ---');

    // Fetch all articles
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, content, thumbnail');

    if (error) {
        console.error('Error fetching articles:', error);
        return;
    }

    console.log(`Found ${articles.length} articles.`);

    for (const article of articles) {
        const firstImgUrl = extractFirstImage(article.content);

        // Decide if we need to optimize
        // If there's an image in content AND (no thumbnail OR current thumbnail is NOT our optimized one)
        const needsOptimization = firstImgUrl && (!article.thumbnail || !article.thumbnail.includes('supabase.co/storage/v1/object/public/partnership_files/articles/'));

        if (needsOptimization) {
            console.log(`Optimizing: ${article.title}`);
            const buffer = await optimizeImage(firstImgUrl);

            if (buffer) {
                const fileName = `thumb-${article.id}.webp`;
                const filePath = `${TARGET_FOLDER}/${fileName}`;

                // Upload
                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, buffer, { contentType: 'image/webp', upsert: true });

                if (uploadError) {
                    console.error(`- Upload failed: ${uploadError.message}`);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

                // Update Article
                const { error: updateError } = await supabase
                    .from('articles')
                    .update({ thumbnail: publicUrl })
                    .eq('id', article.id);

                if (updateError) {
                    console.error(`- DB update failed: ${updateError.message}`);
                } else {
                    console.log(`- Success! URL: ${publicUrl}`);
                }
            }
        } else {
            console.log(`Skipping: ${article.title} (Already optimized or no image)`);
        }
    }

    console.log('--- Migration Finished ---');
}

migrate();
