import { supabase } from './supabaseClient';

export interface User {
    id: string;
    name: string;
    email: string;
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
    author: string;
    date: string;
    views: number;
    status: 'published' | 'draft';
    summary?: string;
    content?: string;
    hashtags?: string[];
    thumbnail?: string;
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

// --- Articles ---

/**
 * 목록용 기사 조회 (본문 content 제외, 페이징 지원)
 */
export const getArticles = async (limit = 20, offset = 0): Promise<Article[]> => {
    const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, prefix, author, date, views, status, summary, hashtags, thumbnail')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
    return data || [];
};

/**
 * 카테고리별 기사 조회 (본문 content 제외, 페이징 지원)
 */
export const getArticlesByCategory = async (category: string, limit = 20, offset = 0): Promise<Article[]> => {
    const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, prefix, author, date, views, status, summary, hashtags, thumbnail')
        .eq('category', category)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching articles by category:', error);
        return [];
    }
    return data || [];
};

/**
 * 히어로 섹션 전용 기사 조회 (각 카테고리별 최신 1건씩만 효율적으로 호출)
 */
export const getHeroArticles = async (): Promise<Article[]> => {
    const targetCategories = ['건강·의료', '임신·육아', '일자리·취업', '생활·안전', '주거·금융'];

    // 개별 쿼리 병렬 처리로 전체 속도 향상
    const promises = targetCategories.map(cat =>
        supabase
            .from('articles')
            .select('id, title, category, author, date, summary, thumbnail')
            .eq('category', cat)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
    );

    const results = await Promise.all(promises);
    return results
        .filter(r => r.data)
        .map(r => r.data as Article);
};

export const getArticleById = async (id: string): Promise<Article | undefined> => {
    const { data, error } = await supabase
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

export const saveArticle = async (article: Article): Promise<{ success: boolean; error?: any }> => {
    // Check if updating or inserting
    const existing = await getArticleById(article.id);

    // Auto-extract thumbnail from content if not present
    let thumbnail = article.thumbnail;
    if (!thumbnail && article.content) {
        const imgMatch = article.content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
            thumbnail = imgMatch[1];
        }
    }

    if (existing) {
        const { error } = await supabase
            .from('articles')
            .update({ ...article, thumbnail: thumbnail })
            .eq('id', article.id);

        if (error) {
            console.error('Error updating article:', error);
            return { success: false, error };
        }
    } else {
        const { error } = await supabase
            .from('articles')
            .insert({ ...article, thumbnail: thumbnail });

        if (error) {
            console.error('Error inserting article:', error);
            return { success: false, error };
        }
    }

    return { success: true };
};

/**
 * 기사 검색 (본문 content 제외)
 */
export const searchArticles = async (query: string): Promise<Article[]> => {
    if (!query.trim()) return [];

    const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, prefix, author, date, views, status, summary, hashtags, thumbnail')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
        .order('created_at', { ascending: false });

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

export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
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
        .order('created_at', { ascending: false });
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
export const getComments = async (articleId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
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

export const addComment = async (comment: Comment): Promise<void> => {
    // Exclude ID to allow DB to auto-generate (BigInt or UUID)
    const { error } = await supabase
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
        .order('date', { ascending: false });
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
export const getStats = async () => {
    // 1. Total Articles
    const { count: articleCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });

    // 2. Pending Inquiries
    const { count: inquiryCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    // 3. Total Visitors (Real Data from daily_visits)
    const { data: visits } = await supabase
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

export const getWeeklyStats = async () => {
    // Fetch last 7 days from daily_visits
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Include today

    const { data } = await supabase
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
