import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof AppError) {
    return c.json({ message: err.message }, err.statusCode as 400);
  }

  if (err instanceof ZodError) {
    return c.json({ message: "Validasi gagal", errors: err.issues.map(i => i.message) }, 400);
  }

  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }

  return c.json({ message: "Server error" }, 500);
};
