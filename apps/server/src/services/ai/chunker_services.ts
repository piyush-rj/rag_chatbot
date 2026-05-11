import type { TavilyResult } from '../../types/tavily.types';
import type { PdfPage } from '../pdf/pdf_parser_services';

export type SourceChunk = {
    text: string;
    sourceTitle: string;
    sourceUrl: string;
    pageStart?: number | null;
    pageEnd?: number | null;
};

export type PageChunk = {
    text: string;
    pageStart: number;
    pageEnd: number;
};

export default class Chunker {
    private static readonly CHUNK_SIZE = 400;
    private static readonly CHUNK_OVERLAP = 60;

    private static chunkText(text: string): string[] {
        const sentences = text
            .replace(/\s+/g, ' ')
            .trim()
            .split(/(?<=[.!?])\s+/);

        const chunks: string[] = [];
        let current = '';

        for (const sentence of sentences) {
            if (
                (current + ' ' + sentence).trim().length <= Chunker.CHUNK_SIZE
            ) {
                current = (current + ' ' + sentence).trim();
            } else {
                if (current.length > 0) chunks.push(current);
                const tail = current.slice(-Chunker.CHUNK_OVERLAP);
                current = (tail + ' ' + sentence).trim();
            }
        }
        if (current.length > 0) chunks.push(current);

        return chunks.filter((c) => c.length > 30);
    }

    public static chunkSources(sources: TavilyResult[]): SourceChunk[] {
        const all: SourceChunk[] = [];

        for (const source of sources) {
            const pieces = Chunker.chunkText(source.content);
            for (const text of pieces) {
                all.push({
                    text,
                    sourceTitle: source.title,
                    sourceUrl: source.url,
                });
            }
        }

        return all;
    }

    public static chunkPages(pages: PdfPage[]): PageChunk[] {
        const chunks: PageChunk[] = [];
        let current = '';
        let chunkStartPage = 0;
        let chunkEndPage = 0;

        for (const { pageNumber, text } of pages) {
            if (text.length === 0) continue;

            const sentences = text
                .replace(/\s+/g, ' ')
                .trim()
                .split(/(?<=[.!?])\s+/)
                .filter((s: string) => s.length > 0);

            for (const sentence of sentences) {
                const candidate =
                    current.length === 0 ? sentence : current + ' ' + sentence;

                if (candidate.length <= Chunker.CHUNK_SIZE) {
                    if (current.length === 0) chunkStartPage = pageNumber;
                    current = candidate;
                    chunkEndPage = pageNumber;
                } else {
                    if (current.length > 0) {
                        chunks.push({
                            text: current,
                            pageStart: chunkStartPage,
                            pageEnd: chunkEndPage,
                        });
                    }
                    const tail = current.slice(-Chunker.CHUNK_OVERLAP);
                    current = (tail + ' ' + sentence).trim();
                    chunkStartPage = pageNumber;
                    chunkEndPage = pageNumber;
                }
            }
        }

        if (current.length > 0) {
            chunks.push({
                text: current,
                pageStart: chunkStartPage,
                pageEnd: chunkEndPage,
            });
        }

        return chunks.filter((c) => c.text.length > 30);
    }
}
