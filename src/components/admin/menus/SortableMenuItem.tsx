'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Eye, EyeOff, Edit2, ChevronRight, ChevronDown } from 'lucide-react';
import { Menu } from '@/lib/services';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SortableMenuItemProps {
    menu: Menu;
    isChild?: boolean;
    onEdit: (menu: Menu) => void;
    onDelete: (id: string) => void;
    onToggleVisibility: (menu: Menu) => void;
    childCount?: number;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function SortableMenuItem({
    menu,
    isChild = false,
    onEdit,
    onDelete,
    onToggleVisibility,
    childCount = 0,
    isCollapsed = false,
    onToggleCollapse
}: SortableMenuItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: menu.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative mb-2 transition-all",
                isDragging && "opacity-50 scale-[1.02] z-50",
                isChild ? "ml-12" : "ml-0"
            )}
        >
            <div className={cn(
                "flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm transition-all",
                isDragging ? "border-primary ring-2 ring-primary/10" : "border-gray-100 group-hover:border-gray-200",
                !menu.is_visible && "bg-gray-50/50 opacity-70"
            )}>
                <div className="flex items-center gap-4">
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <GripVertical size={20} />
                    </div>

                    {/* Icon & Name */}
                    <div className="flex items-center gap-3">
                        {!isChild ? (
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
                                <ChevronRight size={20} />
                            </div>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-300 ml-2" />
                        )}
                        <div>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "font-bold transition-all",
                                    !isChild ? "text-gray-900 text-lg" : "text-gray-600"
                                )}>
                                    {menu.name}
                                </span>
                                {!isChild && childCount > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onToggleCollapse?.();
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-all flex items-center gap-1"
                                        title={isCollapsed ? "펼치기" : "접기"}
                                    >
                                        {isCollapsed ? (
                                            <>
                                                <ChevronRight size={16} />
                                                <span className="text-[10px] font-medium">소분류 펼치기</span>
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown size={16} />
                                                <span className="text-[10px] font-medium">소분류 접기</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                {!menu.is_visible && (
                                    <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">미노출</span>
                                )}
                            </div>
                            {!isChild && childCount > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">소분류 {childCount}개 포함</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onToggleVisibility(menu)}
                        className={cn(
                            "p-2 rounded-xl transition-all",
                            menu.is_visible ? "text-blue-500 hover:bg-blue-50" : "text-gray-400 hover:bg-gray-100"
                        )}
                        title={menu.is_visible ? "숨기기" : "보이기"}
                    >
                        {menu.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                        onClick={() => onEdit(menu)}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                        title="수정"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(menu.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="삭제"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
            
            {/* Visual connector for children */}
            {isChild && (
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-px bg-gray-200" />
            )}
            {!isChild && childCount > 0 && (
                <div className="absolute left-5 top-14 bottom-0 w-px bg-gray-100" />
            )}
        </div>
    );
}
