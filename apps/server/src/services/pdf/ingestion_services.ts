import { randomUUID } from 'node:crypto';
import { prisma, Prisma, DocumentSource, DocumentStatus } from 'database';

import { embeddingsInstance } from '../init.services';
import Chunker, { type PageChunk } from '../ai/chunker_services';
import PdfParser from './pdf_parser_services';
import DocumentStorage from './document_storage_services';

export type IngestResult = {
    documentId: string;
    chunkCount: number;
};

export type IngestPdfOptions = {
    source?: DocumentSource;
    driveFileId?: string | null;
    driveOwner?: string | null;
};

export class EmptyPdfError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EmptyPdfError';
    }
}

const EMBED_BATCH_SIZE = 500;

export default class IngestionService {
    public static async ingestPdf(
        buffer: Uint8Array,
        filename: string,
        mimeType: string,
        userId: string,
        opts?: IngestPdfOptions,
    ): Promise<IngestResult> {
        // validate pdf in the memory before touching the db or filesystem.
        // a pdf that yields zero chunks should be rejected outright, we
        // don't want to leave behind a failed document row or an orphan
        // file on disk for a request the user is going to resubmit.
        const pages = await PdfParser.parse(buffer);
        const chunks = Chunker.chunkPages(pages);
        if (chunks.length === 0) {
            throw new EmptyPdfError(
                'No text could be extracted from this PDF. It may be a scanned image or rely on OCR.',
            );
        }

        const document = await prisma.document.create({
            data: {
                userId,
                source: opts?.source ?? DocumentSource.PDF,
                driveFileId: opts?.driveFileId ?? null,
                driveOwner: opts?.driveOwner ?? null,
                status: DocumentStatus.PROCESSING,
                name: filename,
                mimeType,
                byteSize: buffer.byteLength,
            },
        });

        let storageKey: string | null = null;
        try {
            storageKey = await DocumentStorage.writePdf(
                userId,
                document.id,
                buffer,
            );

            await prisma.document.update({
                where: { id: document.id },
                data: { storageKey },
            });

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
            if (storageKey) {
                await DocumentStorage.deleteIfExists(storageKey).catch(() => {
                    // cleanup coz the stale file is harmless
                });
            }
            throw error;
        }
    }

    // sends batches of 500 chunks for embedding
    private static async embedInBatches(texts: string[]): Promise<number[][]> {
        const out: number[][] = [];
        for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
            const batch = texts.slice(i, i + EMBED_BATCH_SIZE);

            const vecs = await embeddingsInstance.embed(batch);

            out.push(...vecs);
        }
        return out;
    }

    // raw sql to insert all chunks at once in the pgvector db
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
