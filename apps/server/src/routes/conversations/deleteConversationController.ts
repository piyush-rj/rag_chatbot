import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import { prisma } from 'database';

export default async function deleteConversationController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user || !user.id) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const { id } = req.params;
    if (typeof id !== 'string' || id.length === 0) {
        ResponseWriter.badRequest(res, 'Missing conversation id');
        return;
    }

    try {
        const { count } = await prisma.conversation.deleteMany({
            where: {
                id,
                userId: user.id,
            },
        });

        if (count === 0) {
            ResponseWriter.notFound(res, 'Conversation does not exist.');
            return;
        }

        ResponseWriter.ok(res, { conversationId: id });
    } catch (error) {
        console.error('deleteConversation failed', { error });
        ResponseWriter.serverError(res);
    }
}
