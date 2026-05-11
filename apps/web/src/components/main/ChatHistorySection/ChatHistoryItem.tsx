'use client';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { relativeTime } from './relativeTime';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { useChatStore } from '@/store/useChatStore';
import ConversationApi from '@/services/backend_services/conversation.api';
import ConfirmDialog from '@/components/overlays/ConfirmDialog';

interface Props {
    id: string;
    title: string;
    updatedAt: string;
    onOpen: () => void;
    onDeleted: (id: string) => void;
    onRenamed?: (id: string, title: string) => void;
}

const ACTIONS_TRANSITION = { duration: 0.14, ease: 'easeOut' as const };

export default function ChatHistoryItem({
    id,
    title,
    updatedAt,
    onOpen,
    onDeleted,
    onRenamed,
}: Props) {
    const session = useUserSessionStore((s) => s.session);
    const renameConversationLocal = useChatStore(
        (s) => s.renameConversationLocal,
    );

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState(title);
    const [pendingTitle, setPendingTitle] = useState<string | null>(null);
    const [hovered, setHovered] = useState<boolean>(false);
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const displayTitle = pendingTitle ?? title;

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    function startRename(e: MouseEvent) {
        e.stopPropagation();
        setDraft(title);
        setIsEditing(true);
    }

    async function commitRename() {
        const token = session?.user?.token;
        const trimmed = draft.trim();
        setIsEditing(false);

        if (!token || !trimmed || trimmed.length < 2 || trimmed === title) {
            setDraft(title);
            return;
        }

        setPendingTitle(trimmed);
        try {
            const updated = await ConversationApi.renameConversation(
                token,
                id,
                trimmed,
            );
            renameConversationLocal(id, updated);
            onRenamed?.(id, updated);
        } catch (err) {
            console.error('renameConversation failed', err);
            setDraft(title);
        } finally {
            setPendingTitle(null);
        }
    }

    function cancelRename() {
        setDraft(title);
        setIsEditing(false);
    }

    function openConfirm(e: MouseEvent) {
        e.stopPropagation();
        setConfirmOpen(true);
    }

    async function handleConfirmDelete() {
        const token = session?.user?.token;
        setConfirmOpen(false);
        if (!token) return;
        try {
            await ConversationApi.deleteConversation(token, id);
            onDeleted(id);
        } catch (err) {
            console.error('failed to delete conversation', err);
        }
    }

    return (
        <>
            <div
                onClick={isEditing ? undefined : onOpen}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className='flex items-center gap-2 py-4 px-3 border-b border-white/6 hover:bg-white/2 transition-colors cursor-pointer'
            >
                <div className='flex-1 min-w-0'>
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    inputRef.current?.blur();
                                } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    cancelRename();
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className='w-full text-[15px] font-medium text-neutral-100 bg-transparent outline-none border-none p-0 m-0'
                        />
                    ) : (
                        <div
                            className={cn(
                                'text-[15px] font-medium text-neutral-100 truncate',
                                pendingTitle !== null && 'animate-pulse',
                            )}
                        >
                            {displayTitle || 'Untitled'}
                        </div>
                    )}
                    <div className='mt-1 text-xs text-neutral-500'>
                        Last message {relativeTime(updatedAt)}
                    </div>
                </div>

                <AnimatePresence>
                    {hovered && !isEditing && (
                        <motion.div
                            initial={{ opacity: 0, x: 6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            transition={ACTIONS_TRANSITION}
                            className='flex items-center gap-1.75 shrink-0'
                        >
                            <ActionButton
                                onClick={startRename}
                                aria-label='Rename conversation'
                            >
                                <Pencil className='size-3.5' />
                            </ActionButton>
                            <ActionButton
                                onClick={openConfirm}
                                aria-label='Delete conversation'
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
                title={`Delete “${title || 'Untitled'}”?`}
                message='This will permanently remove the conversation and all its messages. This action cannot be undone.'
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
