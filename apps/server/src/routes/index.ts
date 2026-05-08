import { Router } from 'express';
import aiRoutes from './ai/routes';
import userRoutes from './users/routes';
import conversationRoutes from './conversations/routes';
import documentRoutes from './docs/routes';

const router = Router();

router.use(userRoutes);
router.use(aiRoutes);
router.use(conversationRoutes);
router.use(documentRoutes);

export default router;
