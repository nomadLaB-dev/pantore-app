'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOutAction } from '@/app/actions';

const TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

export default function AutoLogout() {
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(async () => {
            console.log('Auto-logout due to inactivity');
            await signOutAction();
            router.push('/login');
        }, TIMEOUT_MS);
    };

    useEffect(() => {
        // Initial timer
        resetTimer();

        // Event listeners for user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, []);

    return null; // This component renders nothing
}
