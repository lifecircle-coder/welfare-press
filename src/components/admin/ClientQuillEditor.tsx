'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import('react-quill');
        // react-quill v2 usually has Quill attached to the default export
        let Quill = (RQ as any).Quill;
        
        if (!Quill) {
            try {
                const Q = await import('quill');
                Quill = Q.default || Q;
            } catch (e) {
                console.error('Failed to import Quill:', e);
            }
        }

        if (Quill) {
            try {
                // Remove custom registrations to restore standard behavior
            } catch (e) {
                console.error('Error during cleanup:', e);
            }
        }

        return RQ;
    },
    { ssr: false, loading: () => <div className="h-[400px] bg-gray-50 animate-pulse rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">에디터 초기화 중...</div> }
);

interface EditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    height?: string;
}

export default function ClientQuillEditor({ value, onChange, placeholder, height = '400px' }: EditorProps) {
    const quillRef = useRef<any>(null);
    const toolbarId = useMemo(() => `toolbar-${Math.random().toString(36).substr(2, 9)}`, []);

    const modules = useMemo(() => ({
        toolbar: {
            container: `#${toolbarId}`,
            handlers: {
                'special-char': function (value: string) {
                    if (!value) return;
                    console.log('Special character selected:', value);
                    const quill = this.quill;
                    const range = quill.getSelection(true);
                    if (range) {
                        quill.insertText(range.index, value, 'user');
                        quill.setSelection(range.index + value.length, 0, 'user');
                        console.log('Inserted character at index:', range.index);
                    } else {
                        console.warn('No range found for special character insertion');
                    }
                }
            }

        },
        clipboard: {
            matchVisual: false,
        },
    }), [toolbarId]);

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet',
        'link', 'image', 'video', 'color', 'background', 'align'
    ];

    return (
        <div className="quill-editor-container border rounded-lg bg-white shadow-sm border-gray-200">
            {/* Custom Toolbar - Restored with Special Character Dropdown */}
            <div id={toolbarId} className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm flex flex-wrap items-center p-2 gap-1 sticky top-0 z-[10]">
                <span className="ql-formats">
                    <select className="ql-header" defaultValue="">
                        <option value="1">제목 1</option>
                        <option value="2">제목 2</option>
                        <option value="3">제목 3</option>
                        <option value="">본문</option>
                    </select>
                </span>
                <span className="ql-formats">
                    <button className="ql-bold transition-colors hover:text-primary" />
                    <button className="ql-italic transition-colors hover:text-primary" />
                    <button className="ql-underline transition-colors hover:text-primary" />
                    <button className="ql-strike transition-colors hover:text-primary" />
                </span>
                <span className="ql-formats">
                    <button className="ql-list transition-colors hover:text-primary" value="ordered" />
                    <button className="ql-list transition-colors hover:text-primary" value="bullet" />
                    
                    {/* Special Character Dropdown */}
                    <select className="ql-special-char ml-1 bg-white border border-gray-200 rounded px-1 text-xs font-medium outline-none" defaultValue="">
                        <option value="" disabled>특수문자</option>
                        <option value="●">● 점</option>
                        <option value="◆">◆ 마름모</option>
                        <option value="■">■ 사각형</option>
                        <option value="○">○ 원형</option>
                        <option value="❖">❖ 별표형</option>
                        <option value="➔">➔ 화살표</option>
                        <option value="✓">✓ 체크</option>
                    </select>
                </span>
                <span className="ql-formats">
                    <button className="ql-link transition-colors hover:text-primary" />
                    <button className="ql-image transition-colors hover:text-primary" />
                    <button className="ql-video transition-colors hover:text-primary" />
                </span>
                <span className="ql-formats">
                    <button className="ql-clean transition-colors hover:text-primary" />
                </span>
            </div>

            <style jsx>{`
                .quill-editor-container :global(.ql-container) {
                    min-height: ${height};
                    font-size: 16px;
                    border: none !important;
                }
                .quill-editor-container .ql-editor {
                    min-height: ${height};
                    padding: ${parseInt(height) < 100 ? '0.75rem 1rem' : '1.5rem'};
                    line-height: 1.7;
                    color: #1f2937;
                }
                .quill-editor-container .ql-editor.ql-blank::before {
                    left: ${parseInt(height) < 100 ? '1rem' : '1.5rem'};
                    color: #9ca3af;
                    font-style: normal;
                }
                .quill-editor-container :global(.ql-toolbar) {
                    border: none !important;
                    padding: ${parseInt(height) < 100 ? '0.25rem 0.5rem' : '0.5rem'} !important;
                }
                .quill-editor-container :global(.ql-container.ql-snow) {
                    border: none !important;
                }
            `}</style>

            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value || ''}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder || '세부 내용을 입력하세요...'}
            />
        </div>
    );
}
