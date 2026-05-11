'use client';
import { useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DocumentSource, type DocsResponseType } from 'shared';
import {
    FileText,
    HardDrive,
    File as FileIcon,
    ExternalLink,
    Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { relativeTime } from './relativeTime';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import DocumentApi from '@/services/backend_services/document.api';
import { documentFileUrl } from '@/routes/api_routes';
import ConfirmDialog from '@/components/overlays/ConfirmDialog';

const SOURCE_META: Record<
    DocumentSource,
    {
        icon: typeof FileText;
        iconColor: string;
        iconBg: string;
        label: string;
    }
> = {
    [DocumentSource.PDF]: {
        icon: FileText,
        iconColor: 'text-sky-300',
        iconBg: 'bg-sky-500/10 ring-sky-400/15',
        label: 'PDF',
    },
    [DocumentSource.DRIVE]: {
        icon: HardDrive,
        iconColor: 'text-teal-300',
        iconBg: 'bg-teal-500/10 ring-teal-400/15',
        label: 'Drive',
    },
};

const ACTIONS_TRANSITION = { duration: 0.14, ease: 'easeOut' as const };

interface Props {
    doc: DocsResponseType;
    onDeleted: (id: string) => void;
}

export default function DocumentLibraryItem({ doc, onDeleted }: Props) {
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token ?? '';

    const meta = SOURCE_META[doc.source] ?? {
        icon: FileIcon,
        iconColor: 'text-neutral-300',
        iconBg: 'bg-white/5 ring-white/10',
        label: doc.source,
    };
    const Icon = meta.icon;

    const [hovered, setHovered] = useState<boolean>(false);
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

    function handleView(e: MouseEvent) {
        e.stopPropagation();
        if (!token) return;
        window.open(
            documentFileUrl(doc.id, token),
            '_blank',
            'noopener,noreferrer',
        );
    }

    function openConfirm(e: MouseEvent) {
        e.stopPropagation();
        setConfirmOpen(true);
    }

    async function handleConfirmDelete() {
        setConfirmOpen(false);
        if (!token) return;
        try {
            await DocumentApi.deleteDocument(token, doc.id);
            onDeleted(doc.id);
        } catch (err) {
            console.error('failed to delete document', err);
        }
    }

    return (
        <>
            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className='flex items-center gap-4 py-4 px-3 border-b border-white/6 hover:bg-white/2 transition-colors'
            >
                <div
                    className={cn(
                        'h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ring-1',
                        meta.iconBg,
                    )}
                >
                    <Icon className={cn('size-4', meta.iconColor)} />
                </div>

                <div className='flex-1 min-w-0'>
                    <div className='text-[15px] font-medium text-neutral-100 truncate'>
                        {doc.name}
                    </div>
                    <div className='mt-1 flex items-center gap-2 text-xs text-neutral-500'>
                        <span className='uppercase tracking-wider text-[10px] text-neutral-400'>
                            {meta.label}
                        </span>
                        <span className='text-neutral-700'>·</span>
                        <span className='truncate font-mono text-[11px]'>
                            {doc.mimeType}
                        </span>
                        <span className='text-neutral-700'>·</span>
                        <span>{relativeTime(doc.createdAt)}</span>
                    </div>
                </div>

                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0, x: 6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            transition={ACTIONS_TRANSITION}
                            className='flex items-center gap-1.75 shrink-0'
                        >
                            <ActionButton
                                onClick={handleView}
                                aria-label='Open document in new tab'
                            >
                                <ExternalLink className='size-3.5' />
                            </ActionButton>
                            <ActionButton
                                onClick={openConfirm}
                                aria-label='Delete document'
                                destructive
                            >
                                <Trash2 className='size-3.5' />
                            </ActionButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title={`Delete “${doc.name}”?`}
                message='This will permanently remove the document and detach it from any conversations using it. This action cannot be undone.'
                confirmLabel='Delete'
                destructive
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
}

function ActionButton({
    children,
    onClick,
    destructive = false,
    ...rest
}: {
    children: React.ReactNode;
    onClick: (e: MouseEvent) => void;
    destructive?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={cn(
                'h-7 w-7 flex items-center justify-center rounded-sm ring-1 transition-all transform duration-200 cursor-pointer',
                destructive
                    ? 'bg-white/4 ring-white/8 text-neutral-400 hover:text-red-300 hover:bg-red-500/10 hover:ring-0'
                    : 'bg-white/4 ring-white/8 text-neutral-400 hover:text-neutral-200 hover:bg-white/8 hover:ring-0',
            )}
            {...rest}
        >
            {children}
        </button>
    );
}
