
import { Hono } from 'hono';
import { user } from '@tanavent/shared';
import { createDb, Env } from '../db';
import { firebaseAuth } from '../middleware/auth';
import { eq } from 'drizzle-orm';

const app = new Hono<{ Bindings: Env }>();

app.use('*', firebaseAuth);

// POST /api/users
app.post('/', async (c) => {
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
        where: eq(user.id, currentUser.uid),
    });

    if (existingUser) {
        return c.json({ message: 'User already exists' }, 200);
    }

    // Insert new user
    await db.insert(user).values({
        id: currentUser.uid,
        email: currentUser.email,
        displayName: '', // Can be updated later
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return c.json({ message: 'User created successfully' }, 201);
});

// PUT /api/users/me
// Update current user profile
app.put('/me', async (c) => {
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);
    const { displayName } = await c.req.json();

    await db.update(user)
        .set({
            displayName,
            updatedAt: new Date(),
        })
        .where(eq(user.id, currentUser.uid));

    return c.json({ success: true });
});

export default app;
