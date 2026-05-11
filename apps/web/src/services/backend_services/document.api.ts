import axios from 'axios';
import authHeader from './api_utils';
import {
    DOCUMENTS_URL,
    INGEST_DRIVE_URL,
    UPLOAD_DOCUMENT_URL,
    conversationDocumentsUrl,
} from '@/routes/api_routes';
import type { AttachedDocument } from '@/types/document.types';
import type { DocsResponseType } from 'shared';

type UploadResponse = {
    documentId: string;
    name: string;
    chunkCount: number;
    status: 'READY';
};

export default class DocumentApi {
    public static async upload(
        token: string,
        file: File,
        onProgress?: (percent: number) => void,
    ): Promise<UploadResponse> {
        const form = new FormData();
        form.append('file', file);

        const { data } = await axios.post<{
            success: boolean;
            data: UploadResponse;
        }>(UPLOAD_DOCUMENT_URL, form, {
            ...authHeader(token),
            onUploadProgress: (e) => {
                if (e.total && onProgress) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            },
        });

        return data.data;
    }

    public static async deleteDocument(
        token: string,
        id: string,
    ): Promise<string> {
        const { data } = await axios.delete<{
            success: boolean;
            data: { documentId: string };
        }>(`${DOCUMENTS_URL}/${id}`, authHeader(token));

        return data.data.documentId;
    }

    public static async attachToConversation(
        token: string,
        conversationId: string,
        documentIds: string[],
    ): Promise<AttachedDocument[]> {
        const { data } = await axios.post<{
            success: boolean;
            data: { documents: AttachedDocument[] };
        }>(
            conversationDocumentsUrl(conversationId),
            { documentIds },
            authHeader(token),
        );
        return data.data.documents;
    }

    public static async detachFromConversation(
        token: string,
        conversationId: string,
        documentId: string,
    ): Promise<void> {
        await axios.delete(
            `${conversationDocumentsUrl(conversationId)}/${documentId}`,
            authHeader(token),
        );
    }

    public static async getAllUserDocs(
        token: string,
    ): Promise<DocsResponseType[]> {
        const { data } = await axios.get<{
            success: boolean;
            data: { docs: DocsResponseType[] };
        }>(DOCUMENTS_URL, authHeader(token));
        return data.data.docs;
    }

    public static async ingestFromDrive(
        token: string,
        file: { fileId: string; name: string; mimeType: string },
        accessToken: string,
    ): Promise<{
        documentId: string;
        name: string;
        chunkCount: number;
        reused: boolean;
    }> {
        const { data } = await axios.post<{
            success: boolean;
            data: {
                documentId: string;
                name: string;
                chunkCount: number;
                reused: boolean;
            };
        }>(INGEST_DRIVE_URL, { ...file, accessToken }, authHeader(token));
        return data.data;
    }
}
