import { OpenRouter } from "@openrouter/sdk";
import type { ChatMessage } from "./prompt.builder";

export default class OpenAIServices {
  private openRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // start -> yield -> pause -> resume -> yield -> pause -> ... -> end
  public async *streamChatResponse(
    messages: ChatMessage[],
  ): AsyncGenerator<string, void> {
    const stream = await this.openRouter.chat.send({
      chatRequest: {
        model: "openai/gpt-4o-mini",
        messages,
        stream: true,
      },
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) yield token;
    }
  }

  // query rewriting
  public async complete(
    messages: ChatMessage[],
    model = "openai/gpt-4o-mini",
  ): Promise<string> {
    const res = await this.openRouter.chat.send({
      chatRequest: {
        model,
        messages,
        stream: false,
      },
    });
    console.log(
      "rewritten query is -------------> ",
      res.choices[0]?.message.content,
    );

    return res.choices[0]?.message.content ?? "";
  }
}
