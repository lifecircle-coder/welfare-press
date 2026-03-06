'use client';

import { Search, MoreHorizontal, UserPlus, ArrowUpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUsers, updateUser, saveUser } from '@/lib/services';
import type { User } from '@/lib/services';
import { useRouter } from 'next/navigation';
import { adminSupabase } from '@/lib/supabaseClient';
import { createReporterAction } from './actions';

export default function UserManagement() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', loginId: '', specialty: '전체', password: '' });
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const loadUsers = async () => {
            const data = await getUsers();

            // Fetch current user and filter if reporter
            const { data: { session } } = await adminSupabase.auth.getSession();
            if (session?.user) {
                const role = session.user.user_metadata?.role;
                setCurrentUser({ id: session.user.id, role });

                if (role === 'reporter') {
                    // Only show self
                    setUsers(data.filter(u => u.id === session.user.id));
                } else {
                    setUsers(data);
                }
            } else {
                setUsers(data);
            }
        };
        loadUsers();
    }, []);

    const handlePromote = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent row click
        if (confirm('이 회원을 기자(Lv.8)로 승격시키겠습니까?')) {
            const target = users.find(u => u.id === id);
            if (target) {
                const updatedUser = { ...target, role: 'reporter' as const, grade: 'Lv.8', specialty: '일반' };
                await updateUser(updatedUser);
                const data = await getUsers(); // Refresh
                setUsers(data);
                alert('승격되었습니다.');
            }
        }
    };

    const handleCreateReporter = async () => {
        if (!newUser.name || !newUser.loginId || !newUser.password) {
            alert('이름, 아이디, 임시 비밀번호를 모두 입력해주세요.');
            return;
        }

        if (newUser.password.length < 6) {
            alert('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        try {
            const result = await createReporterAction({
                name: newUser.name,
                loginId: newUser.loginId,
                password: newUser.password,
                specialty: newUser.specialty
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            const data = await getUsers();
            setUsers(data);
            setShowCreateModal(false);
            setNewUser({ name: '', loginId: '', specialty: '전체', password: '' });
            alert(`기자 계정(${newUser.name})이 성공적으로 등록되었습니다. 아이디: ${newUser.loginId}`);
        } catch (error: any) {
            console.error('Error creating reporter:', error);
            alert('기자 등록 중 오류가 발생했습니다: ' + error.message);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
                {currentUser?.role === 'admin' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        <UserPlus size={18} />
                        기자 직접 등록
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 focus-within:ring-2 focus-within:ring-primary transition-all">
                    <Search size={18} className="text-gray-400" />
                    <input type="text" placeholder="이름 또는 이메일 검색" className="outline-none text-sm w-full" />
                </div>
                <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 outline-none cursor-pointer">
                    <option>전체 등급</option>
                    <option>일반 회원</option>
                    <option>기자</option>
                    <option>관리자</option>
                </select>
            </div>

            {/* User List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 font-medium w-12"><input type="checkbox" /></th>
                            <th className="p-4 font-medium">이름(닉네임)</th>
                            <th className="p-4 font-medium">아이디</th>
                            <th className="p-4 font-medium">등급</th>
                            <th className="p-4 font-medium">전문분야</th>
                            <th className="p-4 font-medium">가입일</th>
                            {currentUser?.role === 'admin' && <th className="p-4 font-medium">관리</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/admin/users/${user.id}`)}
                            >
                                <td className="p-4" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                                <td className="p-4 font-medium text-gray-900">{user.name}</td>
                                <td className="p-4 text-gray-600">
                                    {user.email.replace('@welfare-press.admin', '')}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                        user.role === 'reporter' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {user.grade} ({user.role === 'user' ? '일반' : user.role === 'reporter' ? '기자' : '관리자'})
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600">{user.specialty}</td>
                                <td className="p-4 text-gray-400 text-sm">{user.joinDate}</td>
                                {currentUser?.role === 'admin' && (
                                    <td className="p-4 flex gap-2">
                                        {user.role === 'user' && (
                                            <button
                                                onClick={(e) => handlePromote(e, user.id)}
                                                className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                            >
                                                <ArrowUpCircle size={14} /> 승격
                                            </button>
                                        )}
                                        <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Reporter Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-96 shadow-xl relative animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-4">기자 계정 직접 등록</h3>
                        <div className="space-y-4">
                            <input
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                placeholder="이름 (예: 이철민)"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            />
                            <input
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                placeholder="사용자 아이디 (영문/숫자)"
                                value={newUser.loginId}
                                onChange={(e) => setNewUser({ ...newUser, loginId: e.target.value })}
                            />
                            <input
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                type="text"
                                placeholder="임시 비밀번호 (최소 6자)"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                minLength={6}
                            />
                            <p className="text-[10px] text-gray-500 mt-1 px-1">※ 보안을 위해 6자 이상으로 설정해야 합니다.</p>
                            <select
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                                value={newUser.specialty}
                                onChange={(e) => setNewUser({ ...newUser, specialty: e.target.value })}
                            >
                                <option value="전체">전체 (모든 주제)</option>
                                <option value="일자리">일자리</option>
                                <option value="건강">건강</option>
                                <option value="주거">주거</option>
                                <option value="생활">생활</option>
                                <option value="안전">안전</option>
                            </select>

                            <div className="flex gap-2 justify-end mt-6">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >취소</button>
                                <button
                                    onClick={handleCreateReporter}
                                    className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors font-bold shadow-sm"
                                >
                                    등록하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
