import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@tanavent/shared';

export type Env = {
    DB: D1Database;
    FIREBASE_PROJECT_ID: string;
};

export const createDb = (d1: D1Database) => {
    return drizzle(d1, { schema });
};
