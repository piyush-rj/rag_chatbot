import type { Request, Response } from "express";
import { STREAM_EVENT_TYPE } from "shared";
import {
  openAIInstance,
  tavilyInstance,
  embeddingsInstance,
  chunkerInstance,
} from "../../../services/init.services";
import buildGroundedMessages from "../../../ai/prompt.builder";
import SseWriter from "../../../class/stream_writer";
import ResponseWriter from "../../../class/response_writer";
import DatabaseServices from "../../../ai/conversation.services";
import { retrieveTopSources } from "../../../ai/retriever";
import { rewriteQuery } from "../../../ai/query.rewriter";

export default async function askAIController(req: Request, res: Response) {
  const user = req.user;
  if (!user || !user.email) {
    ResponseWriter.unauthorized(res);
    return;
  }

  const { message, conversationId } = req.body as {
    message: string;
    conversationId?: string;
  };

  // start the sse stream so to push events
  const stream = new SseWriter(res);

  // load the existing conversation if id is sent, else start a new one
  const conversation = await DatabaseServices.getOrCreateConversation(
    conversationId,
    message,
    user.id,
  );

  // tell the client about the conversation so the frontend can store it
  stream.send({ type: STREAM_EVENT_TYPE.CONVERSATION, id: conversation.id });

  // if follow up, fetch previous messages so the llm has context
  const history = conversationId
    ? await DatabaseServices.getConversationHistory(conversation.id, user.id)
    : [];

  // save user's question and rewrite follow-ups into a single query
  const [searchQuery] = await Promise.all([
    rewriteQuery(history, message),
    DatabaseServices.saveUserMessage(conversation.id, message),
  ]);

  // run web search via tavily using the query
  const rawSources = await tavilyInstance.search(searchQuery);

  // split the articles into chunk-sized passages so we can pick the relevant ones
  const chunks = chunkerInstance.chunkSources(rawSources);

  // embed the single query plus every chunk in one batched call
  const vectors = await embeddingsInstance.embed([
    searchQuery,
    ...chunks.map((c) => c.text),
  ]);
  const queryVector = vectors[0]!;
  const chunkVectors = vectors.slice(1);

  // pick the top-k chunks
  const topSources = retrieveTopSources(queryVector, chunks, chunkVectors);

  // send the surviving sources to the client (only the ones the llm actually used)
  stream.send({
    type: STREAM_EVENT_TYPE.SOURCES,
    sources: topSources.map((s) => ({ title: s.title, url: s.url })),
  });

  // grounding: system rules + retrieved chunks + history + new user message
  const messages = buildGroundedMessages(message, topSources, history);

  // stream the llm response, also building the full answer in memory
  let fullAnswer = "";
  for await (const token of openAIInstance.streamChatResponse(messages)) {
    if (stream.isClosed) break;
    fullAnswer += token;
    stream.send({ type: STREAM_EVENT_TYPE.TOKEN, value: token });
  }

  // only persist the answer if the client stayed connected and the llm produced text
  if (!stream.isClosed && fullAnswer.length > 0) {
    // save the assistant message and attach the sources used
    await DatabaseServices.saveAssistantMessage(
      conversation.id,
      fullAnswer,
      topSources.map((s) => ({ title: s.title, url: s.url })),
    );

    // update the conversation's updatedAt
    await DatabaseServices.touchConversation(conversation.id, user.id);
  }

  // emit done event and close the connection
  stream.end();
}
