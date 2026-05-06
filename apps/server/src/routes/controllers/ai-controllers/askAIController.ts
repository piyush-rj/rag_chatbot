import type { Request, Response } from 'express';
import AskService from '../../../ai/ask.service';
import SseWriter from '../../../class/stream_writer';
import ResponseWriter from '../../../class/response_writer';

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

    const stream = new SseWriter(res);
    await new AskService(stream, user.id, message, conversationId).run();
}
