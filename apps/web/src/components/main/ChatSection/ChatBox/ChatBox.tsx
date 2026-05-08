'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    DEFAULT_LINE_HEIGHT,
    DEFAULT_STATUSES,
    DEFAULT_STATUS_INTERVAL_MS,
    DEFAULT_THINKING_DURATION_MS,
    DEFAULT_THINKING_START_DELAY_MS,
    type ChatBoxProps,
} from './config';
import { useDiffedChars, useThinking } from './hooks';
import { useSpeechRecognition } from './useSpeechRecognition';
import { ChatInput } from './ChatInput';
import { SubmitButton } from './SubmitButton';
import { VoiceButton } from './VoiceButton';
import { AttachPanel } from './AttachPanel';
import { AttachedDocs } from './AttachedDocs';
import { Paperclip } from 'lucide-react';
import Image from 'next/image';
import type { ChangeEvent } from 'react';
import { useDocumentsStore } from '@/store/useDocumentsStore';
import { useUserSessionStore } from '@/store/useUserSessionStore';

const submitPop = {
    transition: {
        duration: 0.4,
        ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
        times: [0, 0.35, 0.72, 1],
    },
};

export default function ChatBox({
    placeholder = 'Search anything',
    statuses = DEFAULT_STATUSES,
    thinkingDurationMs = DEFAULT_THINKING_DURATION_MS,
    statusIntervalMs = DEFAULT_STATUS_INTERVAL_MS,
    thinkingStartDelayMs = DEFAULT_THINKING_START_DELAY_MS,
    showVoice = true,
    lineHeight = DEFAULT_LINE_HEIGHT,
    onSubmit,
    className,
}: ChatBoxProps = {}) {
    const [value, setValue] = useState<string>('');
    const [attachOpen, setAttachOpen] = useState<boolean>(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const attachTriggerRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const wrapperControls = useAnimation();
    const uploadDocument = useDocumentsStore((s) => s.upload);
    const session = useUserSessionStore((s) => s.session);
    const token = session?.user?.token;

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const pathname = usePathname();
    const isConversationPage = pathname !== null && pathname !== '/';

    // captuers whatever was already in the input when dictation starts, so the
    // transcript appends instead of overwriting.
    const dictationBaseRef = useRef<string>('');

    const { chars, update: updateChars, reset: resetChars } = useDiffedChars();
    const { thinking, start, stop } = useThinking({
        statuses,
        intervalMs: statusIntervalMs,
        durationMs: thinkingDurationMs,
    });

    const handleTranscript = useCallback(
        (text: string) => {
            const next = dictationBaseRef.current + text;
            setValue(next);
            updateChars(next);
        },
        [updateChars],
    );

    const speech = useSpeechRecognition({ onTranscript: handleTranscript });

    const handleChange = (next: string) => {
        setValue(next);
        updateChars(next);
    };

    const handleUploadFiles = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileSelected = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file || !token) return;
            await uploadDocument(file, token);
        },
        [token, uploadDocument],
    );

    const handleVoiceToggle = () => {
        if (speech.listening) {
            speech.stop();
            return;
        }
        dictationBaseRef.current =
            value && !value.endsWith(' ') ? value + ' ' : value;
        speech.start();
    };

    const handleSubmit = async () => {
        const trimmed = value.trim();
        if (!trimmed || thinking) return;

        if (speech.listening) speech.stop();

        wrapperControls.start(submitPop);
        setValue('');
        resetChars();

        // kick off onSubmit immediately so the parent (e.g. layout slide) can start.
        const submitPromise = onSubmit?.(trimmed);

        // hold the thinking ring until the parent's slide/transition has settled.
        let ringTimer: ReturnType<typeof setTimeout> | null = null;
        if (thinkingStartDelayMs > 0) {
            ringTimer = setTimeout(start, thinkingStartDelayMs);
        } else {
            start();
        }

        try {
            await submitPromise;
        } finally {
            // If onSubmit resolved before the ring even started, cancel the pending start.
            if (ringTimer) clearTimeout(ringTimer);
            if (onSubmit) stop();
        }
    };

    const hasInput = value.length > 0;

    return (
        <motion.div
            animate={wrapperControls}
            className={cn(
                'relative',
                isConversationPage ? 'w-190' : 'w-170',
                className,
            )}
        >
            <AttachPanel
                open={attachOpen}
                onClose={() => setAttachOpen(false)}
                onUploadFiles={handleUploadFiles}
                onConnectDrive={() => {}}
                triggerRef={attachTriggerRef}
            />
            <input
                ref={fileInputRef}
                type='file'
                accept='application/pdf'
                className='hidden'
                onChange={handleFileSelected}
            />
            <AttachedDocs />
            <div className='relative z-20 w-full h-33 overflow-hidden rounded-3xl ring-1 ring-white/5 bg-dark-base shadow-sm shadow-black/40 flex flex-col'>
                <ChatInput
                    value={value}
                    chars={chars}
                    placeholder={placeholder}
                    lineHeight={lineHeight}
                    textareaRef={textareaRef}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                />
                <div className='h-12 shrink-0 flex items-center gap-x-3 px-4'>
                    <button
                        ref={attachTriggerRef}
                        type='button'
                        aria-label='Attach files'
                        aria-expanded={attachOpen}
                        onClick={() => setAttachOpen((v) => !v)}
                        className='h-7 w-7 flex justify-center items-center bg-neutral-800/40 rounded-full ring-1 ring-white/4 shadow-sm shadow-black/5 cursor-pointer hover:bg-neutral-800/70 transition-colors duration-150'
                    >
                        <Paperclip className='size-3.5 text-neutral-300' />
                    </button>

                    <div className='h-7 w-fit flex items-center gap-x-1.5 bg-neutral-800/40 px-2.5 rounded-full shadow-sm shadow-black/5 ring-1 ring-white/4'>
                        <div className='relative h-4 w-4 overflow-hidden'>
                            <Image
                                src={'/svgs/gpt.png'}
                                alt='model-logo'
                                fill
                                unoptimized
                                className='object-cover invert'
                            />
                        </div>
                        <span className='text-xs'>GPT 4.0 mini</span>
                    </div>
                </div>
                <SubmitButton
                    visible={hasInput}
                    thinking={thinking}
                    onClick={handleSubmit}
                />
                {showVoice && !thinking && (
                    <VoiceButton
                        shifted={hasInput}
                        listening={speech.listening}
                        disabled={!speech.supported}
                        onClick={handleVoiceToggle}
                    />
                )}
            </div>
        </motion.div>
    );
}
