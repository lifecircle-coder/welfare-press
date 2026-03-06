'use client';

import { useState, useEffect, useRef } from 'react';
import { Share2, ThumbsUp, MessageSquare, Send, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { getArticleById, getArticles, getComments, addComment, deleteComment, updateComment, incrementArticleView } from '@/lib/services';
import type { Article, Comment } from '@/lib/services';

export default function ArticleDetail({ params }: { params: { id: string } }) {
    const [article, setArticle] = useState<Article | null>(null);
    const [likes, setLikes] = useState(128);
    const [isLiked, setIsLiked] = useState(false);
    const [relatedNews, setRelatedNews] = useState<Article[]>([]);

    // Comment State
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const initialized = useRef(false);

    useEffect(() => {
        const loadData = async () => {
            // Increment View Count (Once per mount)
            if (!initialized.current) {
                initialized.current = true;
                await incrementArticleView(params.id);
            }

            // Check User Login
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }

            const found = await getArticleById(params.id);
            setArticle(found || null);

            // Suggest related news (exclude current, match tags)
            if (found) {
                const allArticles = await getArticles();
                const currentTags = found.hashtags || [];
                // Filter: must share at least one tag
                const related = allArticles.filter(a =>
                    a.id !== params.id &&
                    a.hashtags?.some(tag => currentTags.includes(tag))
                );

                setRelatedNews(related.slice(0, 5));
            }

            // Load Comments
            const commentsData = await getComments(params.id);
            setComments(commentsData);
        };

        loadData();
    }, [params.id]);

    const handlePostComment = async (parentId?: string) => {
        if (!currentUser) return alert('로그인이 필요합니다.');
        const content = parentId ? replyContent : newComment;
        if (!content.trim()) return;

        const comment: Comment = {
            id: Date.now().toString(),
            articleId: params.id,
            author: currentUser.name,
            content: content,
            date: new Date().toLocaleString('ko-KR'),
            parentId: parentId
        };

        await addComment(comment);
        const updated = await getComments(params.id);
        setComments(updated);

        if (parentId) {
            setReplyContent('');
            setReplyingToId(null);
        } else {
            setNewComment('');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (confirm('댓글을 삭제하시겠습니까?')) {
            await deleteComment(commentId);
            const updated = await getComments(params.id);
            setComments(updated);
        }
    };

    const startEditComment = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    const saveEditComment = async () => {
        if (!editingCommentId) return;
        if (!editContent.trim()) return;

        const commentToUpdate = comments.find(c => c.id === editingCommentId);
        if (commentToUpdate) {
            await updateComment({ ...commentToUpdate, content: editContent });
            const updated = await getComments(params.id);
            setComments(updated);
            setEditingCommentId(null);
        }
    };

    if (!article) {
        return <div className="p-20 text-center">기사를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Category Badge */}
            <span className="inline-block bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-bold mb-4">
                {article.category}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {article.title}
            </h1>

            {/* Metadata */}
            <div className="flex items-center text-gray-500 text-sm mb-8 border-b border-gray-100 pb-6">
                <span className="font-medium text-gray-700 mr-4">{article.author}</span>
                <span className="mr-4">{article.date}</span>
                <span>조회 {article.views}</span>
            </div>

            {/* AI Summary Box */}
            <div className="bg-gray-50 border-l-4 border-primary p-6 rounded-r-lg mb-10">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    🤖 AI 3줄 요약
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                    {article.summary}
                </p>
            </div>

            {/* Content Body */}
            <article
                className="prose prose-lg max-w-none text-gray-800 leading-loose prose-headings:font-bold prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />

            {/* Tags */}
            <div className="mt-10 flex gap-2 flex-wrap">
                {article.hashtags?.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm cursor-pointer hover:bg-gray-200">
                        #{tag}
                    </span>
                ))}
            </div>

            {/* Action Buttons Removed as per user request */}

            {/* Related News */}
            <div className="mt-12 mb-16">
                <h3 className="text-xl font-bold text-gray-900 mb-4">관련 뉴스</h3>
                <ul className="space-y-3">
                    {relatedNews.length > 0 ? relatedNews.map(news => (
                        <li key={news.id}>
                            <Link href={`/article/${news.id}`} className="flex items-center justify-between group hover:bg-gray-50 p-3 rounded-lg transition-colors">
                                <span className="text-lg text-gray-700 group-hover:text-primary truncate flex-1 pr-4">{news.title}</span>
                                <span className="text-sm text-gray-400 whitespace-nowrap">{news.date}</span>
                            </Link>
                        </li>
                    )) : (
                        <p className="text-gray-500">관련된 기사가 없습니다.</p>
                    )}
                </ul>
            </div>

            {/* Comment Section (Functional) */}
            <div className="bg-gray-50 rounded-xl p-6 md:p-8" id="comments">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageSquare size={24} />
                    댓글 <span className="text-primary">{comments.length}</span>
                </h3>

                {/* Comment Input */}
                <div className="mb-8">
                    {currentUser ? (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="소중한 의견을 남겨주세요."
                                    className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-white"
                                ></textarea>
                            </div>
                            <button
                                onClick={() => handlePostComment()}
                                className="h-24 px-6 bg-primary text-white rounded-lg font-bold hover:bg-blue-600 flex flex-col items-center justify-center gap-1"
                            >
                                <Send size={20} />
                                등록
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg text-center border border-gray-200">
                            <p className="text-gray-500 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
                            <Link href="/login" className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600">
                                로그인하기
                            </Link>
                        </div>
                    )}
                </div>

                {/* Comment List */}
                <div className="space-y-6">
                    {comments.length > 0 ? (
                        /* Render top-level comments and their replies */
                        comments.filter(c => !c.parentId).map((comment) => (
                            <div key={comment.id} className="space-y-4">
                                <CommentItem
                                    comment={comment}
                                    currentUser={currentUser}
                                    editingCommentId={editingCommentId}
                                    editContent={editContent}
                                    setEditingCommentId={setEditingCommentId}
                                    setEditContent={setEditContent}
                                    saveEditComment={saveEditComment}
                                    handleDeleteComment={handleDeleteComment}
                                    replyingToId={replyingToId}
                                    setReplyingToId={setReplyingToId}
                                    replyContent={replyContent}
                                    setReplyContent={setReplyContent}
                                    handlePostReply={() => handlePostComment(comment.id)}
                                />

                                {/* Replies */}
                                <div className="ml-8 space-y-4 border-l-2 border-gray-200 pl-4">
                                    {comments.filter(c => c.parentId === comment.id).map(reply => (
                                        <CommentItem
                                            key={reply.id}
                                            comment={reply}
                                            isReply
                                            currentUser={currentUser}
                                            editingCommentId={editingCommentId}
                                            editContent={editContent}
                                            setEditingCommentId={setEditingCommentId}
                                            setEditContent={setEditContent}
                                            saveEditComment={saveEditComment}
                                            handleDeleteComment={handleDeleteComment}
                                            replyingToId={replyingToId}
                                            setReplyingToId={setReplyingToId}
                                            replyContent={replyContent}
                                            setReplyContent={setReplyContent}
                                            handlePostReply={() => handlePostComment(comment.id)} // Reply to parent
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 py-4">아직 작성된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-component for individual comments/replies to handle repetitive UI
function CommentItem({
    comment,
    isReply,
    currentUser,
    editingCommentId,
    editContent,
    setEditingCommentId,
    setEditContent,
    saveEditComment,
    handleDeleteComment,
    replyingToId,
    setReplyingToId,
    replyContent,
    setReplyContent,
    handlePostReply
}: any) {
    return (
        <div className={`pb-4 ${!isReply ? 'border-b border-gray-100 last:border-0' : ''}`}>
            {editingCommentId === comment.id ? (
                <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-primary">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        rows={3}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingCommentId(null)} className="px-3 py-1.5 text-sm text-gray-500">취소</button>
                        <button onClick={saveEditComment} className="px-3 py-1.5 text-sm bg-primary text-white rounded font-bold">저장</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{comment.author}</span>
                            <span className="text-[10px] text-gray-400">{comment.date}</span>
                        </div>
                        <div className="flex gap-2">
                            {!isReply && (
                                <button
                                    onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                                    className="text-xs text-gray-500 hover:text-primary font-bold transition-colors"
                                >
                                    답글
                                </button>
                            )}
                            {currentUser?.name === comment.author && (
                                <>
                                    <button onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); }} className="text-gray-400 hover:text-primary p-1"><Pencil size={14} /></button>
                                    <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{comment.content}</p>

                    {/* Reply Input */}
                    {replyingToId === comment.id && (
                        <div className="mt-4 flex gap-2">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="답글을 남겨주세요."
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-white text-sm"
                                rows={2}
                            />
                            <button
                                onClick={handlePostReply}
                                className="px-4 bg-primary text-white rounded-lg font-bold hover:bg-blue-600 flex items-center justify-center"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
