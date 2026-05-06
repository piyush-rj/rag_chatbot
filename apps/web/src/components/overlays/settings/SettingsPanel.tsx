'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsPanelStore } from '@/store/useSettingsPanelStore';
import AccountSection from './AccountSection';
import PersonalizationSection from './PersonalizationSection';

type SectionKey = 'account' | 'personalization';

const SECTIONS: { key: SectionKey; label: string; icon: typeof User }[] = [
    { key: 'account', label: 'Account', icon: User },
    { key: 'personalization', label: 'Personalization', icon: Sparkles },
];

export default function SettingsPanel() {
    const isOpen = useSettingsPanelStore((s) => s.isOpen);
    const close = useSettingsPanelStore((s) => s.close);

    const [active, setActive] = useState<SectionKey>('account');

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
                        className='fixed inset-0 z-50 bg-black/60 backdrop-blur-xs'
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{
                            duration: 0.22,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl px-4'
                    >
                        <div className='flex h-[560px] max-h-[80vh] rounded-2xl bg-linear-to-b from-[#0f0f10] to-[#101011] ring-1 ring-white/8 shadow-2xl shadow-black/60 overflow-hidden'>
                            <aside className='w-56 shrink-0 flex flex-col border-r border-white/6 py-4'>
                                <div className='px-3 pb-3'>
                                    <button
                                        onClick={close}
                                        aria-label='Close'
                                        className='p-1.5 rounded-md text-neutral-500 hover:text-neutral-100 hover:bg-white/5 transition-colors cursor-pointer'
                                    >
                                        <X className='w-4 h-4' />
                                    </button>
                                </div>
                                <nav className='flex-1 px-2 flex flex-col gap-0.5'>
                                    {SECTIONS.map(
                                        ({ key, label, icon: Icon }) => (
                                            <button
                                                key={key}
                                                onClick={() => setActive(key)}
                                                className={cn(
                                                    'h-9 flex items-center gap-2.5 px-2.5 rounded-md cursor-pointer text-[13px] transition-colors',
                                                    active === key
                                                        ? 'bg-white/6 text-neutral-100'
                                                        : 'text-neutral-400 hover:bg-white/3 hover:text-neutral-200',
                                                )}
                                            >
                                                <Icon className='w-4 h-4' />
                                                {label}
                                            </button>
                                        ),
                                    )}
                                </nav>
                            </aside>

                            <div className='flex-1 flex flex-col min-w-0'>
                                <div className='px-6 pt-5 pb-3'>
                                    <h1 className='text-[18px] text-neutral-100 font-medium'>
                                        {
                                            SECTIONS.find(
                                                (s) => s.key === active,
                                            )?.label
                                        }
                                    </h1>
                                </div>
                                <div className='h-px bg-white/6' />
                                <div className='flex-1 overflow-y-auto px-6 py-5'>
                                    {active === 'account' && <AccountSection />}
                                    {active === 'personalization' && (
                                        <PersonalizationSection
                                            isOpen={isOpen}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
