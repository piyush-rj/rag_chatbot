'use client';
import { useActiveTabRendererStore } from '@/store/useActiveTabRenderer';
import { SECTION_TABS } from '@/types/section_types';
import ChatSection from './ChatSection/ChatSection';
import ChatHistorySection from './ChatHistorySection/ChatHistorySection';

export default function SectionRenderer() {
    const activeTab = useActiveTabRendererStore((s) => s.activeTab);

    switch (activeTab) {
        case SECTION_TABS.CHAT_HISTORY:
            return <ChatHistorySection />;
        case SECTION_TABS.CHAT_SECTION:
        default:
            return <ChatSection />;
    }
}
