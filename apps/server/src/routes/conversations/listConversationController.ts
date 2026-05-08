import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import ConversationService from '../../services/db/conversation_services';

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

    const result = await ConversationService.listConversations(
        user.id,
        limit,
        offset,
    );
    ResponseWriter.ok(res, result);
}
