'use client';
import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(async () => {
    const { default: RQ } = await import('react-quill');
    const Quill = (RQ as any).Quill;
    
    // Register Attributors for Inline Styles
    const AlignStyle = Quill.import('attributors/style/align');
    const SizeStyle = Quill.import('attributors/style/size');
    const ColorStyle = Quill.import('attributors/style/color');
    
    // Whitelist values MUST match what the toolbar sends.
    // We use concrete values that will be written into the style attribute.
    SizeStyle.whitelist = ['12px', '16px', '24px', '36px']; 
    
    Quill.register(AlignStyle, true);
    Quill.register(SizeStyle, true);
    Quill.register(ColorStyle, true);
    
    return RQ;
}, {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200 rounded-lg">에디터 로딩 중...</div>
});

const modules = (articleId: string) => ({
    toolbar: {
        container: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'size': ['12px', false, '24px', '36px'] }],
            [{ 'color': [] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
        handlers: {
            image: function(this: any) {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.click();

                input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;

                    // 1. Show loading state
                    const range = this.quill.getSelection(true);
                    this.quill.insertText(range.index, '⌛ 이미지 최적화 및 압축 중...', 'bold', true);

                    const reader = new FileReader();
                    reader.onload = async () => {
                        const originalBase64 = reader.result as string;
                        
                        // --- New: Client-side Pre-compression ---
                        const compressAndResize = (base64: string): Promise<string> => {
                            return new Promise((resolve) => {
                                const img = new Image();
                                img.src = base64;
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    let width = img.width;
                                    let height = img.height;
                                    const MAX_WIDTH = 1200;

                                    if (width > MAX_WIDTH) {
                                        height *= MAX_WIDTH / width;
                                        width = MAX_WIDTH;
                                    }

                                    canvas.width = width;
                                    canvas.height = height;
                                    const ctx = canvas.getContext('2d');
                                    ctx?.drawImage(img, 0, 0, width, height);
                                    
                                    // 0.7 quality is enough for editorial content and keeps file size < 1MB usually
                                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                                };
                            });
                        };

                        try {
                            const compressedBase64 = await compressAndResize(originalBase64);
                            
                            // 2. Call Optimization API with already-shrunken image
                            const response = await fetch('/api/optimize-image', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    imageUrl: compressedBase64,
                                    articleId: articleId
                                })
                            });

                            const data = await response.json();
                            if (data.optimizedUrl) {
                                // 3. Replace loading text with optimized image URL
                                this.quill.deleteText(range.index, 20);
                                this.quill.insertEmbed(range.index, 'image', data.optimizedUrl);
                            } else {
                                throw new Error('Optimization failed');
                            }
                        } catch (error) {
                            console.error('Image upload failed', error);
                            this.quill.deleteText(range.index, 20);
                            alert('이미지 최적화 업로드에 실패했습니다. 이미지를 조금 더 작은 파일로 시도해주세요.');
                        }
                    };
                    reader.readAsDataURL(file);
                };
            }
        }
    }
});

const formats = [
    'header', 'size', 'color',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'align',
    'link', 'image'
];

export default function ClientQuillEditor({ value, onChange, articleId }: any) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const editorModules = useMemo(() => modules(articleId), [articleId]);

    if (!mounted) return <div className="h-96 w-full bg-gray-50 rounded-lg border border-gray-200"></div>;

    return (
        <div className="quill-editor-container h-full">
            <style jsx global>{`
                /* High-Specificity Editor Overrides */
                .ql-editor {
                    font-size: 16px;
                }
                .ql-editor .ql-size-12px { font-size: 12px !important; }
                .ql-editor .ql-size-24px { font-size: 24px !important; }
                .ql-editor .ql-size-36px { font-size: 36px !important; }
                
                .ql-editor img {
                    display: inline-block;
                    max-width: 100%;
                }
                
                /* Alignment Overrides inside Editor */
                .ql-editor .ql-align-center,
                .ql-editor [style*="text-align: center"],
                .ql-editor [style*="text-align:center"] {
                    text-align: center !important;
                }
                .ql-editor .ql-align-center img,
                .ql-editor [style*="text-align: center"] img,
                .ql-editor [style*="text-align:center"] img {
                    display: block !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
                
                .ql-editor .ql-align-right,
                .ql-editor [style*="text-align: right"],
                .ql-editor [style*="text-align:right"] {
                    text-align: right !important;
                }
                .ql-editor .ql-align-right img,
                .ql-editor [style*="text-align: right"] img,
                .ql-editor [style*="text-align:right"] img {
                    display: block !important;
                    margin-left: auto !important;
                    margin-right: 0 !important;
                }
            `}</style>
            <ReactQuill
                key={articleId || 'new'}
                theme="snow"
                value={value || ''}
                onChange={onChange}
                modules={editorModules}
                formats={formats}
                className="h-[400px] mb-12"
            />
        </div>
    );
}
