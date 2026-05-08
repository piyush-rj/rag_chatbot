import { create } from 'zustand';
import DocumentApi from '@/services/backend_services/document.api';
import type { AttachedDocument, UploadingFile } from '@/types/document.types';

interface DocumentsStore {
    attachedDocuments: AttachedDocument[];
    uploadingFiles: UploadingFile[];

    upload: (file: File, token: string) => Promise<void>;
    detachAttached: (token: string, id: string) => Promise<void>;
    dismissUploading: (localId: string) => void;
    clearAll: () => void;
}

export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
    attachedDocuments: [],
    uploadingFiles: [],

    upload: async (file, token) => {
        const localId = crypto.randomUUID();

        set((state) => ({
            uploadingFiles: [
                ...state.uploadingFiles,
                { localId, name: file.name, progress: 0 },
            ],
        }));

        try {
            const result = await DocumentApi.upload(token, file, (percent) => {
                set((state) => ({
                    uploadingFiles: state.uploadingFiles.map((f) =>
                        f.localId === localId ? { ...f, progress: percent } : f,
                    ),
                }));
            });

            set((state) => ({
                uploadingFiles: state.uploadingFiles.filter(
                    (f) => f.localId !== localId,
                ),
                attachedDocuments: [
                    ...state.attachedDocuments,
                    {
                        id: result.documentId,
                        name: result.name,
                        status: 'READY',
                    },
                ],
            }));
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Upload failed';
            set((state) => ({
                uploadingFiles: state.uploadingFiles.map((f) =>
                    f.localId === localId ? { ...f, error: message } : f,
                ),
            }));
        }
    },

    detachAttached: async (token, id) => {
        set((state) => ({
            attachedDocuments: state.attachedDocuments.filter(
                (d) => d.id !== id,
            ),
        }));
        try {
            await DocumentApi.deleteDocument(token, id);
        } catch (err) {
            console.error('Failed to delete document on server:', err);
        }
    },

    dismissUploading: (localId) => {
        set((state) => ({
            uploadingFiles: state.uploadingFiles.filter(
                (f) => f.localId !== localId,
            ),
        }));
    },

    clearAll: () => {
        set({ attachedDocuments: [], uploadingFiles: [] });
    },
}));
