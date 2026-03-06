'use client';

import { useEffect, useRef } from 'react';
import { incrementArticleView } from '@/lib/services';

interface ViewCounterProps {
    articleId: string;
}

export default function ViewCounter({ articleId }: ViewCounterProps) {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            incrementArticleView(articleId);
        }
    }, [articleId]);

    return null; // This component doesn't render anything
}
