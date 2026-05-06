'use client';
import { relativeTime } from './relativeTime';

interface Props {
    title: string;
    updatedAt: string;
    onClick: () => void;
}

export default function ChatHistoryItem({ title, updatedAt, onClick }: Props) {
    return (
        <button
            onClick={onClick}
            className='w-full text-left py-4 border-b border-white/6 hover:bg-white/2 transition-colors cursor-pointer px-2 -mx-2'
        >
            <div className='text-[15px] font-medium text-neutral-100 truncate'>
                {title || 'Untitled'}
            </div>
            <div className='mt-1 text-xs text-neutral-500'>
                Last message {relativeTime(updatedAt)}
            </div>
        </button>
    );
}
