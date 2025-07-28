import { Context } from "hono";
import prisma from "../prisma/prisma";
import z from "zod";
import { compareSync, hashSync } from "bcrypt-ts";
import { sign } from "hono/jwt";

const userSchema = z.object({
  username: z.string(),
  password: z.string().min(5),
});

export const login = async (c: Context) => {
  try {
    const body = await c.req.json(); 
    const { username, password } = await userSchema.parseAsync(body);

    const user = await prisma.user.findFirst({
      where: { username },
    });

    if (!user || !compareSync(password, user.password)) {
      return c.json({ message: "Username atau password salah!" }, 404);
    }

    const payload = { id: user.id };
    const token = await sign(payload, `${Bun.env.SECRET_KEY}`, "HS256");

    return c.json({
      token,
      message: "Berhasil login",
    }, 200);
    
  } catch (error) {
    console.error(error);
    return c.json({
      message: "Gagal Login",
    }, 500);
  }
};

export const getUserInfo = async (c: Context) => {
  try {
    const user = await prisma.user.findFirst({
      select: {
        telp: true,
        email: true,
        instagram: true,
      },
    });

    if (!user) {
      return c.json({ 
        message: "Data admin tidak ditemukan",
        data: {
          telp: "085156203867",
          email: "manukan.wetan@gmail.com", 
          instagram: "manukan_wetan"
        }
      }, 404);
    }

    return c.json({
      message: "Berhasil mengambil data admin",
      data: {
        telp: user.telp ,
        email: user.email ,
        instagram: user.instagram
      }
    }, 200);
    
  } catch (error) {
    console.error(error);
    return c.json({
      message: "Gagal mengambil data admin",
      data: {
        telp: "085156203867",
        email: "manukan.wetan@gmail.com",
        instagram: "manukan_wetan"
      }
    }, 500);
  }
};

export const updateUser = async (c: Context) => {
  try {
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
        return c.json({ message: "Password saat ini salah!" }, 400);
      }
    }

    const updateData: any = {};
    if (telp !== undefined) updateData.telp = telp;
    if (email !== undefined) updateData.email = email;
    if (instagram !== undefined) updateData.instagram = instagram;
    if (newPassword) updateData.password = hashSync(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        telp: true,
        email: true,
        instagram: true,
        updated_at: true,
      },
    });

    return c.json({
      message: "Profil berhasil diperbarui!",
      data: updatedUser,
    }, 200);
    
  } catch (error) {
    console.error(error);
    return c.json({
      message: "Gagal memperbarui profil",
    }, 500);
  }
};
