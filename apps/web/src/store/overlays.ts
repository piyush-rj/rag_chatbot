import { useChatSearchStore } from './useChatSearchStore';
import { useShortcutsPanelStore } from './useShortcutsPanelStore';
import { useSettingsPanelStore } from './useSettingsPanelStore';

export type OverlayName = 'search' | 'shortcuts' | 'settings';

const stores = {
    search: useChatSearchStore,
    shortcuts: useShortcutsPanelStore,
    settings: useSettingsPanelStore,
} as const;

function closeOthers(except: OverlayName) {
    for (const name of Object.keys(stores) as OverlayName[]) {
        if (name === except) continue;
        stores[name].getState().close();
    }
}

export function openOverlay(name: OverlayName) {
    closeOthers(name);
    stores[name].getState().open();
}

export function toggleOverlay(name: OverlayName) {
    const target = stores[name].getState();
    if (target.isOpen) {
        target.close();
        return;
    }
    closeOthers(name);
    target.open();
}
