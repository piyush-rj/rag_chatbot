import { randomUUID } from 'node:crypto';
import { prisma, Prisma, DocumentSource, DocumentStatus } from 'database';

import { embeddingsInstance } from '../init.services';
import Chunker, { type PageChunk } from '../ai/chunker_services';
import PdfParser from './pdf_parser_services';

export type IngestResult = {
    documentId: string;
    chunkCount: number;
};

const EMBED_BATCH_SIZE = 500;

export default class IngestionService {
    public static async ingestPdf(
        buffer: Uint8Array,
        filename: string,
        mimeType: string,
        userId: string,
    ): Promise<IngestResult> {
        const document = await prisma.document.create({
            data: {
                userId,
                source: DocumentSource.PDF,
                status: DocumentStatus.PROCESSING,
                name: filename,
                mimeType,
                byteSize: buffer.byteLength,
            },
        });

        try {
            const pages = await PdfParser.parse(buffer);
            const chunks = Chunker.chunkPages(pages);

            // safety check to not call llm when chunk.length === 0, empty pdf
            // to prevent llm call, instead we set the status as ready and show it in the frontend
            // TODO: add a better status for this case
            if (chunks.length === 0) {
                await prisma.document.update({
                    where: { id: document.id },
                    data: { status: DocumentStatus.READY },
                });
                return { documentId: document.id, chunkCount: 0 };
            }

            const vectors = await IngestionService.embedInBatches(
                chunks.map((c) => c.text),
            );
            await IngestionService.insertChunks(document.id, chunks, vectors);

            await prisma.document.update({
                where: { id: document.id },
                data: { status: DocumentStatus.READY },
            });

            return { documentId: document.id, chunkCount: chunks.length };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            await prisma.document.update({
                where: { id: document.id },
                data: {
                    status: DocumentStatus.FAILED,
                    errorMessage: message,
                },
            });
            throw error;
        }
    }

    private static async embedInBatches(texts: string[]): Promise<number[][]> {
        const out: number[][] = [];
        for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
            const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
            const vecs = await embeddingsInstance.embed(batch);
            out.push(...vecs);
        }
        return out;
    }

    private static async insertChunks(
        documentId: string,
        chunks: PageChunk[],
        embeddings: number[][],
    ): Promise<void> {
        const rows = chunks.map((c, i) => {
            const id = randomUUID();
            const vectorLiteral = `[${embeddings[i]!.join(',')}]`;
            return Prisma.sql`(${id}, ${documentId}, ${i}, ${c.text}, ${vectorLiteral}::vector, ${c.pageStart}, ${c.pageEnd}, NOW())`;
        });

        await prisma.$executeRaw`
            INSERT INTO "DocumentChunk" ("id", "documentId", "ord", "text", "embedding", "pageStart", "pageEnd", "createdAt")
            VALUES ${Prisma.join(rows)}
        `;
    }
}
