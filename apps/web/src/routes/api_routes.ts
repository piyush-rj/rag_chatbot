const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
export const API_URL = `${API_BASE}/api/v1`;

export const SIGNIN_URL = `${API_URL}/sign-in`;
export const GET_CONVERSATIONS_URL = API_URL + '/conversations';
export const GET_CONVERSATION_URL = API_URL + '/conversation';
export const ASK_QUERY_URL = API_URL + '/ask';
export const DELETE_CONVERSATION_URL = API_URL + '/conversations/delete';
export const RENAME_CONVERSATION_URL =
    API_URL + '/conversations/rename-conversation';
export const MEMORY_URL = API_URL + '/memories';
