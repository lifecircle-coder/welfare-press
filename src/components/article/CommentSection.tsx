'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getComments, addComment, deleteComment, updateComment } from '@/lib/services';
import type { Comment } from '@/lib/services';

interface CommentSectionProps {
    articleId: string;
    initialComments: Comment[];
}

export default function CommentSection({ articleId, initialComments }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const handlePostComment = async (parentId?: string) => {
        if (!currentUser) return alert('로그인이 필요합니다.');
        const content = parentId ? replyContent : newComment;
        if (!content.trim()) return;

        const comment: Comment = {
            id: Date.now().toString(),
            articleId: articleId,
            author: currentUser.name,
            content: content,
            date: new Date().toISOString(), // Use ISO for consistency
            parentId: parentId
        };

        await addComment(comment);
        const updated = await getComments(articleId);
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
            const updated = await getComments(articleId);
            setComments(updated);
        }
    };

    const saveEditComment = async () => {
        if (!editingCommentId || !editContent.trim()) return;
        const commentToUpdate = comments.find(c => c.id === editingCommentId);
        if (commentToUpdate) {
            await updateComment({ ...commentToUpdate, content: editContent });
            const updated = await getComments(articleId);
            setComments(updated);
            setEditingCommentId(null);
        }
    };

    return (
        <div className="bg-gray-50 rounded-xl p-6 md:p-8 mt-10" id="comments">
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
                                className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-white text-gray-700"
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
                    comments.filter(c => !c.parentId).map((comment) => (
                        <div key={comment.id} className="space-y-4">
                            <SmallCommentItem
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
                                    <SmallCommentItem
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
                                        handlePostReply={() => handlePostComment(comment.id)}
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
    );
}

function SmallCommentItem({
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
    const formattedDate = new Date(comment.date).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

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
                            <span className="text-[10px] text-gray-400">{formattedDate}</span>
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
