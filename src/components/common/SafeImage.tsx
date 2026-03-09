'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'src' | 'onError'> {
    src?: string | null;
    fallback: React.ReactNode;
}

export default function SafeImage({ src, fallback, ...props }: SafeImageProps) {
    const [imgSrc, setImgSrc] = useState<string | null>(src || null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src || null);
        setHasError(false);
    }, [src]);

    if (!imgSrc || imgSrc.trim() === '' || hasError) {
        return <>{fallback}</>;
    }

    return (
        <Image
            {...props}
            src={imgSrc}
            onError={() => setHasError(true)}
        />
    );
}
