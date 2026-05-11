'use client';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const SHEET_SPRING = {
    type: 'spring' as const,
    stiffness: 380,
    damping: 28,
    mass: 0.7,
};

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
    onConfirm,
    onCancel,
}: Props) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onConfirm, onCancel]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key='backdrop'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onCancel}
                        className='fixed inset-0 bg-black/55 backdrop-blur-[2px] z-50'
                    />
                    <motion.div
                        key='sheet'
                        initial={{
                            opacity: 0,
                            scale: 0.98,
                            filter: 'blur(4px)',
                        }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                        transition={SHEET_SPRING}
                        role='dialog'
                        aria-modal='true'
                        className='fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-110 max-w-[90vw] z-60 p-5 rounded-xl bg-[#0e0e0e] ring-1 ring-white/8 shadow-2xl shadow-black/60'
                    >
                        <h2 className='text-[15px] font-medium text-neutral-100 leading-tight'>
                            {title}
                        </h2>
                        {message && (
                            <p className='mt-2 text-xs text-neutral-400 leading-relaxed'>
                                {message}
                            </p>
                        )}
                        <div className='mt-5 flex items-center justify-end gap-2'>
                            <button
                                type='button'
                                onClick={onCancel}
                                className='px-3 py-1.5 rounded-md text-xs text-neutral-300 hover:text-neutral-100 hover:bg-white/5 transition-colors cursor-pointer'
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type='button'
                                onClick={onConfirm}
                                className={cn(
                                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
                                    destructive
                                        ? 'bg-red-500/20 text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/30'
                                        : 'bg-neutral-100 text-neutral-900 hover:bg-white',
                                )}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
