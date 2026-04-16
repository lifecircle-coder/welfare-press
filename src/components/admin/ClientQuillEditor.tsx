'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { uploadArticleImage } from '@/lib/services';
import { supabase } from '@/lib/supabaseClient';

const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import('react-quill');
        const Quill = (RQ as any).Quill;
        
        if (Quill) {
            try {
                const Parchment = Quill.import('parchment');
                
                // Register Numerical Font Sizes
                const SizeStyle = Quill.import('attributors/style/size');
                SizeStyle.whitelist = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'];
                Quill.register(SizeStyle, true);

                // Register Line Height
                if (!Quill.imports['formats/line-height']) {
                    const LineHeightStyle = new Parchment.Attributor.Style('line-height', 'line-height', {
                        scope: Parchment.Scope.BLOCK,
                        whitelist: ['1.0', '1.2', '1.5', '1.6', '1.8', '2.0', '2.4', '2.8', '3.0']
                    });
                    Quill.register(LineHeightStyle, true);
                }

                // Register Special Char
                if (!Quill.imports['formats/special-char']) {
                    const SpecialChar = new Parchment.Attributor.Class('special-char', 'ql-special-char', {
                        scope: Parchment.Scope.INLINE
                    });
                    Quill.register(SpecialChar, true);
                }
            } catch (e) {
                console.error('Quill registration error:', e);
            }
        }
        return RQ;
    },
    { ssr: false, loading: () => <div className="h-[400px] bg-gray-50 animate-pulse rounded-lg border border-gray-200" /> }
);

interface EditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    height?: string;
    articleId?: string;
}

export default function ClientQuillEditor({ value, onChange, placeholder, height = '400px', articleId }: EditorProps) {
    const quillRef = useRef<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const toolbarId = useMemo(() => `toolbar-${Math.random().toString(36).substr(2, 9)}`, []);
    
    // Use ref for articleId to avoid re-initializing modules when data loads
    const articleIdRef = useRef(articleId);
    useEffect(() => {
        articleIdRef.current = articleId;
    }, [articleId]);

    const resizeImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 1200;
                        let w = img.width;
                        let h = img.height;
                        if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
                        else if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
                        canvas.width = w; canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            reject(new Error('Canvas context를 생성할 수 없습니다. (브라우저 메모리 부족)'));
                            return;
                        }
                        ctx.drawImage(img, 0, 0, w, h);
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve(new File([blob], 'image.webp', { type: 'image/webp' }));
                            } else {
                                reject(new Error('이미지 변환(WebP)에 실패했습니다.'));
                            }
                        }, 'image/webp', 0.82);
                    } catch (err: any) {
                        reject(new Error(`최적화 처리 중 오류: ${err.message}`));
                    }
                };
                img.onerror = () => reject(new Error('이미지 로드에 실패했습니다. (손상된 파일)'));
            };
            reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
        });
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: `#${toolbarId}`,
            handlers: {
                'image': function () {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();
                    input.onchange = async () => {
                        const file = input.files?.[0];
                        if (file) {
                            try {
                                setIsUploading(true);
                                const optimizedFile = await resizeImage(file);
                                const url = await uploadArticleImage(optimizedFile, articleIdRef.current || 'temp');
                                
                                if (url) {
                                    const quill = quillRef.current.getEditor();
                                    const range = quill.getSelection(true);
                                    quill.insertEmbed(range.index, 'image', url);
                                    quill.setSelection(range.index + 1);
                                } else {
                                    alert('이미지 업로드에 실패했습니다. (서버/권한 오류)');
                                }
                            } catch (error) {
                                console.error('Image upload error:', error);
                                alert('이미지 처리 중 오류가 발생했습니다.');
                            } finally {
                                setIsUploading(false);
                            }
                        }
                    };
                }
            }
        },
        clipboard: {
            matchVisual: false,
            matchers: [
                ['img', (node: any, delta: any) => {
                    const src = node.getAttribute('src');
                    if (src && src.startsWith('data:')) {
                        setTimeout(async () => {
                            try {
                                const response = await fetch(src);
                                const blob = await response.blob();
                                const file = new File([blob], 'pasted-image.webp', { type: blob.type });
                                
                                setIsUploading(true);
                                const optimizedFile = await resizeImage(file);
                                const url = await uploadArticleImage(optimizedFile, articleIdRef.current || 'temp');
                                
                                if (url) {
                                    const quill = quillRef.current.getEditor();
                                    const html = quill.root.innerHTML;
                                    const updatedHtml = html.replace(src, url);
                                    quill.root.innerHTML = updatedHtml;
                                }
                            } catch (error) {
                                console.error('Pasted image processing failed:', error);
                            } finally {
                                setIsUploading(false);
                            }
                        }, 0);
                    }
                    return delta;
                }]
            ]
        },

    }), [toolbarId]); // STABLE: articleId removed from deps

    return (
        <div className="quill-editor-container" style={{ position: 'relative' }}>
            {isUploading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: '10px 20px', background: 'white', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontWeight: 'bold' }}>이미지 업로드 중...</div>
                </div>
            )}
            
            <div id={toolbarId} className="ql-toolbar ql-snow" style={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px', border: '1px solid #e5e7eb' }}>
                <span className="ql-formats">
                    <select className="ql-size" defaultValue="16px">
                        <option value="12px">12</option>
                        <option value="14px">14</option>
                        <option value="16px">16</option>
                        <option value="18px">18</option>
                        <option value="20px">20</option>
                        <option value="24px">24</option>
                        <option value="30px">30</option>
                        <option value="36px">36</option>
                    </select>
                </span>
                <span className="ql-formats">
                    <button className="ql-bold" />
                    <button className="ql-italic" />
                    <button className="ql-underline" />
                    <button className="ql-strike" />
                </span>
                <span className="ql-formats">
                    <select className="ql-color" />
                    <select className="ql-background" />
                </span>
                <span className="ql-formats">
                    <select className="ql-align" />
                    <button className="ql-list" value="ordered" />
                    <button className="ql-list" value="bullet" />
                </span>
                <span className="ql-formats">
                    <select className="ql-special-char" defaultValue="">
                        <option value="">특수기호</option>
                        {[ '●', '◇', '◆', '□', '■', '○', '▲', '△', '▼', '▽', '▶', '▷', '✓', '※'].map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </span>
                <span className="ql-formats">
                    <select className="ql-line-height" defaultValue="2.0">
                        <option value="">줄간격</option>
                        {['1.0', '1.2', '1.5', '1.6', '1.8', '2.0', '2.4', '2.8', '3.0'].map(lh => (
                            <option key={lh} value={lh}>{lh}</option>
                        ))}
                    </select>
                </span>
                <span className="ql-formats">
                    <button className="ql-link" />
                    <button className="ql-image" />
                    <button className="ql-video" />
                    <button className="ql-clean" />
                </span>
            </div>

            <div className="editor-wrapper" style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={value || ''}
                    onChange={onChange}
                    modules={modules}
                    placeholder={placeholder}
                />
            </div>

            <style jsx global>{`
                .editor-wrapper .ql-container.ql-snow {
                    border: none !important;
                    min-height: ${height};
                    font-size: 16px;
                }
                .editor-wrapper .ql-editor {
                    min-height: ${height};
                    padding: 20px;
                }
                .ql-snow .ql-picker.ql-special-char, 
                .ql-snow .ql-picker.ql-line-height {
                    width: 90px;
                }
            `}</style>
        </div>
    );
}
