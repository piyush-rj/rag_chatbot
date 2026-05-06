import LLMServices from '../ai/llm.services';
import TavilyServices from '../ai/tavily.services';
import EmbeddingsServices from '../ai/embeddings.services';
import Chunker from '../ai/chunker';

export let llmInstance: LLMServices;
export let tavilyInstance: TavilyServices;
export let embeddingsInstance: EmbeddingsServices;
export let chunkerInstance: Chunker;

export default async function initServices() {
    llmInstance = new LLMServices();
    tavilyInstance = new TavilyServices();
    embeddingsInstance = new EmbeddingsServices();
    chunkerInstance = new Chunker();
}
