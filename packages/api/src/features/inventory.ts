import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { item, member, section } from '@tanavent/shared';
import { createDb, Env } from '../db';
import { firebaseAuth } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

app.use('*', firebaseAuth);

// GET /api/inventory
// Query: ?sectionId=...
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    const sectionId = c.req.query('sectionId');
    const user = c.get('user');

    if (!sectionId) {
        return c.json({ error: 'sectionId is required' }, 400);
    }

    // 1. Verify Section exists
    const targetSection = await db.query.section.findFirst({
        where: eq(section.id, sectionId),
    });

    if (!targetSection) {
        return c.json({ error: 'Section not found' }, 404);
    }

    // 2. Verify Membership in the Organization of the Section
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, targetSection.organizationId),
            eq(member.userId, user.uid)
        )
    });

    if (!membership) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    // 3. Fetch Items
    const items = await db.query.item.findMany({
        where: eq(item.sectionId, sectionId),
    });

    return c.json({ items });
});

// GET /api/inventory/:id
app.get('/:id', async (c) => {
    const db = createDb(c.env.DB);
    const id = c.req.param('id');
    const user = c.get('user');

    const foundItem = await db.query.item.findFirst({
        where: eq(item.id, id),
    });

    if (!foundItem) {
        return c.json({ error: 'Item not found' }, 404);
    }

    // Verify Ownership via Organization Membership
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, foundItem.organizationId),
            eq(member.userId, user.uid)
        )
    });

    if (!membership) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json(foundItem);
});

// POST /api/inventory
app.post('/', async (c) => {
    const db = createDb(c.env.DB);
    const body = await c.req.json();
    const user = c.get('user');

    // Validation (simple)
    if (!body.name || !body.organizationId || !body.sectionId) {
        return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify Section Validity (belongs to Org)
    const targetSection = await db.query.section.findFirst({
        where: and(
            eq(section.id, body.sectionId),
            eq(section.organizationId, body.organizationId)
        )
    });

    if (!targetSection) {
        return c.json({ error: 'Invalid section for organization' }, 400);
    }

    // Verify Membership
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, body.organizationId),
            eq(member.userId, user.uid)
        )
    });

    if (!membership) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    const newItem = {
        id: crypto.randomUUID(),
        organizationId: body.organizationId,
        sectionId: body.sectionId,
        name: body.name,
        vintage: body.vintage || null,
        quantity: body.quantity || 0,
        unit: body.unit || 'pc',
        updatedAt: new Date(),
    };

    await db.insert(item).values(newItem);

    return c.json(newItem);
});

// PUT /api/inventory/:id
app.put('/:id', async (c) => {
    const db = createDb(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();
    const user = c.get('user');

    const foundItem = await db.query.item.findFirst({
        where: eq(item.id, id),
    });

    if (!foundItem) {
        return c.json({ error: 'Item not found' }, 404);
    }

    // Verify Membership
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, foundItem.organizationId),
            eq(member.userId, user.uid)
        )
    });

    if (!membership) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    await db.update(item)
        .set({
            name: body.name,
            vintage: body.vintage,
            quantity: body.quantity,
            unit: body.unit,
            updatedAt: new Date(),
        })
        .where(eq(item.id, id));

    return c.json({ success: true, id });
});

// DELETE /api/inventory/:id
app.delete('/:id', async (c) => {
    const db = createDb(c.env.DB);
    const id = c.req.param('id');
    const user = c.get('user');

    const foundItem = await db.query.item.findFirst({
        where: eq(item.id, id),
    });

    if (!foundItem) {
        return c.json({ error: 'Item not found' }, 404);
    }

    // Verify Membership
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, foundItem.organizationId),
            eq(member.userId, user.uid)
        )
    });

    if (!membership) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    const result = await db.delete(item).where(eq(item.id, id)).returning({ id: item.id });

    return c.json({ success: true, id });
});

export default app;