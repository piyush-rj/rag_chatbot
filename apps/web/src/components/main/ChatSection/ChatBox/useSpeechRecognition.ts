'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Web Speech API recognition types are not consistently exposed by lib.dom across
// TS versions. Define a minimal local shape compatible with both Chromium's
// `SpeechRecognition` and Safari's `webkitSpeechRecognition`. Kept local (not
// `declare global`) to avoid collisions with versions of lib.dom that ship
// partial declarations for the same names.
type SRResult = { readonly transcript: string };
type SRResults = ArrayLike<{ readonly 0: SRResult; readonly isFinal: boolean }>;

type SREvent = { readonly resultIndex: number; readonly results: SRResults };
type SRErrorEvent = { readonly error: string };

interface SR {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((ev: SREvent) => void) | null;
    onerror: ((ev: SRErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

type SRConstructor = new () => SR;

function getCtor(): SRConstructor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
        SpeechRecognition?: SRConstructor;
        webkitSpeechRecognition?: SRConstructor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechRecognitionOptions = {
    lang?: string;
    /** Called every result event with the full session transcript so far. */
    onTranscript: (text: string) => void;
    onError?: (error: string) => void;
};

export type SpeechRecognitionApi = {
    listening: boolean;
    supported: boolean;
    start: () => void;
    stop: () => void;
};

type Handlers = {
    onTranscript: (text: string) => void;
    onError?: (error: string) => void;
};

/**
 * Wraps Web Speech API as a manually-controlled hook.
 *
 * - One `SpeechRecognition` instance per mount, stored in a ref.
 * - `onTranscript` / `onError` are read through a ref, so identity changes on
 *   every render do NOT re-bind the SR event listeners.
 * - `start()` / `stop()` are stable; safe to use in effect deps or props.
 */
export function useSpeechRecognition({
    lang = 'en-US',
    onTranscript,
    onError,
}: SpeechRecognitionOptions): SpeechRecognitionApi {
    const [listening, setListening] = useState<boolean>(false);
    // Lazy initializer runs once — no setState in effect, no cascading render.
    const [supported] = useState<boolean>(() => getCtor() !== null);

    const recognitionRef = useRef<SR | null>(null);
    const handlersRef = useRef<Handlers>({ onTranscript, onError });

    // Sync the freshest handlers without re-binding SR listeners.
    useEffect(() => {
        handlersRef.current = { onTranscript, onError };
    }, [onTranscript, onError]);

    useEffect(() => {
        const Ctor = getCtor();
        if (!Ctor) return;

        const r: SR = new Ctor();
        r.lang = lang;
        r.continuous = true;
        r.interimResults = true;

        r.onresult = (event: SREvent) => {
            // event.results is a live list maintained by the browser; iterate once
            // per event and concatenate alternative-0 transcripts.
            let text = '';
            for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
            }
            handlersRef.current.onTranscript(text);
        };
        r.onerror = (event: SRErrorEvent) => {
            handlersRef.current.onError?.(event.error);
        };
        r.onend = () => setListening(false);

        recognitionRef.current = r;

        return () => {
            r.onresult = null;
            r.onerror = null;
            r.onend = null;
            try {
                r.abort();
            } catch {
                // ignore — abort can throw if recognition was never started
            }
            recognitionRef.current = null;
        };
    }, [lang]);

    const start = useCallback(() => {
        const r = recognitionRef.current;
        if (!r) return;
        try {
            r.start();
            setListening(true);
        } catch {
            // start() throws if already running — keep state consistent
            setListening(true);
        }
    }, []);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
        // onend will flip listening to false; set it eagerly for a snappy UI
        setListening(false);
    }, []);

    return { listening, supported, start, stop };
}
