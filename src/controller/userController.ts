import { Context } from "hono";
import prisma from "../prisma/prisma";
import z from "zod";
import { compareSync, hashSync } from "bcrypt-ts";
import { sign } from "hono/jwt";
import { AppError } from "../middleware/errorHandler";

const userSchema = z.object({
  username: z.string(),
  password: z.string().min(5),
});

export const login = async (c: Context) => {
  const body = await c.req.json();
  const { username, password } = await userSchema.parseAsync(body);

  const user = await prisma.user.findFirst({ where: { username } });

  if (!user || !compareSync(password, user.password)) {
    throw new AppError(404, "Username atau password salah!");
  }

  const payload = { id: user.id };
  const token = await sign(payload, `${Bun.env.SECRET_KEY}`, "HS256");

  return c.json({ token, message: "Berhasil login" }, 200);
};

export const getUserInfo = async (c: Context) => {
  const user = await prisma.user.findFirst({
    select: { telp: true, email: true, instagram: true },
  });

  if (!user) throw new AppError(404, "Data admin tidak ditemukan");

  return c.json({
    message: "Berhasil mengambil data admin",
    data: { telp: user.telp, email: user.email, instagram: user.instagram },
  }, 200);
};

export const updateUser = async (c: Context) => {
  const body = await c.req.json();

  const updateSchema = z.object({
    telp: z.string().optional(),
    email: z.string().email().optional(),
    instagram: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(5).optional(),
  });

  const { telp, email, instagram, currentPassword, newPassword } = await updateSchema.parseAsync(body);
  const currentUser = c.get("user");

  if (newPassword && currentPassword) {
    if (!compareSync(currentPassword, currentUser.password)) {
      throw new AppError(400, "Password saat ini salah!");
    }
  }

  const updateData: Record<string, string> = {};
  if (telp !== undefined) updateData.telp = telp;
  if (email !== undefined) updateData.email = email;
  if (instagram !== undefined) updateData.instagram = instagram;
  if (newPassword) updateData.password = hashSync(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: currentUser.id },
    data: updateData,
    select: { id: true, username: true, name: true, telp: true, email: true, instagram: true, updated_at: true },
  });

  return c.json({ message: "Profil berhasil diperbarui!", data: updatedUser }, 200);
};
