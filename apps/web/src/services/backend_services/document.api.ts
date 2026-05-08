import axios from 'axios';
import authHeader from './api_utils';
import { DOCUMENTS_URL, UPLOAD_DOCUMENT_URL } from '@/routes/api_routes';

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
}
