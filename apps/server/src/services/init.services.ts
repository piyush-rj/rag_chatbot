import LLMService from './ai/llm_services';
import TavilyService from './ai/tavily_services';
import EmbeddingsService from './ai/embeddings_services';

export let llmInstance: LLMService;
export let tavilyInstance: TavilyService;
export let embeddingsInstance: EmbeddingsService;

export default async function initServices() {
    llmInstance = new LLMService();
    tavilyInstance = new TavilyService();
    embeddingsInstance = new EmbeddingsService();
}
