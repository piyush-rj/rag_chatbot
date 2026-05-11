export enum DocumentSource {
    PDF = 'PDF',
    DRIVE = 'DRIVE',
}

export enum DocumentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    READY = 'READY',
    FAILED = 'FAILED',
}

export type DocsResponseType = {
    id: string;
    source: DocumentSource;
    status: DocumentStatus;
    name: string;
    mimeType: string;
    byteSize: number | null;
    errorMessage: string | null;
    createdAt: string;
};
