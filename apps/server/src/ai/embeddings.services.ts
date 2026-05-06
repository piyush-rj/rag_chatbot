import { OpenRouter } from '@openrouter/sdk';

export default class EmbeddingsServices {
    private model = 'openai/text-embedding-3-small';
    private openRouter = new OpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
    });

    public async embed(inputs: string[]): Promise<number[][]> {
        const res = await this.openRouter.embeddings.generate({
            requestBody: {
                model: this.model,
                input: inputs,
                encodingFormat: 'float',
            },
        });

        if (typeof res === 'string') {
            throw new Error('Unexpected string response from embeddings');
        }

        const indexed = res.data.map((d, i) => ({ ...d, index: d.index ?? i }));
        indexed.sort((a, b) => a.index - b.index);

        return indexed.map((d) => {
            if (typeof d.embedding === 'string') {
                throw new Error('Got base64 embedding, expected float array');
            }
            return d.embedding;
        });
    }
}
