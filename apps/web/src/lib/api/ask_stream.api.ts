import {
  STREAM_EVENT_TYPE,
  type SourceCitation,
  type StreamEvent,
} from "shared";
import { ASK_QUERY_URL } from "./api_routes";

export type Source = SourceCitation;

type StreamCallbacks = {
  onConversation?: (id: string) => void;
  onSources: (sources: Source[]) => void;
  onToken: (token: string) => void;
  onDone: () => void;
  onError?: (err: unknown) => void;
};

export async function streamAsk(
  message: string,
  token: string,
  callbacks: StreamCallbacks,
  conversationId?: string,
): Promise<void> {
  try {
    const res = await fetch(ASK_QUERY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, conversationId }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Request failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const raw of events) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;

        const json = line.slice(5).trim();
        if (!json) continue;

        const msg = JSON.parse(json) as StreamEvent;
        switch (msg.type) {
          case STREAM_EVENT_TYPE.CONVERSATION:
            callbacks.onConversation?.(msg.id);
            break;
          case STREAM_EVENT_TYPE.SOURCES:
            callbacks.onSources(msg.sources);
            break;
          case STREAM_EVENT_TYPE.TOKEN:
            callbacks.onToken(msg.value);
            break;
          case STREAM_EVENT_TYPE.DONE:
            callbacks.onDone();
            break;
          case STREAM_EVENT_TYPE.ERROR:
            callbacks.onError?.(new Error(msg.message));
            break;
        }
      }
    }
  } catch (err) {
    callbacks.onError?.(err);
  }
}
