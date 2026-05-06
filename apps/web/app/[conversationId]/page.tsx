'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/sidebar/Sidebar';
import SectionRenderer from '@/components/main/SectionRenderer';
import { useChatStore } from '@/store/useChatStore';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { useActiveTabRendererStore } from '@/store/useActiveTabRenderer';
import { SECTION_TABS } from '@/types/section_types';

export default function ConversationPage() {
    const params = useParams<{ conversationId: string }>();
    const id = params?.conversationId ?? null;

    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token ?? null;
    const selectConversation = useChatStore((s) => s.selectConversation);
    const setActiveTab = useActiveTabRendererStore((s) => s.setActiveTab);

    // When the user lands on /<id> directly (refresh / shared link),
    // load that conversation into the store and switch to the chat tab.
    useEffect(() => {
        if (token && id) {
            void selectConversation(token, id);
            setActiveTab(SECTION_TABS.CHAT_SECTION);
        }
    }, [token, id, selectConversation, setActiveTab]);

    return (
        <div className='h-screen w-screen bg-[#090909] text-neutral-100 flex'>
            <Sidebar />
            <SectionRenderer />
        </div>
    );
}
