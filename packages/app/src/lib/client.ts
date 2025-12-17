import { hc } from 'hono/client';
import type { AppType } from '@tanavent/api/src/index';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * Creates an authenticated API client with the current user's ID token.
 * Use this for all API calls to ensure secure access.
 */
export const getApiClient = async () => {
    const user = auth.currentUser;
    // Wait for auth to be ready if needed, or just get token.
    // If user is null, token will be null, and backend will return 401.
    const token = user ? await user.getIdToken() : null;

    return hc<AppType>(API_URL, {
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
};

// Deprecated: Do not use this static client for authenticated requests.
// Kept temporarily to avoid breaking build before all files are updated.
export const client = hc<AppType>(API_URL, {
    headers: {
        'Authorization': 'Bearer deprecated-client',
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

export const createAuthClient = (token: string) => {
    return hc<AppType>(API_URL, {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
};