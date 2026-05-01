import type { TavilyResult } from "../types/tavily.types";

export type SourceChunk = {
  text: string;
  sourceTitle: string;
  sourceUrl: string;
};

export default class Chunker {
  // splits each article (tavily reference) into 400 char passages, the chunks here do not contain the ref urls and titles, these are metadata along with the chunk
  private readonly CHUNK_SIZE = 400;
  // if i divide an article into multiple chunks and suppose the relevant chunk doesnt have the reference to what the query was.. Hence, what we do is we use the 60 tail characters of prev chunk and add it in the next chunk -> So chunk_B will contain last 60 chars of chunk_A plus further 340 chars.
  private readonly CHUNK_OVERLAP = 60;

  // What is the capital of france

  // The capital of , -> chunk a
  // france is -> chunk b
  // paris -> chunk c

  // chunk a -> the capital of -> 400 chars
  // chunk b -> of france is -> last 60 chars of chunk a + 340 chars further
  // chunk c -> france is paris -> last 60 chars of chunk b + 340 chars further

  private chunkText(text: string): string[] {
    const sentences = text
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=[.!?])\s+/);

    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
      if ((current + " " + sentence).trim().length <= this.CHUNK_SIZE) {
        current = (current + " " + sentence).trim();
      } else {
        if (current.length > 0) chunks.push(current);
        const tail = current.slice(-this.CHUNK_OVERLAP);
        current = (tail + " " + sentence).trim();
      }
    }
    if (current.length > 0) chunks.push(current);

    return chunks.filter((c) => c.length > 30);
  }

  public chunkSources(sources: TavilyResult[]): SourceChunk[] {
    const all: SourceChunk[] = [];

    for (const source of sources) {
      const pieces = this.chunkText(source.content);
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
}
