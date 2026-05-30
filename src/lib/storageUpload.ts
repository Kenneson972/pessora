import { supabase } from './supabaseClient';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'image';
}

export async function uploadPublicImage(
  bucket: 'product-images' | 'event-images' | 'carousel-images' | 'split-gammes-images',
  file: File,
  pathPrefix: string
): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Format accepté : JPEG, PNG, WebP, GIF.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Fichier trop volumineux (max 5 Mo).');
  }
  const path = `${pathPrefix.replace(/\/$/, '')}/${Date.now()}-${safeFileName(file.name)}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  const { data: pub } = db.storage.from(bucket).getPublicUrl(data.path);
  return pub.publicUrl as string;
}

export async function uploadHomeBannerImage(file: File): Promise<string> {
  return uploadPublicImage('carousel-images', file, 'home-banner');
}
