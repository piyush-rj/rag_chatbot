import type { Request, Response } from 'express';
import ResponseWriter from '../../services/responses/response_writer';
import IngestionService, {
    EmptyPdfError,
} from '../../services/pdf/ingestion_services';

export default async function uploadDocumentController(
    req: Request,
    res: Response,
) {
    const user = req.user;
    if (!user) {
        ResponseWriter.unauthorized(res);
        return;
    }

    const file = req.file;
    if (!file) {
        ResponseWriter.badRequest(res, 'No file provided');
        return;
    }

    if (file.mimetype !== 'application/pdf') {
        ResponseWriter.badRequest(
            res,
            'Only application/pdf is supported',
            'UNSUPPORTED_MIME',
        );
        return;
    }

    // redecode to resolve the mojibake issue
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
    );

    try {
        const result = await IngestionService.ingestPdf(
            file.buffer,
            originalName,
            file.mimetype,
            user.id,
        );
        ResponseWriter.created(res, {
            documentId: result.documentId,
            name: originalName,
            chunkCount: result.chunkCount,
            status: 'READY',
        });
    } catch (error) {
        if (error instanceof EmptyPdfError) {
            ResponseWriter.badRequest(res, error.message, 'EMPTY_PDF');
            return;
        }
        console.error('uploadDocument failed', { error });
        ResponseWriter.serverError(res, 'Document processing failed');
    }
}
