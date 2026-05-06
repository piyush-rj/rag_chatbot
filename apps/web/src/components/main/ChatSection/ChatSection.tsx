'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/useChatStore';
import { useUserSessionStore } from '@/store/useUserSessionStore';
import { cn } from '@/lib/utils';
import ChatBox from './ChatBox/ChatBox';
import MessageList from './MessageList';

// Brief pause after submit so the chatbox doesn't bolt the moment Enter is pressed.
const SLIDE_DELAY = 0;
const SLIDE_DURATION = 0.05;

const SLIDE_TRANSITION = {
    duration: SLIDE_DURATION,
    delay: SLIDE_DELAY,
    ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
};

// Wait for the chatbox to settle (delay + duration) before messages fade in.
const MESSAGES_REVEAL_DELAY = SLIDE_DELAY + 0.4;

// Hold the thinking ring until the slide completes (delay + duration), in ms.
const THINKING_START_DELAY_MS = (SLIDE_DELAY + SLIDE_DURATION) * 1000;

export default function ChatSection() {
    const messages = useChatStore((s) => s.messages);
    const isStreaming = useChatStore((s) => s.isStreaming);
    const sendMessage = useChatStore((s) => s.sendMessage);
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token ?? null;

    const showEmpty = messages.length === 0 && !isStreaming;

    // Track previous showEmpty so we only animate the chatbox layout when going
    // empty → chat (slide down). Going chat → empty just snaps via CSS.
    const [prevShowEmpty, setPrevShowEmpty] = useState(showEmpty);
    const [animateLayout, setAnimateLayout] = useState<boolean>(false);
    if (prevShowEmpty !== showEmpty) {
        setAnimateLayout(prevShowEmpty && !showEmpty);
        setPrevShowEmpty(showEmpty);
    }

    async function handleSubmit(text: string) {
        if (!token) return;
        await sendMessage(token, text);
    }
    const name = session?.user?.name?.split(' ')[0] ?? '';

    return (
        <main className='flex-1 flex flex-col min-w-0 h-full'>
            <div className='flex-1 flex flex-col min-h-0'>
                <AnimatePresence mode='popLayout'>
                    {!showEmpty && (
                        <motion.div
                            key='messages'
                            initial={{ opacity: 0, y: 12 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                    duration: 0.35,
                                    delay: MESSAGES_REVEAL_DELAY,
                                    ease: 'easeOut',
                                },
                            }}
                            exit={{
                                opacity: 0,
                                transition: { duration: 0.12, ease: 'easeOut' },
                            }}
                            className='flex-1 overflow-y-auto min-h-0 no-scrollbar'
                        >
                            <MessageList />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    className={cn(
                        'flex flex-col items-center gap-y-8 px-6',
                        showEmpty ? 'flex-1 justify-center' : 'pb-6 pt-2',
                    )}
                >
                    <AnimatePresence>
                        {showEmpty && (
                            <motion.div className='text-[2.6rem] font-serif tracking-tight leading-none'>
                                {session && session.user.name
                                    ? `How are you ${name}`
                                    : `Looking for something?`}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        layout={animateLayout}
                        transition={SLIDE_TRANSITION}
                    >
                        <ChatBox
                            onSubmit={handleSubmit}
                            thinkingStartDelayMs={THINKING_START_DELAY_MS}
                        />
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
