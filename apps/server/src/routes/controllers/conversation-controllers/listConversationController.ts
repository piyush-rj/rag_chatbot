import type { Request, Response } from "express";
import ResponseWriter from "../../../class/response_writer";
import ConversationServices from "../../../ai/conversation.services";

export default async function listConversationsController(
  req: Request,
  res: Response,
) {
  const user = req.user;
  if (!user) {
    ResponseWriter.unauthorized(res);
    return;
  }
  const conversations = await ConversationServices.listConversations(user.id);
  ResponseWriter.ok(res, { conversations });
}
