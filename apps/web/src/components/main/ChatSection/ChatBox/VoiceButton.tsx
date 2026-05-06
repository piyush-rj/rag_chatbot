'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

const VOICE_BARS = [
    { rest: 4, peak: 7 },
    { rest: 9, peak: 13 },
    { rest: 11, peak: 15 },
    { rest: 9, peak: 13 },
    { rest: 6, peak: 10 },
    { rest: 4, peak: 7 },
];

const spring = {
    type: 'spring' as const,
    stiffness: 420,
    damping: 32,
    mass: 0.6,
};

type Props = {
    /** Shifts the button left to make room for the submit arrow. */
    shifted: boolean;
    listening: boolean;
    disabled?: boolean;
    onClick: () => void;
};

export function VoiceButton({ shifted, listening, disabled, onClick }: Props) {
    const animate = listening;

    return (
        <motion.button
            type='button'
            onClick={onClick}
            disabled={disabled}
            aria-pressed={listening}
            aria-label={listening ? 'Stop voice input' : 'Start voice input'}
            initial={false}
            animate={{ right: shifted ? 50 : 12 }}
            transition={spring}
            className={cn(
                'group absolute bottom-3.5 flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-full transition-colors duration-250 hover:bg-neutral-800 active:bg-neutral-800/50',
                listening && 'bg-neutral-800',
                disabled && 'opacity-40',
            )}
        >
            <div className='flex items-center gap-px'>
                {VOICE_BARS.map((b, i) => (
                    <motion.div
                        key={i}
                        className={cn(
                            'w-[1.5px] rounded-full transition-colors duration-250',
                            listening
                                ? 'bg-neutral-300'
                                : 'bg-neutral-500 group-hover:bg-neutral-200',
                        )}
                        animate={{
                            height: animate ? [b.rest, b.peak, b.rest] : b.rest,
                        }}
                        transition={{
                            duration: 0.7,
                            repeat: animate ? Infinity : 0,
                            delay: i * 0.08,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </div>
        </motion.button>
    );
}
