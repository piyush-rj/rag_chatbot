export const STREAM_EVENT_TYPE = {
    CONVERSATION: 'CONVERSATION',
    SOURCES: 'SOURCES',
    TOKEN: 'TOKEN',
    DONE: 'DONE',
    ERROR: 'ERROR',
} as const;

export type StreamEventType =
    (typeof STREAM_EVENT_TYPE)[keyof typeof STREAM_EVENT_TYPE];

export type SourceCitation = {
    title: string;
    url: string;
};

export type StreamEvent =
    | { type: typeof STREAM_EVENT_TYPE.CONVERSATION; id: string }
    | { type: typeof STREAM_EVENT_TYPE.SOURCES; sources: SourceCitation[] }
    | { type: typeof STREAM_EVENT_TYPE.TOKEN; value: string }
    | { type: typeof STREAM_EVENT_TYPE.DONE }
    | { type: typeof STREAM_EVENT_TYPE.ERROR; message: string };
