import { Router } from 'express';
import askAIController from './controllers/ai-controllers/askAIController';
import signInController from './controllers/user-controllers/signInController';
import authMiddleware from '../middlewares/auth.middleware';
import listConversationsController from './controllers/conversation-controllers/listConversationController';
import { getConversationController } from './controllers/conversation-controllers/getConversationController';
import deleteConversationController from './controllers/conversation-controllers/deleteConversationController';
import renameConversationController from './controllers/conversation-controllers/renameConversationController';
import listMemoriesController from './controllers/conversation-controllers/listMemoriesController';
import deleteMemoryController from './controllers/conversation-controllers/deleteMemoryController';

const router = Router();

router.post('/sign-in', signInController);

router.post('/ask', authMiddleware, askAIController);
router.post(
    '/conversations/rename-conversation/:id',
    authMiddleware,
    renameConversationController,
);

router.get('/conversations', authMiddleware, listConversationsController);
router.get('/conversations/:id', authMiddleware, getConversationController);
router.get('/memories', authMiddleware, listMemoriesController);

router.delete(
    '/conversations/delete/:id',
    authMiddleware,
    deleteConversationController,
);
router.delete('/memories/:id', authMiddleware, deleteMemoryController);

export default router;
