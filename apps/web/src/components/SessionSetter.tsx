'use client';

import { useEffect } from 'react';
import type { Session } from 'next-auth';
import { useUserSessionStore } from '@/store/useUserSessionStore';

export function SessionSetter({ session }: { session: Session | null }) {
    const setSession = useUserSessionStore((s) => s.setSession);

    useEffect(() => {
        setSession(session);
    }, [session, setSession]);

    return null;
}
