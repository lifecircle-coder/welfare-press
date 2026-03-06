declare module 'react-quill' {
    import React from 'react';
    export interface ReactQuillProps {
        theme?: string;
        modules?: any;
        formats?: string[];
        value?: string;
        placeholder?: string;
        onChange?: (value: string, delta: any, source: any, editor: any) => void;
        className?: string;
        [key: string]: any;
    }
    export default class ReactQuill extends React.Component<ReactQuillProps> { }
}
