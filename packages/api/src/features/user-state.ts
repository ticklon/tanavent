import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { userPreference, user } from '@tanavent/shared';
import { createDb, Env } from '../db';
import { firebaseAuth } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

app.use('*', firebaseAuth);

// GET /api/me/state
app.get('/', async (c) => {
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);

    // Fetch preference
    const preference = await db.query.userPreference.findFirst({
        where: eq(userPreference.userId, currentUser.uid),
    });

    if (!preference) {
        // If no preference found, return defaults (or create one implicitly if we want)
        // Here we return nulls or defaults which the frontend should handle
        return c.json({
            activeOrganizationId: null,
            activeSectionId: null,
            language: 'ja',
            lastViewState: { view: 'dashboard' },
        });
    }

    return c.json(preference);
});

// POST /api/me/state
app.post('/', async (c) => {
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);
    const body = await c.req.json();

    // Upsert preference
    // SQLite (D1) usually supports ON CONFLICT logic via Drizzle
    await db.insert(userPreference)
        .values({
            userId: currentUser.uid,
            language: body.language,
            activeOrganizationId: body.activeOrganizationId,
            activeSectionId: body.activeSectionId,
            lastViewState: body.lastViewState,
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: userPreference.userId,
            set: {
                language: body.language,
                activeOrganizationId: body.activeOrganizationId,
                activeSectionId: body.activeSectionId,
                lastViewState: body.lastViewState,
                updatedAt: new Date(),
            },
        });

    // Check if user exists, if not create stub user (For first time login consistency)
    // In a real app, this happens on a signup trigger, but for lazy init:
    const userExists = await db.query.user.findFirst({
        where: eq(user.id, currentUser.uid),
    });

    if (!userExists) {
        await db.insert(user).values({
            id: currentUser.uid,
            email: currentUser.email,
            displayName: 'New User', // Typically fetched from Firebase User Record
        });
    }

    return c.json({ success: true });
});

export default app;
