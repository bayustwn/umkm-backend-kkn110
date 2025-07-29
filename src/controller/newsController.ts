import { Context } from "hono";
import prisma from "../prisma/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Bun.env.SUPABASE_URL!,
  Bun.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const uploadNews = async (c: Context) => {
  const bucket = Bun.env.SUPABASE_BUCKET!;
  const body = await c.req.parseBody();
  const file = body['image'] as File;
  const title = body['title'] as string;
  const content = body['content'] as string;

  if (!file) {
    return c.json({ message: 'File tidak ada!' }, 400);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${crypto.randomUUID()}-${file.name}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return c.json({ message: `Upload gagal: ${error.message}` }, 500);
    }

    const { data: dataUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    const news = await prisma.news.create({
      data: {
        id: crypto.randomUUID(),
        title,
        content,
        image: dataUrl.publicUrl,
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
    console.log(error);
    return c.json({ message: 'Server error', error }, 500);
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
      return c.json(
        {
          message: "Berhasil mendapatkan berita!",
          data: otherNews,
        },
        200
      );
    } else {
      return c.json(
        {
          message: "Berita tidak ada",
        },
        404
      );
    }
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan berita " + error,
      },
      404
    );
  }
};

export const getDetailNews = async (c: Context) => {
  const id = c.req.param("id");

  try {
    const news = await prisma.news.findFirst({
      where: {
        id: id,
      },
    });

    if (news) {
      return c.json(
        {
          message: "Berhasil mendapatkan berita",
          data: news,
        },
        200
      );
    } else {
      return c.json(
        {
          message: "Berita tidak ditemukan",
        },
        404
      );
    }
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan berita",
      },
      404
    );
  }
};

export const getPreviewNews = async (c: Context) => {
  try {
    const news = await prisma.news.findMany({});

    if (news.length > 0) {
      return c.json(
        {
          message: "Berhasil mendapatkan berita",
          data: news.slice(0, 6),
        },
        200
      );
    } else {
      return c.json(
        {
          message: "Tidak ada berita",
        },
        404
      );
    }
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan berita",
      },
      404
    );
  }
};

export const getAllNews = async (c: Context) => {
  try {
    const news = await prisma.news.findMany({});

    if (news.length > 0) {
      return c.json(
        {
          message: "Berhasil mendapatkan berita",
          data: news,
        },
        200
      );
    } else {
      return c.json(
        {
          message: "Tidak ada berita",
        },
        404
      );
    }
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan berita",
        error : error
      },
      404
    );
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

      const url = new URL(news.image);
      const path = decodeURIComponent(url.pathname.replace(`/storage/v1/object/public/${Bun.env.SUPABASE_BUCKET}/`, ''));
      const { error } = await supabase.storage.from(Bun.env.SUPABASE_BUCKET!).remove([path]);
      if (error) {
        return c.json({ message: 'Gagal menghapus gambar di storage', error }, 500);
      }
    }

    await prisma.news.delete({ where: { id } });
    return c.json({ message: 'Berita berhasil dihapus' }, 200);
  } catch (error) {
    return c.json({ message: 'Gagal menghapus berita', error }, 500);
  }
}

export const editNews = async (c: Context) => {
  const id = c.req.param('id');
  const bucket = Bun.env.SUPABASE_BUCKET!;
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
        const url = new URL(news.image);
        const path = decodeURIComponent(url.pathname.replace(`/storage/v1/object/public/${bucket}/`, ''));
        await supabase.storage.from(bucket).remove([path]);
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });
      if (error) {
        return c.json({ message: `Upload gagal: ${error.message}` }, 500);
      }
      const { data: dataUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
      imageUrl = dataUrl.publicUrl;
    }

    const updated = await prisma.news.update({
      where: { id },
      data: {
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
    return c.json({ message: 'Berita berhasil diupdate', data: updated }, 200);
  } catch (error) {
    return c.json({ message: 'Gagal mengupdate berita', error }, 500);
  }
}
