import z from 'zod';

const delete_chat_schema = z.object({
    conversationId: z.string(),
});

export default delete_chat_schema;
