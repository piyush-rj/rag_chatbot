import z from 'zod';

const rename_chat_schema = z.object({
    title: z.string().min(2).max(60),
});

export default rename_chat_schema;
