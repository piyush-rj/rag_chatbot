export type ChatBoxProps = {
    placeholder?: string;
    statuses?: readonly string[];
    thinkingDurationMs?: number;
    statusIntervalMs?: number;
    thinkingStartDelayMs?: number;
    showVoice?: boolean;
    lineHeight?: number;
    onSubmit?: (value: string) => void | Promise<void>;
    className?: string;
};

export const DEFAULT_LINE_HEIGHT = 20;
export const DEFAULT_THINKING_DURATION_MS = 10_000;
export const DEFAULT_STATUS_INTERVAL_MS = 1_800;
export const DEFAULT_THINKING_START_DELAY_MS = 0;

export const DEFAULT_STATUSES: readonly string[] = [
    'Looking for files',
    'Searching the web',
    'Reading documents',
    'Pulling it together',
    'Almost ready',
];
