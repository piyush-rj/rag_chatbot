'use client';

import { AlertTriangle, FileText, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    PENDING_CONVERSATION_KEY,
    useDocumentsStore,
} from '@/store/useDocumentsStore';
import { useUserSessionStore } from '@/store/useUserSessionStore';

const chipMotion = {
    initial: { opacity: 0, y: 4, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -4, scale: 0.96 },
    transition: { duration: 0.15 },
};

export function AttachedDocs() {
    const activeConversationId = useDocumentsStore(
        (s) => s.activeConversationId,
    );
    const bucket = useDocumentsStore(
        (s) =>
            s.byConversation[activeConversationId ?? PENDING_CONVERSATION_KEY],
    );
    const detachAttached = useDocumentsStore((s) => s.detachAttached);
    const dismissUploading = useDocumentsStore((s) => s.dismissUploading);
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token;

    const attached = bucket?.attached ?? [];
    const uploading = bucket?.uploading ?? [];

    if (attached.length === 0 && uploading.length === 0) return null;

    return (
        <div className='mb-2 flex flex-wrap gap-1.5'>
            <AnimatePresence initial={false}>
                {uploading.map((f) => {
                    const failed = Boolean(f.error);

                    if (failed) {
                        return (
                            <motion.div
                                key={f.localId}
                                {...chipMotion}
                                className='flex items-start gap-2 max-w-72 px-2.5 py-1.5 rounded-lg ring-1 bg-red-500/10 ring-red-400/30 text-red-100'
                            >
                                <AlertTriangle className='size-3.5 text-red-400 shrink-0 mt-0.5' />
                                <div className='flex flex-col min-w-0 flex-1'>
                                    <span className='truncate text-xs text-red-50'>
                                        {f.name}
                                    </span>
                                    <span className='text-[11px] text-red-300/90 leading-snug line-clamp-2'>
                                        {f.error}
                                    </span>
                                </div>
                                <button
                                    type='button'
                                    aria-label='Dismiss error'
                                    onClick={() => dismissUploading(f.localId)}
                                    className='h-5 w-5 flex items-center justify-center rounded-full hover:bg-red-500/20 cursor-pointer shrink-0'
                                >
                                    <X className='size-3 text-red-300' />
                                </button>
                            </motion.div>
                        );
                    }

                    return (
                        <motion.div
                            key={f.localId}
                            {...chipMotion}
                            className='inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-full ring-1 bg-neutral-800/40 ring-white/4 text-xs text-neutral-200'
                        >
                            <Loader2 className='size-3.5 text-sky-400 animate-spin' />
                            <span className='truncate max-w-40'>{f.name}</span>
                            <span className='text-[10px] text-neutral-400 tabular-nums w-7 text-right'>
                                {f.progress}%
                            </span>
                            <button
                                type='button'
                                aria-label='Cancel upload'
                                onClick={() => dismissUploading(f.localId)}
                                className='h-5 w-5 flex items-center justify-center rounded-full hover:bg-neutral-700/60 cursor-pointer'
                            >
                                <X className='size-3 text-neutral-400' />
                            </button>
                        </motion.div>
                    );
                })}

                {attached.map((doc) => (
                    <motion.div
                        key={doc.id}
                        {...chipMotion}
                        className='inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-full bg-neutral-800/40 ring-1 ring-white/4 text-xs text-neutral-200'
                    >
                        <FileText className='size-3.5 text-sky-400' />
                        <span className='truncate max-w-40'>{doc.name}</span>
                        <button
                            type='button'
                            aria-label={`Remove ${doc.name}`}
                            onClick={() =>
                                token && detachAttached(token, doc.id)
                            }
                            className='h-5 w-5 flex items-center justify-center rounded-full hover:bg-neutral-700/60 cursor-pointer'
                        >
                            <X className='size-3 text-neutral-400' />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
