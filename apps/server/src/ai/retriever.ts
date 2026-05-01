import type { SourceChunk } from "./chunker";

export type RetrievedSource = {
  title: string;
  url: string;
  chunks: string[];
};

const TOP_K = 5;

function cosineSimilarity(a: number[], b: number[]): number {
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

export function retrieveTopSources(
  queryVector: number[],
  chunks: SourceChunk[],
  chunkVectors: number[][],
  k: number = TOP_K,
): RetrievedSource[] {
  const scored = chunks.map((chunk, i) => ({
    chunk,
    score: cosineSimilarity(queryVector, chunkVectors[i] ?? []),
  }));

  console.log(
    "embedding score after cosine similarity is: ",
    Array.from(scored.values()),
  );

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, k);

  console.log("top 5 chosen values are: ", Array.from(top.values()));

  const grouped = new Map<string, RetrievedSource>();
  for (const { chunk } of top) {
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

  console.log("final selected chunks are: ", Array.from(grouped.values()));

  return Array.from(grouped.values());
}
