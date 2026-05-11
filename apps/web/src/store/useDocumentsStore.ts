import { create } from 'zustand';
import axios from 'axios';
import DocumentApi from '@/services/backend_services/document.api';
import type { AttachedDocument, UploadingFile } from '@/types/document.types';

function extractErrorMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data as
            | { error?: { message?: string } }
            | undefined;
        if (data?.error?.message) return data.error.message;
    }
    return err instanceof Error ? err.message : 'Upload failed';
}

// "pending" = uploads kicked off before a conversation exists. They live in
// the pending bucket and get attached to whichever conversation is created by
// the next sendMessage. After that they move into byConversation[id].

const PENDING_KEY = '__pending__';

type Bucket = {
    attached: AttachedDocument[];
    uploading: UploadingFile[];
};
// byConversation: {
//   "cmp08mvgq00018hvhhk": {
//     attached:  [{ id: "doc_42", name: "notes.pdf", status: "READY" }],
//     uploading: []
//   },
//   "cmpAnotherChat123": {
//     attached:  [{ id: "doc_99", name: "resume.pdf", status: "READY" }],
//     uploading: [{ localId: "abc-xyz", name: "report.pdf", progress: 47 }]
//   },
//   "__pending__": {
//     attached:  [{ id: "doc_55", name: "lecture.pdf", status: "READY" }],
//     uploading: []
//   }
// }

interface DocumentsStore {
    byConversation: Record<string, Bucket>;
    activeConversationId: string | null;

    setActiveConversation: (id: string | null) => void;
    promotePending: (newConversationId: string) => void;

    upload: (file: File, token: string) => Promise<void>;
    uploadFromDrive: (
        file: { fileId: string; name: string; mimeType: string },
        accessToken: string,
        token: string,
    ) => Promise<void>;
    detachAttached: (token: string, id: string) => Promise<void>;
    dismissUploading: (localId: string) => void;
    clearAll: () => void;

    getActiveAttachedIds: () => string[];
    getActiveAttachedSnapshots: () => Array<{ id: string; name: string }>;
    clearActiveAttached: () => void;
}

const emptyBucket = (): Bucket => ({ attached: [], uploading: [] });

const updateBucket = (
    state: { byConversation: Record<string, Bucket> },
    key: string,
    update: (b: Bucket) => Bucket,
): Record<string, Bucket> => ({
    ...state.byConversation,
    [key]: update(state.byConversation[key] ?? emptyBucket()),
});

const activeKey = (id: string | null): string => id ?? PENDING_KEY;

export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
    byConversation: {},
    activeConversationId: null,

    setActiveConversation: (id) => {
        set({ activeConversationId: id });
    },

    // When the first message creates a conversation, move the pending bucket
    // under the real conversation id.
    promotePending: (newConversationId) => {
        set((state) => {
            const pending = state.byConversation[PENDING_KEY];
            if (!pending) return state;
            const existing =
                state.byConversation[newConversationId] ?? emptyBucket();
            const next = { ...state.byConversation };
            next[newConversationId] = {
                attached: [...existing.attached, ...pending.attached],
                uploading: [...existing.uploading, ...pending.uploading],
            };
            delete next[PENDING_KEY];
            return { byConversation: next };
        });
    },

    upload: async (file, token) => {
        const localId = crypto.randomUUID();
        const startKey = activeKey(get().activeConversationId);

        set((state) => ({
            byConversation: updateBucket(state, startKey, (b) => ({
                ...b,
                uploading: [
                    ...b.uploading,
                    { localId, name: file.name, progress: 0 },
                ],
            })),
        }));

        try {
            const result = await DocumentApi.upload(token, file, (percent) => {
                set((state) => ({
                    byConversation: updateBucket(state, startKey, (b) => ({
                        ...b,
                        uploading: b.uploading.map((f) =>
                            f.localId === localId
                                ? { ...f, progress: percent }
                                : f,
                        ),
                    })),
                }));
            });

            // Attach to current conversation if one exists. If the user opened
            // a new chat mid-upload the doc lands wherever startKey was when
            // it began — feels right for "this upload belongs to that chat".
            const finalKey = startKey;
            if (finalKey !== PENDING_KEY) {
                try {
                    await DocumentApi.attachToConversation(token, finalKey, [
                        result.documentId,
                    ]);
                } catch (err) {
                    console.error(
                        'Failed to attach uploaded doc to conversation',
                        err,
                    );
                }
            }

            set((state) => ({
                byConversation: updateBucket(state, finalKey, (b) => ({
                    uploading: b.uploading.filter((f) => f.localId !== localId),
                    attached: [
                        ...b.attached,
                        {
                            id: result.documentId,
                            name: result.name,
                            status: 'READY',
                        },
                    ],
                })),
            }));
        } catch (err) {
            const message = extractErrorMessage(err);
            set((state) => ({
                byConversation: updateBucket(state, startKey, (b) => ({
                    ...b,
                    uploading: b.uploading.map((f) =>
                        f.localId === localId ? { ...f, error: message } : f,
                    ),
                })),
            }));
        }
    },

    uploadFromDrive: async (file, accessToken, token) => {
        const localId = crypto.randomUUID();
        const startKey = activeKey(get().activeConversationId);

        set((state) => ({
            byConversation: updateBucket(state, startKey, (b) => ({
                ...b,
                uploading: [
                    ...b.uploading,
                    { localId, name: file.name, progress: 0 },
                ],
            })),
        }));

        try {
            const result = await DocumentApi.ingestFromDrive(
                token,
                file,
                accessToken,
            );

            const finalKey = startKey;
            if (finalKey !== PENDING_KEY) {
                try {
                    await DocumentApi.attachToConversation(token, finalKey, [
                        result.documentId,
                    ]);
                } catch (err) {
                    console.error(
                        'Failed to attach Drive doc to conversation',
                        err,
                    );
                }
            }

            set((state) => ({
                byConversation: updateBucket(state, finalKey, (b) => ({
                    uploading: b.uploading.filter((f) => f.localId !== localId),
                    attached: [
                        ...b.attached,
                        {
                            id: result.documentId,
                            name: result.name,
                            status: 'READY',
                        },
                    ],
                })),
            }));
        } catch (err) {
            const message = extractErrorMessage(err);
            set((state) => ({
                byConversation: updateBucket(state, startKey, (b) => ({
                    ...b,
                    uploading: b.uploading.map((f) =>
                        f.localId === localId ? { ...f, error: message } : f,
                    ),
                })),
            }));
        }
    },

    detachAttached: async (token, id) => {
        const key = activeKey(get().activeConversationId);

        set((state) => ({
            byConversation: updateBucket(state, key, (b) => ({
                ...b,
                attached: b.attached.filter((d) => d.id !== id),
            })),
        }));

        try {
            if (key !== PENDING_KEY) {
                await DocumentApi.detachFromConversation(token, key, id);
            } else {
                // Doc never made it into a conversation — delete it outright
                // so it doesn't sit orphaned in the user's library.
                await DocumentApi.deleteDocument(token, id);
            }
        } catch (err) {
            console.error('Failed to detach document on server:', err);
        }
    },

    dismissUploading: (localId) => {
        const key = activeKey(get().activeConversationId);
        set((state) => ({
            byConversation: updateBucket(state, key, (b) => ({
                ...b,
                uploading: b.uploading.filter((f) => f.localId !== localId),
            })),
        }));
    },

    clearAll: () => {
        set({ byConversation: {}, activeConversationId: null });
    },

    getActiveAttachedIds: () => {
        const key = activeKey(get().activeConversationId);
        return get().byConversation[key]?.attached.map((d) => d.id) ?? [];
    },

    getActiveAttachedSnapshots: () => {
        const key = activeKey(get().activeConversationId);
        return (
            get().byConversation[key]?.attached.map((d) => ({
                id: d.id,
                name: d.name,
            })) ?? []
        );
    },

    // Visually clear the chip tray after a message has been sent. The
    // attachment lives on in the sent bubble and in the server's join table,
    // so retrieval keeps using these docs for follow-up questions even though
    // the chips are no longer shown in the input.
    clearActiveAttached: () => {
        const key = activeKey(get().activeConversationId);
        set((state) => ({
            byConversation: updateBucket(state, key, (b) => ({
                ...b,
                attached: [],
            })),
        }));
    },
}));

export const PENDING_CONVERSATION_KEY = PENDING_KEY;
