import { useState, useEffect, useCallback } from 'react';
import { Button, Input, TextArea } from '@heroui/react';
import { Upload, Check, Loader2 } from 'lucide-react';
import { uploadHomeBannerImage } from '../../lib/storageUpload';
import { useHomeBanner, updateHomeBanner } from '../../hooks/useHomeBanner';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { DashEyebrow } from '../../components/dashboard/primitives';

const inputBase =
  'w-full bg-white border border-noir/[0.09] rounded-[2px] px-3.5 py-3 text-base sm:text-[13px] text-noir placeholder:text-black/30 focus-visible:outline-none focus-visible:border-sapin/50 focus-visible:ring-2 focus-visible:ring-sapin/20 transition-colors';
const labelBase = 'block text-[9px] font-medium uppercase tracking-[0.22em] text-black/45 mb-1.5';

const AdminHomeBanner = () => {
  useEffect(() => { document.title = 'Bannière — Admin PessÓra'; }, []);
  const { data, loading, refetch } = useHomeBanner();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setSubtitle(data.subtitle);
      setImageUrl(data.image_url ?? '');
    }
  }, [data]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateHomeBanner({ title: title.trim(), subtitle: subtitle.trim(), image_url: imageUrl || null });
      setSavedAt(Date.now());
      refetch();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }, [title, subtitle, imageUrl, refetch]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadHomeBannerImage(file);
      setImageUrl(url);
    } catch {
      setSaveError('Erreur lors de l\'upload de l\'image.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p className="text-[11px] text-black/30 px-5 py-4">Chargement…</p>;

  return (
    <div className="max-w-2xl">
      {saveError && <AdminErrorAlert message={saveError} />}
      {savedAt && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-[2px] border border-sapin-muted bg-sapin-subtle px-3 py-2 text-[11px] text-sapin">
          <Check size={14} /> Bannière enregistrée.
        </div>
      )}

      <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6 mb-6">
        <DashEyebrow className="mb-4">Texte</DashEyebrow>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelBase}>Titre</label>
            <Input
              className={inputBase}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Un concentré de bien-être au naturel"
            />
          </div>
          <div>
            <label className={labelBase}>Sous-titre (optionnel)</label>
            <TextArea
              className={`${inputBase} min-h-[72px] resize-y`}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Une phrase d'accroche…"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[2px] border border-noir/[0.06] bg-white p-5 sm:p-6 mb-6">
        <DashEyebrow className="mb-4">Image</DashEyebrow>
        {imageUrl && (
          <img src={imageUrl} alt="Aperçu bannière" className="w-full aspect-[4/3] object-cover rounded-[2px] mb-4 border border-noir/[0.06]" />
        )}
        <label className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-noir/15 px-4 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 hover:border-noir/30 hover:text-noir transition-colors cursor-pointer">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Envoi…' : imageUrl ? 'Changer l\'image' : 'Ajouter une image'}
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      </section>

      <Button
        type="button"
        isDisabled={saving || !title.trim()}
        onPress={handleSave}
        className="inline-flex h-12 min-h-12 items-center justify-center rounded-full bg-sapin px-8 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-sapin/85 disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </div>
  );
};

export default AdminHomeBanner;
