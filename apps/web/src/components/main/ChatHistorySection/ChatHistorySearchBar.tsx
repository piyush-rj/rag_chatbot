'use client';
import { Search } from 'lucide-react';

interface Props {
    value: string;
    onChange: (value: string) => void;
}

export default function ChatHistorySearchBar({ value, onChange }: Props) {
    return (
        <div className='relative w-full'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none' />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder='Search your chats...'
                className='w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/4 ring-1 ring-white/8 text-[15px] text-neutral-200 placeholder:text-neutral-500 outline-none focus:ring-white/15 transition-colors'
            />
        </div>
    );
}
