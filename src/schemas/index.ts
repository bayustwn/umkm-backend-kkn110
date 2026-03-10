import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(5, 'Password minimal 5 karakter'),
});

export const updateUserSchema = z.object({
  telp: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional(),
  instagram: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(5, 'Password baru minimal 5 karakter').optional(),
});

export const newsSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  content: z.string().min(1, 'Konten wajib diisi'),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Nama kategori tidak boleh kosong')
    .transform((v) => v.trim()),
});

export const umkmSchema = z.object({
  name: z.string().min(1, 'Nama UMKM wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  status: z.string().default('pending'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  latitude: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
  longitude: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined)),
});

export const productSchema = z.object({
  umkmId: z.string().min(1, 'umkmId wajib diisi'),
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, 'Harga wajib diisi')
    .transform((v) => parseFloat(v)),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, 'Harga wajib diisi')
    .transform((v) => parseFloat(v)),
});
