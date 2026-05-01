import OpenAIServices from "../ai/openai.services";
import TavilyServices from "../ai/tavily.services";
import EmbeddingsServices from "../ai/embeddings.services";
import Chunker from "../ai/chunker";

export let openAIInstance: OpenAIServices;
export let tavilyInstance: TavilyServices;
export let embeddingsInstance: EmbeddingsServices;
export let chunkerInstance: Chunker;

export default async function initServices() {
  openAIInstance = new OpenAIServices();
  tavilyInstance = new TavilyServices();
  embeddingsInstance = new EmbeddingsServices();
  chunkerInstance = new Chunker();
}
