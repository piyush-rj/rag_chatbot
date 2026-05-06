import { cn } from '@/lib/utils';
import React from 'react';

interface OptionsItemProps {
    icon: React.ReactElement;
    name: string;
    onClick: () => void;
    className?: string;
}

export default function OptionsItem({
    icon,
    name,
    onClick,
    className,
}: OptionsItemProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'h-9 w-24 rounded-md flex items-center tracking-wide px-3 gap-1.5 text-neutral-300 text-[12px] hover:bg-[#0f0f0f] cursor-pointer',
                className,
            )}
        >
            <div>{icon}</div>

            <div>{name}</div>
        </div>
    );
}
