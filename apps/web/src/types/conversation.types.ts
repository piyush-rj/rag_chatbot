export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface SourceCitation {
  title: string;
  url: string;
}

export interface StoredMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
  sources: { id: string; title: string; url: string }[];
}

export interface ConversationDetail {
  id: string;
  title: string;
  updatedAt: string;
  messages: StoredMessage[];
}
