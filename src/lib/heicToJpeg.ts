/**
 * Photo iPhone (HEIC/HEIF) → JPEG, AVANT l'envoi.
 *
 * Pourquoi ici et pas côté serveur : le bucket accepte le HEIC depuis le 17/09, mais un
 * HEIC ne s'affiche **que dans Safari** — sur Chrome et Android, les photos déposées
 * casseraient. Catherine dépose depuis son téléphone, donc la conversion se fait au
 * moment du dépôt, pendant que le navigateur sait encore lire le fichier (Safari décode
 * le HEIC ; Chrome non — d'où le message d'aide en cas d'échec).
 *
 * ⚠️ Si la conversion échoue, on **lève** : l'original ne part JAMAIS au bucket. C'est
 * un garde-fou, pas un confort — depuis que le bucket accepte le HEIC, ce code est le
 * seul filet qui empêche un fichier illisible ailleurs d'être publié.
 */
const estHeic = (file: File) =>
  /^image\/hei[cf]$/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);

export async function toJpegSiHeic(file: File): Promise<File> {
  if (!estHeic(file)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas indisponible');
    ctx.drawImage(bitmap, 0, 0);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    );
    if (!blob) throw new Error('conversion vide');
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg',
    });
  } catch {
    throw new Error(
      'Photo iPhone (HEIC) que ce navigateur ne sait pas convertir. Essaie depuis Safari, ' +
        'ou envoie la photo en JPEG (iPhone : Réglages → Appareil photo → Formats → « Compatible »).',
    );
  }
}
