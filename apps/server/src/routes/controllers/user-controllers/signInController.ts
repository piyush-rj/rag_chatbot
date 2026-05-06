import { prisma } from 'database';
import type { Request, Response } from 'express';
import ResponseWriter from '../../../class/response_writer';
import jwt from 'jsonwebtoken';

interface SignInBody {
    user?: {
        email?: string;
        name?: string;
        image?: string | null;
    };
}

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
    throw new Error('JWT_SECRET not found in env');
}
const JWT_SECRET: string = rawSecret;

export default async function signInController(req: Request, res: Response) {
    const { user } = req.body as SignInBody;

    if (!user?.email || !user?.name) {
        ResponseWriter.badRequest(res, 'email and name are required');
        return;
    }

    try {
        const myUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
                name: user.name,
                image: user.image ?? null,
            },
            create: {
                email: user.email,
                name: user.name,
                image: user.image ?? null,
            },
        });

        const jwtPayload = {
            id: myUser.id,
            name: myUser.name,
            email: myUser.email,
            image: myUser.image,
        };

        const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '7d' });

        ResponseWriter.ok(res, { user: myUser, token: token });
        return;
    } catch (error) {
        console.error('signInController failed:', error);
        ResponseWriter.serverError(res, 'Failed to sign in');
        return;
    }
}
