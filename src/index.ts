import { Hono } from 'hono'
import { serve } from 'bun'
import news from './router/newsRouter'
import { cors } from 'hono/cors'

const app = new Hono()

app.use(cors())

app.get('/', (c) => {
  return c.text("Hello Bayu!, how's your day?")
})

app.route("/news", news)

serve({
  fetch: app.fetch,
  port: 3001,
})

export default app
