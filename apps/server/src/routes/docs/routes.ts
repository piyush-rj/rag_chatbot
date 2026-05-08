import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.middleware';
import uploadSingleMiddleware from '../../middlewares/upload.middleware';
import uploadDocumentController from './uploadDocumentController';
import listDocumentsController from './listDocumentsController';
import deleteDocumentController from './deleteDocumentController';

const documentRoutes = Router();

documentRoutes.post(
    '/documents/upload',
    authMiddleware,
    uploadSingleMiddleware,
    uploadDocumentController,
);
documentRoutes.get('/documents', authMiddleware, listDocumentsController);
documentRoutes.delete(
    '/documents/:id',
    authMiddleware,
    deleteDocumentController,
);

export default documentRoutes;
