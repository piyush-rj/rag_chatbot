import type { Request, Response } from "express";
import ConversationServices from "../../../ai/conversation.services";
import ResponseWriter from "../../../class/response_writer";

export async function getConversationController(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    ResponseWriter.unauthorized(res);
    return;
  }
  const id = req.params.id;
  if (typeof id !== "string") {
    return ResponseWriter.badRequest(res, "id is required");
  }

  const conversation = await ConversationServices.getConversationDetail(
    id,
    user.id,
  );
  if (!conversation) {
    return ResponseWriter.notFound(res, "Conversation not found");
  }

  ResponseWriter.ok(res, { conversation });
}
