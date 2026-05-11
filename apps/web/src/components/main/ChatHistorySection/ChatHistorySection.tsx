'use client';
import { useEffect, useMemo, useRef, useState, type WheelEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { useChatStore } from '@/store/useChatStore';
import { useActiveTabRendererStore } from '@/store/useActiveTabRenderer';
import { SECTION_TABS } from '@/types/section_types';
import ConversationApi from '@/services/backend_services/conversation.api';
import DocumentApi from '@/services/backend_services/document.api';
import type { ConversationSummary } from '@/types/conversation.types';
import type { DocsResponseType } from 'shared';
import ChatHistoryItem from './ChatHistoryItem';
import ChatHistorySearchBar from './ChatHistorySearchBar';
import DocumentLibraryItem from './DocumentLibraryItem';
import { application_name } from '@/lib/application';
import { SiReadthedocs } from 'react-icons/si';
import { LuMessagesSquare } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const TOGGLE_SPRING = {
    type: 'spring' as const,
    stiffness: 380,
    damping: 32,
    mass: 0.6,
};

const VIEW_TRANSITION = {
    duration: 0.28,
    ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
};

const PAGE_SIZE = 20;

type View = 'chats' | 'docs';

export default function ChatHistorySection() {
    const router = useRouter();
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token ?? null;
    const selectConversation = useChatStore((s) => s.selectConversation);
    const removeConversation = useChatStore((s) => s.removeConversation);
    const setActiveTab = useActiveTabRendererStore((s) => s.setActiveTab);

    const scrollRef = useRef<HTMLDivElement>(null);

    const [view, setView] = useState<View>('chats');
    const [query, setQuery] = useState<string>('');

    const [chats, setChats] = useState<ConversationSummary[]>([]);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [chatsLoading, setChatsLoading] = useState<boolean>(true);

    const [docs, setDocs] = useState<DocsResponseType[]>([]);
    const [docsLoaded, setDocsLoaded] = useState<boolean>(false);
    const [docsLoading, setDocsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        ConversationApi.fetchAll(token, { limit: PAGE_SIZE, offset: 0 })
            .then((res) => {
                if (cancelled) return;
                setChats(res.conversations);
                setHasMore(res.hasMore);
            })
            .catch((err) => console.error('failed to load chat history', err))
            .finally(() => {
                if (!cancelled) setChatsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [token]);

    // Lazy-load the docs list the first time the user opens that tab.
    useEffect(() => {
        if (!token || view !== 'docs' || docsLoaded) return;
        let cancelled = false;
        setDocsLoading(true);
        DocumentApi.getAllUserDocs(token)
            .then((res) => {
                if (!cancelled) setDocs(res);
            })
            .catch((err) => console.error('failed to load documents', err))
            .finally(() => {
                if (cancelled) return;
                setDocsLoading(false);
                setDocsLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, [token, view, docsLoaded]);

    const filteredChats = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return chats;
        return chats.filter((c) => c.title.toLowerCase().includes(q));
    }, [chats, query]);

    const filteredDocs = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return docs;
        return docs.filter(
            (d) =>
                d.name.toLowerCase().includes(q) ||
                d.mimeType.toLowerCase().includes(q),
        );
    }, [docs, query]);

    async function handleShowMore() {
        if (!token || chatsLoading) return;
        setChatsLoading(true);
        try {
            const res = await ConversationApi.fetchAll(token, {
                limit: PAGE_SIZE,
                offset: chats.length,
            });
            setChats((prev) => [...prev, ...res.conversations]);
            setHasMore(res.hasMore);
        } catch (err) {
            console.error('failed to load more chats', err);
        } finally {
            setChatsLoading(false);
        }
    }

    function handleOpen(id: string) {
        if (!token) return;
        void selectConversation(token, id);
        setActiveTab(SECTION_TABS.CHAT_SECTION);
    }

    function handleChatDeleted(id: string) {
        setChats((prev) => prev.filter((c) => c.id !== id));
        removeConversation(id);
    }

    function handleChatRenamed(id: string, newTitle: string) {
        setChats((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
        );
    }

    function handleDocDeleted(id: string) {
        setDocs((prev) => prev.filter((d) => d.id !== id));
    }

    // Forward wheel events that happen anywhere on the page (e.g. over the
    // sticky header) to the inner scroll container. When the cursor is
    // already inside the scrollable area the browser handles it natively,
    // so we early-return to avoid double-scrolling.
    function handleWheel(e: WheelEvent<HTMLElement>) {
        const el = scrollRef.current;
        if (!el) return;
        if (el.contains(e.target as Node)) return;
        el.scrollTop += e.deltaY;
    }

    const isChats = view === 'chats';
    const heading = isChats ? 'Chat History' : 'Documents';
    const subheading = isChats
        ? `Your chats with ${application_name}`
        : `Documents you've uploaded`;

    return (
        <main
            onWheel={handleWheel}
            className='flex-1 flex flex-col min-w-0 h-full bg-dark-alpha'
        >
            {/* Fixed top band */}
            <div className='bg-dark-alpha'>
                <div className='max-w-4xl w-full mx-auto px-8 pt-16 pb-6'>
                    <div className='mb-8'>
                        <h1 className='text-4xl font-serif text-neutral-100'>
                            {heading}
                        </h1>
                    </div>

                    <div className='flex items-center justify-between gap-3 h-9.5'>
                        <div className='flex items-center gap-2 h-full'>
                            <LayoutGroup id='history-view-toggle'>
                                <div className='flex bg-dark-alpha p-1 rounded-md ring-1 ring-white/5 h-full'>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setView('chats');
                                            setQuery('');
                                        }}
                                        aria-pressed={isChats}
                                        className={cn(
                                            'relative h-full px-2.5 rounded-sm flex items-center gap-1.5 text-xs transition-colors cursor-pointer',
                                            isChats
                                                ? 'text-neutral-100'
                                                : 'text-neutral-400 hover:text-neutral-200',
                                        )}
                                    >
                                        {isChats && (
                                            <motion.span
                                                layoutId='history-view-pill'
                                                transition={TOGGLE_SPRING}
                                                className='absolute inset-0 rounded-sm bg-linear-to-b from-neutral-800/60 to-neutral-800/50 ring-1 ring-white/4 shadow-sm shadow-black/50 inset-shadow-2xs inset-shadow-white/5'
                                            />
                                        )}
                                        <LuMessagesSquare className='size-3.5 relative z-10' />
                                        <span className='relative z-10'>
                                            Chats
                                        </span>
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setView('docs');
                                            setQuery('');
                                        }}
                                        aria-pressed={!isChats}
                                        className={cn(
                                            'relative h-full px-2.5 rounded-sm flex items-center gap-1.5 text-xs transition-colors cursor-pointer',
                                            !isChats
                                                ? 'text-neutral-100'
                                                : 'text-neutral-400 hover:text-neutral-200',
                                        )}
                                    >
                                        {!isChats && (
                                            <motion.span
                                                layoutId='history-view-pill'
                                                transition={TOGGLE_SPRING}
                                                className='absolute inset-0 rounded-sm bg-linear-to-b from-neutral-800/60 to-neutral-800/50 ring-1 ring-white/4 shadow-sm shadow-black/50 inset-shadow-2xs inset-shadow-white/5'
                                            />
                                        )}
                                        <SiReadthedocs className='size-3.5 relative z-10' />
                                        <span className='relative z-10'>
                                            Docs
                                        </span>
                                    </button>
                                </div>
                            </LayoutGroup>
                        </div>

                        <ChatHistorySearchBar
                            value={query}
                            onChange={setQuery}
                        />
                    </div>

                    <div className='mt-8 text-sm text-neutral-400'>
                        {subheading}
                    </div>
                </div>
            </div>

            <div
                ref={scrollRef}
                className='flex-1 overflow-y-auto no-scrollbar'
            >
                <div className='max-w-4xl w-full mx-auto px-8 pb-12'>
                    <div className='border-t border-white/6'>
                        <AnimatePresence mode='wait' initial={true}>
                            <motion.div
                                key={view}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={VIEW_TRANSITION}
                            >
                                {isChats ? (
                                    <>
                                        {filteredChats.map((c) => (
                                            <ChatHistoryItem
                                                key={c.id}
                                                id={c.id}
                                                title={c.title}
                                                updatedAt={c.updatedAt}
                                                onOpen={() => handleOpen(c.id)}
                                                onDeleted={handleChatDeleted}
                                                onRenamed={handleChatRenamed}
                                            />
                                        ))}
                                        {filteredChats.length === 0 &&
                                            !chatsLoading && (
                                                <div className='py-10 text-center text-sm text-neutral-500'>
                                                    {query.trim()
                                                        ? 'No matching chats'
                                                        : 'No chats yet'}
                                                </div>
                                            )}
                                    </>
                                ) : docsLoading ? (
                                    <div className='py-10 text-center text-sm text-neutral-500'>
                                        Loading documents...
                                    </div>
                                ) : filteredDocs.length === 0 ? (
                                    <div className='py-10 text-center text-sm text-neutral-500'>
                                        {query.trim()
                                            ? 'No matching documents'
                                            : 'No documents uploaded yet'}
                                    </div>
                                ) : (
                                    filteredDocs.map((d) => (
                                        <DocumentLibraryItem
                                            key={d.id}
                                            doc={d}
                                            onDeleted={handleDocDeleted}
                                        />
                                    ))
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {isChats && hasMore && !query.trim() && (
                        <div className='mt-6 flex justify-center'>
                            <button
                                onClick={handleShowMore}
                                disabled={chatsLoading}
                                className='px-4 py-2 rounded-lg text-sm text-neutral-300 hover:text-neutral-100 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer'
                            >
                                {chatsLoading ? 'Loading...' : 'Show more'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
