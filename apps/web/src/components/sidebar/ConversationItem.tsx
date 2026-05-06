'use client';
import { cn } from '@/lib/utils';
import { Popover } from 'radix-ui';
import { SlOptions } from 'react-icons/sl';
import OptionsItem from './OptionsItem';
import { MdDeleteOutline, MdDriveFileRenameOutline } from 'react-icons/md';
import { IoShareOutline } from 'react-icons/io5';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { useChatStore } from '@/store/useChatStore';
import ConversationApi from '@/services/backend_services/conversation.api';
import { useEffect, useRef, useState } from 'react';

interface Props {
    id: string;
    title: string;
    active: boolean;
    onClick: () => void;
}

export default function ConversationItem({
    id,
    title,
    active,
    onClick,
}: Props) {
    const session = useUserSessionStore((s) => s.session);
    const removeConversation = useChatStore((s) => s.removeConversation);
    const renameConversationLocal = useChatStore(
        (s) => s.renameConversationLocal,
    );

    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(title);
    const [pendingTitle, setPendingTitle] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const displayTitle = pendingTitle ?? title;

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    async function handleDelete() {
        const token = session?.user?.token;
        if (!token) return;
        try {
            await ConversationApi.deleteConversation(token, id);
            removeConversation(id);
        } catch (err) {
            console.error('failed to delete conversation', err);
        }
    }

    function startRename() {
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

    return (
        <div
            onClick={onClick}
            className={cn(
                'flex items-center rounded-sm px-2.75 py-1.5 group cursor-pointer',
                active
                    ? 'bg-white/6 text-neutral-100'
                    : 'text-neutral-400 hover:bg-white/3 hover:shadow-xs hover:shadow-black/5 hover:inset-shadow-xs hover:inset-shadow-white/1 hover:text-neutral-200',
            )}
        >
            {/* text  */}
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
                    className='w-full text-left text-[13.5px] truncate pr-3 bg-transparent outline-none border-none p-0 m-0 text-inherit font-inherit cursor-pointer'
                />
            ) : (
                <button
                    onClick={onClick}
                    className={cn(
                        'w-full text-left rounded-md text-[13.5px] truncate transition-colors pr-3 cursor-pointer',
                        pendingTitle !== null && 'animate-pulse',
                    )}
                >
                    {displayTitle || 'Untitled'}
                </button>
            )}

            {/* options panel */}
            <Popover.Root>
                <Popover.Trigger asChild>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className='h-auto w-auto opacity-0 group-hover:opacity-100 cursor-pointer'
                    >
                        <SlOptions className='size-3' />
                    </div>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        side='right'
                        align='start'
                        sideOffset={8}
                        collisionPadding={8}
                        className={cn(
                            'rounded-md bg-[#111111] ring-1 ring-white/8 outline-none! shadow-2xl shadow-black/60 z-50 gap-0 overflow-hidden',
                        )}
                    >
                        <OptionsItem
                            icon={
                                <MdDriveFileRenameOutline className='size-3.5' />
                            }
                            name='Rename'
                            className='rounded-b-none'
                            onClick={startRename}
                        />
                        <div className='h-px w-full bg-white/5' />
                        <OptionsItem
                            icon={<IoShareOutline className='size-3.5' />}
                            name='Share'
                            className='rounded-t-none'
                            onClick={() => {}}
                        />
                        <div className='h-px w-full bg-white/5' />
                        <OptionsItem
                            icon={<MdDeleteOutline className='size-3.5' />}
                            name='Delete'
                            className='text-red-500/80 rounded-none'
                            onClick={handleDelete}
                        />
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
