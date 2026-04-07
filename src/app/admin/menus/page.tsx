'use client';

import { useState, useEffect } from 'react';
import { Settings, Plus, Save, Move, Trash2, Eye, EyeOff, Loader2, X, Check } from 'lucide-react';
import { Menu, getMenus, saveMenus, deleteMenu, getLinkedArticleCount } from '@/lib/services';
import { adminSupabase } from '@/lib/supabaseClient';
import { SortableMenuTree } from '@/components/admin/menus/SortableMenuTree';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function MenuManagementPage() {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState<Partial<Menu> | null>(null);

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        setLoading(true);
        try {
            const data = await getMenus(adminSupabase);
            setMenus(data);
        } catch (err) {
            console.error('Failed to fetch menus', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const result = await saveMenus(menus, adminSupabase);
            if (result.success) {
                alert('메뉴 구성이 성공적으로 저장되었습니다.');
                await fetchMenus();
            } else {
                alert('저장 중 오류가 발생했습니다: ' + result.error?.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleAddClick = (parentId: string | null = null) => {
        setEditingMenu({
            id: crypto.randomUUID(), // Temp ID for new items
            name: '',
            parent_id: parentId,
            sort_order: menus.length,
            is_visible: true
        });
        setIsEditModalOpen(true);
    };

    const handleEditClick = (menu: Menu) => {
        setEditingMenu(menu);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = async (id: string) => {
        const menuToDelete = menus.find(m => m.id === id);
        if (!menuToDelete) return;

        const isSub = !!menuToDelete.parent_id;
        const count = await getLinkedArticleCount(menuToDelete.name, isSub);
        
        let confirmMsg = isSub ? `정말 '${menuToDelete.name}' 소분류를 삭제하시겠습니까?` : '정말 이 메뉴를 삭제하시겠습니까?\n하위 메뉴가 있다면 함께 삭제됩니다.';
        
        if (count > 0) {
            if (!isSub) {
                confirmMsg = `⚠️ 주의: 이 메뉴('${menuToDelete.name}')로 작성된 기사가 ${count}개 있습니다.\n삭제 시 기사는 '카테고리 없음'으로 변경되고 미게재(Draft) 상태가 됩니다. 정말 삭제하시겠습니까?`;
            } else {
                // 소분류 삭제 시 기사가 있는 경우 대분류 삭제 시와 같은 톤의 경고창 노출
                confirmMsg = `⚠️ 주의: 이 소분류('${menuToDelete.name}')로 작성된 기사가 ${count}개 있습니다.\n삭제 시 소분류 정보만 삭제되며 대분류 기사로 유지됩니다. 정말 삭제하시겠습니까?`;
            }
        }

        if (!confirm(confirmMsg)) return;
        
        const result = await deleteMenu(id, adminSupabase);
        if (result.success) {
            await fetchMenus();
        } else {
            alert('삭제 실패: ' + result.error?.message);
        }
    };

    const handleToggleVisibility = async (menu: Menu) => {
        const updated = menus.map(m => 
            m.id === menu.id ? { ...m, is_visible: !m.is_visible } : m
        );
        setMenus(updated);
        // 즉시 반영은 하지 않고 '저장' 버튼을 누르도록 유도 (Batch update)
    };

    const saveEdit = () => {
        if (!editingMenu?.name) return alert('메뉴 명을 입력해주세요.');
        
        const exists = menus.find(m => m.id === editingMenu.id);
        if (exists) {
            setMenus(menus.map(m => m.id === editingMenu.id ? (editingMenu as Menu) : m));
        } else {
            setMenus([...menus, editingMenu as Menu]);
        }
        setIsEditModalOpen(false);
        setEditingMenu(null);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-2xl">
                            <Settings className="text-primary" size={28} />
                        </div>
                        메뉴 관리
                    </h1>
                    <p className="text-gray-500 mt-2">프론트엔드 내비게이션 메뉴와 기사 카테고리를 통합 관리합니다.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => handleAddClick()}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all font-bold shadow-sm"
                    >
                        <Plus size={20} />
                        대분류 추가
                    </button>
                    <button 
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl hover:bg-blue-700 disabled:bg-gray-400 transition-all font-bold shadow-lg shadow-blue-100"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        변경사항 저장
                    </button>
                </div>
            </div>

            {/* Guide Alert */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-3xl mb-8 flex items-start gap-4">
                <div className="bg-blue-500 text-white p-2 rounded-xl shrink-0 shadow-lg shadow-blue-200">
                    <Settings size={20} />
                </div>
                <div className="text-sm text-blue-900 leading-relaxed">
                    <p className="font-bold text-lg mb-2">💡 스마트 메뉴 관리 안내</p>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                            <Check size={14} className="text-blue-500" />
                            <span>메뉴를 <strong>드래그</strong>하여 순서를 변경하거나 2depth(소분류) 구성을 할 수 있습니다.</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check size={14} className="text-blue-500" />
                            <span><strong>미노출</strong> 처리된 카테고리의 기사는 프론트엔드에서 보이지 않게 됩니다.</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check size={14} className="text-blue-500" />
                            <span>이름 변경 시 해당 카테고리로 작성된 <strong>기사 메타데이터</strong>도 함께 업데이트됩니다.</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-2 md:p-8 min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <Loader2 className="animate-spin text-primary mb-4" size={48} />
                        <p className="text-gray-500 animate-pulse font-medium">메뉴 정보를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <SortableMenuTree 
                        menus={menus}
                        onMenusChange={setMenus}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        onToggleVisibility={handleToggleVisibility}
                    />
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {menus.find(m => m.id === editingMenu?.id) ? '메뉴 수정' : '새 메뉴 추가'}
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">메뉴 이름</label>
                                <input 
                                    type="text"
                                    value={editingMenu?.name || ''}
                                    onChange={(e) => setEditingMenu({ ...editingMenu!, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg"
                                    placeholder="예: 사회복지, 시니어뉴스"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">상위 메뉴 설정</label>
                                <select 
                                    value={editingMenu?.parent_id || ''}
                                    onChange={(e) => setEditingMenu({ ...editingMenu!, parent_id: e.target.value || null })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                >
                                    <option value="">대분류 (상위 메뉴 없음)</option>
                                    {menus.filter(m => !m.parent_id && m.id !== editingMenu?.id).map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-2">최대 2단계까지만 지원됩니다.</p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div>
                                    <p className="font-bold text-gray-900">사용자 노출</p>
                                    <p className="text-xs text-gray-500">프론트엔드 내비게이션 노출 여부</p>
                                </div>
                                <button 
                                    onClick={() => setEditingMenu({ ...editingMenu!, is_visible: !editingMenu?.is_visible })}
                                    className={cn(
                                        "w-14 h-8 rounded-full transition-all relative",
                                        editingMenu?.is_visible ? "bg-primary" : "bg-gray-300"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm",
                                        editingMenu?.is_visible ? "left-7" : "left-1"
                                    )} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all"
                            >
                                취소
                            </button>
                            <button 
                                onClick={saveEdit}
                                className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
