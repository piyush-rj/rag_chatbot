export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export type AttachedDocument = {
    id: string;
    name: string;
    status: DocumentStatus;
};

export type UploadingFile = {
    localId: string;
    name: string;
    progress: number;
    error?: string;
};
