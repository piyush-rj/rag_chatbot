import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import ConversationDocumentService from '../../services/db/conversation_document_services';

export default async function attachDocumentController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const conversationId = req.params.id;
    if (typeof conversationId !== 'string' || conversationId.length === 0) {
        ResponseWriter.badRequest(res, 'Missing conversation id');
        return;
    }

    const raw = req.body?.documentIds;
    const documentIds = Array.isArray(raw)
        ? raw.filter((d): d is string => typeof d === 'string' && d.length > 0)
        : [];
    if (documentIds.length === 0) {
        ResponseWriter.badRequest(res, 'documentIds must be a non-empty array');
        return;
    }

    try {
        const documents = await ConversationDocumentService.attach(
            conversationId,
            user.id,
            documentIds,
        );
        ResponseWriter.ok(res, { documents });
    } catch (error) {
        console.error('attachDocument failed', { error });
        ResponseWriter.serverError(res);
    }
}
