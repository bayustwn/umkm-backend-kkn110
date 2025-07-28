import { Context } from "hono";
import prisma from "../prisma/prisma";

export const getDashboard = async (c: Context) => {
  try {
    const [news, newsCount, umkmRaw, umkmCount] = await Promise.all([
      prisma.news.findMany({
        take: 4,
      }),
      prisma.news.count(),
      prisma.umkm.findMany({
        where: {
          status: "active",
        },
        take: 4,
        select: {
          id: true,
          name: true,
          image: true,
          address: true,
          phone: true,
          description: true,
          category: true,
          _count: {
            select: { product: true },
          },
        },
      }),
      prisma.umkm.count({
        where: {
          status: "active",
        },
      }),
    ]);

    const umkmWithPrice = await Promise.all(
      umkmRaw.map(async (u) => {
        const result = await prisma.product.aggregate({
          where: {
            umkmId: u.id,
          },
          _min: {
            price: true,
          },
        });

        return {
          ...u,
          hargaTermurah: result._min.price ? Number(result._min.price) : null,
        };
      })
    );

    return c.json({
      message: "Berhasil mendapatkan dashboard.",
      data: {
        news: {
          items: news,
          total: newsCount,
        },
        umkm: {
          items: umkmWithPrice,
          total: umkmCount,
        },
      },
    });
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan dashboard.",
        error,
      },
      500
    );
  }
};