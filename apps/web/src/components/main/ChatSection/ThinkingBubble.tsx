'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Filler labels shown while we're waiting for the first real STATUS event
// from the server. Once the server says something specific, that takes over.
const FILLER_LABELS = [
    'Thinking',
    'Pondering',
    'Considering',
    'Mulling it over',
    'Putting pieces together',
];

const FILLER_INTERVAL_MS = 1800;

const BUBBLE_TRANSITION = {
    duration: 0.22,
    ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
};

type Props = {
    status: string | null;
};

export default function ThinkingBubble({ status }: Props) {
    const [fillerIdx, setFillerIdx] = useState(0);

    // Cycle fillers only while no server-driven status has arrived yet.
    useEffect(() => {
        if (status) return;
        const t = setInterval(
            () => setFillerIdx((i) => (i + 1) % FILLER_LABELS.length),
            FILLER_INTERVAL_MS,
        );
        return () => clearInterval(t);
    }, [status]);

    const label = status ?? FILLER_LABELS[fillerIdx];

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={BUBBLE_TRANSITION}
            className='flex items-center gap-2.5 text-neutral-400 text-[14px]'
        >
            <span className='relative inline-flex'>
                <span className='absolute inline-flex h-2 w-2 rounded-full bg-neutral-400/40 animate-ping' />
                <span className='relative inline-flex h-2 w-2 rounded-full bg-neutral-300' />
            </span>
            <motion.span
                key={label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className='leading-none'
            >
                {label}…
            </motion.span>
        </motion.div>
    );
}
