import { OpenRouter } from '@openrouter/sdk';
import type { RetrievedSource } from './retriever_services';
import REWRITE_PROMPT from './prompts/rewrite_prompt';
import EXPAND_PROMPT from './prompts/expand_prompt';
import RERANK_PROMPT from './prompts/rerank_prompt';
import TITLE_PROMPT from './prompts/title_prompt';
import SUMMARY_PROMPT from './prompts/summary_prompt';
import EXTRACT_FACTS_PROMPT from './prompts/extract_facts_prompt';
import type { SourceChunk } from './chunker_services';

export enum ROLE {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant',
}

export type ChatMessage = {
    role: ROLE;
    content: string;
};

export type HistoryMessage = {
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
};

type ScoreEntry = { id: number; score: number };

export default class LLMService {
    private static readonly MODEL = 'openai/gpt-4o-mini';
    private openRouter = new OpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
    });

    public async *streamChat(
        messages: ChatMessage[],
    ): AsyncGenerator<string, void> {
        const stream = await this.openRouter.chat.send({
            chatRequest: {
                model: LLMService.MODEL,
                messages,
                stream: true,
            },
        });

        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content;
            if (token) yield token;
        }
    }

    private async complete(messages: ChatMessage[]): Promise<string> {
        const res = await this.openRouter.chat.send({
            chatRequest: {
                model: LLMService.MODEL,
                messages,
                stream: false,
            },
        });

        return res.choices[0]?.message.content ?? '';
    }

    public async rewriteQuery(
        history: HistoryMessage[],
        latestMessage: string,
    ): Promise<string> {
        if (history.length === 0) return latestMessage;

        // TODO: slice the history to 5-6 last msgs
        const formattedHistory = history
            .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
            .map((m) => `[${m.role}]: ${m.content}`)
            .join('\n');

        const userContent = `Conversation:\n${formattedHistory}\n\nLatest message: ${latestMessage}\n\nRewritten:`;
        console.log('users content is -------------> ', userContent);

        const result = await this.complete([
            { role: ROLE.SYSTEM, content: REWRITE_PROMPT },
            { role: ROLE.USER, content: userContent },
        ]);

        const cleaned = result.trim().replace(/^["']|["']$/g, '');
        return cleaned || latestMessage;
    }

    public async expandQuery(query: string): Promise<string[]> {
        let raw: string;

        try {
            raw = await this.complete([
                { role: ROLE.SYSTEM, content: EXPAND_PROMPT },
                { role: ROLE.USER, content: `Original question: ${query}` },
            ]);
        } catch {
            return [];
        }

        try {
            const parsed = JSON.parse(raw.trim().replace(/^```json|```$/g, ''));
            const queries = parsed?.queries;
            if (!Array.isArray(queries)) return [];

            return queries
                .filter(
                    (q): q is string => typeof q === 'string' && q.length > 0,
                )
                .slice(0, 2);
        } catch {
            return [];
        }
    }

    public async rerankChunks(
        query: string,
        candidates: SourceChunk[],
    ): Promise<SourceChunk[]> {
        if (candidates.length <= 1) return candidates;

        const formatted = candidates
            .map((c, i) => `[${i + 1}] ${c.text}`)
            .join('\n\n');

        const userContent = `Question: ${query}\n\nPassages:\n${formatted}`;

        let raw: string;
        try {
            raw = await this.complete([
                { role: ROLE.SYSTEM, content: RERANK_PROMPT },
                { role: ROLE.USER, content: userContent },
            ]);
        } catch {
            return candidates;
        }

        const scores = LLMService.parseScores(raw);
        if (scores.length === 0) return candidates;

        const scoreById = new Map(scores.map((s) => [s.id, s.score]));
        return candidates
            .map((chunk, i) => ({
                chunk,
                score: scoreById.get(i + 1) ?? -1,
            }))
            .sort((a, b) => b.score - a.score)
            .map((s) => s.chunk);
    }

    public async generateTitle(
        question: string,
        answer: string,
    ): Promise<string> {
        const userContent = `Question: ${question}\n\nAnswer: ${answer}\n\nTitle:`;

        const raw = await this.complete([
            { role: ROLE.SYSTEM, content: TITLE_PROMPT },
            { role: ROLE.USER, content: userContent },
        ]);

        return raw
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/[.!?]+$/, '')
            .slice(0, 80);
    }

    public static buildGroundedMessages(
        question: string,
        sources: RetrievedSource[],
        history: HistoryMessage[] = [],
        summary?: string | null,
        userFacts: string[] = [],
    ): ChatMessage[] {
        const formattedSources = sources
            .map(
                (s, i) =>
                    `[${i + 1}] ${s.title}\n${s.url}\n${s.chunks
                        .map((c) => `- ${c}`)
                        .join('\n')}`,
            )
            .join('\n\n');

        const userBlock =
            userFacts.length > 0
                ? `What you know about this user from past conversations:\n${userFacts
                      .map((f) => `- ${f}`)
                      .join('\n')}\n\n`
                : '';

        const recapBlock = summary
            ? `Recap of this conversation so far:\n${summary}\n\n`
            : '';

        const systemContent = `${userBlock}${recapBlock}You are a research assistant named Raven. Answer the user's question using ONLY the sources provided below.

        Rules:
        - Cite sources inline using [1], [2], etc. matching the source numbers below.
        - Only say "I don't have enough information" if you cannot answer at all.
        - Be concise and factual.

        Sources:
        ${formattedSources}`;

        const historyMessages: ChatMessage[] = history
            .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
            .map((m) => ({
                role: m.role === 'USER' ? ROLE.USER : ROLE.ASSISTANT,
                content: m.content,
            }));

        return [
            { role: ROLE.SYSTEM, content: systemContent },
            ...historyMessages,
            { role: ROLE.USER, content: question },
        ];
    }

    private static parseScores(raw: string): ScoreEntry[] {
        try {
            const cleaned = raw.trim().replace(/^```json|```$/g, '');
            const parsed = JSON.parse(cleaned);
            const arr = parsed?.scores;
            if (!Array.isArray(arr)) return [];
            return arr.filter(
                (s): s is ScoreEntry =>
                    s &&
                    typeof s.id === 'number' &&
                    typeof s.score === 'number',
            );
        } catch {
            return [];
        }
    }

    public async extractFacts(
        summary: string,
        existingFacts: string[],
    ): Promise<string[]> {
        const existingBlock =
            existingFacts.length > 0
                ? existingFacts.map((f) => `- ${f}`).join('\n')
                : '(none yet)';

        const userContent = `Existing facts:\n${existingBlock}\n\nConversation summary: ${summary}\n\nNew facts:`;

        let raw: string;
        try {
            raw = await this.complete([
                { role: ROLE.SYSTEM, content: EXTRACT_FACTS_PROMPT },
                { role: ROLE.USER, content: userContent },
            ]);
        } catch {
            return [];
        }

        try {
            const parsed = JSON.parse(raw.trim().replace(/^```json|```$/g, ''));
            const facts = parsed?.facts;
            if (!Array.isArray(facts)) return [];

            return facts
                .filter(
                    (f): f is string =>
                        typeof f === 'string' && f.length > 0 && f.length < 200,
                )
                .slice(0, 3);
        } catch {
            return [];
        }
    }

    public async updateSummary(
        currentSummary: string | null,
        question: string,
        answer: string,
    ): Promise<string> {
        const userContent = `Existing summary: ${currentSummary ?? '(none yet)'}

        New exchange
        User: ${question}
        Assistant: ${answer}

        Updated summary:`;

        const raw = await this.complete([
            { role: ROLE.SYSTEM, content: SUMMARY_PROMPT },
            { role: ROLE.USER, content: userContent },
        ]);

        return raw
            .trim()
            .replace(/^["']|["']$/g, '')
            .slice(0, 500);
    }
}
