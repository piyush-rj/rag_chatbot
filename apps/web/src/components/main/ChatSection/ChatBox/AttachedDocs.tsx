'use client';

import { AlertTriangle, FileText, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDocumentsStore } from '@/store/useDocumentsStore';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { cn } from '@/lib/utils';

const chipMotion = {
    initial: { opacity: 0, y: 4, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -4, scale: 0.96 },
    transition: { duration: 0.15 },
};

export function AttachedDocs() {
    const attached = useDocumentsStore((s) => s.attachedDocuments);
    const uploading = useDocumentsStore((s) => s.uploadingFiles);
    const detachAttached = useDocumentsStore((s) => s.detachAttached);
    const dismissUploading = useDocumentsStore((s) => s.dismissUploading);
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token;

    if (attached.length === 0 && uploading.length === 0) return null;

    return (
        <div className='mb-2 flex flex-wrap gap-1.5'>
            <AnimatePresence initial={false}>
                {uploading.map((f) => {
                    const failed = Boolean(f.error);
                    return (
                        <motion.div
                            key={f.localId}
                            {...chipMotion}
                            className={cn(
                                'inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-full ring-1 text-xs',
                                failed
                                    ? 'bg-red-500/10 ring-red-400/30 text-red-200'
                                    : 'bg-neutral-800/40 ring-white/4 text-neutral-200',
                            )}
                            title={f.error}
                        >
                            {failed ? (
                                <AlertTriangle className='size-3.5 text-red-400' />
                            ) : (
                                <Loader2 className='size-3.5 text-sky-400 animate-spin' />
                            )}
                            <span className='truncate max-w-40'>{f.name}</span>
                            {!failed && (
                                <span className='text-[10px] text-neutral-400 tabular-nums w-7 text-right'>
                                    {f.progress}%
                                </span>
                            )}
                            <button
                                type='button'
                                aria-label={
                                    failed ? 'Dismiss error' : 'Cancel upload'
                                }
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
