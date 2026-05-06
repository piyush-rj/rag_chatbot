import { create } from 'zustand';

interface ChatSearchData {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export const useChatSearchStore = create<ChatSearchData>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
