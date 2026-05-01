import type { RetrievedSource } from "./retriever";

export enum ROLE {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
}

export type ChatMessage = {
  role: ROLE;
  content: string;
};

export type HistoryMessage = {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
};

export default function buildGroundedMessages(
  question: string,
  sources: RetrievedSource[],
  history: HistoryMessage[] = [],
): ChatMessage[] {
  const formattedSources = sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title}\n${s.url}\n${s.chunks
          .map((c) => `- ${c}`)
          .join("\n")}`,
    )
    .join("\n\n");

  const systemContent = `You are a research assistant named Riva. Answer the user's question using ONLY the sources provided below.

Rules:
- Cite sources inline using [1], [2], etc. matching the source numbers below.
- Only say "I don't have enough information" if you cannot answer at all.
- Be concise and factual.

Sources:
${formattedSources}`;

  const historyMessages: ChatMessage[] = history
    .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
    .map((m) => ({
      role: m.role === "USER" ? ROLE.USER : ROLE.ASSISTANT,
      content: m.content,
    }));

  return [
    { role: ROLE.SYSTEM, content: systemContent },
    ...historyMessages,
    { role: ROLE.USER, content: question },
  ];
}
