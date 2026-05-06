'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import MessageBubble from './MessageBubble';

export default function MessageList() {
    const messages = useChatStore((s) => s.messages);
    const streamingAnswer = useChatStore((s) => s.streamingAnswer);
    const streamingSources = useChatStore((s) => s.streamingSources);
    const isStreaming = useChatStore((s) => s.isStreaming);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, streamingAnswer]);

    return (
        <div className='max-w-190 w-full mx-auto px-1 py-8 space-y-6 mt-2'>
            {messages.map((m) => (
                <MessageBubble
                    key={m.id}
                    role={m.role}
                    content={m.content}
                    sources={m.sources}
                />
            ))}

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
