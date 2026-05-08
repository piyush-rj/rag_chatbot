'use client';

import {
    useEffect,
    useRef,
    type ComponentType,
    type RefObject,
    type SVGProps,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HardDrive, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

type AttachOption = {
    key: 'upload' | 'drive';
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    iconBgClass: string;
    iconColorClass: string;
    onSelect: () => void;
};

type AttachPanelProps = {
    open: boolean;
    onClose: () => void;
    onUploadFiles: () => void;
    onConnectDrive: () => void;
    triggerRef?: RefObject<HTMLElement | null>;
    className?: string;
};

const panelMotion = {
    initial: { opacity: 0, y: 6, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 6, scale: 0.98 },
    transition: {
        duration: 0.16,
        ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
};

export function AttachPanel({
    open,
    onClose,
    onUploadFiles,
    onConnectDrive,
    triggerRef,
    className,
}: AttachPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (panelRef.current?.contains(target)) return;
            if (triggerRef?.current?.contains(target)) return;
            onClose();
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open, onClose, triggerRef]);

    const options: AttachOption[] = [
        {
            key: 'upload',
            icon: Upload,
            title: 'Upload files',
            description: 'Add documents from your device',
            iconBgClass: 'bg-sky-500/15 ring-sky-400/20',
            iconColorClass: 'text-sky-400',
            onSelect: onUploadFiles,
        },
        {
            key: 'drive',
            icon: HardDrive,
            title: 'Connect to Drive',
            description: 'Pull in files from Google Drive',
            iconBgClass: 'bg-teal-500/15',
            iconColorClass: 'text-teal-400',
            onSelect: onConnectDrive,
        },
    ];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={panelRef}
                    {...panelMotion}
                    className={cn(
                        'absolute bottom-12 left-6 z-30 w-64 origin-bottom-left p-1.5 rounded-lg bg-dark-base ring-1 ring-white/5 shadow-lg shadow-black/40',
                        className,
                    )}
                >
                    {options.map(
                        ({
                            key,
                            icon: Icon,
                            title,

                            description,
                            iconBgClass,
                            iconColorClass,
                            onSelect,
                        }) => (
                            <button
                                key={key}
                                type='button'
                                onClick={() => {
                                    onSelect();
                                    onClose();
                                }}
                                className='w-full flex items-start gap-2.75 p-2 rounded-md text-left cursor-pointer hover:bg-neutral-800/50 transition-colors duration-150'
                            >
                                <div
                                    className={cn(
                                        'h-8 w-8 shrink-0 flex items-center justify-center rounded-md',
                                        iconBgClass,
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'size-3.5',
                                            iconColorClass,
                                        )}
                                    />
                                </div>
                                <div className='flex flex-col min-w-0'>
                                    <span className='text-xs text-neutral-100 leading-tight'>
                                        {title}
                                    </span>
                                    <span className='text-[11px] text-neutral-500 leading-snug mt-0.5'>
                                        {description}
                                    </span>
                                </div>
                            </button>
                        ),
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
