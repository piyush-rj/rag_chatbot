'use client';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const SEARCH_SPRING = {
    type: 'spring' as const,
    stiffness: 360,
    damping: 24,
    mass: 0.7,
};

export default function ChatHistorySearchBar({
    value,
    onChange,
    placeholder = 'search',
}: Props) {
    const [searchBarActive, setSearchBarActive] = useState<boolean>(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Click anywhere outside the bar collapses it. Escape too.
        const handleMouseDown = (e: MouseEvent) => {
            if (wrapperRef.current?.contains(e.target as Node)) return;
            setSearchBarActive(false);
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'escape') {
                e.preventDefault();
                setSearchBarActive(false);
                inputRef.current?.blur();
            }
        };
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (searchBarActive) inputRef.current?.focus();
    }, [searchBarActive]);

    return (
        <div ref={wrapperRef} className='flex justify-end h-full'>
            <motion.div
                onClick={() => setSearchBarActive(true)}
                animate={{ width: searchBarActive ? 280 : 132 }}
                transition={SEARCH_SPRING}
                className='relative h-full cursor-text'
            >
                <Search
                    className={cn(
                        'absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none transition-colors duration-200',
                        searchBarActive
                            ? 'text-neutral-200'
                            : 'text-neutral-500',
                    )}
                />
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                        'w-full pl-10 pr-4 h-full rounded-full',
                        'bg-white/5 ring-1 ring-white/6 shadow-sm shadow-black/10',
                        'text-[15px] text-neutral-200',
                        'outline-none transition-colors duration-200 cursor-text',
                    )}
                />
            </motion.div>
        </div>
    );
}
