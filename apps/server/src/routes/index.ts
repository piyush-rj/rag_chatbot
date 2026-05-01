import { Router } from "express";
import askAIController from "./controllers/ai-controllers/askAIController";
import signInController from "./controllers/user-controllers/signInController";
import authMiddleware from "../middlewares/auth.middleware";
import listConversationsController from "./controllers/conversation-controllers/listConversationController";
import { getConversationController } from "./controllers/conversation-controllers/getConversationController";

const router = Router();

router.post("/ask", authMiddleware, askAIController);
router.get("/conversations", authMiddleware, listConversationsController);
router.get("/conversations/:id", authMiddleware, getConversationController);
router.post("/sign-in", signInController);

export default router;
