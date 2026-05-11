export interface ConversationSummary {
    id: string;
    title: string;
    updatedAt: string;
}

export interface SourceCitation {
    title: string;
    url: string;
    page?: string | null;
}

export interface MessageAttachmentSummary {
    id: string;
    documentId: string | null;
    documentName: string;
}

export interface StoredMessage {
    id: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    createdAt: string;
    sources: {
        id: string;
        title: string;
        url: string;
        page?: string | null;
    }[];
    attachments: MessageAttachmentSummary[];
}

export interface AttachedDocumentSummary {
    id: string;
    name: string;
    status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
    source: 'PDF' | 'DRIVE';
    mimeType: string;
}

export interface ConversationDetail {
    id: string;
    title: string;
    updatedAt: string;
    messages: StoredMessage[];
    attachedDocuments: AttachedDocumentSummary[];
}
