import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.middleware';
import listConversationsController from './listConversationController';
import { getConversationController } from './getConversationController';
import deleteConversationController from './deleteConversationController';
import renameConversationController from './renameConversationController';
import listMemoriesController from './listMemoriesController';
import deleteMemoryController from './deleteMemoryController';

const conversationRoutes = Router();

conversationRoutes.get(
    '/conversations',
    authMiddleware,
    listConversationsController,
);
conversationRoutes.get(
    '/conversations/:id',
    authMiddleware,
    getConversationController,
);
conversationRoutes.get('/memories', authMiddleware, listMemoriesController);
conversationRoutes.post(
    '/conversations/rename-conversation/:id',
    authMiddleware,
    renameConversationController,
);
conversationRoutes.delete(
    '/conversations/delete/:id',
    authMiddleware,
    deleteConversationController,
);

conversationRoutes.delete(
    '/memories/:id',
    authMiddleware,
    deleteMemoryController,
);

export default conversationRoutes;
