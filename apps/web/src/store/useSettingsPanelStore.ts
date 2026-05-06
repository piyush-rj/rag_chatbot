import { create } from 'zustand';

interface SettingsPanelData {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export const useSettingsPanelStore = create<SettingsPanelData>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
