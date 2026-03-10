import { Hono } from 'hono';
import { serve } from 'bun';
import news from './router/newsRouter';
import umkmRouter from './router/umkmRouter';
import { cors } from 'hono/cors';
import userRouter from './router/userRouter';
import dashboardRouter from './router/dashboardRouter';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app = new Hono();

app.use(cors());
app.use(rateLimiter(100, 60_000)); // 100 requests per minute

app.get('/', (c) => {
  return c.text("Hello Bayu!, how's your day?");
});

app.route('/news', news);
app.route('/umkm', umkmRouter);
app.route('/user', userRouter);
app.route('/dashboard', dashboardRouter);

app.onError(errorHandler);

serve({
  fetch: app.fetch,
  port: 3000,
});

export default app;
