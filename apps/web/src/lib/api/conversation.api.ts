import type {
  ConversationDetail,
  ConversationSummary,
} from "@/types/conversation.types";
import axios from "axios";
import { GET_CONVERSATIONS_URL } from "./api_routes";

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export default class ConversationApi {
  public static async fetchAll(token: string) {
    const res = await axios.get<{
      success: boolean;
      data: { conversations: ConversationSummary[] };
    }>(GET_CONVERSATIONS_URL, authHeader(token));
    return res.data.data.conversations;
  }

  public static async fetchOne(token: string, id: string) {
    const res = await axios.get<{
      success: boolean;
      data: { conversation: ConversationDetail };
    }>(`${GET_CONVERSATIONS_URL}/${id}`, authHeader(token));
    return res.data.data.conversation;
  }
}
