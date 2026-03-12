'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(async () => {
    const { default: RQ } = await import('react-quill');
    const Quill = RQ.Quill;
    const Align = Quill.import('attributors/style/align');
    const Size = Quill.import('attributors/style/size');
    Quill.register(Align, true);
    Quill.register(Size, true);
    return RQ;
}, {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200 rounded-lg">에디터 로딩 중...</div>
});

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
    ],
};

const formats = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'align',
    'link', 'image'
];

export default function ClientQuillEditor({ value, onChange }: any) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return <div className="h-96 w-full bg-gray-50 rounded-lg border border-gray-200"></div>;

    return (
        <div className="quill-editor-container h-full">
            <style jsx global>{`
                .ql-editor img {
                    display: inline-block;
                    max-width: 100%;
                }
                .ql-editor .ql-align-center {
                    text-align: center;
                }
                .ql-editor .ql-align-right {
                    text-align: right;
                }
                .ql-editor .ql-align-justify {
                    text-align: justify;
                }
            `}</style>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                className="h-[400px] mb-12"
            />
        </div>
    );
}
