const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

// 1. Load environment variables manually
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local not found');
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) {
            env[key.trim()] = value.join('=').trim();
        }
    });
    return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET_NAME = 'partnership_files';

async function optimizeAndUpload(base64Data, articleId, type = 'content') {
    try {
        const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (!matches) return null;

        const buffer = Buffer.from(matches[2], 'base64');
        
        // Optimize with Sharp
        const optimizedBuffer = await sharp(buffer)
            .resize({ width: 1200, withoutEnlargement: true, fit: 'inside' })
            .webp({ quality: 80 })
            .toBuffer();

        const fileName = `${type}-${articleId}-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const filePath = `articles/${articleId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true
            });

        if (uploadError) {
            console.error(`  - Upload error for ${articleId}:`, uploadError.message);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        return publicUrl;
    } catch (err) {
        console.error(`  - Processing error:`, err.message);
        return null;
    }
}

async function cleanup() {
    console.log('--- Starting Base64 Cleanup & Migration ---');

    // Fetch all articles
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, content, thumbnail, summary');

    if (error) {
        console.error('Error fetching articles:', error);
        return;
    }

    console.log(`Analyzing ${articles.length} articles...`);

    let totalFixed = 0;

    for (const article of articles) {
        let updatedContent = article.content || '';
        let updatedThumbnail = article.thumbnail || '';
        let updatedSummary = article.summary || '';
        let isModified = false;

        console.log(`Checking article [${article.id}]: ${article.title}`);

        // 1. Process Content
        const base64Regex = /src=["'](data:image\/[a-zA-Z+]+;base64,[^"']+)["']/g;
        const matches = [...updatedContent.matchAll(base64Regex)];
        
        if (matches.length > 0) {
            console.log(`  - Found ${matches.length} images in content. Processing...`);
            for (const match of matches) {
                const b64 = match[1];
                const url = await optimizeAndUpload(b64, article.id, 'content');
                if (url) {
                    updatedContent = updatedContent.replace(b64, url);
                    isModified = true;
                }
            }
        }

        // 2. Process Thumbnail
        if (updatedThumbnail && updatedThumbnail.startsWith('data:image/')) {
            console.log(`  - Found base64 thumbnail. Processing...`);
            const url = await optimizeAndUpload(updatedThumbnail, article.id, 'thumb');
            if (url) {
                updatedThumbnail = url;
                isModified = true;
            }
        }

        // 3. Process Summary
        const summaryMatches = [...updatedSummary.matchAll(base64Regex)];
        if (summaryMatches.length > 0) {
            console.log(`  - Found ${summaryMatches.length} images in summary. Processing...`);
            for (const match of summaryMatches) {
                const b64 = match[1];
                const url = await optimizeAndUpload(b64, article.id, 'summary');
                if (url) {
                    updatedSummary = updatedSummary.replace(b64, url);
                    isModified = true;
                }
            }
        }

        if (isModified) {
            const { error: updateError } = await supabase
                .from('articles')
                .update({
                    content: updatedContent,
                    thumbnail: updatedThumbnail,
                    summary: updatedSummary
                })
                .eq('id', article.id);

            if (updateError) {
                console.error(`  - Failed to update article ${article.id}:`, updateError.message);
            } else {
                console.log(`  - SUCCESS: Article ${article.id} updated.`);
                totalFixed++;
            }
        } else {
            console.log(`  - No base64 data found.`);
        }
    }

    console.log(`--- Cleanup Finished. Total articles modified: ${totalFixed} ---`);
}

cleanup();
