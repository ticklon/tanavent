import { createMiddleware } from 'hono/factory';
// import { getAuth } from 'firebase-admin/auth';
import { Env } from '../db';

// Note: In a real Cloudflare Worker environment, 'firebase-admin' might calculate signature differently or need Node.js compatibility flags.
// For this v3 implementation, we will assume we are receiving a valid Bearer token.
// We will stub the validation for local dev or use a simplified JWT verify if needed.
// For production, consider using 'cloudflare-worker-jwt' to verify Firebase ID tokens against Google's public keys.

import { jwtVerify, createRemoteJWKSet } from 'jose';

// Fetch JWKS from Google
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export const firebaseAuth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        if (!c.env.FIREBASE_PROJECT_ID) {
            console.error('FIREBASE_PROJECT_ID is not configured');
            return c.json({ error: 'Internal Server Error' }, 500);
        }

        // Verify token signature and expiration
        // Added strict Audience/Issuer checks
        const { payload } = await jwtVerify(token, JWKS, {
            algorithms: ['RS256'],
            audience: c.env.FIREBASE_PROJECT_ID,
            issuer: `https://securetoken.google.com/${c.env.FIREBASE_PROJECT_ID}`
        });

        const uid = payload.sub;
        const email = payload.email as string;

        if (!uid || !email) {
            throw new Error('Invalid payload');
        }

        c.set('user', { uid, email });
        await next();
    } catch (e) {
        console.error('Auth Error:', e);
        return c.json({ error: 'Unauthorized' }, 401);
    }
});

// Type augmentation
declare module 'hono' {
    interface ContextVariableMap {
        user: {
            uid: string;
            email: string;
        }
    }
}