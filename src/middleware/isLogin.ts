import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import prisma from "../prisma/prisma";
import { z } from "zod";

const jwtPayloadSchema = z.object({
    id: z.string(),
});

export const verifyToken = (_admin: boolean) => {
    return async (ctx: Context, next: Next) => {
        const token = ctx.req.header("authorization")?.split(" ")[1];
        if (!token) {
            return ctx.json({ message: "Token tidak valid!" }, 401);
        }

        try {
            const payload = await verify(token, `${Bun.env.SECRET_KEY}`);
            const data = await jwtPayloadSchema.parseAsync(payload);

            const user = await prisma.user.findUnique({
                where: { id: data.id },
            });

            if (!user) {
                return ctx.json({ message: "Token tidak valid!" }, 401);
            }

            ctx.set("user", user);
            await next();
        } catch {
            return ctx.json({ message: "Server Error" }, 500);
        }
    };
};
