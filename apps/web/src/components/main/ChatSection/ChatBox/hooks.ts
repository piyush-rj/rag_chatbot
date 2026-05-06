import { useCallback, useEffect, useRef, useState } from 'react';

export type Char = { id: number; char: string };

/**
 * Diffs successive input values down to per-character add/remove ops so each new
 * character can animate in independently while existing ones stay mounted.
 */
export function useDiffedChars() {
    const [chars, setChars] = useState<Char[]>([]);
    const idRef = useRef<number>(0);

    const update = useCallback((next: string) => {
        setChars((prev) => {
            let common = 0;
            while (
                common < prev.length &&
                common < next.length &&
                prev[common].char === next[common]
            ) {
                common++;
            }
            const arr = prev.slice(0, common);
            for (let i = common; i < next.length; i++) {
                arr.push({ id: idRef.current++, char: next[i] });
            }
            return arr;
        });
    }, []);

    const reset = useCallback(() => setChars([]), []);

    return { chars, update, reset };
}

/**
 * Tracks a "thinking" state with a rotating status message and an automatic timeout.
 * Consumers can `start()` and `stop()` manually; the hook also self-stops after `durationMs`.
 */
export function useThinking(opts: {
    statuses: readonly string[];
    intervalMs: number;
    durationMs: number;
}) {
    const { statuses, intervalMs, durationMs } = opts;
    const [thinking, setThinking] = useState<boolean>(false);
    const [statusIdx, setStatusIdx] = useState<number>(0);

    useEffect(() => {
        if (!thinking) return;
        const tick = window.setInterval(() => {
            setStatusIdx((i) => (i + 1) % statuses.length);
        }, intervalMs);
        const stop = window.setTimeout(() => setThinking(false), durationMs);
        return () => {
            window.clearInterval(tick);
            window.clearTimeout(stop);
        };
    }, [thinking, statuses.length, intervalMs, durationMs]);

    const start = useCallback(() => {
        setStatusIdx(0);
        setThinking(true);
    }, []);
    const stop = useCallback(() => setThinking(false), []);

    return { thinking, status: statuses[statusIdx] ?? '', start, stop };
}
