'use client';
import { cn } from '@/lib/utils';
import { useShortcutsPanelStore } from '@/store/useShortcutsPanelStore';

export default function PageScaler({
    children,
}: {
    children: React.ReactNode;
}) {
    const isOpen = useShortcutsPanelStore((s) => s.isOpen);

    return (
        <div
            className={cn(
                'transition-transform duration-300 ease-out',
                isOpen && 'scale-[0.98]',
            )}
        >
            {children}
        </div>
    );
}
