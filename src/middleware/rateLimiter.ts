import type { Context, Next } from 'hono';

const store = new Map<string, { count: number; resetTime: number }>();

setInterval(
  () => {
    const now = Date.now();
    store.forEach((record, ip) => {
      if (now > record.resetTime) {
        store.delete(ip);
      }
    });
  },
  5 * 60 * 1000,
);

export const rateLimiter = (maxRequests = 60, windowMs = 60_000) => {
  return async (c: Context, next: Next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown';

    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      await next();
      return;
    }

    if (record.count >= maxRequests) {
      return c.json({ message: 'Terlalu banyak permintaan, coba lagi nanti.' }, 429);
    }

    record.count++;
    await next();
  };
};
