import { Context } from "hono";
import prisma from "../prisma/prisma";

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
    const news = await prisma.news.findMany();

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
      },
      404
    );
  }
};
