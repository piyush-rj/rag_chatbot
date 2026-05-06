'use client';
import { signIn } from 'next-auth/react';
import { Button } from '../ui/button';
import { useUserSessionStore } from '@/store/useUserSessionStore';

export default function Navbar() {
    const { session } = useUserSessionStore();

    function handleSignIn() {
        signIn('google', { callbackUrl: '/' });
    }

    return (
        <div className='w-full h-20 fixed top-0 flex justify-end px-8 items-center'>
            {session ? (
                <div>{session.user?.name}</div>
            ) : (
                <Button
                    className='bg-neutral-100 text-neutral-800'
                    onClick={handleSignIn}
                >
                    Sign In
                </Button>
            )}
        </div>
    );
}
