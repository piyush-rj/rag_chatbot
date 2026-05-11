'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/useChatStore';
import MessageBubble from './MessageBubble';
import ThinkingBubble from './ThinkingBubble';

export default function MessageList() {
    const messages = useChatStore((s) => s.messages);
    const streamingAnswer = useChatStore((s) => s.streamingAnswer);
    const streamingSources = useChatStore((s) => s.streamingSources);
    const streamingStatus = useChatStore((s) => s.streamingStatus);
    const isStreaming = useChatStore((s) => s.isStreaming);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, streamingAnswer, isStreaming]);

    // Show the placeholder thinking bubble in the gap between submit and the
    // first piece of real content (answer tokens or source cards). Once the
    // assistant has anything to show, the real bubble takes over.
    const showThinking =
        isStreaming &&
        streamingAnswer.length === 0 &&
        streamingSources.length === 0;

    return (
        <div className='max-w-190 w-full mx-auto px-1 py-8 space-y-6 mt-2'>
            {messages.map((m) => (
                <MessageBubble
                    key={m.id}
                    role={m.role}
                    content={m.content}
                    sources={m.sources}
                    attachments={m.attachments}
                />
            ))}

            <AnimatePresence>
                {showThinking && (
                    <ThinkingBubble key='thinking' status={streamingStatus} />
                )}
            </AnimatePresence>

            {isStreaming &&
                (streamingAnswer || streamingSources.length > 0) && (
                    <MessageBubble
                        role='ASSISTANT'
                        content={streamingAnswer}
                        sources={streamingSources}
                        streaming
                    />
                )}

            <div ref={bottomRef} />
        </div>
    );
}
