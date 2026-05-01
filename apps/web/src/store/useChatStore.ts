import { create } from "zustand";
import { SourceCitation } from "shared";
import { ConversationSummary } from "@/types/conversation.types";
import ConversationApi from "@/lib/api/conversation.api";
import { streamAsk } from "@/lib/api/ask_stream.api";

export type UIMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: SourceCitation[];
};

interface ChatStoreData {
  conversations: ConversationSummary[];
  currentConversationId: string | null;
  messages: UIMessage[];
  streamingAnswer: string;
  streamingSources: SourceCitation[];
  isStreaming: boolean;

  loadConversations: (token: string) => Promise<void>;
  selectConversation: (token: string, id: string) => Promise<void>;
  newConversation: () => void;
  sendMessage: (token: string, message: string) => Promise<void>;
}

export const useChatStore = create<ChatStoreData>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  streamingAnswer: "",
  streamingSources: [],
  isStreaming: false,

  loadConversations: async (token) => {
    const conversations = await ConversationApi.fetchAll(token);
    set({ conversations });
  },

  selectConversation: async (token, id) => {
    if (get().currentConversationId === id) return;
    const conv = await ConversationApi.fetchOne(token, id);
    const messages: UIMessage[] = conv.messages
      .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
      .map((m) => ({
        id: m.id,
        role: m.role as "USER" | "ASSISTANT",
        content: m.content,
        sources: m.sources.map((s) => ({ title: s.title, url: s.url })),
      }));
    set({
      currentConversationId: id,
      messages,
      streamingAnswer: "",
      streamingSources: [],
      isStreaming: false,
    });
  },

  newConversation: () => {
    set({
      currentConversationId: null,
      messages: [],
      streamingAnswer: "",
      streamingSources: [],
      isStreaming: false,
    });
  },

  sendMessage: async (token, message) => {
    const trimmed = message.trim();
    if (!trimmed || get().isStreaming) return;

    const userMsg: UIMessage = {
      id: `local-${Date.now()}`,
      role: "USER",
      content: trimmed,
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isStreaming: true,
      streamingAnswer: "",
      streamingSources: [],
    }));

    const conversationId = get().currentConversationId ?? undefined;

    await streamAsk(
      trimmed,
      token,
      {
        onConversation: (id) => {
          set({ currentConversationId: id });
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
              role: "ASSISTANT",
              content: streamingAnswer,
              sources: streamingSources,
            };
            set((s) => ({
              messages: [...s.messages, assistantMsg],
              streamingAnswer: "",
              streamingSources: [],
              isStreaming: false,
            }));
          } else {
            set({ isStreaming: false });
          }
          void get().loadConversations(token);
        },
        onError: (err) => {
          console.error("streamAsk error:", err);
          set({ isStreaming: false, streamingAnswer: "" });
        },
      },
      conversationId,
    );
  },
}));
