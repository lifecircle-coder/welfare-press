'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { uploadArticleImage } from '@/lib/services';

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
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 1200;
                    let w = img.width;
                    let h = img.height;
                    if (w > h && w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
                    else if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, w, h);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob!], 'image.webp', { type: 'image/webp' }));
                    }, 'image/webp', 0.82);
                };
            };
        });
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: `#${toolbarId}`,
            handlers: {
                'image': function () {
                    console.log('이미지 버튼 클릭됨');
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    
                    // ONCHANGE MUST BE ATTACHED BEFORE CLICK
                    input.onchange = async () => {
                        const file = input.files?.[0];
                        console.log('파일 선택됨:', file?.name);
                        if (file) {
                            try {
                                setIsUploading(true);
                                console.log('이미지 최적화 시작...');
                                const optimized = await resizeImage(file);
                                console.log('최적화 완료. 업로드 시작...');
                                const url = await uploadArticleImage(optimized, articleIdRef.current || 'temp');
                                console.log('업로드 결과 URL:', url);
                                
                                if (url) {
                                    // Use this.quill which is the internal Quill instance for handlers
                                    const quill = (this as any).quill;
                                    const range = quill.getSelection(true) || { index: quill.getLength() };
                                    quill.insertEmbed(range.index, 'image', url);
                                    quill.setSelection(range.index + 1);
                                    console.log('에디터에 이미지 삽입 완료');
                                } else {

                                    alert('이미지 업로드에 실패했습니다. (URL 반환 실패)');
                                }
                            } catch (err) {
                                console.error('이미지 처리 중 치명적 오류:', err);
                                alert('이미지 처리 중 오류가 발생했습니다: ' + (err as Error).message);
                            } finally {
                                setIsUploading(false);
                            }
                        }
                    };

                    input.click();
                }
            }
        },
        clipboard: { matchVisual: false }
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
