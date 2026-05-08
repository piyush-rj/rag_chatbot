import multer, { MulterError } from 'multer';
import type { Request, Response, NextFunction } from 'express';
import ResponseWriter from '../services/responses/response_writer';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_BYTES, files: 1 },
});

const single = upload.single('file');

export default function uploadSingleMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    single(req, res, (err) => {
        if (err instanceof MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                ResponseWriter.badRequest(
                    res,
                    'File exceeds 25 MB limit',
                    'FILE_TOO_LARGE',
                );
                return;
            }
            ResponseWriter.badRequest(res, err.message, 'UPLOAD_ERROR');
            return;
        }
        if (err) {
            console.error('upload middleware error', { err });
            ResponseWriter.serverError(res);
            return;
        }
        next();
    });
}
