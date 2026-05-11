import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import ConversationDocumentService from '../../services/db/conversation_document_services';

export default async function detachDocumentController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const conversationId = req.params.id;
    const documentId = req.params.documentId;
    if (
        typeof conversationId !== 'string' ||
        conversationId.length === 0 ||
        typeof documentId !== 'string' ||
        documentId.length === 0
    ) {
        ResponseWriter.badRequest(res, 'Missing id');
        return;
    }

    try {
        const removed = await ConversationDocumentService.detach(
            conversationId,
            user.id,
            documentId,
        );
        if (!removed) {
            ResponseWriter.notFound(res, 'Attachment not found');
            return;
        }
        ResponseWriter.ok(res, { conversationId, documentId });
    } catch (error) {
        console.error('detachDocument failed', { error });
        ResponseWriter.serverError(res);
    }
}
