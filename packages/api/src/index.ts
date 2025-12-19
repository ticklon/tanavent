import { Hono } from 'hono'
import { cors } from 'hono/cors'
import inventory from './features/inventory'
import users from './features/users'
import organizations from './features/organizations'
import sections from './features/sections'
import { Env } from './db'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/', (c) => {
    return c.text('Tanavent API is running!')
})

app.route('/api/inventory', inventory)
app.route('/api/users', users)
app.route('/api/organizations', organizations)
app.route('/api/organizations', sections) // Mounts at /api/organizations/:orgId/sections

export default app
export type AppType = typeof app
