'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerDownLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatSearchStore } from '@/store/useChatSearchStore';
import { useChatStore } from '@/store/useChatStore';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { useActiveTabRendererStore } from '@/store/useActiveTabRenderer';
import { SECTION_TABS } from '@/types/section_types';
import { LuArrowRight } from 'react-icons/lu';

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

function formatChatDate(iso: string): string {
    const date = new Date(iso);
    const startOfDay = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayDiff = Math.round(
        (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
    );
    if (dayDiff <= 0) return 'Today';
    if (dayDiff === 1) return 'Yesterday';
    if (dayDiff === 2) return 'Day before yesterday';
    return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

export default function ChatSearchModal() {
    const isOpen = useChatSearchStore((s) => s.isOpen);
    const close = useChatSearchStore((s) => s.close);

    const conversations = useChatStore((s) => s.conversations);
    const selectConversation = useChatStore((s) => s.selectConversation);
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token ?? null;
    const setActiveTab = useActiveTabRendererStore((s) => s.setActiveTab);

    const [query, setQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter((c) => c.title.toLowerCase().includes(q));
    }, [conversations, query]);

    // Reset internal state on close; focus input when opened.
    // State-during-render pattern avoids setState() in an effect body.
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen);
        if (!isOpen) {
            setQuery('');
            setFocusedIndex(0);
        }
    }
    useEffect(() => {
        if (!isOpen) return;
        const t = setTimeout(() => inputRef.current?.focus(), 0);
        return () => clearTimeout(t);
    }, [isOpen]);

    // Snap focus back to the top when the conversation list changes externally
    // (typing into the input resets focusedIndex inline in onChange below).
    const [prevConversations, setPrevConversations] = useState(conversations);
    if (prevConversations !== conversations) {
        setPrevConversations(conversations);
        setFocusedIndex(0);
    }

    const handleOpen = useCallback(
        (id: string) => {
            if (!token) return;
            void selectConversation(token, id);
            setActiveTab(SECTION_TABS.CHAT_SECTION);
            close();
        },
        [token, selectConversation, setActiveTab, close],
    );

    useEffect(() => {
        if (!isOpen) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
                return;
            }
            if (filtered.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex((curr) =>
                    Math.min(curr + 1, filtered.length - 1),
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex((curr) => Math.max(curr - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const target = filtered[focusedIndex];
                if (target) handleOpen(target.id);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, close, filtered, focusedIndex, handleOpen]);

    useEffect(() => {
        itemRefs.current[focusedIndex]?.scrollIntoView({
            block: 'nearest',
        });
    }, [focusedIndex]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={close}
                    className='fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-2xs pt-[22vh]'
                >
                    {/* component */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.98,
                            filter: 'blur(6px)',
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            filter: 'blur(0px)',
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.98,
                            filter: 'blur(6px)',
                        }}
                        transition={{
                            duration: 0.18,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className='w-full max-w-180 mx-4 rounded-[1.2rem] bg-linear-to-b from-[#0f0f10] to-[#101011] ring-1 ring-white/8 shadow-2xl shadow-black/60 overflow-hidden inset-shadow-sm inset-shadow-white/3 relative'
                    >
                        <div className='h-px w-full top-0 bg-linear-to-r from-neutral-800/10 via-neutral-800/40 to-neutral-800/10' />
                        {/* search bar */}
                        <div className='p-2.5'>
                            <div className='flex items-center gap-3 h-11 px-4 rounded-[0.8rem] bg-[#141415] ring-1 ring-white/5'>
                                <Search className='size-4 text-neutral-500 shrink-0' />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setFocusedIndex(0);
                                    }}
                                    placeholder='Search conversations'
                                    className='flex-1 bg-transparent outline-none text-[15px] text-neutral-100 placeholder:text-neutral-500'
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className='max-h-93 overflow-y-auto px-3 pb-2 no-scrollbar'>
                            {filtered.length === 0 ? (
                                <div className='py-10 text-center text-sm text-neutral-500'>
                                    {query.trim()
                                        ? 'No matching chats'
                                        : 'No chats yet'}
                                </div>
                            ) : (
                                <div>
                                    <div className='px-2 pt-1.5 pb-1 text-[12px] text-neutral-500/80'>
                                        History
                                    </div>
                                    <div className='flex flex-col gap-y-0.5'>
                                        {filtered.map((c, idx) => {
                                            const isFocused =
                                                focusedIndex === idx;
                                            return (
                                                <button
                                                    key={c.id}
                                                    ref={(el) => {
                                                        itemRefs.current[idx] =
                                                            el;
                                                    }}
                                                    onClick={() =>
                                                        handleOpen(c.id)
                                                    }
                                                    onMouseEnter={() =>
                                                        setFocusedIndex(idx)
                                                    }
                                                    className={cn(
                                                        'w-full flex items-center justify-between gap-3 h-11.5 px-3 text-left cursor-pointer rounded-xl transition-colors',
                                                        isFocused &&
                                                            'bg-white/2',
                                                    )}
                                                >
                                                    <div className='flex items-center gap-2.5 min-w-0'>
                                                        <LuArrowRight className='size-4 text-neutral-700 shrink-0' />
                                                        <span className='truncate text-sm font-medium text-neutral-100'>
                                                            {c.title ||
                                                                'Untitled'}
                                                        </span>
                                                    </div>
                                                    <div className='text-[11.5px] text-neutral-500 shrink-0'>
                                                        {formatChatDate(
                                                            c.updatedAt,
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* search bar footer */}
                        <div className='border-t border-white/5 px-4 py-3.5 flex items-center justify-between text-[12px] text-neutral-500'>
                            <div
                                onClick={() => close()}
                                className='flex items-center gap-2 cursor-pointer'
                            >
                                <span className='inline-flex items-center justify-center size-5 rounded-sm bg-white/4 ring-1 ring-white/8 text-neutral-300'>
                                    <CornerDownLeft className='size-3' />
                                </span>
                                <span>Open Chat</span>
                            </div>
                            <div className='flex items-center gap-1.5'>
                                <span className='inline-flex items-center justify-center h-5 px-1.5 rounded-sm bg-white/4 ring-1 ring-white/8 text-neutral-400 font-mono text-[11px]'>
                                    ESC
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
