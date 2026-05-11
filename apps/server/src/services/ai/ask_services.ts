import { STREAM_EVENT_TYPE } from 'shared';
import { prisma, Prisma, Role } from 'database';
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
import ConversationDocumentService from '../db/conversation_document_services';
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
    private activeDocumentIds: string[] = [];

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

        this.emitStatus('Thinking');

        this.activeDocumentIds = await this.resolveAttachedDocumentIds();

        console.log(
            `[ask] clientIds=[${(this.documentIds ?? []).join(',')}] resolvedScope=[${this.activeDocumentIds.join(',')}]`,
        );

        const searchQuery = await this.rewriteAndSave();

        const useDocs = this.activeDocumentIds.length > 0;
        this.emitStatus(
            useDocs ? 'Reading your documents' : 'Searching the web',
        );

        const topSources = useDocs
            ? await this.retrieveFromDocs(searchQuery, this.activeDocumentIds)
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

    // Retrieval scope per turn:
    //   1. Primary scope = whatever the user attached on THIS message; or
    //      if they attached nothing, whatever the most recent user message
    //      with attachments had (so follow-up questions inherit context).
    //   2. Plus any older conversation docs the user *names* in their
    //      message — e.g. uploading B then asking "compare with the EAM
    //      doc" should also pull A back into scope.
    //
    // The join table is still updated for record-keeping but no longer
    // dictates retrieval on its own.
    private async resolveAttachedDocumentIds(): Promise<string[]> {
        const clientIds = this.documentIds ?? [];

        if (clientIds.length > 0) {
            const persistedIds = await ConversationDocumentService.listIds(
                this.currentConversationId,
                this.userId,
            );
            const missing = clientIds.filter(
                (id) => !persistedIds.includes(id),
            );
            if (missing.length > 0) {
                await ConversationDocumentService.attach(
                    this.currentConversationId,
                    this.userId,
                    missing,
                );
            }
        }

        const primary =
            clientIds.length > 0
                ? clientIds
                : await this.findLatestUserMessageAttachments();

        const mentioned = await this.detectMentionedDocs(primary);
        if (mentioned.length > 0) {
            console.log(
                `[ask] mentioned older docs by name: ${mentioned.join(',')}`,
            );
        }

        return Array.from(new Set([...primary, ...mentioned]));
    }

    // Names of the docs the user attached on THIS turn (not inherited).
    // Used to disambiguate the answer LLM when it would otherwise resolve
    // "this pdf" using prior conversation context.
    private async fetchFreshlyAttachedDocNames(): Promise<string[]> {
        const ids = this.documentIds ?? [];
        if (ids.length === 0) return [];
        const docs = await prisma.document.findMany({
            where: { id: { in: ids }, userId: this.userId },
            select: { name: true },
        });
        return docs.map((d) => d.name);
    }

    private async findLatestUserMessageAttachments(): Promise<string[]> {
        const last = await prisma.message.findFirst({
            where: {
                conversationId: this.currentConversationId,
                role: Role.USER,
                attachments: { some: { documentId: { not: null } } },
            },
            orderBy: { createdAt: 'desc' },
            select: {
                attachments: {
                    where: { documentId: { not: null } },
                    select: { documentId: true },
                },
            },
        });
        if (!last) return [];
        return last.attachments
            .map((a) => a.documentId)
            .filter((id): id is string => typeof id === 'string');
    }

    // Pull in any conversation docs whose filename the user mentions by
    // name in this turn's message. Lets users say "what does the EAM doc
    // say about X" after uploading something newer, without losing the
    // default behaviour of sticking to the latest upload.
    private async detectMentionedDocs(excludeIds: string[]): Promise<string[]> {
        const rows = await prisma.conversationDocument.findMany({
            where: {
                conversationId: this.currentConversationId,
                ...(excludeIds.length > 0
                    ? { documentId: { notIn: excludeIds } }
                    : {}),
            },
            select: {
                document: { select: { id: true, name: true } },
            },
        });
        if (rows.length === 0) return [];

        const messageLower = this.message.toLowerCase();
        const matched: string[] = [];
        for (const { document } of rows) {
            if (AskService.docNameMentioned(document.name, messageLower)) {
                matched.push(document.id);
            }
        }
        return matched;
    }

    private static readonly MENTION_STOPWORDS = new Set([
        'the',
        'and',
        'for',
        'are',
        'but',
        'not',
        'you',
        'all',
        'can',
        'was',
        'one',
        'our',
        'out',
        'has',
        'had',
        'how',
        'who',
        'what',
        'when',
        'where',
        'why',
        'this',
        'that',
        'with',
        'have',
        'from',
        'they',
        'will',
        'your',
        'about',
        'pdf',
        'doc',
        'docs',
        'document',
        'documents',
        'file',
        'files',
        'attached',
        'attachment',
        'previous',
        'next',
        'new',
        'old',
        'tell',
    ]);

    private static docNameMentioned(
        docName: string,
        messageLower: string,
    ): boolean {
        const stem = docName.replace(/\.[^.]+$/, '').toLowerCase();
        const tokens = stem
            .split(/[^a-z0-9]+/)
            .filter(
                (t) => t.length >= 3 && !AskService.MENTION_STOPWORDS.has(t),
            );
        if (tokens.length === 0) return false;

        return tokens.some((t) => {
            const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(`\\b${escaped}\\b`).test(messageLower);
        });
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
        // Skip the query rewrite when the user just attached new docs. The
        // rewriter uses prior conversation history to disambiguate ambiguous
        // phrases like "this pdf" — useful for follow-ups, but disastrous
        // when the user has uploaded a brand new file. In that case "this
        // pdf" gets rewritten into a reference to the *previous* doc, which
        // then mismatches the chunks we're actually retrieving from. Use
        // their literal message instead.
        const skipRewrite = (this.documentIds?.length ?? 0) > 0;

        const [searchQuery] = await Promise.all([
            skipRewrite
                ? Promise.resolve(this.message)
                : llmInstance.rewriteQuery(this.history, this.message),
            ConversationService.saveUserMessage(
                this.currentConversationId,
                this.message,
                this.documentIds ?? [],
            ),
        ]);
        console.log(`[ask] searchQuery="${searchQuery}"`);
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
        documentIds: string[],
    ): Promise<RetrievedSource[]> {
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

        console.log(
            `[ask] retrieveFromDocs: docs=${documentIds.length} chunks=${rows.length}`,
        );
        if (rows.length === 0) return [];

        const candidates: SourceChunk[] = rows.map((r) => ({
            text: r.text,
            sourceTitle: r.documentName,
            sourceUrl: `doc://${r.documentId}`,
            pageStart: r.pageStart,
            pageEnd: r.pageEnd,
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
            sources: sources.map((s) => ({
                title: s.title,
                url: s.url,
                page: Retriever.formatPageLabel(s),
            })),
        });
    }

    private emitStatus(value: string): void {
        this.stream.send({ type: STREAM_EVENT_TYPE.STATUS, value });
    }

    private async streamAnswer(sources: RetrievedSource[]): Promise<string> {
        const freshlyAttachedDocs = await this.fetchFreshlyAttachedDocNames();
        const messages: ChatMessage[] = LLMService.buildGroundedMessages(
            this.message,
            sources,
            this.history,
            this.summary,
            this.userFacts,
            freshlyAttachedDocs,
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
            sources.map((s) => ({
                title: s.title,
                url: s.url,
                page: Retriever.formatPageLabel(s),
            })),
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
