'use client';
import { useEffect, useState } from 'react';
import { Brain, Trash2 } from 'lucide-react';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import MemoryApi, { type Memory } from '@/services/backend_services/memory.api';

type Props = {
    isOpen: boolean;
};

export default function PersonalizationSection({ isOpen }: Props) {
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token ?? null;

    const [memories, setMemories] = useState<Memory[] | null>(null);
    const loading = memories === null;
    const items = memories ?? [];

    useEffect(() => {
        if (!isOpen || !token) return;
        let cancelled = false;
        MemoryApi.list(token)
            .then((data) => {
                if (!cancelled) setMemories(data);
            })
            .catch(() => {
                if (!cancelled) setMemories([]);
            });
        return () => {
            cancelled = true;
        };
    }, [isOpen, token]);

    async function handleDelete(id: string) {
        if (!token || !memories) return;
        const previous = memories;
        setMemories(memories.filter((x) => x.id !== id));
        try {
            await MemoryApi.remove(token, id);
        } catch {
            setMemories(previous);
        }
    }

    return (
        <div>
            <div className='flex items-center gap-2 mb-1'>
                <Brain className='w-4 h-4 text-neutral-400' />
                <h2 className='text-sm font-medium text-neutral-100'>Memory</h2>
            </div>
            <p className='text-xs text-neutral-500 mb-4'>
                Things Raven remembers about you across conversations.
                {items.length > 0 && (
                    <>
                        {' '}
                        Currently storing {items.length}{' '}
                        {items.length === 1 ? 'fact' : 'facts'}.
                    </>
                )}
            </p>

            {loading ? (
                <div className='text-xs text-neutral-500'>Loading…</div>
            ) : items.length === 0 ? (
                <div className='text-xs text-neutral-500 border border-white/8 rounded-lg p-4 text-center'>
                    Nothing stored yet. Have a few conversations and Raven will
                    start remembering things.
                </div>
            ) : (
                <ul className='space-y-1.5'>
                    {items.map((m) => (
                        <li
                            key={m.id}
                            className='group flex items-start gap-3 p-3 rounded-lg border border-white/8 hover:border-white/15 transition-colors'
                        >
                            <div className='flex-1 min-w-0'>
                                <div className='text-sm text-neutral-100'>
                                    {m.fact}
                                </div>
                                <div className='text-[11px] text-neutral-600 mt-1'>
                                    {new Date(m.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(m.id)}
                                aria-label='Delete memory'
                                className='opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-neutral-500 hover:text-rose-400 hover:bg-white/5 transition-all cursor-pointer'
                            >
                                <Trash2 className='w-3.5 h-3.5' />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
