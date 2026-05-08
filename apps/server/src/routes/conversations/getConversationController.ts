import type { Request, Response } from 'express';
import ConversationService from '../../services/db/conversation_services';
import ResponseWriter from '../../services/responses/response_writer';

export async function getConversationController(req: Request, res: Response) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }
    const id = req.params.id;
    if (typeof id !== 'string') {
        return ResponseWriter.badRequest(res, 'id is required');
    }

    try {
        const conversation = await ConversationService.getConversationDetail(
            id,
            user.id,
        );
        if (!conversation) {
            return ResponseWriter.notFound(res, 'Conversation not found');
        }

        ResponseWriter.ok(res, { conversation });
    } catch (error) {
        console.error('getConversationController error: ', error);
        ResponseWriter.serverError(res);
    }
}
