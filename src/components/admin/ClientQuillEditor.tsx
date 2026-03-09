'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center text-gray-400 bg-gray-50 border border-gray-200 rounded-md">에디터 로딩 중...</div>,
});

interface ClientQuillEditorProps {
    value: string;
    onChange: (value: string) => void;
    articleId: string;
}

export default function ClientQuillEditor({ value, onChange, articleId }: ClientQuillEditorProps) {
    const quillRef = useRef<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files ? input.files[0] : null;
            if (!file) return;

            if (!file.type.startsWith('image/')) return alert('이미지 파일만 업로드 가능합니다.');
            if (file.size > 10 * 1024 * 1024) return alert('이미지 파일은 10MB 이하만 가능합니다.');

            setIsUploading(true);

            try {
                const { uploadArticleImage } = await import('@/lib/services');
                // Use a generated dummy ID if articleId is empty (new article)
                // This will be replaced by the actual ID upon saving, but Storage will store it under this dummy ID temporarily or permanently
                const targetId = articleId || `new_${Date.now()}`;

                const storageUrl = await uploadArticleImage(file, targetId);

                if (storageUrl) {
                    const reactQuill: any = quillRef.current;
                    const editor = reactQuill?.getEditor();
                    if (editor) {
                        const range = editor.getSelection(true);
                        editor.insertEmbed(range.index, 'image', storageUrl);
                        editor.setSelection(range.index + 1, 0);
                    }
                }
            } catch (err) {
                console.error('Image upload failed:', err);
                alert('이미지 업로드 중 오류가 발생했습니다.');
            } finally {
                setIsUploading(false);
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                ['link', 'image'],
                [{ 'align': [] }, { 'color': [] }, { 'background': [] }],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), [articleId]);

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image',
        'align', 'color', 'background'
    ];

    return (
        <div className="relative min-h-[450px]">
            {isUploading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded">
                    <div className="text-primary font-bold">이미지 업로드 중...</div>
                </div>
            )}
            <div className="h-[400px] mb-12">
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={modules}
                    formats={formats}
                    style={{ height: '400px', backgroundColor: 'white' }}
                />
            </div>
        </div>
    );
}
