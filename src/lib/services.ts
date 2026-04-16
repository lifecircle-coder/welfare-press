import { supabase } from './supabaseClient';

export interface User {
    id: string;
    name: string;
    email: string;
    email_display?: string; // 기사 상세페이지 노출용 이메일
    role: 'admin' | 'reporter' | 'user';
    specialty?: string;
    grade?: string;
    joinDate: string;
}

export interface Article {
    id: string;
    title: string;
    category: string;
    prefix?: string;
    category_list?: { category: string; prefix: string; }[];
    author: string;
    date?: string;
    views: number;
    status: 'published' | 'draft';
    summary?: string;
    content?: string;
    hashtags?: string[];
    thumbnail?: string;
    updated_at?: string;
    created_at?: string;
    link_button_text?: string;
    link_url?: string;
}

export interface Inquiry {
    id: string;
    author: string;
    title: string;
    content: string;
    date: string;
    status: 'pending' | 'answered';
    answer?: string | null;
}

export interface Comment {
    id: string;
    articleId: string;
    author: string;
    content: string;
    date: string;
    parentId?: string; // 대댓글 지원을 위한 부모 댓글 ID
}

export interface PartnershipInquiry {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    title: string;
    content: string;
    fileUrl?: string;
    createdAt: string;
    status: 'pending' | 'reviewing' | 'completed';
}

export interface Menu {
    id: string;
    name: string;
    parent_id: string | null;
    sort_order: number;
    is_visible: boolean;
    created_at?: string;
}

// --- Constants for Query Stability ---
export const ARTICLE_LIST_FIELDS = 'id, title, category, prefix, category_list, author, date, views, status, summary, hashtags, thumbnail, updated_at, created_at';

// --- Articles ---

export const getAllArticles = async (limit = 20, offset = 0, client = supabase): Promise<Article[]> => {
    const { data, error } = await client
        .from('articles')
        .select(ARTICLE_LIST_FIELDS)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching all articles:', error);
        // NO select('*') fallback here. It crashes on production if rows are large.
        return [];
    }
    return data || [];
};

export const getArticles = async (limit = 20, offset = 0, client = supabase): Promise<Article[]> => {
    const { data, error } = await client
        .from('articles')
        .select(ARTICLE_LIST_FIELDS)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
    return data || [];
};

export const getArticlesByCategory = async (category: string, limit = 20, offset = 0, prefix?: string): Promise<Article[]> => {
    let query = supabase
        .from('articles')
        .select(ARTICLE_LIST_FIELDS)
        .eq('status', 'published');
    
    // 다중 카테고리 검색 지원 (category_list JSONB 내부에 존재 여부 확인)
    if (category && category !== 'all' && category !== '전체') {
        let jsonPart: string;
        let escapedJson: string;

        if (prefix && prefix !== '전체') {
            // 특정 소분류(prefix)가 선택된 경우: (레거시 필드 조합) OR (신규 JSONB 내 존재)
            jsonPart = JSON.stringify([{ category, prefix }]);
            escapedJson = jsonPart.replace(/"/g, '\\"');
            query = query.or(`and(category.eq."${category}",prefix.eq."${prefix}"),category_list.cs."${escapedJson}"`);
        } else {
            // 특정 소분류가 지정되지 않은 경우: (레거시 대분류) OR (신규 JSONB 내 대분류 존재)
            jsonPart = JSON.stringify([{ category }]);
            escapedJson = jsonPart.replace(/"/g, '\\"');
            query = query.or(`category.eq."${category}",category_list.cs."${escapedJson}"`);
        }
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching articles by category:', error);
        return [];
    }
    return data || [];
};

export const getHeroArticles = async (limit = 5): Promise<Article[]> => {
    const { data, error } = await supabase
        .from('articles')
        .select(ARTICLE_LIST_FIELDS)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching hero articles:', error);
        return [];
    }
    return data || [];
};

export const getTopArticles = async (limit = 10, client = supabase): Promise<Article[]> => {
    const { data, error } = await client
        .from('articles')
        .select(ARTICLE_LIST_FIELDS)
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching top articles:', error);
        return [];
    }
    return data || [];
};

/**
 * 특정 메뉴(대분류/소분류)에 연결된 기사의 개수를 조회합니다.
 */
export const getLinkedArticleCount = async (menuName: string, isSub: boolean): Promise<number> => {
    const field = isSub ? 'prefix' : 'category';
    const { count, error } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq(field, menuName);

    if (error) {
        console.error(`Error counting articles for ${menuName}:`, error);
        return 0;
    }
    return count || 0;
};

export const getArticleById = async (id: string, client = supabase): Promise<Article | undefined> => {
    const { data, error } = await client
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching article:', error);
        return undefined;
    }
    return data;
};

// --- Image Upload Helpers ---

/**
 * Uploads a file or Base64 string to Supabase Storage
 */
export const uploadArticleImage = async (source: File | string, articleId: string): Promise<string | null> => {
    try {
        let body: Buffer | File;
        let contentType: string;
        let extension: string;

        if (typeof source === 'string' && source.startsWith('data:')) {
            const matches = source.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
            if (!matches) return null;
            extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            contentType = `image/${extension}`;
            body = Buffer.from(matches[2], 'base64');
        } else if (source instanceof File) {
            body = source;
            contentType = source.type;
            extension = source.name.split('.').pop() || 'jpg';
        } else {
            return null;
        }

        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
        const filePath = `articles/${articleId || 'misc'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('partnership_files')
            .upload(filePath, body, {
                contentType,
                cacheControl: '3600',
                upsert: false
            });


        if (uploadError) {
            console.error('Core Storage Upload Error:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from('partnership_files')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (err) {
        console.error('Unexpected uploadArticleImage failure:', err);
        return null;
    }
};


export const saveArticle = async (article: Article, client = supabase): Promise<{ success: boolean; error?: any }> => {
    let finalContent = article.content || '';
    let finalThumbnail = article.thumbnail || '';

    // 1. Process Content: Scan and replace Base64 images with Storage URLs (using server-side optimization)
    const base64Regex = /src=["'](data:image\/[a-zA-Z+]+;base64,[^"']+)["']/g;
    const base64Matches = Array.from(finalContent.matchAll(base64Regex));
    const base64Images = base64Matches.map(match => match[1]);

    if (base64Images.length > 0) {
        console.log(`Found ${base64Images.length} Base64 images in content. Optimizing via server...`);
        for (const b64 of base64Images) {
            try {
                const response = await fetch('/api/optimize-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: b64, articleId: article.id })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.optimizedUrl) {
                        finalContent = finalContent.replace(b64, data.optimizedUrl);
                        console.log(`Successfully optimized and replaced image with: ${data.optimizedUrl}`);
                    }
                } else {
                    console.error('Failed to optimize image via API:', await response.text());
                    // Fallback to original Base64 if optimization fails (though this might cause timeout)
                }
            } catch (err) {
                console.error('Error calling optimize-image API:', err);
            }
        }
    }

    // 2. Process Thumbnail: If Base64 or missing, try to get from processed content or upload
    if (finalThumbnail && finalThumbnail.startsWith('data:')) {
        const storageUrl = await uploadArticleImage(finalThumbnail, article.id);
        if (storageUrl) finalThumbnail = storageUrl;
    }

    // If still no thumbnail, grab the first image from the refined content
    if (!finalThumbnail || finalThumbnail.startsWith('data:')) {
        let extractedSrc = null;

        // 1. 브라우저 환경인 경우 DOMParser 활용
        if (typeof window !== 'undefined' && window.DOMParser) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(finalContent, 'text/html');
                const img = doc.querySelector('img');
                if (img) extractedSrc = img.getAttribute('src');
            } catch (e) {
                console.error('DOMParser error', e);
            }
        }

        // Fallback robust regex
        if (!extractedSrc) {
            const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
            const firstImgMatch = finalContent.match(imgRegex);
            if (firstImgMatch) {
                extractedSrc = firstImgMatch[1];
            }
        }

        if (extractedSrc) {
            finalThumbnail = extractedSrc;
        }
    }

    // 3. Payload Size Safety Check: Prevent "Statement Timeout" by blocking massive Base64
    // If content still contains massive Base64 (> 2MB for safety), block saving.
    const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
    if (finalContent.length > MAX_CONTENT_SIZE) {
        return { 
            success: false, 
            error: { message: '기사 내용이 너무 큽니다. 대용량 이미지는 최적화가 필요합니다 (약 5MB 제한).' } 
        };
    }

    const existing = await getArticleById(article.id);
    const now = new Date().toISOString();

    // [의존성 전수 조사] 정렬과 발행일의 기준이 되는 date 필드를 created_at 개념으로 정립
    let finalizedDate = article.date;

    if (existing) {
        // 수정 시: 기존의 date(발행일)를 절대적으로 유지함 (초 단위 포함)
        // 사용자가 관리자 페이지에서 명시적으로 수정했을 경우에만 새로운 값을 적용
        finalizedDate = article.date || existing.date || now;
    } else {
        // 신규 작성 시: 현재 시간을 발행일로 설정 (초 단위 포함)
        finalizedDate = article.date || now;
    }

    const articleData = {
        ...article,
        content: finalContent,
        thumbnail: finalThumbnail,
        date: finalizedDate || article.created_at, // date와 created_at 동기화
        created_at: article.created_at || finalizedDate, // 명시적으로 created_at 포함
        updated_at: now,
        // 첫 번째 카테고리를 기존 필드에 유지 (하위 호환성 및 메인 표시용)
        category: article.category_list && article.category_list.length > 0 
            ? article.category_list[0].category 
            : article.category,
        prefix: article.category_list && article.category_list.length > 0
            ? article.category_list[0].prefix
            : article.prefix,
        link_button_text: article.link_button_text,
        link_url: article.link_url
    };

    if (existing) {
        // Strictly exclude `id` and `views` from update payload
        const { id, views, created_at: _, date: __, ...updatePayload } = articleData;

        const { error } = await client
            .from('articles')
            .update(updatePayload)
            .eq('id', id);

        if (error) return { success: false, error };
    } else {
        const { error } = await client
            .from('articles')
            .insert({
                ...articleData,
                views: 0
            });

        if (error) return { success: false, error };
    }

    return { success: true };
};

export const searchArticles = async (query: string): Promise<Article[]> => {
    if (!query.trim()) return [];

    const { data, error } = await supabase
        .from('articles')
        .select(ARTICLE_LIST_FIELDS)
        .or(`"title.ilike.%${query}%","content.ilike.%${query}%","summary.ilike.%${query}%"`)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error searching articles:', error);
        return [];
    }
    return data || [];
};

export const deleteArticle = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
    if (error) console.error('Error deleting article:', error);
};

// --- Users ---

export const getUsers = async (client = supabase): Promise<User[]> => {
    const { data, error } = await client
        .from('users')
        .select('*')
        .order('join_date', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    return data?.map(u => ({
        ...u,
        joinDate: u.join_date
    })) || [];
};

export const getUserById = async (id: string): Promise<User | undefined> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return undefined;
    return { ...data, joinDate: data.join_date };
};

/**
 * 작성자 이름(닉네임)으로 유저 정보를 조회합니다.
 * 기사 상세페이지에서 이메일 매칭을 위해 사용합니다.
 */
export const getUserByName = async (name: string): Promise<User | undefined> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .eq('role', 'reporter') // 기자 계정에서만 찾음
        .maybeSingle();

    if (error || !data) return undefined;
    return { ...data, joinDate: data.join_date };
};


export const updateUser = async (user: User): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update({
            name: user.name,
            role: user.role,
            specialty: user.specialty,
            grade: user.grade
        })
        .eq('id', user.id);
    if (error) console.error('Error updating user:', error);
};

/**
 * 기자의 이름을 수정하고, 해당 기자가 작성한 모든 기사, 댓글, 문의의 작성자 명을 일괄 업데이트합니다.
 * @param userId 수정할 사용자의 ID
 * @param oldName 기준 이름 (검색용)
 * @param newName 새 이름
 * @param client Supabase 클라이언트
 */
export const updateUserWithContent = async (
    userId: string,
    oldName: string,
    newName: string,
    client = supabase
): Promise<{ success: boolean; error?: any }> => {
    try {
        // 1. users 테이블 업데이트
        const { error: userError } = await client
            .from('users')
            .update({ name: newName })
            .eq('id', userId);
        
        if (userError) throw userError;

        // 이름이 변경된 경우에만 관련 콘텐츠 업데이트 진행
        if (oldName !== newName) {
            console.log(`Synchronizing content creator name from [${oldName}] to [${newName}]...`);
            
            // 2. articles 테이블 업데이트
            const { error: artError } = await client
                .from('articles')
                .update({ author: newName })
                .eq('author', oldName);
            if (artError) console.error('Error updating articles author:', artError);

            // 3. comments 테이블 업데이트
            const { error: cmtError } = await client
                .from('comments')
                .update({ author: newName })
                .eq('author', oldName);
            if (cmtError) console.error('Error updating comments author:', cmtError);

            // 4. inquiries 테이블 업데이트
            const { error: inqError } = await client
                .from('inquiries')
                .update({ author: newName })
                .eq('author', oldName);
            if (inqError) console.error('Error updating inquiries author:', inqError);
        }

        return { success: true };
    } catch (error) {
        console.error('updateUserWithContent failed:', error);
        return { success: false, error };
    }
};


export const saveUser = async (user: User): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .insert({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            specialty: user.specialty,
            grade: user.grade,
            join_date: user.joinDate
        });
    if (error) console.error('Error saving user:', error);
};


// --- Inquiries ---

export const getInquiries = async (): Promise<Inquiry[]> => {
    const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
    if (error) return [];
    return data || [];
};

export const updateInquiry = async (id: string, answer: string): Promise<void> => {
    const { error } = await supabase
        .from('inquiries')
        .update({
            status: 'answered',
            answer: answer,
            answered_at: new Date().toISOString()
        })
        .eq('id', id);
    if (error) console.error('Error updating inquiry:', error);
};

export const createInquiry = async (inquiry: Omit<Inquiry, 'id' | 'answer' | 'date'> & { email?: string }): Promise<void> => {
    const { error } = await supabase
        .from('inquiries')
        .insert({
            author: inquiry.author,
            title: inquiry.title,
            content: inquiry.content,
            status: 'pending',
            email: inquiry.email // Ensure this column exists in DB, or remove if not needed. Metadata suggests it might be 'author' as name?
        });

    if (error) {
        console.error('Error creating inquiry:', error);
        throw error;
    }
};

// --- Comments ---
export const getComments = async (articleId: string, client = supabase): Promise<Comment[]> => {
    const { data, error } = await client
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('date', { ascending: true });
    if (error) return [];

    return (data || []).map(item => ({
        id: String(item.id),
        articleId: item.article_id,
        author: item.author,
        content: item.content,
        date: item.date,
        parentId: item.parent_id
    }));
};

export const addComment = async (comment: Comment, client = supabase): Promise<void> => {
    // Exclude ID to allow DB to auto-generate (BigInt or UUID)
    const { error } = await client
        .from('comments')
        .insert({
            // id: comment.id, <--- Let DB handle this
            article_id: comment.articleId,
            author: comment.author,
            content: comment.content,
            date: new Date().toISOString(),
            parent_id: comment.parentId // 부모 ID 추가
        });
    if (error) {
        console.error('Error adding comment:', error);
        alert('댓글 등록 중 오류가 발생했습니다: ' + error.message);
    }
};

export const deleteComment = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);
    if (error) console.error('Error deleting comment:', error);
};

export const updateComment = async (comment: Comment): Promise<void> => {
    const { error } = await supabase
        .from('comments')
        .update({
            content: comment.content,
            date: new Date().toISOString()
        })
        .eq('id', comment.id);
    if (error) console.error('Error updating comment:', error);
};

export const getCommentsByAuthor = async (author: string): Promise<Comment[]> => {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('author', author)
        .order('date', { ascending: false })
        .limit(100);
    if (error) return [];

    return (data || []).map(item => ({
        id: String(item.id),
        articleId: item.article_id,
        author: item.author,
        content: item.content,
        date: item.date,
        parentId: item.parent_id
    }));
};

// --- Partnership Inquiries ---

export const uploadPartnershipFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `partnerships/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('partnership_files')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
    }

    const { data } = supabase.storage
        .from('partnership_files')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export const addPartnershipInquiry = async (inquiry: Omit<PartnershipInquiry, 'id' | 'createdAt' | 'status'>, file?: File): Promise<void> => {
    let fileUrl = inquiry.fileUrl;

    if (file) {
        const uploadedUrl = await uploadPartnershipFile(file);
        if (uploadedUrl) fileUrl = uploadedUrl;
    }

    const { error } = await supabase
        .from('partnership_inquiries')
        .insert({
            company_name: inquiry.companyName,
            contact_person: inquiry.contactPerson,
            email: inquiry.email,
            phone: inquiry.phone,
            title: inquiry.title,
            content: inquiry.content,
            file_url: fileUrl,
            status: 'pending'
        });

    if (error) {
        console.error('Error adding partnership inquiry:', error);
        throw error;
    }
};

export const getPartnershipInquiries = async (client = supabase): Promise<PartnershipInquiry[]> => {
    const { data, error } = await client
        .from('partnership_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching partnership inquiries:', error);
        return [];
    }

    return (data || []).map(item => ({
        id: item.id,
        companyName: item.company_name,
        contactPerson: item.contact_person,
        email: item.email,
        phone: item.phone,
        title: item.title,
        content: item.content,
        fileUrl: item.file_url,
        createdAt: item.created_at,
        status: item.status
    }));
};

export const updatePartnershipStatus = async (id: string, status: PartnershipInquiry['status'], client = supabase): Promise<void> => {
    const { error } = await client
        .from('partnership_inquiries')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating partnership status:', error);
        throw error;
    }
};

export const deletePartnershipInquiry = async (id: string, client = supabase): Promise<void> => {
    const { error } = await client
        .from('partnership_inquiries')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting partnership inquiry:', error);
        throw error;
    }
};

// --- Stats & Tracking ---
export const getStats = async (client = supabase) => {
    // 1. Total Articles
    const { count: articleCount } = await client
        .from('articles')
        .select('*', { count: 'exact', head: true });

    // 2. Pending Inquiries
    const { count: inquiryCount } = await client
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    // 3. Total Visitors (Real Data from daily_visits)
    const { data: visits } = await client
        .from('daily_visits')
        .select('count');

    // Sum of all daily visits
    const totalVisitors = visits?.reduce((sum, v) => sum + (v.count || 0), 0) || 0;

    return {
        totalVisitors: totalVisitors,
        totalArticles: articleCount || 0,
        pendingInquiries: inquiryCount || 0
    };
};

export const getWeeklyStats = async (client = supabase) => {
    // Fetch last 7 days from daily_visits
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Include today

    const { data } = await client
        .from('daily_visits')
        .select('date, count')
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

    return data || [];
};

export const incrementArticleView = async (articleId: string) => {
    const { error } = await supabase.rpc('increment_article_view', { article_id: articleId });
    if (error) console.error('Error incrementing view:', error);
};

export const recordVisit = async () => {
    const { error } = await supabase.rpc('increment_visit');
    if (error) {
        console.error('Error recording visit:', error);
    }
};

export const getPendingInquiriesCount = async (): Promise<number> => {
    const { count, error } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
    if (error) return 0;
    return count || 0;
};

/**
 * 최근 특정 시간 이내에 새로운 댓글이 달린 기사의 ID 목록을 조회합니다.
 */
export const getArticlesWithNewComments = async (hours = 12, client = supabase): Promise<string[]> => {
    const targetDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // date 컬럼이 ISO 형식 문자열이므로 gte로 비교 가능
    const { data, error } = await client
        .from('comments')
        .select('article_id')
        .gte('date', targetDate);

    if (error) {
        console.error('Error fetching new comments articles:', error);
        return [];
    }

    if (data && data.length > 0) {
        console.log(`[Admin Notice] Found ${data.length} new comments in last ${hours}h:`, data);
    }

    // 중복 제거된 article_id 목록 반환
    const articleIds = Array.from(new Set(data.map(item => item.article_id)));
    return articleIds;
};

// --- Menus ---

export const getMenus = async (client = supabase): Promise<Menu[]> => {
    const { data, error } = await client
        .from('menus')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching menus:', error);
        return [];
    }
    return data || [];
};

/**
 * 메뉴 목록을 일괄 저장합니다. (순서 및 계층 구조 반영)
 * 메뉴 명칭이 변경된 경우, 해당 카테고리로 작성된 기존 기사들의 정보도 함께 업데이트합니다.
 */
export const saveMenus = async (menus: Menu[], client = supabase): Promise<{ success: boolean; error?: any }> => {
    try {
        // 1. 기존 메뉴 정보를 불러와 명칭 변경 감지 준비
        const { data: existingMenus } = await client.from('menus').select('*');
        const existingMap = new Map((existingMenus || []).map(m => [m.id, m]));

        // 2. 모든 메뉴를 upsert (id가 있으면 update, 없으면 insert)
        const { error: upsertError } = await client
            .from('menus')
            .upsert(menus.map(m => ({
                id: m.id,
                name: m.name,
                parent_id: m.parent_id,
                sort_order: m.sort_order,
                is_visible: m.is_visible
            })));

        if (upsertError) throw upsertError;

        // 3. 노출 여부 및 명칭 변경 시 기사 데이터 동기화 (Article Sync)
        for (const menu of menus) {
            const oldMenu = existingMap.get(menu.id);
            if (oldMenu) {
                // 노출 여부 변경 감지: 미노출 시 'draft', 노출 시 'published'로 일괄 변경
                if (oldMenu.is_visible !== menu.is_visible) {
                    const newStatus = menu.is_visible ? 'published' : 'draft';
                    console.log(`Syncing article status: Menu [${menu.name}] Visibility ${oldMenu.is_visible} -> ${menu.is_visible} (Status: ${newStatus})`);
                    
                    if (!menu.parent_id) {
                        // 대분류 노출 상태 변경 시 해당 카테고리의 모든 기사 상태 업데이트
                        await client
                            .from('articles')
                            .update({ status: newStatus })
                            .eq('category', menu.name);
                    } else {
                        // 소분류 노출 상태 변경 시 해당 소분류(prefix) 기사 상태 업데이트
                        await client
                            .from('articles')
                            .update({ status: newStatus })
                            .eq('prefix', menu.name);
                    }
                }

                // 명칭 변경 감지 (기존 로직)
                if (oldMenu.name !== menu.name) {
                    console.log(`Syncing article names: Category/Prefix [${oldMenu.name}] -> [${menu.name}]`);
                    
                    if (!menu.parent_id) {
                        // 대분류(Category) 명칭 변경
                        await client
                            .from('articles')
                            .update({ category: menu.name })
                            .eq('category', oldMenu.name);
                    } else {
                        // 소분류(Prefix) 명칭 변경
                        await client
                            .from('articles')
                            .update({ prefix: menu.name })
                            .eq('prefix', oldMenu.name);
                    }
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error in saveMenus:', error);
        return { success: false, error };
    }
};

export const deleteMenu = async (id: string, client = supabase): Promise<{ success: boolean; error?: any }> => {
    try {
        // 1. 삭제할 메뉴 정보 조회 (연관 기사 처리를 위해 이름과 대/소분류 여부 확인)
        const { data: menuToDelete, error: fetchError } = await client
            .from('menus')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !menuToDelete) {
            throw new Error('삭제할 메뉴를 찾을 수 없습니다.');
        }

        const isSubCategory = !!menuToDelete.parent_id;

        // 2. 연관된 기사 처리 (대표님 지시사항 반영)
        if (!isSubCategory) {
            // [대분류 삭제]
            // - 해당 카테고리의 기사를 '카테고리 없음'으로 변경
            // - 기사 상태를 'draft'(미게재)로 전환
            await client
                .from('articles')
                .update({ 
                    category: '카테고리 없음', 
                    status: 'draft',
                    prefix: null // 대분류가 사라지면 소분류 의미가 없으므로 함께 제거
                })
                .eq('category', menuToDelete.name);
            
            // 하위 소분류들도 함께 삭제 처리가 필요할 수 있으나, 
            // 현재 DB 제약 조건이 없다면 수동으로 하위 메뉴도 삭제하거나 알림창에서 예고한대로 진행
        } else {
            // [소분류(말머리) 삭제]
            // - 기사의 소분류(prefix)만 제거
            // - 대분류 및 게재 상태(published)는 유지
            await client
                .from('articles')
                .update({ prefix: null })
                .eq('prefix', menuToDelete.name);
        }

        // 3. 실제 메뉴 레코드 삭제
        const { error: deleteError } = await client
            .from('menus')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return { success: true };
    } catch (error: any) {
        console.error('Error in deleteMenu (with sync):', error);
        return { success: false, error };
    }
};
