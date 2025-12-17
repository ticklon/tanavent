
import { Hono } from 'hono';
import { user, organization, member } from '@tanavent/shared';
import { createDb, Env } from '../db';
import { firebaseAuth } from '../middleware/auth';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const app = new Hono<{ Bindings: Env }>();

app.use('*', firebaseAuth);

// GET /api/organizations
// Get list of organizations the user belongs to
app.get('/', async (c) => {
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);

    const members = await db.query.member.findMany({
        where: eq(member.userId, currentUser.uid),
        with: {
            organization: true,
        },
    });

    // Extract organizations from membership
    const organizations = members.map(m => m.organization).filter(Boolean);

    return c.json(organizations);
});

// POST /api/organizations
// Create a new organization
app.post('/', async (c) => {
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);
    const { name } = await c.req.json();

    if (!name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    const orgId = uuidv4();
    const now = new Date();

    // Transaction to create org and add user as owner
    // Note: D1 doesn't support massive transactions perfectly but batch() helps, 
    // or just await sequentially for MVP as consistency is less critical here than banking.
    // Drizzle's db.batch is good.

    try {
        await db.batch([
            db.insert(organization).values({
                id: orgId,
                name,
                createdAt: now,
                plan: 'free',
            }),
            db.insert(member).values({
                id: uuidv4(),
                organizationId: orgId,
                userId: currentUser.uid,
                role: 'owner',
                joinedAt: now,
            })
        ]);

        // NO default section created as per user request.

        return c.json({ id: orgId, name }, 201);
    } catch (e: any) {
        console.error('Failed to create organization:', e);
        return c.json({ error: 'Failed to create organization' }, 500);
    }
});

export default app;
