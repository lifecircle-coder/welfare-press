'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200 rounded-lg">에디터 로딩 중...</div>
});

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
    ],
};

export default function ClientQuillEditor({ value, onChange }: any) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return <div className="h-96 w-full bg-gray-50 rounded-lg border border-gray-200"></div>;

    return (
        <div className="quill-editor-container h-full">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                className="h-[400px] mb-12"
            />
        </div>
    );
}
