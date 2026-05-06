'use client';

import { motion } from 'framer-motion';
import { LuArrowUp } from 'react-icons/lu';

const spring = {
    type: 'spring' as const,
    stiffness: 420,
    damping: 32,
    mass: 0.6,
};

type Props = {
    visible: boolean;
    thinking?: boolean;
    onClick: () => void;
};

export function SubmitButton({ visible, thinking = false, onClick }: Props) {
    // Stay on-screen while either there's input OR we're mid-thinking (showing stop).
    const onScreen = visible || thinking;

    return (
        <motion.button
            type='button'
            onClick={onClick}
            aria-label={thinking ? 'Stop generating' : 'Send message'}
            initial={false}
            animate={{ right: onScreen ? 14 : -36, opacity: onScreen ? 1 : 0 }}
            transition={spring}
            className='absolute bottom-3.5 flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-full transition-colors duration-250 bg-cyan-950/50 active:bg-cyan-800/40'
        >
            {thinking ? (
                <span className='block h-2.5 w-2.5 rounded-xs bg-cyan-600/90' />
            ) : (
                <LuArrowUp className='size-4 text-cyan-600' />
            )}
        </motion.button>
    );
}
