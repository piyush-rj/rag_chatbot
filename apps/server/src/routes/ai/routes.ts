import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.middleware';
import askAIController from './askAIController';

const aiRoutes = Router();

aiRoutes.post('/ask', authMiddleware, askAIController);

export default aiRoutes;
