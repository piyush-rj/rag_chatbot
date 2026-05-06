'use client';
import Image from 'next/image';
import { signIn, signOut } from 'next-auth/react';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    isCollapsed?: boolean;
}

export default function UserMenu({ isCollapsed = false }: Props) {
    const session = useUserSessionStore((s) => s.session);
    const user = session?.user;

    if (!user) {
        return (
            <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className={cn(
                    'h-9 flex items-center rounded-lg cursor-pointer overflow-hidden',
                    'text-sm text-neutral-300 hover:bg-white/4',
                    'transition-[width] duration-200',
                    isCollapsed ? 'w-9' : 'w-full',
                )}
            >
                <span className='w-9 h-9 flex items-center justify-center shrink-0'>
                    <LogIn className='w-4 h-4' />
                </span>
                <span
                    className={cn(
                        'whitespace-nowrap pr-3 transition-opacity duration-200',
                        isCollapsed ? 'opacity-0' : 'opacity-100',
                    )}
                >
                    Sign in with Google
                </span>
            </button>
        );
    }

    return (
        <div
            className={cn(
                'flex items-center rounded-lg group overflow-hidden h-11 pt-2',
                isCollapsed ? 'w-9' : 'w-full',
            )}
        >
            <span className='w-9 h-9 flex items-center justify-center shrink-0'>
                {user.image ? (
                    <Image
                        src={user.image}
                        alt={user.name ?? ''}
                        width={28}
                        height={28}
                        className='w-7 h-7 rounded-full ring-1 ring-white/10'
                        priority
                    />
                ) : (
                    <div className='w-7 h-7 rounded-full bg-neutral-800 grid place-items-center text-xs text-neutral-300'>
                        {user.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                )}
            </span>
            <div
                className={cn(
                    'min-w-0 flex-1 px-2 whitespace-nowrap transition-opacity duration-200',
                    isCollapsed ? 'opacity-0' : 'opacity-100',
                )}
            >
                <div className='text-sm text-neutral-100 truncate'>
                    {user.name}
                </div>
                <div className='text-xs text-neutral-500 truncate'>
                    {user.email}
                </div>
            </div>

            <button
                onClick={() => signOut({ callbackUrl: '/' })}
                title='Sign out'
                className={cn(
                    'p-1.5 mr-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-opacity',
                    isCollapsed
                        ? 'opacity-0 pointer-events-none'
                        : 'opacity-0 group-hover:opacity-100',
                )}
            >
                <LogOut className='w-4 h-4' />
            </button>
        </div>
    );
}
