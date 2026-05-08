import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import MemoryService from '../../services/db/memory_services';

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
        const memories = await MemoryService.listUserMemories(user.id);
        ResponseWriter.ok(res, { memories });
    } catch (error) {
        console.error('listUserMemories controller failed: ', error);
        ResponseWriter.serverError(res);
        return;
    }
}
