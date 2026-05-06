'use client';
import { useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useActiveTabRendererStore } from '@/store/useActiveTabRenderer';
import { toggleOverlay } from '@/store/overlays';
import { SECTION_TABS } from '@/types/section_types';
import ChatSearchModal from './ChatSearchModal';
import ShortcutsPanel from './ShortcutsPanel';
import SettingsPanel from './settings/SettingsPanel';

export default function GlobalOverlays() {
    const newConversation = useChatStore((s) => s.newConversation);
    const setActiveTab = useActiveTabRendererStore((s) => s.setActiveTab);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod) return;
            const key = e.key.toLowerCase();

            if (e.shiftKey && key === 'o') {
                e.preventDefault();
                newConversation();
                setActiveTab(SECTION_TABS.CHAT_SECTION);
                return;
            }

            if (key === 'k') {
                e.preventDefault();
                toggleOverlay('search');
                return;
            }

            if (key === '/') {
                e.preventDefault();
                toggleOverlay('shortcuts');
                return;
            }

            if (e.shiftKey && key === ',') {
                e.preventDefault();
                setActiveTab(SECTION_TABS.CHAT_HISTORY);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [newConversation, setActiveTab]);

    return (
        <>
            <ChatSearchModal />
            <ShortcutsPanel />
            <SettingsPanel />
        </>
    );
}
