'use client';

import { useEffect, useRef } from 'react';
import { recordVisit } from '@/lib/services';

export default function VisitorTracker() {
    const initialized = useRef(false);

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    useEffect(() => {
        // 관리자 페이지(/admin)에서는 방문자 추적을 건너뛰어 세션 간섭을 방지합니다.
        if (pathname.startsWith('/admin')) return;

        if (!initialized.current) {
            initialized.current = true;
            // Record visit only once per session/mount
            const lastVisit = sessionStorage.getItem('last_visit');
            if (!lastVisit) {
                recordVisit();
                sessionStorage.setItem('last_visit', new Date().toISOString());
            }
        }
    }, [pathname]);

    return null;
}
