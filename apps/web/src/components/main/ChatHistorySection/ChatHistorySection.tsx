'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { useChatStore } from '@/store/useChatStore';
import { useActiveTabRendererStore } from '@/store/useActiveTabRenderer';
import { SECTION_TABS } from '@/types/section_types';
import ConversationApi from '@/services/backend_services/conversation.api';
import type { ConversationSummary } from '@/types/conversation.types';
import ChatHistoryItem from './ChatHistoryItem';
import ChatHistorySearchBar from './ChatHistorySearchBar';
import { application_name } from '@/lib/application';

const PAGE_SIZE = 20;

export default function ChatHistorySection() {
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token ?? null;
    const selectConversation = useChatStore((s) => s.selectConversation);
    const newConversation = useChatStore((s) => s.newConversation);
    const setActiveTab = useActiveTabRendererStore((s) => s.setActiveTab);

    const [chats, setChats] = useState<ConversationSummary[]>([]);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [query, setQuery] = useState<string>('');

    useEffect(() => {
        if (!token) {
            return;
        }
        let cancelled = false;
        ConversationApi.fetchAll(token, { limit: PAGE_SIZE, offset: 0 })
            .then((res) => {
                if (cancelled) return;
                setChats(res.conversations);
                setHasMore(res.hasMore);
            })
            .catch((err) => {
                console.error('failed to load chat history', err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [token]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return chats;
        return chats.filter((c) => c.title.toLowerCase().includes(q));
    }, [chats, query]);

    async function handleShowMore() {
        if (!token || loading) return;
        setLoading(true);
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
            setLoading(false);
        }
    }

    function handleNewChat() {
        newConversation();
        setActiveTab(SECTION_TABS.CHAT_SECTION);
    }

    function handleOpen(id: string) {
        if (!token) return;
        void selectConversation(token, id);
        setActiveTab(SECTION_TABS.CHAT_SECTION);
    }

    return (
        <main className='flex-1 flex flex-col min-w-0 h-full overflow-y-auto'>
            <div className='max-w-4xl w-full mx-auto px-8 pt-16 pb-12'>
                <div className='flex items-center justify-between mb-8'>
                    <h1 className='text-4xl font-serif text-neutral-100'>
                        Chat History
                    </h1>
                    <button
                        onClick={handleNewChat}
                        className='flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-100 text-neutral-900 text-sm font-medium hover:bg-white transition-colors cursor-pointer'
                    >
                        <Plus className='size-4' />
                        New chat
                    </button>
                </div>

                <ChatHistorySearchBar value={query} onChange={setQuery} />

                <div className='mt-8 mb-2 text-sm text-neutral-400'>
                    Your chats with {application_name}
                </div>

                <div className='border-t border-white/6'>
                    {filtered.map((c) => (
                        <ChatHistoryItem
                            key={c.id}
                            title={c.title}
                            updatedAt={c.updatedAt}
                            onClick={() => handleOpen(c.id)}
                        />
                    ))}
                    {filtered.length === 0 && !loading && (
                        <div className='py-10 text-center text-sm text-neutral-500'>
                            {query.trim()
                                ? 'No matching chats'
                                : 'No chats yet'}
                        </div>
                    )}
                </div>

                {hasMore && !query.trim() && (
                    <div className='mt-6 flex justify-center'>
                        <button
                            onClick={handleShowMore}
                            disabled={loading}
                            className='px-4 py-2 rounded-lg text-sm text-neutral-300 hover:text-neutral-100 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer'
                        >
                            {loading ? 'Loading...' : 'Show more'}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
