'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import type { Char } from './hooks';

const charEase = [0.22, 1, 0.36, 1] as const;

type Props = {
    value: string;
    chars: Char[];
    placeholder: string;
    lineHeight: number;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    onChange: (next: string) => void;
    onSubmit: () => void;
};

export function ChatInput({
    value,
    chars,
    placeholder,
    lineHeight,
    textareaRef,
    onChange,
    onSubmit,
}: Props) {
    const overlayRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        const ta = textareaRef.current;
        const ov = overlayRef.current;
        if (!ta || !ov) return;
        ov.scrollTop = ta.scrollTop;
    };

    return (
        <div className='relative flex-1 min-h-0 px-5 pt-4'>
            <textarea
                ref={textareaRef}
                rows={1}
                value={value}
                spellCheck={false}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit();
                    }
                }}
                placeholder={placeholder}
                style={{
                    lineHeight: `${lineHeight}px`,
                    color: 'transparent',
                    caretColor: '#06b6d4',
                    fontKerning: 'none',
                    fontFeatureSettings: '"kern" 0, "liga" 0',
                }}
                className='relative z-10 block w-full h-full resize-none overflow-y-auto bg-transparent text-[15px] [scrollbar-width:none] placeholder:text-neutral-600 focus:outline-none [&::-webkit-scrollbar]:hidden'
            />
            <div
                ref={overlayRef}
                aria-hidden
                className='pointer-events-none absolute inset-0 px-5 pt-4 overflow-hidden wrap-break-word whitespace-pre-wrap text-neutral-200 text-[15px]'
                style={{
                    lineHeight: `${lineHeight}px`,
                    fontKerning: 'none',
                    fontFeatureSettings: '"kern" 0, "liga" 0',
                }}
            >
                <AnimatePresence initial={false}>
                    {chars.map(({ id, char }) => (
                        <motion.span
                            key={id}
                            initial={{ opacity: 0, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, filter: 'blur(4px)' }}
                            transition={{ duration: 0.14, ease: charEase }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
