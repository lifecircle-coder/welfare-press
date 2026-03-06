'use client';

import { useEffect, useRef } from 'react';
import { recordVisit } from '@/lib/services';

export default function VisitorTracker() {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            // Record visit only once per session/mount
            // In a real app, you might want to check localStorage or cookies to debounce this
            const lastVisit = sessionStorage.getItem('last_visit');
            if (!lastVisit) {
                recordVisit();
                sessionStorage.setItem('last_visit', new Date().toISOString());
            }
        }
    }, []);

    return null;
}
