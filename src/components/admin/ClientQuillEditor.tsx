'use client';

import React, { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { uploadArticleImage } from '@/lib/services';

const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import('react-quill');
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
                // Register custom format for Special Characters Picker
                const Parchment = Quill.import('parchment');
                const SpecialChar = new Parchment.Attributor.Class('special-char', 'ql-special-char', {
                    scope: Parchment.Scope.INLINE
                });
                Quill.register(SpecialChar, true);

                // Register Numerical Font Sizes as Inline Styles
                const SizeStyle = Quill.import('attributors/style/size');
                SizeStyle.whitelist = ['12px', '13px', '14px', '15px', '16px', '17px', '18px', '19px', '20px', '21px', '22px', '23px', '24px'];
                Quill.register(SizeStyle, true);

                // Register Line Height as Block Styles
                const LineHeightStyle = new Parchment.Attributor.Style('line-height', 'line-height', {
                    scope: Parchment.Scope.BLOCK
                });
                LineHeightStyle.whitelist = ['1.0', '1.2', '1.5', '1.6', '1.8', '2.0', '2.4', '2.8', '3.0'];
                Quill.register(LineHeightStyle, true);
            } catch (e) {
                console.error('Error during registration:', e);
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
    articleId?: string; // Added articleId for storage path
}

export default function ClientQuillEditor({ value, onChange, placeholder, height = '400px', articleId }: EditorProps) {
    const quillRef = useRef<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const toolbarId = useMemo(() => `toolbar-${Math.random().toString(36).substr(2, 9)}`, []);

    // 1. Image Resizing Utility (Canvas-based)
    const resizeImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 1200; // Max width/height

                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const resizedFile = new File([blob], file.name, {
                                type: 'image/webp',
                                lastModified: Date.now(),
                            });
                            resolve(resizedFile);
                        } else {
                            resolve(file); // Fallback
                        }
                    }, 'image/webp', 0.85); // Convert to WebP with good quality
                };
            };
        });
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: `#${toolbarId}`,
            handlers: {
                'special-char': function (value: string) {
                    if (!value) return;
                    const quill = this.quill;
                    const range = quill.getSelection(true);
                    if (range) {
                        quill.insertText(range.index, value, 'user');
                        quill.setSelection(range.index + value.length, 0, 'user');
                    }
                },
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
                                // Client-side Resize
                                const optimizedFile = await resizeImage(file);
                                // Upload to Storage
                                const url = await uploadArticleImage(optimizedFile, articleId || 'temp');
                                
                                if (url) {
                                    const quill = quillRef.current.getEditor();
                                    const range = quill.getSelection(true);
                                    quill.insertEmbed(range.index, 'image', url);
                                    quill.setSelection(range.index + 1);
                                } else {
                                    alert('이미지 업로드에 실패했습니다.');
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
                        // We will handle Base64 image upload asynchronously
                        setTimeout(async () => {
                            try {
                                const response = await fetch(src);
                                const blob = await response.blob();
                                const file = new File([blob], 'pasted-image.webp', { type: blob.type });
                                
                                setIsUploading(true);
                                const optimizedFile = await resizeImage(file);
                                const url = await uploadArticleImage(optimizedFile, articleId || 'temp');
                                
                                if (url) {
                                    const quill = quillRef.current.getEditor();
                                    const fullContents = quill.getContents();
                                    
                                    // Replace the base64 src with the new URL in the document
                                    // This is a simplified replacement approach
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
    }), [toolbarId, articleId]);

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet',
        'link', 'image', 'video', 'color', 'background', 'align',
        'special-char', 'line-height'
    ];

    return (
        <div className={`quill-editor-container border rounded-lg bg-white shadow-sm border-gray-200 ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}>
            {isUploading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[1px]">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-rotate mb-2" />
                    <span className="text-sm font-bold text-primary animate-pulse">이미지 최적화 및 업로드 중...</span>
                </div>
            )}
            
            <div id={toolbarId} className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm flex flex-wrap items-center p-2 gap-1 sticky top-0 z-[10]">
                <span className="ql-formats">
                    <select className="ql-size" defaultValue="16px">
                        {[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(s => (
                            <option key={s} value={`${s}px`}>{s}</option>
                        ))}
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
                </span>
                <span className="ql-formats">
                    <button className="ql-list" value="ordered" />
                    <button className="ql-list" value="bullet" />
                    
                    <select className="ql-special-char" defaultValue="">
                        <option value="" disabled>특수문자</option>
                        <option value="●">● 점</option>
                        <option value="◇">◇ 마름모</option>
                        <option value="▲">▲ 삼각형</option>
                        <option value="○">○ 원형</option>
                        <option value="❖">❖ 별표형</option>
                        <option value="➔">➔ 화살표</option>
                        <option value="✓">✓ 체크</option>
                    </select>

                    <select className="ql-line-height" defaultValue="2.0">
                        {['1.0', '1.2', '1.5', '1.6', '1.8', '2.0', '2.4', '2.8', '3.0'].map(lh => (
                            <option key={lh} value={lh}>{lh}</option>
                        ))}
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
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-rotate {
                    animation: rotate 1s linear infinite;
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
