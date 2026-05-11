import type { SourceChunk } from './chunker_services';

export type RetrievedSource = {
    title: string;
    url: string;
    chunks: string[];
    pageStart?: number | null;
    pageEnd?: number | null;
};

export default class Retriever {
    public static rankByCosine(
        queryVector: number[],
        chunks: SourceChunk[],
        chunkVectors: number[][],
    ): SourceChunk[] {
        return chunks
            .map((chunk, i) => ({
                chunk,
                score: Retriever.cosineSimilarity(
                    queryVector,
                    chunkVectors[i] ?? [],
                ),
            }))
            .sort((a, b) => b.score - a.score)
            .map((s) => s.chunk);
    }

    public static groupByUrl(chunks: SourceChunk[]): RetrievedSource[] {
        const grouped = new Map<string, RetrievedSource>();
        for (const chunk of chunks) {
            const existing = grouped.get(chunk.sourceUrl);
            if (existing) {
                existing.chunks.push(chunk.text);
                if (chunk.pageStart != null) {
                    existing.pageStart =
                        existing.pageStart == null
                            ? chunk.pageStart
                            : Math.min(existing.pageStart, chunk.pageStart);
                }
                if (chunk.pageEnd != null) {
                    existing.pageEnd =
                        existing.pageEnd == null
                            ? chunk.pageEnd
                            : Math.max(existing.pageEnd, chunk.pageEnd);
                }
            } else {
                grouped.set(chunk.sourceUrl, {
                    title: chunk.sourceTitle,
                    url: chunk.sourceUrl,
                    chunks: [chunk.text],
                    pageStart: chunk.pageStart ?? null,
                    pageEnd: chunk.pageEnd ?? null,
                });
            }
        }
        return Array.from(grouped.values());
    }

    // Format a source's page range for display. "4" if start == end,
    // "4–7" otherwise. Returns null when no page info is available.
    public static formatPageLabel(source: RetrievedSource): string | null {
        const start = source.pageStart;
        const end = source.pageEnd;
        if (start == null && end == null) return null;
        const lo = start ?? end!;
        const hi = end ?? start!;
        return lo === hi ? String(lo) : `${lo}–${hi}`;
    }

    private static cosineSimilarity(a: number[], b: number[]): number {
        let dot = 0;
        let normA = 0;
        let normB = 0;
        const len = Math.min(a.length, b.length);
        for (let i = 0; i < len; i++) {
            const ai = a[i] ?? 0;
            const bi = b[i] ?? 0;
            dot += ai * bi;
            normA += ai * ai;
            normB += bi * bi;
        }
        if (normA === 0 || normB === 0) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
