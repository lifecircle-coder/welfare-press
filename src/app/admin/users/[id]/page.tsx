'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUsers, updateUser, getComments, getInquiries, getArticles } from '@/lib/services';
import type { User, Article, Comment, Inquiry } from '@/lib/services';
import { ArrowLeft, Edit, Save, Trash2, Shield, Clock, FileText, MessageSquare, Key } from 'lucide-react';
import Link from 'next/link';
import { adminSupabase } from '@/lib/supabaseClient';

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState({ articles: 0, comments: 0, inquiries: 0 });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'activity'>('info');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Edit states
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editGrade, setEditGrade] = useState('');
    const [editName, setEditName] = useState('');

    // Password change states
    const [showPwModal, setShowPwModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');


    useEffect(() => {
        const loadDetail = async () => {
            if (!userId) return;

            // 1. Check current operator's role and permission
            const { data: { session } } = await adminSupabase.auth.getSession();
            if (!session?.user) return;

            const operatorId = session.user.id;
            const operatorRole = session.user.user_metadata?.role;
            setCurrentUser({ id: operatorId, role: operatorRole });

            // Reporter can only see their own profile
            if (operatorRole === 'reporter' && operatorId !== userId) {
                alert('자신의 프로필만 열람할 수 있습니다.');
                router.push('/admin/users');
                return;
            }

            // Fetch User
            const dbUser = await import('@/lib/services').then(s => s.getUserById(userId));

            if (dbUser) {
                setUser(dbUser);
                setEditGrade(dbUser.grade || 'Lv.1');
                setEditName(dbUser.name);


                // Parallel fetch for stats
                const [articles, comments, inquiries] = await Promise.all([
                    import('@/lib/services').then(s => s.getArticles()).then(list => list.filter(a => a.author === dbUser.name)),
                    import('@/lib/services').then(s => s.getCommentsByAuthor(dbUser.name)),
                    import('@/lib/services').then(s => s.getInquiries()).then(list => list.filter(i => i.author === dbUser.name))
                ]);

                setStats({
                    articles: articles.length,
                    comments: comments.length,
                    inquiries: inquiries.length
                });

                const activity = [
                    ...articles.map(a => ({ type: '기사 작성', title: a.title, date: a.date, id: a.id })),
                    ...comments.map(c => ({ type: '댓글 작성', title: c.content, date: c.date, id: c.id })),
                    ...inquiries.map(i => ({ type: '문의 등록', title: i.title, date: i.date, id: i.id }))
                ].filter(act => !!act.date).sort((a, b) => {
                    const timeA = a.date ? new Date(a.date).getTime() : 0;
                    const timeB = b.date ? new Date(b.date).getTime() : 0;
                    return timeB - timeA;
                });


                setRecentActivity(activity);

            } else {
                alert('사용자를 찾을 수 없습니다.');
                router.push('/admin/users');
            }
        };
        loadDetail();
    }, [userId, router]);

    const handleSaveRole = () => {
        if (!user) return;
        const updated = { ...user, grade: editGrade };
        updateUser(updated);
        setUser(updated);
        setIsEditing(false);
        alert('등급이 수정되었습니다.');
    };

    const getByteLength = (str: string) => {
        return new TextEncoder().encode(str).length;
    };

    const handleSaveName = async () => {
        if (!user) return;
        if (!editName.trim()) return alert('이름을 입력해주세요.');
        
        const byteLen = getByteLength(editName);
        if (byteLen > 50) {
            return alert(`이름은 최대 50byte(한글 약 25자)를 초과할 수 없습니다. (현재: ${byteLen}byte)`);
        }

        if (confirm(`이름을 "${editName}"(으)로 수정하시겠습니까? \n수정 시 기사, 댓글, 문의의 작성자 명도 함께 변경됩니다.`)) {
            const { updateUserAction } = await import('../actions');
            const result = await updateUserAction({
                userId: user.id,
                oldName: user.name,
                newName: editName
            });

            if (result.success) {
                setUser({ ...user, name: editName });
                setIsEditingName(false);
                alert('이름이 성공적으로 수정되었습니다.');
                router.refresh(); // 전역 반영을 위해 새로고침 유도
            } else {
                alert('수정 실패: ' + result.error);
            }
        }
    };

    const handleDeleteUser = async () => {
        if (!user) return;
        if (confirm('정말로 이 계정을 삭제하시겠습니까? \n삭제된 정보는 복구할 수 없습니다.')) {
            const { deleteUserAction } = await import('../actions');
            const result = await deleteUserAction(user.id);
            if (result.success) {
                alert('계정이 삭제되었습니다.');
                router.push('/admin/users');
            } else {
                alert('삭제 실패: ' + result.error);
            }
        }
    };


    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        try {
            const { error } = await adminSupabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            alert('비밀번호가 성공적으로 변경되었습니다.');
            setShowPwModal(false);
            setNewPassword('');
        } catch (err: any) {
            alert('비밀번호 변경 실패: ' + err.message);
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-500 animate-pulse">상세 정보를 불러오는 중...</div>;

    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8 text-sm">
                <Link href="/admin/users" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    목록으로 돌아가기
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: User Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                        <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-primary border-4 border-white shadow-inner">
                            {user.name[0]}
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                            {isEditingName ? (
                                <div className="flex gap-1 items-center">
                                    <input 
                                        type="text" 
                                        className="border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={handleSaveName} className="p-1 text-primary hover:bg-blue-50 rounded"><Save size={16}/></button>
                                    <button onClick={() => { setIsEditingName(false); setEditName(user.name); }} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><ArrowLeft size={16}/></button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => setIsEditingName(true)}
                                            className="p-1 text-gray-400 hover:text-primary transition-colors"
                                            title="이름 수정"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <p className="text-gray-500 text-sm mb-4">
                            {user.email.replace('@welfare-press.admin', '')}
                        </p>

                        <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-6">
                            {user.grade}
                        </div>

                        <div className="border-t border-gray-50 pt-4 text-left space-y-3 text-sm text-gray-600">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">가입일</span>
                                <span className="font-medium">{new Date(user.joinDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">권한</span>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${user.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {user.role === 'admin' ? '최고관리자' : user.role === 'reporter' ? '기자' : '일반'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">전문분야</span>
                                <span className="font-medium">{user.specialty}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        {/* Grade management for Admin only */}
                        {isAdmin && (
                            <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm border-b pb-2">
                                    <Shield size={16} className="text-primary" /> 등급 변경
                                </h4>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <select
                                            className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
                                            value={editGrade}
                                            onChange={(e) => setEditGrade(e.target.value)}
                                        >
                                            <option value="Lv.1">Lv.1 (일반)</option>
                                            <option value="Lv.2">Lv.2 (우수)</option>
                                            <option value="Lv.8">Lv.8 (기자)</option>
                                            <option value="Lv.99">Lv.99 (관리자)</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveRole} className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-600 shadow-sm transition-all">저장</button>
                                            <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all">취소</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                                    >
                                        <Edit size={14} /> 등급 변경하기
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Password management for everyone on their own page, or admin for everyone */}
                        {(isAdmin || currentUser?.id === userId) && (
                            <div className={isAdmin ? "pt-4 border-t border-gray-50" : ""}>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm border-b pb-2">
                                    <Key size={16} className="text-orange-500" /> 보안 설정
                                </h4>

                                {showPwModal ? (
                                    <div className="space-y-3">
                                        <input
                                            type="password"
                                            className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                            placeholder="새 비밀번호 (6자 이상)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={handleUpdatePassword} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition-all">변경 완료</button>
                                            <button onClick={() => setShowPwModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-bold">취소</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowPwModal(true)}
                                        className="w-full border border-orange-100 text-orange-600 py-2.5 rounded-lg font-bold text-sm hover:bg-orange-50 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                                    >
                                        <Key size={14} /> 비밀번호 수정
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Delete User Section - Admin only */}
                        {isAdmin && user.id !== currentUser?.id && (
                            <div className="pt-4 border-t border-gray-50">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm border-b pb-2">
                                    <Trash2 size={16} className="text-red-500" /> 위험 구역
                                </h4>
                                <button
                                    onClick={handleDeleteUser}
                                    className="w-full border border-red-100 text-red-600 py-2.5 rounded-lg font-bold text-sm hover:bg-red-50 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                                >
                                    <Trash2 size={14} /> 계정 영구 삭제
                                </button>
                            </div>
                        )}
                    </div>
                </div>


                {/* Right Column: Activity & Stats */}
                <div className="md:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <div className="text-gray-500 text-xs font-bold mb-1">작성 기사</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.articles}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <div className="text-gray-500 text-xs font-bold mb-1">작성 댓글</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.comments}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                            <div className="text-gray-500 text-xs font-bold mb-1">문의 내역</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.inquiries}</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex border-b border-gray-100">
                            <button
                                className={`px-6 py-4 font-bold text-sm ${activeTab === 'info' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('info')}
                            >
                                기본 정보
                            </button>
                            <button
                                className={`px-6 py-4 font-bold text-sm ${activeTab === 'activity' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('activity')}
                            >
                                활동 로그
                            </button>
                        </div>

                        <div className="p-6">
                            {activeTab === 'info' && (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-2">연동 계정 정보</h4>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                <span className="font-bold text-green-600 text-xs">G</span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">Google 계정</div>
                                                <div className="text-xs text-gray-500">{user.email} (연동됨)</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-2">계정 상태</h4>
                                        <p className="text-sm text-green-600 font-bold flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            정상 활동 중
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div className="space-y-4">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.map((act, idx) => (
                                            <div key={idx} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                                <div className="mt-1">
                                                    {act.type === '기사 작성' && <FileText size={16} className="text-blue-500" />}
                                                    {act.type === '댓글 작성' && <MessageSquare size={16} className="text-green-500" />}
                                                    {act.type === '문의 등록' && <Clock size={16} className="text-orange-500" />}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">{act.date} &middot; {act.type}</div>
                                                    <p className="text-sm text-gray-900 font-medium line-clamp-1">{act.title}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            최근 활동 내역이 없습니다.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
