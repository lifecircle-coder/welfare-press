'use client';
import React, { useState, useEffect } from 'react';
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

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'size': ['12px', false, '24px', '36px'] }], // Match with whitelist. 'false' is default (16px)
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
                
                /* Alignment Overrides */
                .ql-editor .ql-align-center {
                    text-align: center !important;
                }
                .ql-editor .ql-align-center img {
                    display: block !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
                .ql-editor .ql-align-right {
                    text-align: right !important;
                }
                .ql-editor .ql-align-right img {
                    display: block !important;
                    margin-left: auto !important;
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
