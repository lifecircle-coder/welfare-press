'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(async () => {
    const { default: RQ } = await import('react-quill');
    const ReactQuillWithQuill = RQ as any;
    const Quill = ReactQuillWithQuill.Quill;
    
    // Register Attributors for Inline Styles
    const AlignStyle = Quill.import('attributors/style/align');
    const SizeStyle = Quill.import('attributors/style/size');
    const ColorStyle = Quill.import('attributors/style/color');
    
    // Whitelist specific sizes to ensure they map to desired pixel/em values
    SizeStyle.whitelist = ['0.75em', '1em', '1.5em', '2.5em']; 
    
    Quill.register(AlignStyle, true);
    Quill.register(SizeStyle, true);
    Quill.register(ColorStyle, true);
    
    return RQ;
}, {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200 rounded-lg">에디터 로딩 중...</div>
});

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'color': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
    ],
};

const formats = [
    'header', 'size', 'color',
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
                /* Editor Visual Feedback */
                .ql-editor .ql-size-small { font-size: 0.75em; }
                .ql-editor .ql-size-large { font-size: 1.5em; }
                .ql-editor .ql-size-huge { font-size: 2.5em; }
                
                .ql-editor img {
                    display: inline-block;
                    max-width: 100%;
                }
                .ql-editor p[style*="text-align: center"], 
                .ql-editor div[style*="text-align: center"],
                .ql-editor .ql-align-center {
                    text-align: center;
                }
                .ql-editor p[style*="text-align: center"] img,
                .ql-editor .ql-align-center img {
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
                .ql-editor .ql-align-right {
                    text-align: right;
                }
                .ql-editor .ql-align-right img {
                    display: block;
                    margin-left: auto;
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
