import type { Request, Response } from 'express';
import ResponseWriter from '../../../class/response_writer';
import { prisma } from 'database';
import rename_chat_schema from '../../../schemas/conversation_controller_schemas/rename_chat_schema';

export default async function renameConversationController(
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

    const { data, success } = rename_chat_schema.safeParse(req.body);
    if (!success) {
        ResponseWriter.badRequest(res, 'Invalid title');
        return;
    }

    try {
        const result = await prisma.conversation.updateMany({
            where: {
                id,
                userId: user.id,
            },
            data: {
                title: data.title,
            },
        });

        if (result.count === 0) {
            ResponseWriter.notFound(res);
            return;
        }

        ResponseWriter.ok(res, { title: data.title });
    } catch (error) {
        console.error('renameConversation failed', {
            error,
        });
        ResponseWriter.serverError(res);
    }
}
