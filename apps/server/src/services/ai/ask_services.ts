import { STREAM_EVENT_TYPE } from 'shared';
import { prisma, Prisma } from 'database';
import {
    llmInstance,
    tavilyInstance,
    embeddingsInstance,
} from '../init.services';
import LLMService, {
    type ChatMessage,
    type HistoryMessage,
} from './llm_services';
import Chunker, { type SourceChunk } from './chunker_services';
import Retriever, { type RetrievedSource } from './retriever_services';
import ConversationService from '../db/conversation_services';
import MemoryService from '../db/memory_services';
import SseWriter from '../responses/stream_writer';
import type { TavilyResult } from '../../types/tavily.types';

export default class AskService {
    private static readonly RERANK_POOL = 20;
    private static readonly TOP_K = 5;

    private static readonly EXTRACT_EVERY_N_TURNS = 3;

    private summary: string | null = null;
    private userFacts: string[] = [];
    private currentConversationId: string = '';
    private history: HistoryMessage[] = [];
    private isFirstTurn: boolean = true;

    constructor(
        private readonly stream: SseWriter,
        private readonly userId: string,
        private readonly message: string,
        private readonly conversationId?: string,
        private readonly documentIds?: string[],
    ) {}

    public async run(): Promise<void> {
        await this.initConversation();
        await this.loadHistory();

        const searchQuery = await this.rewriteAndSave();

        const useDocs = (this.documentIds?.length ?? 0) > 0;
        const topSources = useDocs
            ? await this.retrieveFromDocs(searchQuery)
            : await this.retrieveTop(
                  searchQuery,
                  await this.searchWeb(searchQuery),
              );

        this.emitSources(topSources);

        const answer = await this.streamAnswer(topSources);

        if (!this.stream.isClosed && answer.length > 0) {
            await this.persist(answer, topSources);
        }

        this.stream.end();
    }

    private async initConversation(): Promise<void> {
        const [conversation, userFacts] = await Promise.all([
            ConversationService.getOrCreateConversation(
                this.conversationId,
                this.message,
                this.userId,
            ),
            MemoryService.getUserMemories(this.userId),
        ]);

        this.currentConversationId = conversation.id;
        this.summary = conversation.summary;
        this.userFacts = userFacts;

        this.stream.send({
            type: STREAM_EVENT_TYPE.CONVERSATION,
            id: conversation.id,
        });
    }

    private async loadHistory(): Promise<void> {
        if (!this.conversationId) return;
        this.history = await ConversationService.getConversationHistory(
            this.currentConversationId,
            this.userId,
        );
        this.isFirstTurn = this.history.length === 0;
    }

    private async rewriteAndSave(): Promise<string> {
        const [searchQuery] = await Promise.all([
            llmInstance.rewriteQuery(this.history, this.message),
            ConversationService.saveUserMessage(
                this.currentConversationId,
                this.message,
            ),
        ]);
        return searchQuery;
    }

    private async searchWeb(searchQuery: string): Promise<TavilyResult[]> {
        const alternates = await llmInstance.expandQuery(searchQuery);
        const queries = [searchQuery, ...alternates];

        const searchResults = await Promise.all(
            queries.map((q) => tavilyInstance.search(q)),
        );

        return AskService.removeDuplicates(searchResults.flat());
    }

    private async retrieveTop(
        searchQuery: string,
        rawSources: TavilyResult[],
    ): Promise<RetrievedSource[]> {
        const chunks = Chunker.chunkSources(rawSources);

        const vectors = await embeddingsInstance.embed([
            searchQuery,
            ...chunks.map((c) => c.text),
        ]);

        const queryVector = vectors[0]!;
        const chunkVectors = vectors.slice(1);

        const candidates = Retriever.rankByCosine(
            queryVector,
            chunks,
            chunkVectors,
        ).slice(0, AskService.RERANK_POOL);

        const reranked = await llmInstance.rerankChunks(
            searchQuery,
            candidates,
        );

        return Retriever.groupByUrl(reranked.slice(0, AskService.TOP_K));
    }

    private async retrieveFromDocs(
        searchQuery: string,
    ): Promise<RetrievedSource[]> {
        const documentIds = this.documentIds ?? [];
        if (documentIds.length === 0) return [];

        const [queryVector] = await embeddingsInstance.embed([searchQuery]);
        if (!queryVector) return [];
        const queryLiteral = `[${queryVector.join(',')}]`;

        const rows = await prisma.$queryRaw<
            Array<{
                text: string;
                documentName: string;
                documentId: string;
                pageStart: number | null;
                pageEnd: number | null;
            }>
        >`
            SELECT
                c."text",
                d."name" AS "documentName",
                d."id" AS "documentId",
                c."pageStart",
                c."pageEnd"
            FROM "DocumentChunk" c
            JOIN "Document" d ON d."id" = c."documentId"
            WHERE d."userId" = ${this.userId}
              AND c."documentId" IN (${Prisma.join(documentIds)})
            ORDER BY c."embedding" <=> ${queryLiteral}::vector
            LIMIT ${AskService.RERANK_POOL}
        `;

        if (rows.length === 0) return [];

        const candidates: SourceChunk[] = rows.map((r) => ({
            text: r.text,
            sourceTitle: r.documentName,
            sourceUrl: `doc://${r.documentId}`,
        }));

        const reranked = await llmInstance.rerankChunks(
            searchQuery,
            candidates,
        );

        return Retriever.groupByUrl(reranked.slice(0, AskService.TOP_K));
    }

    private emitSources(sources: RetrievedSource[]): void {
        this.stream.send({
            type: STREAM_EVENT_TYPE.SOURCES,
            sources: sources.map((s) => ({ title: s.title, url: s.url })),
        });
    }

    private async streamAnswer(sources: RetrievedSource[]): Promise<string> {
        const messages: ChatMessage[] = LLMService.buildGroundedMessages(
            this.message,
            sources,
            this.history,
            this.summary,
            this.userFacts,
        );

        let fullAnswer: string = '';
        for await (const token of llmInstance.streamChat(messages)) {
            if (this.stream.isClosed) break;
            fullAnswer += token;
            this.stream.send({
                type: STREAM_EVENT_TYPE.TOKEN,
                value: token,
            });
        }
        return fullAnswer;
    }

    private async persist(
        answer: string,
        sources: RetrievedSource[],
    ): Promise<void> {
        await ConversationService.saveAssistantMessage(
            this.currentConversationId,
            answer,
            sources.map((s) => ({ title: s.title, url: s.url })),
        );

        const tasks: Promise<unknown>[] = [
            ConversationService.touchConversation(
                this.currentConversationId,
                this.userId,
            ),
            this.updateRunningSummary(answer),
        ];
        if (this.isFirstTurn) {
            tasks.push(this.generateAndSaveTitle(answer));
        }
        await Promise.all(tasks);
    }

    private async updateRunningSummary(answer: string): Promise<void> {
        try {
            const newSummary = await llmInstance.updateSummary(
                this.summary,
                this.message,
                answer,
            );
            await ConversationService.updateConversationSummary(
                this.currentConversationId,
                newSummary,
            );
            this.summary = newSummary;

            const currentTurn = this.history.length / 2 + 1;
            if (currentTurn % AskService.EXTRACT_EVERY_N_TURNS === 0) {
                await this.extractAndSaveFacts(newSummary);
            }
        } catch (err) {
            console.error('summary update failed:', err);
        }
    }

    private async extractAndSaveFacts(summary: string): Promise<void> {
        try {
            const newFacts = await llmInstance.extractFacts(
                summary,
                this.userFacts,
            );
            if (newFacts.length === 0) return;

            await MemoryService.addUserMemories(
                this.userId,
                newFacts,
                this.currentConversationId,
            );
            this.userFacts = [...newFacts, ...this.userFacts];
        } catch (err) {
            console.error('fact extraction failed:', err);
        }
    }

    private async generateAndSaveTitle(answer: string): Promise<void> {
        try {
            const title = await llmInstance.generateTitle(this.message, answer);
            await ConversationService.updateConversationTitle(
                this.currentConversationId,
                title,
            );
        } catch (err) {
            console.error('title generation failed:', err);
        }
    }

    private static removeDuplicates(results: TavilyResult[]): TavilyResult[] {
        const seen = new Set<string>();
        const out: TavilyResult[] = [];

        for (const r of results) {
            if (seen.has(r.url)) continue;
            seen.add(r.url);
            out.push(r);
        }

        return out;
    }
}
