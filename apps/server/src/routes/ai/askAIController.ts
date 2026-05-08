import type { Request, Response } from 'express';
import AskService from '../../services/ai/ask_services';
import SseWriter from '../../services/responses/stream_writer';
import ResponseWriter from '../../services/responses/response_writer';

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

    const documentIds = Array.isArray(req.body?.documentIds)
        ? req.body.documentIds.filter(
              (id: unknown): id is string => typeof id === 'string',
          )
        : undefined;

    const stream = new SseWriter(res);
    await new AskService(
        stream,
        user.id,
        message,
        conversationId,
        documentIds,
    ).run();
}
