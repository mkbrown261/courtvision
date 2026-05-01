import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import apiRoutes from './routes/api'
import { getHTML } from './ui'

const app = new Hono()

app.use('*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// Mount API
app.route('/api', apiRoutes)

// SPA catch-all
app.get('*', (c) => c.html(getHTML()))

export default app
