import {
    DELETE_CONVERSATION_URL,
    GET_CONVERSATIONS_URL,
    RENAME_CONVERSATION_URL,
} from '@/routes/api_routes';
import type {
    ConversationDetail,
    ConversationSummary,
} from '@/types/conversation.types';
import axios from 'axios';
import authHeader from './api_utils';

export default class ConversationApi {
    public static async fetchAll(
        token: string,
        opts?: { limit?: number; offset?: number },
    ) {
        const params = new URLSearchParams();
        if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
        if (opts?.offset !== undefined)
            params.set('offset', String(opts.offset));
        const qs = params.toString();
        const url = qs
            ? `${GET_CONVERSATIONS_URL}?${qs}`
            : GET_CONVERSATIONS_URL;

        const { data } = await axios.get<{
            success: boolean;
            data: { conversations: ConversationSummary[]; hasMore: boolean };
        }>(url, authHeader(token));

        return data.data;
    }

    public static async fetchOne(token: string, id: string) {
        const { data } = await axios.get<{
            success: boolean;
            data: { conversation: ConversationDetail };
        }>(`${GET_CONVERSATIONS_URL}/${id}`, authHeader(token));

        return data.data.conversation;
    }

    public static async deleteConversation(token: string, id: string) {
        const { data } = await axios.delete<{
            success: boolean;
            data: { conversationId: string };
        }>(`${DELETE_CONVERSATION_URL}/${id}`, authHeader(token));

        return data.data.conversationId;
    }

    public static async renameConversation(
        token: string,
        id: string,
        title: string,
    ) {
        const { data } = await axios.post<{
            success: boolean;
            data: { title: string };
        }>(`${RENAME_CONVERSATION_URL}/${id}`, { title }, authHeader(token));

        return data.data.title;
    }
}
