'use client';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { useUserSessionStore } from '@/store/useUserSessionStore';

export default function AccountSection() {
    const session = useUserSessionStore((s) => s.session);
    const user = session?.user;

    if (!user) {
        return (
            <div className='text-sm text-neutral-500'>
                You are not signed in.
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-6'>
            <div className='flex items-center gap-4'>
                {user.image ? (
                    <Image
                        src={user.image}
                        alt={user.name ?? ''}
                        width={56}
                        height={56}
                        className='w-14 h-14 rounded-full ring-1 ring-white/10'
                        priority
                    />
                ) : (
                    <div className='w-14 h-14 rounded-full bg-neutral-800 grid place-items-center text-lg text-neutral-300'>
                        {user.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                )}
                <div className='min-w-0'>
                    <div className='text-[15px] text-neutral-100 font-medium truncate'>
                        {user.name}
                    </div>
                    <div className='text-xs text-neutral-500 truncate'>
                        {user.email}
                    </div>
                </div>
            </div>

            <div className='h-px bg-white/6' />

            <div className='flex items-center justify-between'>
                <div>
                    <div className='text-sm text-neutral-100'>Sign out</div>
                    <div className='text-xs text-neutral-500'>
                        End your current session.
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className='flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-neutral-200 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer'
                >
                    <LogOut className='w-3.5 h-3.5' />
                    Sign out
                </button>
            </div>
        </div>
    );
}
