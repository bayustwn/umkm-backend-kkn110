import supabase from "./supabase";

const bucket = Bun.env.SUPABASE_BUCKET!;

export async function uploadToStorage(file: File): Promise<string> {
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
    throw new Error(`Upload gagal: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteFromStorage(imageUrl: string): Promise<void> {
  const url = new URL(imageUrl);
  const path = decodeURIComponent(
    url.pathname.replace(`/storage/v1/object/public/${bucket}/`, "")
  );

  await supabase.storage.from(bucket).remove([path]);
}
