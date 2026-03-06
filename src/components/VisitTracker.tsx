'use client';

import { useEffect, useRef } from 'react';
import { recordVisit } from '@/lib/services';

export default function VisitTracker() {
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            recordVisit();
        }
    }, []);

    return null; // This component renders nothing
}
