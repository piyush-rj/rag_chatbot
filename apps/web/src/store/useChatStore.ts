import { create } from 'zustand';
import { SourceCitation } from 'shared';
import { ConversationSummary } from '@/types/conversation.types';
import ConversationApi from '@/services/backend_services/conversation.api';
import { streamAsk } from '@/services/backend_services/ask_stream.api';
import { useDocumentsStore } from './useDocumentsStore';

function syncUrl(conversationId: string | null) {
    if (typeof window === 'undefined') return;
    const target = conversationId ? `/${conversationId}` : '/';
    if (window.location.pathname !== target) {
        window.history.replaceState(null, '', target);
    }
}

export type UIAttachment = {
    id: string;
    documentId: string | null;
    documentName: string;
};

export type UIMessage = {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    sources?: SourceCitation[];
    attachments?: UIAttachment[];
};

interface ChatStoreData {
    conversations: ConversationSummary[];
    currentConversationId: string | null;
    messages: UIMessage[];
    streamingAnswer: string;
    streamingSources: SourceCitation[];
    streamingStatus: string | null;
    isStreaming: boolean;

    loadConversations: (token: string) => Promise<void>;
    selectConversation: (token: string, id: string) => Promise<void>;
    newConversation: () => void;
    sendMessage: (token: string, message: string) => Promise<void>;
    removeConversation: (id: string) => void;
    renameConversationLocal: (id: string, title: string) => void;
}

export const useChatStore = create<ChatStoreData>((set, get) => ({
    conversations: [],
    currentConversationId: null,
    messages: [],
    streamingAnswer: '',
    streamingSources: [],
    streamingStatus: null,
    isStreaming: false,

    loadConversations: async (token) => {
        const { conversations } = await ConversationApi.fetchAll(token);
        set({ conversations });
    },

    selectConversation: async (token, id) => {
        if (get().currentConversationId === id) return;
        const conv = await ConversationApi.fetchOne(token, id);
        const messages: UIMessage[] = conv.messages
            .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
            .map((m) => ({
                id: m.id,
                role: m.role as 'USER' | 'ASSISTANT',
                content: m.content,
                sources: m.sources.map((s) => ({
                    title: s.title,
                    url: s.url,
                    page: s.page ?? null,
                })),
                attachments: m.attachments,
            }));
        set({
            currentConversationId: id,
            messages,
            streamingAnswer: '',
            streamingSources: [],
            streamingStatus: null,
            isStreaming: false,
        });
        syncUrl(id);

        useDocumentsStore.getState().setActiveConversation(id);
    },

    newConversation: () => {
        set({
            currentConversationId: null,
            messages: [],
            streamingAnswer: '',
            streamingSources: [],
            streamingStatus: null,
            isStreaming: false,
        });
        syncUrl(null);
        useDocumentsStore.getState().setActiveConversation(null);
    },

    removeConversation: (id) => {
        const wasActive = get().currentConversationId === id;
        set((s) => ({
            conversations: s.conversations.filter((c) => c.id !== id),
            ...(wasActive
                ? {
                      currentConversationId: null,
                      messages: [],
                      streamingAnswer: '',
                      streamingSources: [],
                      isStreaming: false,
                  }
                : {}),
        }));
        if (wasActive) syncUrl(null);
    },

    renameConversationLocal: (id, title) => {
        set((s) => ({
            conversations: s.conversations.map((c) =>
                c.id === id ? { ...c, title } : c,
            ),
        }));
    },

    sendMessage: async (token, message) => {
        const trimmed = message.trim();
        if (!trimmed || get().isStreaming) return;

        const docsState = useDocumentsStore.getState();
        const documentIds = docsState.getActiveAttachedIds();
        const attachmentSnapshots = docsState.getActiveAttachedSnapshots();

        // Match the server: drop attachments already stamped on an earlier
        // user message in this conversation so the chip doesn't repeat.
        const previousAttachmentIds = new Set(
            get()
                .messages.flatMap((m) => m.attachments ?? [])
                .map((a) => a.documentId)
                .filter((id): id is string => typeof id === 'string'),
        );
        const newSnapshots = attachmentSnapshots.filter(
            (s) => !previousAttachmentIds.has(s.id),
        );

        const userMsg: UIMessage = {
            id: `local-${Date.now()}`,
            role: 'USER',
            content: trimmed,
            attachments: newSnapshots.map((s) => ({
                id: `local-att-${s.id}`,
                documentId: s.id,
                documentName: s.name,
            })),
        };

        set((s) => ({
            messages: [...s.messages, userMsg],
            isStreaming: true,
            streamingAnswer: '',
            streamingSources: [],
            streamingStatus: null,
        }));

        // Clear the chip tray once the message is on its way. The server's
        // join table still has these docs attached to the conversation, so
        // follow-up questions can keep referencing them.
        docsState.clearActiveAttached();

        const conversationId = get().currentConversationId ?? undefined;

        await streamAsk(
            trimmed,
            token,
            {
                onConversation: (id) => {
                    if (get().currentConversationId !== id) {
                        set({ currentConversationId: id });
                        syncUrl(id);
                        const docsStore = useDocumentsStore.getState();
                        // first msg of a new chat: pending bucket becomes this conversation's bucket
                        if (!conversationId) {
                            docsStore.promotePending(id);
                        }
                        docsStore.setActiveConversation(id);
                    }
                },
                onStatus: (status) => {
                    set({ streamingStatus: status });
                },
                onSources: (sources) => {
                    set({ streamingSources: sources });
                },
                onToken: (t) => {
                    set((s) => ({ streamingAnswer: s.streamingAnswer + t }));
                },
                onDone: () => {
                    const { streamingAnswer, streamingSources } = get();
                    if (streamingAnswer.length > 0) {
                        const assistantMsg: UIMessage = {
                            id: `local-${Date.now()}-a`,
                            role: 'ASSISTANT',
                            content: streamingAnswer,
                            sources: streamingSources,
                        };
                        set((s) => ({
                            messages: [...s.messages, assistantMsg],
                            streamingAnswer: '',
                            streamingSources: [],
                            streamingStatus: null,
                            isStreaming: false,
                        }));
                    } else {
                        set({ isStreaming: false, streamingStatus: null });
                    }
                    void get().loadConversations(token);
                },
                onError: (err) => {
                    console.error('streamAsk error:', err);
                    set({
                        isStreaming: false,
                        streamingAnswer: '',
                        streamingStatus: null,
                    });
                },
            },
            conversationId,
            documentIds,
        );
    },
}));
