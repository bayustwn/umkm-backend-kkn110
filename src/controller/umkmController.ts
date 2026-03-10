import { Context } from "hono";
import prisma from "../prisma/prisma";
import { uploadToStorage, deleteFromStorage } from "../utils/storage";
import { AppError } from "../middleware/errorHandler";

export const registerUMKM = async (c: Context) => {
  const body = await c.req.parseBody();
  const file = body['image'] as File;
  const name = body['name'] as string;
  const address = body['address'] as string;
  const phone = body['phone'] as string;
  const description = body['description'] as string;
  const status = body['status'] as string | 'pending';
  const latitude = body['latitude'] ? parseFloat(body['latitude'] as string) : undefined;
  const longitude = body['longitude'] ? parseFloat(body['longitude'] as string) : undefined;
  const categoryId = body['categoryId'] as string;

  if (!file) throw new AppError(400, 'File gambar UMKM tidak ada!');

  const imageUrl = await uploadToStorage(file);

  const umkm = await prisma.umkm.create({
    data: { id: crypto.randomUUID(), name, address, phone, description, status, image: imageUrl, latitude, longitude, categoryId },
  });

  return c.json({ message: "UMKM berhasil didaftarkan!", data: umkm }, 200);
}

export const getOtherUmkm = async (c: Context) => {
  const excludedId = c.req.param("id");

  const umkm = await prisma.$queryRaw<{ id: string; name: string; address: string; phone: string; description: string; status: string; image: string; latitude: number; longitude: number; category: string; jumlahProduk: bigint }[]>`
    SELECT u.id, u.name, u.address, u.phone, u.description, u.status, u.image, u.latitude, u.longitude,
      c.name AS category, COUNT(p.id) AS jumlahProduk
    FROM umkm u
    LEFT JOIN product p ON p.umkmId = u.id
    LEFT JOIN category c ON c.id = u.categoryId
    WHERE u.id != ${excludedId}
    GROUP BY u.id
    ORDER BY RAND()
    LIMIT 8
  `;

  const result = umkm.map(u => ({ ...u, jumlahProduk: Number(u.jumlahProduk) }));
  return c.json({ message: "Berhasil mendapatkan preview UMKM!", data: result }, 200);
};

export const getPreviewUmkm = async (c: Context) => {
  const umkm = await prisma.$queryRaw<{ id: string; name: string; address: string; phone: string; description: string; status: string; image: string; latitude: number; longitude: number; category: string; jumlahProduk: bigint; hargaTermurah: number | null }[]>`
    SELECT u.id, u.name, u.address, u.phone, u.description, u.status, u.image, u.latitude, u.longitude,
      c.name AS category, COUNT(p.id) AS jumlahProduk, MIN(p.price) AS hargaTermurah
    FROM umkm u
    LEFT JOIN product p ON p.umkmId = u.id
    LEFT JOIN category c ON c.id = u.categoryId
    GROUP BY u.id
    ORDER BY RAND()
    LIMIT 4
  `;

  const result = umkm.map(u => ({
    ...u,
    jumlahProduk: Number(u.jumlahProduk),
    hargaTermurah: u.hargaTermurah !== null ? Number(u.hargaTermurah) : null,
  }));

  return c.json({ message: "Berhasil mendapatkan preview UMKM!", data: result }, 200);
};

export const getAllUmkm = async (c: Context) => {
  const umkmList = await prisma.umkm.findMany({
    where: { status: 'active' },
    include: { category: true, _count: { select: { product: true } } },
  });

  const result = await Promise.all(
    umkmList.map(async (umkm) => {
      const minPrice = await prisma.product.aggregate({
        where: { umkmId: umkm.id },
        _min: { price: true },
      });
      return {
        id: umkm.id, name: umkm.name, image: umkm.image, address: umkm.address,
        description: umkm.description, jumlahProduk: umkm._count.product,
        category: umkm.category.name,
        hargaTermurah: minPrice._min.price ? Number(minPrice._min.price) : null,
      };
    })
  );

  return c.json({ message: "Berhasil mendapatkan seluruh data UMKM!", data: result }, 200);
};

export const getAllUmkmAdmin = async (c: Context) => {
  const umkmList = await prisma.umkm.findMany({
    include: { category: true, _count: { select: { product: true } } },
  });

  const result = await Promise.all(
    umkmList.map(async (umkm) => {
      const minPrice = await prisma.product.aggregate({
        where: { umkmId: umkm.id },
        _min: { price: true },
      });
      return {
        id: umkm.id, name: umkm.name, image: umkm.image, address: umkm.address,
        description: umkm.description, status: umkm.status, phone: umkm.phone,
        jumlahProduk: umkm._count.product, category: umkm.category.name,
        hargaTermurah: minPrice._min.price ? Number(minPrice._min.price) : null,
      };
    })
  );

  return c.json({ message: "Berhasil mendapatkan seluruh data UMKM untuk admin!", data: result }, 200);
};

export const deleteUMKM = async (c: Context) => {
  const id = c.req.param("id");

  const existingUmkm = await prisma.umkm.findUnique({
    where: { id },
    include: { product: true }
  });

  if (!existingUmkm) throw new AppError(404, 'UMKM tidak ditemukan!');

  if (existingUmkm.image) {
    try { await deleteFromStorage(existingUmkm.image); } catch {}
  }

  for (const product of existingUmkm.product) {
    if (product.image) {
      try { await deleteFromStorage(product.image); } catch {}
    }
  }

  if (existingUmkm.product.length > 0) {
    await prisma.product.deleteMany({ where: { umkmId: id } });
  }

  await prisma.umkm.delete({ where: { id } });
  return c.json({ message: "UMKM berhasil dihapus!" }, 200);
}

export const approveUMKM = async (c: Context) => {
  const id = c.req.param("id");

  const umkm = await prisma.umkm.update({
    where: { id },
    data: { status: 'active' },
  });

  return c.json({ message: "UMKM berhasil disetujui!", data: umkm }, 200);
}

export const getAllCategory = async (c: Context) => {
  const categories = await prisma.category.findMany();
  return c.json({ message: "Berhasil mendapatkan seluruh kategori!", data: categories }, 200);
};

export const addCategory = async (c: Context) => {
  const body = await c.req.json();
  const { name } = body;

  if (!name || name.trim() === '') throw new AppError(400, 'Nama kategori tidak boleh kosong!');

  const existingCategory = await prisma.category.findFirst({ where: { name: name.trim() } });
  if (existingCategory) throw new AppError(400, 'Kategori dengan nama tersebut sudah ada!');

  const category = await prisma.category.create({
    data: { id: crypto.randomUUID(), name: name.trim() },
  });

  return c.json({ message: "Kategori berhasil ditambahkan!", data: category }, 201);
};

export const deleteCategory = async (c: Context) => {
  const id = c.req.param("id");

  const existingCategory = await prisma.category.findUnique({
    where: { id },
    include: { umkm: true }
  });

  if (!existingCategory) throw new AppError(404, 'Kategori tidak ditemukan!');

  if (existingCategory.umkm.length > 0) {
    throw new AppError(400, `Kategori "${existingCategory.name}" tidak dapat dihapus karena masih digunakan oleh ${existingCategory.umkm.length} UMKM!`);
  }

  await prisma.category.delete({ where: { id } });
  return c.json({ message: "Kategori berhasil dihapus!" }, 200);
};

export const getDetailUmkm = async (c: Context) => {
  const id = c.req.param("id");

  const umkm = await prisma.umkm.findUnique({
    where: { id },
    include: { category: { select: { name: true } }, product: true },
  });

  if (!umkm) throw new AppError(404, "UMKM tidak ditemukan");

  return c.json({ message: "Berhasil mendapatkan produk untuk UMKM!", data: umkm }, 200);
};

export const uploadProduct = async (c: Context) => {
  const body = await c.req.parseBody();
  const umkmId = body['umkmId'] as string;
  const name = body['name'] as string;
  const description = body['description'] as string | undefined;
  const price = typeof body['price'] === 'string' ? parseFloat(body['price']) : undefined;

  if (!umkmId || !name || price === undefined) {
    throw new AppError(400, 'umkmId, name, dan price wajib diisi!');
  }

  let imageUrl = null;
  if (body['image'] && body['image'] instanceof File) {
    imageUrl = await uploadToStorage(body['image'] as File);
  }

  const product = await prisma.product.create({
    data: { id: crypto.randomUUID(), name, description, image: imageUrl, price, umkmId },
  });

  return c.json({ message: 'Produk berhasil diupload!', data: product }, 200);
}

export const updateUMKM = async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody();

  const existingUmkm = await prisma.umkm.findUnique({ where: { id }, include: { product: true } });
  if (!existingUmkm) throw new AppError(404, 'UMKM tidak ditemukan!');

  const name = body['name'] as string;
  const address = body['address'] as string;
  const phone = body['phone'] as string;
  const description = body['description'] as string;
  const categoryId = body['categoryId'] as string;
  const latitude = body['latitude'] ? parseFloat(body['latitude'] as string) : undefined;
  const longitude = body['longitude'] ? parseFloat(body['longitude'] as string) : undefined;
  const file = body['image'] as File;

  let imageUrl = existingUmkm.image;

  if (file && file instanceof File) {
    if (existingUmkm.image) {
      try { await deleteFromStorage(existingUmkm.image); } catch {}
    }
    imageUrl = await uploadToStorage(file);
  }

  const updatedUmkm = await prisma.umkm.update({
    where: { id },
    data: { name, address, phone, description, categoryId, latitude, longitude, image: imageUrl },
  });

  return c.json({ message: "UMKM berhasil diperbarui!", data: updatedUmkm }, 200);
}

export const updateProduct = async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody();

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) throw new AppError(404, 'Produk tidak ditemukan!');

  const name = body['name'] as string;
  const description = body['description'] as string;
  const price = body['price'] as string;
  const file = body['image'] as File;

  let imageUrl = existingProduct.image;

  if (file && file instanceof File) {
    if (existingProduct.image) {
      try { await deleteFromStorage(existingProduct.image); } catch {}
    }
    imageUrl = await uploadToStorage(file);
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: { name, description, price: parseFloat(price), image: imageUrl },
  });

  return c.json({ message: "Produk berhasil diperbarui!", data: updatedProduct }, 200);
}
