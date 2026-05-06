import { SECTION_TABS } from '@/types/section_types';
import { create } from 'zustand';

interface ActiveTabRendererData {
    activeTab: SECTION_TABS;
    setActiveTab: (tab: SECTION_TABS) => void;
}

export const useActiveTabRendererStore = create<ActiveTabRendererData>(
    (set) => ({
        activeTab: SECTION_TABS.CHAT_SECTION,
        setActiveTab: (tab: SECTION_TABS) => set({ activeTab: tab }),
    }),
);
