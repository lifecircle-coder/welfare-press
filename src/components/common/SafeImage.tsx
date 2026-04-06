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
        let finalSrc = src;
        
        // --- Supabase Image Transformation Integration ---
        // If it's a Supabase storage URL, we use the transformation endpoint to save bandwidth
        if (src && src.includes('supabase.co/storage/v1/object/public/')) {
            const width = props.width;
            const height = props.height;
            
            // Only transform if dimensions are provided (to avoid breaking 'fill' layout without dimensions)
            // or if we want a default quality reduction even for full-size images
            if (width || height) {
                // Change /object/public/ to /render/image/public/
                let transformed = src.replace('/object/public/', '/render/image/public/');
                
                // Add transformation parameters
                const params = new URLSearchParams();
                if (width) params.append('width', String(width));
                if (height) params.append('height', String(height));
                params.append('quality', '75'); // 75% is usually the sweet spot for file size vs quality
                
                finalSrc = `${transformed}?${params.toString()}`;
            }
        }
        
        setImgSrc(finalSrc || null);
        setHasError(false);
    }, [src, props.width, props.height]);

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
