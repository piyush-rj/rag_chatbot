import type { Request, Response } from 'express';
import ResponseWriter from '../../../class/response_writer';
import DatabaseServices from '../../../ai/conversation.services';

export default async function listMemoriesController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user || !user.email) {
        ResponseWriter.unauthorized(res);
        return;
    }

    try {
        const memories = await DatabaseServices.listUserMemories(user.id);
        ResponseWriter.ok(res, { memories });
    } catch (error) {
        console.error('listUserMemories controller failed: ', error);
        ResponseWriter.serverError(res);
        return;
    }
}
