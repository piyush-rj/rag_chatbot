'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShortcutsPanelStore } from '@/store/useShortcutsPanelStore';

type KeyToken = 'mod' | 'shift' | 'alt' | string;

const SHORTCUTS: { name: string; keys: KeyToken[] }[] = [
    { name: 'New chat', keys: ['mod', 'shift', 'O'] },
    { name: 'Search chats', keys: ['mod', 'K'] },
    { name: 'Show shortcuts', keys: ['mod', '/'] },
    { name: 'Toggle sidebar', keys: ['mod', '.'] },
    { name: 'See Chat history', keys: ['mod', 'shift', ','] },
];

export default function ShortcutsPanel() {
    const isOpen = useShortcutsPanelStore((s) => s.isOpen);
    const close = useShortcutsPanelStore((s) => s.close);

    // Detect platform on mount only — avoids SSR/hydration mismatch.
    const isMac = useSyncExternalStore(
        () => () => {},
        () => navigator.platform.toLowerCase().includes('mac'),
        () => true,
    );

    useEffect(() => {
        if (!isOpen) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, close]);

    function renderKey(k: KeyToken): string {
        if (k === 'mod') return isMac ? '⌘' : 'Ctrl';
        if (k === 'shift') return isMac ? '⇧' : 'Shift';
        if (k === 'alt') return isMac ? '⌥' : 'Alt';
        return k;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={close}
                        className='fixed inset-0 z-50 bg-black/40 backdrop-blur-[0.5px]'
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            duration: 0.32,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        className='fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-180 px-4'
                    >
                        <div className='rounded-t-[1.2rem] bg-linear-to-b from-[#0f0f10] to-[#101011] ring-1 ring-white/8 shadow-2xl shadow-black/60 overflow-hidden'>
                            <div className='h-px w-full bg-linear-to-r from-neutral-800/10 via-neutral-800/40 to-neutral-800/10' />

                            <div className='px-5 pt-4 pb-2 flex items-center justify-between'>
                                <span className='text-[12px] text-neutral-500/80'>
                                    Keyboard shortcuts
                                </span>
                                <span className='inline-flex items-center justify-center h-5 px-1.5 rounded-sm bg-white/4 ring-1 ring-white/8 text-neutral-400 font-mono text-[11px]'>
                                    ESC
                                </span>
                            </div>

                            <div className='px-3 pb-4 flex flex-col gap-y-0.5'>
                                {SHORTCUTS.map(({ name, keys }) => (
                                    <div
                                        key={name}
                                        className='flex items-center justify-between h-11 px-3 rounded-xl'
                                    >
                                        <span className='text-sm text-neutral-200'>
                                            {name}
                                        </span>
                                        <div className='flex items-center gap-1.5'>
                                            {keys.map((k, i) => (
                                                <kbd
                                                    key={`${name}-${i}`}
                                                    className='inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-sm bg-white/4 ring-1 ring-white/8 text-[13px] text-neutral-300 font-mono'
                                                >
                                                    {renderKey(k)}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
