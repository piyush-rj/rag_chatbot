const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
export const API_URL = `${API_BASE}/api/v1`;

export const SIGNIN_URL = API_URL + '/sign-in';
export const GET_CONVERSATIONS_URL = API_URL + '/conversations';
export const GET_CONVERSATION_URL = API_URL + '/conversation';
export const ASK_QUERY_URL = API_URL + '/ask';
export const DELETE_CONVERSATION_URL = API_URL + '/conversations/delete';
export const RENAME_CONVERSATION_URL =
    API_URL + '/conversations/rename-conversation';
export const MEMORY_URL = API_URL + '/memories';

export const DOCUMENTS_URL = API_URL + '/documents';
export const INGEST_DRIVE_URL = DOCUMENTS_URL + '/ingest-drive';
export const UPLOAD_DOCUMENT_URL = API_URL + '/documents/upload';

export const documentFileUrl = (id: string, token: string) =>
    `${DOCUMENTS_URL}/${id}/file?token=${encodeURIComponent(token)}`;
export const conversationDocumentsUrl = (conversationId: string) =>
    `${GET_CONVERSATIONS_URL}/${conversationId}/documents`;
