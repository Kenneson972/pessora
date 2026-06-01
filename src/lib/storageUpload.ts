import { supabase } from './supabaseClient';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
};

async function verifyMagicBytes(file: File, expectedType: string): Promise<void> {
  const signature = MAGIC_BYTES[expectedType];
  if (!signature) return; // pas de signature connue, on laisse passer
  const bytes = new Uint8Array(await file.slice(0, signature.length).arrayBuffer());
  if (signature.some((b, i) => bytes[i] !== b)) {
    throw new Error(`Type de fichier invalide : ${file.type} ne correspond pas au contenu réel.`);
  }
}

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
  await verifyMagicBytes(file, file.type);
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
