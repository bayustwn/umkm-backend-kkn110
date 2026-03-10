import { Context } from "hono";
import prisma from "../prisma/prisma";
import { uploadToStorage, deleteFromStorage } from "../utils/storage";

export const uploadNews = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body['image'] as File;
  const title = body['title'] as string;
  const content = body['content'] as string;

  if (!file) {
    return c.json({ message: 'File tidak ada!' }, 400);
  }

  try {
    const imageUrl = await uploadToStorage(file);

    const news = await prisma.news.create({
      data: {
        id: crypto.randomUUID(),
        title,
        content,
        image: imageUrl,
      },
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        created_at: true,
      },
    });

    return c.json({ message: 'Berita berhasil diupload', data: news }, 200);
  } catch (error) {
    return c.json({ message: error instanceof Error ? error.message : 'Server error' }, 500);
  }
}

export const getOtherNews = async (c: Context) => {
  const id = c.req.param("id");

  try {
    const otherNews = await prisma.$queryRaw`
      SELECT * FROM news
      WHERE id != ${id}
      ORDER BY RAND()
      LIMIT 3
    `;

    if (otherNews) {
      return c.json({ message: "Berhasil mendapatkan berita!", data: otherNews }, 200);
    } else {
      return c.json({ message: "Berita tidak ada" }, 404);
    }
  } catch (error) {
    return c.json({ message: "Gagal mendapatkan berita" }, 500);
  }
};

export const getDetailNews = async (c: Context) => {
  const id = c.req.param("id");

  try {
    const news = await prisma.news.findFirst({ where: { id } });

    if (news) {
      return c.json({ message: "Berhasil mendapatkan berita", data: news }, 200);
    } else {
      return c.json({ message: "Berita tidak ditemukan" }, 404);
    }
  } catch (error) {
    return c.json({ message: "Gagal mendapatkan berita" }, 500);
  }
};

export const getPreviewNews = async (c: Context) => {
  try {
    const news = await prisma.news.findMany({ take: 6 });

    if (news.length > 0) {
      return c.json({ message: "Berhasil mendapatkan berita", data: news }, 200);
    } else {
      return c.json({ message: "Tidak ada berita" }, 404);
    }
  } catch (error) {
    return c.json({ message: "Gagal mendapatkan berita" }, 500);
  }
};

export const getAllNews = async (c: Context) => {
  try {
    const news = await prisma.news.findMany({});

    if (news.length > 0) {
      return c.json({ message: "Berhasil mendapatkan berita", data: news }, 200);
    } else {
      return c.json({ message: "Tidak ada berita" }, 404);
    }
  } catch (error) {
    return c.json({ message: "Gagal mendapatkan berita" }, 500);
  }
};

export const deleteNews = async (c: Context) => {
  const id = c.req.param('id');
  try {
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) {
      return c.json({ message: 'Berita tidak ditemukan' }, 404);
    }

    if (news.image) {
      try { await deleteFromStorage(news.image); } catch {}
    }

    await prisma.news.delete({ where: { id } });
    return c.json({ message: 'Berita berhasil dihapus' }, 200);
  } catch (error) {
    return c.json({ message: 'Gagal menghapus berita' }, 500);
  }
}

export const editNews = async (c: Context) => {
  const id = c.req.param('id');
  const body = await c.req.parseBody();
  const title = body['title'] as string;
  const content = body['content'] as string;
  const file = body['image'] as File | undefined;

  try {
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) {
      return c.json({ message: 'Berita tidak ditemukan' }, 404);
    }

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
  } catch (error) {
    return c.json({ message: error instanceof Error ? error.message : 'Gagal mengupdate berita' }, 500);
  }
}
