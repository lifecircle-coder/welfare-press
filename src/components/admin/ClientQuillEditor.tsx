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
        <div className="quill-editor-container border rounded-lg overflow-hidden bg-white shadow-sm border-gray-200">
            {/* Custom Toolbar - Restored with Special Character Dropdown */}
            <div id={toolbarId} className="border-b border-gray-200 bg-gray-50 flex flex-wrap items-center p-1 gap-1">
                <span className="ql-formats">
                    <select className="ql-header" defaultValue="">
                        <option value="1">제목 1</option>
                        <option value="2">제목 2</option>
                        <option value="3">제목 3</option>
                        <option value="">본문</option>
                    </select>
                </span>
                <span className="ql-formats">
                    <button className="ql-bold" />
                    <button className="ql-italic" />
                    <button className="ql-underline" />
                    <button className="ql-strike" />
                </span>
                <span className="ql-formats">
                    <button className="ql-list" value="ordered" />
                    <button className="ql-list" value="bullet" />
                    
                    {/* Special Character Dropdown */}
                    <select className="ql-special-char ml-1" defaultValue="">
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
                    <button className="ql-link" />
                    <button className="ql-image" />
                    <button className="ql-video" />
                </span>
                <span className="ql-formats">
                    <button className="ql-clean" />
                </span>
            </div>

            <style jsx global>{`
                .quill-editor-container .ql-container {
                    min-height: ${height};
                    font-size: 16px;
                }
                .quill-editor-container .ql-toolbar {
                    border: none !important;
                }
                .quill-editor-container .ql-container.ql-snow {
                    border: none !important;
                }
                    /* Custom label for list styles - Handled in globals.css for higher specificity and picker support */
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
