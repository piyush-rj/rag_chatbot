import type { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import ResponseWriter from '../services/responses/response_writer';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
    throw new Error('JWT_SECRET not found in env');
}
const JWT_SECRET: string = rawSecret;

export default function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const authHeader = req.headers.authorization;
    const queryToken =
        typeof req.query.token === 'string' ? req.query.token : null;

    let accessToken: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.split(' ')[1] ?? null;
    } else if (queryToken) {
        // Allow ?token=<jwt> for endpoints opened directly by the browser
        // (e.g. PDF file links) where setting an Authorization header isn't
        // possible. Header form is preferred everywhere else.
        accessToken = queryToken;
    }

    if (!accessToken) {
        ResponseWriter.unauthorized(res, 'Missing bearer token');
        return;
    }

    try {
        const decoded = jwt.verify(accessToken, JWT_SECRET);

        if (typeof decoded === 'string') {
            ResponseWriter.unauthorized(res, 'Malformed token payload');
            return;
        }

        if (
            typeof decoded.id !== 'string' ||
            typeof decoded.email !== 'string' ||
            typeof decoded.name !== 'string'
        ) {
            ResponseWriter.unauthorized(res, 'Malformed token payload');
            return;
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            image: typeof decoded.image === 'string' ? decoded.image : null,
        };

        return next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return ResponseWriter.unauthorized(res, 'Token expired');
        }
        if (error instanceof JsonWebTokenError) {
            return ResponseWriter.unauthorized(res, 'Invalid token');
        }
        console.error('error in auth middleware:', error);
        return ResponseWriter.serverError(res);
    }
}
