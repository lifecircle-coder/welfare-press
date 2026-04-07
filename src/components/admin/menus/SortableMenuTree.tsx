'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Menu } from '@/lib/services';
import { SortableMenuItem } from './SortableMenuItem';
import { Plus, Loader2 } from 'lucide-react';

interface SortableMenuTreeProps {
    menus: Menu[];
    onMenusChange: (newMenus: Menu[]) => void;
    onEdit: (menu: Menu) => void;
    onDelete: (id: string) => void;
    onToggleVisibility: (menu: Menu) => void;
}

export function SortableMenuTree({
    menus,
    onMenusChange,
    onEdit,
    onDelete,
    onToggleVisibility
}: SortableMenuTreeProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 메뉴를 트리 구조로 렌더링하기 위해 정렬된 플랫 리스트 생성
    const sortedMenus = [...menus].sort((a, b) => {
        if (a.parent_id === b.id) return 1;
        if (b.parent_id === a.id) return -1;
        return a.sort_order - b.sort_order;
    });

    // 2단계(대분류-소분류) 구조를 유지하며 플랫 리스트로 변환
    const getFlattenedTree = () => {
        const result: Menu[] = [];
        const parents = menus.filter(m => !m.parent_id).sort((a, b) => a.sort_order - b.sort_order);
        
        parents.forEach(parent => {
            result.push(parent);
            const children = menus
                .filter(m => m.parent_id === parent.id)
                .sort((a, b) => a.sort_order - b.sort_order);
            result.push(...children);
        });
        
        return result;
    };

    const flatItems = getFlattenedTree();

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = flatItems.findIndex(i => i.id === active.id);
            const newIndex = flatItems.findIndex(i => i.id === over.id);

            const newFlatItems = arrayMove(flatItems, oldIndex, newIndex);
            
            // 변경된 인덱스를 기반으로 sort_order 재계산 및 부모 관계 유추
            // (간단한 구현을 위해 일단 리스트 순서만 업데이트)
            const updatedMenus = newFlatItems.map((item, index) => ({
                ...item,
                sort_order: index
            }));

            onMenusChange(updatedMenus);
        }
    };

    if (menus.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <p className="text-gray-400 mb-4 font-medium">등록된 메뉴가 없습니다.</p>
                <button 
                    onClick={() => onEdit({ id: '', name: '', parent_id: null, sort_order: menus.length, is_visible: true })}
                    className="flex items-center gap-2 text-primary hover:bg-blue-50 px-4 py-2 rounded-xl transition-all font-bold"
                >
                    <Plus size={18} />
                    첫 번째 메뉴 추가하기
                </button>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={flatItems.map(i => i.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-1">
                    {flatItems.map((menu) => (
                        <SortableMenuItem
                            key={menu.id}
                            menu={menu}
                            isChild={!!menu.parent_id}
                            childCount={menus.filter(m => m.parent_id === menu.id).length}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleVisibility={onToggleVisibility}
                        />
                    ))}
                </div>
            </SortableContext>
            
            <DragOverlay adjustScale={false}>
                {activeId ? (
                    <SortableMenuItem
                        menu={menus.find(m => m.id === activeId)!}
                        isChild={!!menus.find(m => m.id === activeId)?.parent_id}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onToggleVisibility={() => {}}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
