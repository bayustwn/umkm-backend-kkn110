import { Context } from "hono";
import prisma from "../prisma/prisma";
import { createClient } from "@supabase/supabase-js";
import getRandomBase64ID from "../utils/id";

const supabase = createClient(
  Bun.env.SUPABASE_URL!,
  Bun.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const registerUMKM = async(c: Context) => {
  try {
    const bucket = Bun.env.SUPABASE_BUCKET!;
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

    if (!file) {
      return c.json({ message: 'File gambar UMKM tidak ada!' }, 400);
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
      return c.json({ message: `Upload gambar gagal: ${error.message}` }, 500);
    }
    const { data: dataUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const imageUrl = dataUrl.publicUrl;

    const umkmId = getRandomBase64ID();
    const umkm = await prisma.umkm.create({
      data: {
        id: umkmId,
        name,
        address,
        phone,
        description,
        status,
        image: imageUrl,
        latitude,
        longitude,
        categoryId,
      },
    });

    return c.json({
      message: "UMKM berhasil didaftarkan!",
      data: umkm,
    }, 200);
  } catch (error) {
    console.log(error)
    return c.json({
      message : "Gagal mendaftakan UMKM",
    }, 500)
  }
}



export const getOtherUmkm = async (c: Context) => {
  try {
    const excludedId = c.req.param("id"); 

    const umkm = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id,
        u.name,
        u.address,
        u.phone,
        u.description,
        u.status,
        u.image,
        u.latitude,
        u.longitude,
        c.name AS category,
        COUNT(p.id) AS jumlahProduk
      FROM umkm u
      LEFT JOIN product p ON p.umkmId = u.id
      LEFT JOIN category c ON c.id = u.categoryId
      WHERE u.id != ${excludedId} 
      GROUP BY u.id
      ORDER BY RAND()
      LIMIT 8
    `;

    const result = umkm.map(u => ({
      ...u,
      jumlahProduk: Number(u.jumlahProduk),
    }));

    return c.json({
      message: "Berhasil mendapatkan preview UMKM!",
      data: result,
    }, 200);

  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan preview UMKM: " + error,
      },
      500
    );
  }
};


export const getPreviewUmkm = async (c: Context) => {
  try {
    const umkm = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id,
        u.name,
        u.address,
        u.phone,
        u.description,
        u.status,
        u.image,
        u.latitude,
        u.longitude,
        c.name AS category,
        COUNT(p.id) AS jumlahProduk,
        MIN(p.price) AS hargaTermurah
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

    return c.json({
      message: "Berhasil mendapatkan preview UMKM!",
      data: result,
    }, 200);
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan preview UMKM: " + error,
      },
      500
    );
  }
};


export const getAllUmkm = async (c: Context) => {
  try {
    const umkmList = await prisma.umkm.findMany({
      where: { status: 'active' },
      include: {
        category: true,
        _count: { select: { product: true } },
      },
    });

    const result = await Promise.all(
      umkmList.map(async (umkm) => {
        const minPrice = await prisma.product.aggregate({
          where: { umkmId: umkm.id },
          _min: { price: true },
        });

        return {
          id: umkm.id,
          name: umkm.name,
          image: umkm.image,
          address: umkm.address,
          description: umkm.description,
          jumlahProduk: umkm._count.product,
          category: umkm.category.name,
          hargaTermurah: minPrice._min.price ? Number(minPrice._min.price) : null,
        };
      })
    );

    if (result.length > 0) {
      return c.json(
        {
          message: "Berhasil mendapatkan seluruh data UMKM!",
          data: result,
        },
        200
      );
    } else {
      return c.json(
        {
          message: "Tidak ada data UMKM",
        },
        404
      );
    }
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan data UMKM: " + error,
      },
      500
    );
  }
};

export const getAllUmkmAdmin = async (c: Context) => {
  try {
    const umkmList = await prisma.umkm.findMany({
      include: {
        category: true,
        _count: { select: { product: true } },
      },
    });

    const result = await Promise.all(
      umkmList.map(async (umkm) => {
        const minPrice = await prisma.product.aggregate({
          where: { umkmId: umkm.id },
          _min: { price: true },
        });

        return {
          id: umkm.id,
          name: umkm.name,
          image: umkm.image,
          address: umkm.address,
          description: umkm.description,
          status: umkm.status,
          phone: umkm.phone,
          jumlahProduk: umkm._count.product,
          category: umkm.category.name,
          hargaTermurah: minPrice._min.price ? Number(minPrice._min.price) : null,
        };
      })
    );

    if (result.length > 0) {
      return c.json(
        {
          message: "Berhasil mendapatkan seluruh data UMKM untuk admin!",
          data: result,
        },
        200
      );
    } else {
      return c.json(
        {
          message: "Tidak ada data UMKM",
        },
        404
      );
    }
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan data UMKM: " + error,
      },
      500
    );
  }
};


export const deleteUMKM = async(c: Context) => {
  try {
    const id = c.req.param("id");
    const bucket = Bun.env.SUPABASE_BUCKET!;
    
    // Check if UMKM exists
    const existingUmkm = await prisma.umkm.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!existingUmkm) {
      return c.json({ message: 'UMKM tidak ditemukan!' }, 404);
    }

    // Delete UMKM image from Supabase storage
    if (existingUmkm.image) {
      try {
        const imageUrl = existingUmkm.image;
        const fileName = imageUrl.split('/').pop()?.split('?')[0]; // Extract filename from URL
        
        if (fileName) {
          await supabase.storage
            .from(bucket)
            .remove([fileName]);
        }
      } catch (storageError) {
        console.log('Error deleting UMKM image from storage:', storageError);
        // Continue with deletion even if image deletion fails
      }
    }

    // Delete product images from Supabase storage
    for (const product of existingUmkm.product) {
      if (product.image) {
        try {
          const imageUrl = product.image;
          const fileName = imageUrl.split('/').pop()?.split('?')[0]; // Extract filename from URL
          
          if (fileName) {
            await supabase.storage
              .from(bucket)
              .remove([fileName]);
          }
        } catch (storageError) {
          console.log('Error deleting product image from storage:', storageError);
          // Continue with deletion even if image deletion fails
        }
      }
    }

    // Delete all products associated with this UMKM first
    if (existingUmkm.product.length > 0) {
      await prisma.product.deleteMany({
        where: { umkmId: id }
      });
    }

    // Delete the UMKM
    await prisma.umkm.delete({
      where: { id }
    });

    return c.json({
      message: "UMKM berhasil dihapus!",
    }, 200);
  } catch (error) {
    return c.json({
      message: "Gagal menghapus UMKM",
      error: error instanceof Error ? error.message : error
    }, 500);
  }
}

export const approveUMKM = async(c: Context) => {
  try {
    const id = c.req.param("id");
    
    const umkm = await prisma.umkm.update({
      where: { id },
      data: { status: 'active' },
    });

    return c.json({
      message: "UMKM berhasil disetujui!",
      data: umkm,
    }, 200);
  } catch (error) {
    return c.json({
      message: "Gagal menyetujui UMKM",
      error: error instanceof Error ? error.message : error
    }, 500);
  }
}

export const getAllCategory = async (c: Context) => {
  try {
    const categories = await prisma.category.findMany();
    if (categories.length > 0) {
      return c.json(
        {
          message: "Berhasil mendapatkan seluruh kategori!",
          data: categories,
        },
        200
      );
    } else {
      return c.json(
        {
          message: "Tidak ada kategori",
        },
        404
      );
    }
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan kategori: " + error,
      },
      500
    );
  }
};

export const addCategory = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return c.json({ message: 'Nama kategori tidak boleh kosong!' }, 400);
    }

    const existingCategory = await prisma.category.findFirst({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return c.json({ message: 'Kategori dengan nama tersebut sudah ada!' }, 400);
    }

    const category = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        name: name.trim(),
      },
    });

    return c.json({
      message: "Kategori berhasil ditambahkan!",
      data: category,
    }, 201);
  } catch (error) {
    return c.json({
      message: "Gagal menambahkan kategori",
      error: error instanceof Error ? error.message : error
    }, 500);
  }
};

export const deleteCategory = async (c: Context) => {
  try {
    const id = c.req.param("id");
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: { umkm: true }
    });

    if (!existingCategory) {
      return c.json({ message: 'Kategori tidak ditemukan!' }, 404);
    }

    // Check if category is being used by any UMKM
    if (existingCategory.umkm.length > 0) {
      return c.json({ 
        message: `Kategori "${existingCategory.name}" tidak dapat dihapus karena masih digunakan oleh ${existingCategory.umkm.length} UMKM!` 
      }, 400);
    }

    // Delete the category
    await prisma.category.delete({
      where: { id }
    });

    return c.json({
      message: "Kategori berhasil dihapus!",
    }, 200);
  } catch (error) {
    return c.json({
      message: "Gagal menghapus kategori",
      error: error instanceof Error ? error.message : error
    }, 500);
  }
};

export const getDetailUmkm = async (c: Context) => {
  const id = c.req.param("id");
  try {
    const umkm = await prisma.umkm.findUnique({
      where: { id },
      include : {
        category : {
          select : {
            name: true
          }
        },
        product : true,
      }
    });
    if (umkm) {
      return c.json(
        {
          message: "Berhasil mendapatkan produk untuk UMKM!",
          data: umkm,
        },
        200
      );
    } else {
      return c.json(
        {
          message: "Tidak ada produk untuk UMKM ini",
        },
        404
      );
    }
  } catch (error) {
    return c.json(
      {
        message: "Gagal mendapatkan produk: " + error,
      },
      500
    );
  }
};

export const uploadProduct = async (c: Context) => {
  try {
    const bucket = Bun.env.SUPABASE_BUCKET!;
    const body = await c.req.parseBody();
    const umkmId = body['umkmId'] as string;
    const name = body['name'] as string;
    const description = body['description'] as string | undefined;
    const price = typeof body['price'] === 'string' ? parseFloat(body['price']) : undefined;
    let imageUrl = null;
    if (!umkmId || !name || price === undefined) {
      return c.json({ message: 'umkmId, name, dan price wajib diisi!' }, 400);
    }
    if (body['image'] && body['image'] instanceof File) {
      const file = body['image'] as File;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });
      if (!error) {
        const { data: dataUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
        imageUrl = dataUrl.publicUrl;
      }
    }
    const product = await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description,
        image: imageUrl,
        price,
        umkmId,
      },
    });
    return c.json({
      message: 'Produk berhasil diupload!',
      data: product,
    }, 200);
  } catch (error) {
    return c.json({
      message: 'Gagal upload produk',
      error: error instanceof Error ? error.message : error
    }, 500);
  }
}

export const updateUMKM = async(c: Context) => {
  try {
    const id = c.req.param("id");
    const bucket = Bun.env.SUPABASE_BUCKET!;
    const body = await c.req.parseBody();
    
    // Check if UMKM exists
    const existingUmkm = await prisma.umkm.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!existingUmkm) {
      return c.json({ message: 'UMKM tidak ditemukan!' }, 404);
    }

    const name = body['name'] as string;
    const address = body['address'] as string;
    const phone = body['phone'] as string;
    const description = body['description'] as string;
    const categoryId = body['categoryId'] as string;
    const latitude = body['latitude'] ? parseFloat(body['latitude'] as string) : undefined;
    const longitude = body['longitude'] ? parseFloat(body['longitude'] as string) : undefined;
    const file = body['image'] as File;

    let imageUrl = existingUmkm.image; // Keep existing image if no new one

    // Handle new image upload if provided
    if (file && file instanceof File) {
      // Delete old image from Supabase if exists
      if (existingUmkm.image) {
        try {
          const oldImageUrl = existingUmkm.image;
          const oldFileName = oldImageUrl.split('/').pop()?.split('?')[0];
          
          if (oldFileName) {
            await supabase.storage
              .from(bucket)
              .remove([oldFileName]);
          }
        } catch (storageError) {
          console.log('Error deleting old image from storage:', storageError);
        }
      }

      // Upload new image
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
        return c.json({ message: `Upload gambar gagal: ${error.message}` }, 500);
      }
      
      const { data: dataUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
      imageUrl = dataUrl.publicUrl;
    }

    // Update UMKM
    const updatedUmkm = await prisma.umkm.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        description,
        categoryId,
        latitude,
        longitude,
        image: imageUrl,
      },
    });

    return c.json({
      message: "UMKM berhasil diperbarui!",
      data: updatedUmkm,
    }, 200);
  } catch (error) {
    return c.json({
      message: "Gagal memperbarui UMKM",
      error: error instanceof Error ? error.message : error
    }, 500);
  }
}

export const updateProduct = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const bucket = Bun.env.SUPABASE_BUCKET!;
    const body = await c.req.parseBody();
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return c.json({ message: 'Produk tidak ditemukan!' }, 404);
    }

    const name = body['name'] as string;
    const description = body['description'] as string;
    const price = body['price'] as string;
    const file = body['image'] as File;

    let imageUrl = existingProduct.image; // Keep existing image if no new one

    // Handle new image upload if provided
    if (file && file instanceof File) {
      // Delete old image from Supabase if exists
      if (existingProduct.image) {
        try {
          const oldImageUrl = existingProduct.image;
          const oldFileName = oldImageUrl.split('/').pop()?.split('?')[0];
          
          if (oldFileName) {
            await supabase.storage
              .from(bucket)
              .remove([oldFileName]);
          }
        } catch (storageError) {
          console.log('Error deleting old product image from storage:', storageError);
        }
      }

      // Upload new image
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
        return c.json({ message: `Upload gambar gagal: ${error.message}` }, 500);
      }
      
      const { data: dataUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
      imageUrl = dataUrl.publicUrl;
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        image: imageUrl,
      },
    });

    return c.json({
      message: "Produk berhasil diperbarui!",
      data: updatedProduct,
    }, 200);
  } catch (error) {
    return c.json({
      message: "Gagal memperbarui produk",
      error: error instanceof Error ? error.message : error
    }, 500);
  }
}


