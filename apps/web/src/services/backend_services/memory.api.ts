import { MEMORY_URL } from '@/routes/api_routes';
import axios from 'axios';
import authHeader from './api_utils';

export type Memory = {
    id: string;
    fact: string;
    source: string | null;
    createdAt: string;
};

export default class MemoryApi {
    static async list(token: string): Promise<Memory[]> {
        const res = await axios.get(MEMORY_URL, authHeader(token));
        return res.data.data.memories;
    }

    static async remove(token: string, id: string): Promise<void> {
        await axios.delete(`${MEMORY_URL}/${id}`, authHeader(token));
    }
}
