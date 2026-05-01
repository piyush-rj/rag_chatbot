import { ROLE, type HistoryMessage } from "./prompt.builder";
import { openAIInstance } from "../services/init.services";

const SYSTEM_PROMPT = `You rewrite follow-up questions as standalone questions that don't depend on prior context.

Rules:
- Resolve all pronouns (it, that, they, this, those, these) to their referents from the conversation.
- If the question is already standalone, return it unchanged.
- Do not add facts that aren't implied by the conversation.
- Keep it short — a single question.
- Output ONLY the rewritten question. No preamble, no explanation, no quotes.`;

export async function rewriteQuery(
  history: HistoryMessage[],
  latestMessage: string,
): Promise<string> {
  if (history.length === 0) return latestMessage;

  const formattedHistory = history
    .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
    .map((m) => `[${m.role}]: ${m.content}`)
    .join("\n");

  const userContent = `Conversation:
${formattedHistory}

Latest message: ${latestMessage}

Rewritten:`;

  const result = await openAIInstance.complete([
    { role: ROLE.SYSTEM, content: SYSTEM_PROMPT },
    { role: ROLE.USER, content: userContent },
  ]);

  const cleaned = result.trim().replace(/^["']|["']$/g, "");
  return cleaned || latestMessage;
}
