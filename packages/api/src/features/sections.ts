
import { Hono } from 'hono';
import { section, member } from '@tanavent/shared';
import { createDb, Env } from '../db';
import { firebaseAuth } from '../middleware/auth';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const app = new Hono<{ Bindings: Env }>();

app.use('*', firebaseAuth);

// GET /api/organizations/:orgId/sections
// Get list of sections in the organization
app.get('/:orgId/sections', async (c) => {
    const orgId = c.req.param('orgId');
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);

    // Verify membership
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, orgId),
            eq(member.userId, currentUser.uid)
        )
    });

    if (!membership) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    const sections = await db.query.section.findMany({
        where: eq(section.organizationId, orgId),
    });

    return c.json(sections);
});

// POST /api/organizations/:orgId/sections
// Create a new section
app.post('/:orgId/sections', async (c) => {
    const orgId = c.req.param('orgId');
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);
    const { name } = await c.req.json();

    if (!name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    // Verify membership (Optional: check role 'owner' or 'admin')
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, orgId),
            eq(member.userId, currentUser.uid)
        )
    });

    if (!membership) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    const sectionId = uuidv4();
    const now = new Date();

    try {
        await db.insert(section).values({
            id: sectionId,
            organizationId: orgId,
            name,
        });

        return c.json({ id: sectionId, name }, 201);
    } catch (e: any) {
        console.error('Failed to create section:', e);
        return c.json({ error: 'Failed to create section' }, 500);
    }
});

// PUT /api/organizations/:orgId/sections/:sectionId
// Update a section
app.put('/:orgId/sections/:sectionId', async (c) => {
    const orgId = c.req.param('orgId');
    const sectionId = c.req.param('sectionId');
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);
    const { name } = await c.req.json();

    if (!name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    // Verify membership
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, orgId),
            eq(member.userId, currentUser.uid)
        )
    });

    if (!membership) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    try {
        await db.update(section)
            .set({ name })
            .where(and(
                eq(section.id, sectionId),
                eq(section.organizationId, orgId)
            ));

        return c.json({ id: sectionId, name });
    } catch (e: any) {
        console.error('Failed to update section:', e);
        return c.json({ error: 'Failed to update section' }, 500);
    }
});

// DELETE /api/organizations/:orgId/sections/:sectionId
// Delete a section
app.delete('/:orgId/sections/:sectionId', async (c) => {
    const orgId = c.req.param('orgId');
    const sectionId = c.req.param('sectionId');
    const currentUser = c.get('user');
    const db = createDb(c.env.DB);

    // Verify membership
    const membership = await db.query.member.findFirst({
        where: and(
            eq(member.organizationId, orgId),
            eq(member.userId, currentUser.uid)
        )
    });

    if (!membership) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    try {
        await db.delete(section)
            .where(and(
                eq(section.id, sectionId),
                eq(section.organizationId, orgId)
            ));

        return c.json({ success: true });
    } catch (e: any) {
        console.error('Failed to delete section:', e);
        return c.json({ error: 'Failed to delete section' }, 500);
    }
});

export default app;
