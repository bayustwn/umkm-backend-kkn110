import { Context } from "hono";
import prisma from "../prisma/prisma";
import { uploadToStorage, deleteFromStorage } from "../utils/storage";
import { AppError } from "../middleware/errorHandler";

export const uploadNews = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body['image'] as File;
  const title = body['title'] as string;
  const content = body['content'] as string;

  if (!file) throw new AppError(400, 'File tidak ada!');

  const imageUrl = await uploadToStorage(file);

  const news = await prisma.news.create({
    data: { id: crypto.randomUUID(), title, content, image: imageUrl },
    select: { id: true, title: true, content: true, image: true, created_at: true },
  });

  return c.json({ message: 'Berita berhasil diupload', data: news }, 200);
}

export const getOtherNews = async (c: Context) => {
  const id = c.req.param("id");

  const otherNews = await prisma.$queryRaw`
    SELECT * FROM news WHERE id != ${id} ORDER BY RAND() LIMIT 3
  `;

  return c.json({ message: "Berhasil mendapatkan berita!", data: otherNews }, 200);
};

export const getDetailNews = async (c: Context) => {
  const id = c.req.param("id");
  const news = await prisma.news.findFirst({ where: { id } });

  if (!news) throw new AppError(404, "Berita tidak ditemukan");

  return c.json({ message: "Berhasil mendapatkan berita", data: news }, 200);
};

export const getPreviewNews = async (c: Context) => {
  const news = await prisma.news.findMany({ take: 6 });

  return c.json({ message: "Berhasil mendapatkan berita", data: news }, 200);
};

export const getAllNews = async (c: Context) => {
  const news = await prisma.news.findMany({});

  return c.json({ message: "Berhasil mendapatkan berita", data: news }, 200);
};

export const deleteNews = async (c: Context) => {
  const id = c.req.param('id');
  const news = await prisma.news.findUnique({ where: { id } });

  if (!news) throw new AppError(404, 'Berita tidak ditemukan');

  if (news.image) {
    try { await deleteFromStorage(news.image); } catch {}
  }

  await prisma.news.delete({ where: { id } });
  return c.json({ message: 'Berita berhasil dihapus' }, 200);
}

export const editNews = async (c: Context) => {
  const id = c.req.param('id');
  const body = await c.req.parseBody();
  const title = body['title'] as string;
  const content = body['content'] as string;
  const file = body['image'] as File | undefined;

  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) throw new AppError(404, 'Berita tidak ditemukan');

  let imageUrl = news.image;
  if (file) {
    if (news.image) {
      try { await deleteFromStorage(news.image); } catch {}
    }
    imageUrl = await uploadToStorage(file);
  }

  const updated = await prisma.news.update({
    where: { id },
    data: { title, content, image: imageUrl },
    select: { id: true, title: true, content: true, image: true, created_at: true },
  });

  return c.json({ message: 'Berita berhasil diupdate', data: updated }, 200);
}
