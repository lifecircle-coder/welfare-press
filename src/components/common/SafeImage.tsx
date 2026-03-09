'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { Newspaper } from 'lucide-react';

interface SafeImageProps extends Omit<ImageProps, 'src' | 'onError'> {
    src?: string | null;
    fallback?: React.ReactNode;
}

export default function SafeImage({ src, fallback, ...props }: SafeImageProps) {
    const [imgSrc, setImgSrc] = useState<string | null>(src || null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src || null);
        setHasError(false);
    }, [src]);

    if (!imgSrc || imgSrc.trim() === '' || hasError) {
        if (fallback) {
            return <>{fallback}</>;
        }
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-200 text-gray-400 w-full h-full ${props.className || ''}`}>
                <Newspaper className="w-10 h-10 opacity-40" />
            </div>
        );
    }

    return (
        <Image
            {...props}
            src={imgSrc}
            onError={() => setHasError(true)}
        />
    );
}
