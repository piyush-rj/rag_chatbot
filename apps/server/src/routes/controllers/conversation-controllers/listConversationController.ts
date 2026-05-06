import type { Request, Response } from 'express';
import ResponseWriter from '../../../class/response_writer';
import ConversationServices from '../../../ai/conversation.services';

function parsePositiveInt(value: unknown): number | undefined {
    if (typeof value !== 'string') return undefined;
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return n;
}

export default async function listConversationsController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const limit = parsePositiveInt(req.query.limit);
    const offset = parsePositiveInt(req.query.offset);

    const result = await ConversationServices.listConversations(
        user.id,
        limit,
        offset,
    );
    ResponseWriter.ok(res, result);
}
