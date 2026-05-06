import type { SourceChunk } from './chunker';

export type RetrievedSource = {
    title: string;
    url: string;
    chunks: string[];
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
            } else {
                grouped.set(chunk.sourceUrl, {
                    title: chunk.sourceTitle,
                    url: chunk.sourceUrl,
                    chunks: [chunk.text],
                });
            }
        }
        return Array.from(grouped.values());
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
