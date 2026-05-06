import type { Request, Response } from 'express';
import ResponseWriter from '../../../class/response_writer';
import DatabaseServices from '../../../ai/conversation.services';

export default async function deleteMemoryController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const memoryId = req.params.id;
    if (!memoryId) {
        ResponseWriter.badRequest(res, 'Memory id is required.');
        return;
    }

    try {
        const result = await DatabaseServices.deleteUserMemory(
            user.id,
            JSON.stringify(memoryId),
        );
        if (result.count === 0) {
            ResponseWriter.notFound(res, 'Memory not found');
            return;
        }

        ResponseWriter.ok(res, { deleted: result });
        return;
    } catch (error) {
        console.error('deleteMemoryController failed: ', error);
        ResponseWriter.serverError(res);
        return;
    }
}
