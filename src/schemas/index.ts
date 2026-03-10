import { z } from 'zod';
import { sanitize } from '../utils/sanitize';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi').transform(sanitize),
  password: z.string().min(5, 'Password minimal 5 karakter'),
});

export const updateUserSchema = z.object({
  telp: z
    .string()
    .optional()
    .transform((v) => (v ? sanitize(v) : v)),
  email: z.string().email('Format email tidak valid').optional(),
  instagram: z
    .string()
    .optional()
    .transform((v) => (v ? sanitize(v) : v)),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(5, 'Password baru minimal 5 karakter').optional(),
});

export const newsSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').transform(sanitize),
  content: z.string().min(1, 'Konten wajib diisi').transform(sanitize),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Nama kategori tidak boleh kosong')
    .transform((v) => sanitize(v.trim())),
});

export const umkmSchema = z.object({
  name: z.string().min(1, 'Nama UMKM wajib diisi').transform(sanitize),
  address: z.string().min(1, 'Alamat wajib diisi').transform(sanitize),
  phone: z.string().min(1, 'Nomor telepon wajib diisi').transform(sanitize),
  description: z.string().min(1, 'Deskripsi wajib diisi').transform(sanitize),
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
  name: z.string().min(1, 'Nama produk wajib diisi').transform(sanitize),
  description: z
    .string()
    .optional()
    .transform((v) => (v ? sanitize(v) : v)),
  price: z
    .string()
    .min(1, 'Harga wajib diisi')
    .transform((v) => parseFloat(v)),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').transform(sanitize),
  description: z
    .string()
    .optional()
    .transform((v) => (v ? sanitize(v) : v)),
  price: z
    .string()
    .min(1, 'Harga wajib diisi')
    .transform((v) => parseFloat(v)),
});
