import { tavily } from "@tavily/core";
import type { TavilyResult } from "../types/tavily.types";

export default class TavilyServices {
  private client = tavily({ apiKey: process.env.TAVILY_API_KEY });

  public async search(query: string): Promise<TavilyResult[]> {
    const res = await this.client.search(query, { maxResults: 5 });

    return res.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  }
}
