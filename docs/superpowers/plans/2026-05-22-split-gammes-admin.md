# Split Gammes Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la section "Choisis ton moment" entièrement gérable depuis l'admin — textes et 3 photos par onglet stockés dans Supabase au lieu d'un fichier TS statique.

**Architecture:** Table Supabase `home_split_gammes` (4 lignes fixes, une par onglet) + bucket Storage `split-gammes-images` + hook `useSplitGammes` qui remplace `splitGammesData` + page admin `/admin/moments` identique au pattern `AdminCarousel`.

**Tech Stack:** React 18, TypeScript, Supabase (PostgreSQL + Storage MCP), HeroUI compound Modal, Framer Motion, Tailwind CSS v4, `storageUpload.ts` existant (pattern bucket déjà en place pour `carousel-images`).

---

## Fichiers touchés

| Action | Fichier |
|--------|---------|
| Créer | `supabase/migrations/20260522100000_home_split_gammes.sql` |
| Créer | `src/hooks/useSplitGammes.ts` |
| Créer | `src/pages/admin/AdminSplitGammes.tsx` |
| Modifier | `src/components/home/HomeSplitGammes.tsx` |
| Modifier | `src/lib/storageUpload.ts` (ajouter `'split-gammes-images'` au union type) |
| Modifier | `src/pages/admin/AdminLayout.tsx` (ajouter entrée nav "Moments") |
| Modifier | `src/App.tsx` (lazy import + route `/admin/moments`) |

Fichier `src/data/homeSplitGammes.ts` : conservé (utilisé comme fallback dans le hook si DB vide).

---

## Task 1 — Migration Supabase : table + RLS + seed + bucket Storage

**Files:**
- Create: `supabase/migrations/20260522100000_home_split_gammes.sql`
- Apply via Supabase MCP (project_id: `tulhiipucrnyejheuitv`)

- [ ] **Step 1: Créer le fichier de migration**

```sql
-- supabase/migrations/20260522100000_home_split_gammes.sql

-- Table des 4 onglets "Choisis ton moment"
CREATE TABLE IF NOT EXISTS home_split_gammes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key              TEXT UNIQUE NOT NULL,
  position         INTEGER NOT NULL,
  label            TEXT NOT NULL,
  eyebrow          TEXT NOT NULL,
  title            TEXT NOT NULL,
  link_to          TEXT NOT NULL,
  main_image_url   TEXT,
  side_image_1_url TEXT,
  side_image_2_url TEXT,
  updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE home_split_gammes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "split_gammes_public_read"
  ON home_split_gammes FOR SELECT
  USING (true);

CREATE POLICY "split_gammes_admin_update"
  ON home_split_gammes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4 onglets pré-chargés avec les textes actuels
INSERT INTO home_split_gammes (key, position, label, eyebrow, title, link_to)
VALUES
  ('wellness', 1, 'Wellness', 'Wellness · PessÓra',  'Un concentré de bien-être au naturel', '/menu?gamme=wellness'),
  ('energie',  2, 'Énergie',  'Énergie · PessÓra',   'Ton boost pour la journée',             '/menu?gamme=energie'),
  ('shakes',   3, 'Shakes',   'Shakes · PessÓra',    'Protéines & gourmandise',               '/menu?gamme=shakes'),
  ('coffee',   4, 'Coffee',   'Coffee · Martinique',  'Café glacé à la martiniquaise',          '/menu?gamme=coffee')
ON CONFLICT (key) DO NOTHING;

-- Bucket Storage pour les photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'split-gammes-images',
  'split-gammes-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "split_gammes_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'split-gammes-images');

CREATE POLICY "split_gammes_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'split-gammes-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "split_gammes_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'split-gammes-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

- [ ] **Step 2: Appliquer la migration via Supabase MCP**

Utiliser l'outil `mcp__claude_ai_Supabase__apply_migration` avec :
- `project_id`: `tulhiipucrnyejheuitv`
- `name`: `home_split_gammes`
- `query`: contenu complet du fichier ci-dessus

Résultat attendu : `{ "success": true }`

- [ ] **Step 3: Vérifier les 4 lignes en base**

Utiliser `mcp__claude_ai_Supabase__execute_sql` :
```sql
SELECT key, position, label FROM home_split_gammes ORDER BY position;
```
Attendu : 4 lignes (wellness, energie, shakes, coffee).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260522100000_home_split_gammes.sql
git commit -m "feat: migration home_split_gammes table + storage bucket"
```

---

## Task 2 — Mettre à jour `storageUpload.ts`

**Files:**
- Modify: `src/lib/storageUpload.ts`

Contexte : `uploadPublicImage` accepte actuellement `'product-images' | 'event-images' | 'carousel-images'`. On ajoute `'split-gammes-images'`.

- [ ] **Step 1: Lire le fichier actuel**

```bash
# Vérifier la ligne du union type
grep -n "bucket:" src/lib/storageUpload.ts
```

- [ ] **Step 2: Modifier le type du paramètre `bucket`**

Remplacer :
```ts
  bucket: 'product-images' | 'event-images' | 'carousel-images',
```
Par :
```ts
  bucket: 'product-images' | 'event-images' | 'carousel-images' | 'split-gammes-images',
```

- [ ] **Step 3: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/lib/storageUpload.ts
git commit -m "feat: add split-gammes-images bucket to storageUpload"
```

---

## Task 3 — Créer le hook `useSplitGammes`

**Files:**
- Create: `src/hooks/useSplitGammes.ts`

Ce hook remplace `splitGammesData` importé directement dans le composant. Il fetche depuis Supabase et retombe sur les données TS si la DB est vide ou en erreur.

- [ ] **Step 1: Créer `src/hooks/useSplitGammes.ts`**

```ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { splitGammesData } from '../data/homeSplitGammes';

export interface SplitGammeRow {
  id: string;
  key: string;
  position: number;
  label: string;
  eyebrow: string;
  title: string;
  link_to: string;
  main_image_url: string | null;
  side_image_1_url: string | null;
  side_image_2_url: string | null;
}

export function useSplitGammes(): { gammes: SplitGammeRow[]; loading: boolean } {
  const [gammes, setGammes] = useState<SplitGammeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any)
      .from('home_split_gammes')
      .select('*')
      .order('position', { ascending: true })
      .then(({ data, error }: { data: SplitGammeRow[] | null; error: unknown }) => {
        if (error || !data || data.length === 0) {
          setGammes(
            splitGammesData.map((g, i) => ({
              id: g.key,
              key: g.key,
              position: i + 1,
              label: g.label,
              eyebrow: g.eyebrow,
              title: g.title,
              link_to: g.linkTo,
              main_image_url: g.mainImage,
              side_image_1_url: g.sideImages[0],
              side_image_2_url: g.sideImages[1],
            }))
          );
        } else {
          setGammes(data);
        }
        setLoading(false);
      });
  }, []);

  return { gammes, loading };
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSplitGammes.ts
git commit -m "feat: add useSplitGammes hook — fetch from Supabase with TS fallback"
```

---

## Task 4 — Mettre à jour `HomeSplitGammes.tsx`

**Files:**
- Modify: `src/components/home/HomeSplitGammes.tsx`

Remplacer `splitGammesData` (TS statique) par `useSplitGammes()`. Adapter les noms de champs (`mainImage` → `main_image_url`, etc.). Ajouter skeleton de chargement.

- [ ] **Step 1: Réécrire `src/components/home/HomeSplitGammes.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useSplitGammes } from '../../hooks/useSplitGammes';
import { useFadeUpWhenVisible, SPRING_TAB, EDITORIAL_EASE } from '../../lib/motionReveal';

const PHOTO_TRANSITION = { duration: 0.32, ease: EDITORIAL_EASE };

function PhotoSlot({ src, alt }: { src: string | null; alt: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-top"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div className="absolute inset-0 bg-noir/[0.06] flex flex-col items-center justify-center gap-2 text-black/25">
      <span className="text-[9px] uppercase tracking-[0.16em]">Photo à venir</span>
    </div>
  );
}

export function HomeSplitGammes() {
  const { gammes, loading } = useSplitGammes();
  const [activeKey, setActiveKey] = useState<string>('wellness');
  const navigate = useNavigate();
  const headerAnim = useFadeUpWhenVisible();

  const active = gammes.find((g) => g.key === activeKey) ?? gammes[0];

  if (loading) {
    return (
      <section className="bg-surface-muted px-4 py-16 md:px-10 md:py-20 lg:px-[72px]">
        <div className="mx-auto max-w-[1400px]">
          <div className="h-8 w-48 bg-noir/[0.06] rounded animate-pulse mb-6 mx-auto" />
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-noir/[0.06] rounded-full animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-[3fr_2fr] gap-1 rounded-[12px] overflow-hidden h-[420px] md:h-[520px]">
            <div className="bg-noir/[0.05] animate-pulse" />
            <div className="flex flex-col gap-1">
              <div className="flex-1 bg-noir/[0.04] animate-pulse" />
              <div className="flex-1 bg-noir/[0.04] animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!active) return null;

  return (
    <section className="bg-surface-muted px-4 py-16 md:px-10 md:py-20 lg:px-[72px]">
      <div className="mx-auto max-w-[1400px]">
        <motion.div className="mb-8 text-center" {...headerAnim}>
          <h2
            className="mb-3 font-display font-normal leading-[1.02] text-black"
            style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
          >
            Choisis ton moment
          </h2>
          <p className="mx-auto mb-6 max-w-[36ch] text-[13px] font-light leading-relaxed text-black/50">
            Chaque boisson PessÓra est pensée pour un instant précis.
          </p>

          <LayoutGroup id="split-gammes-tabs">
            <div className="flex justify-center gap-2 flex-wrap">
              {gammes.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setActiveKey(g.key)}
                  className={[
                    'relative overflow-hidden px-5 py-2 rounded-full text-[11px] font-normal tracking-[0.06em] border transition-colors duration-200',
                    activeKey === g.key
                      ? 'border-noir text-white'
                      : 'bg-white border-noir/[0.15] text-black/55 hover:border-noir/30 hover:text-black',
                  ].join(' ')}
                >
                  {activeKey === g.key && (
                    <motion.span
                      layoutId="split-tab-bg"
                      className="absolute inset-0 bg-noir"
                      transition={SPRING_TAB}
                    />
                  )}
                  <span className="relative">{g.label}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </motion.div>

        <motion.div
          className="grid grid-cols-[3fr_2fr] gap-1 rounded-[12px] overflow-hidden h-[420px] md:h-[520px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: EDITORIAL_EASE, delay: 0.1 }}
        >
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`main-${active.key}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={PHOTO_TRANSITION}
              >
                <PhotoSlot src={active.main_image_url} alt={active.eyebrow} />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-noir/55 via-transparent to-transparent pointer-events-none" />
            <AnimatePresence mode="wait">
              <motion.div
                key={`overlay-${active.key}`}
                className="absolute inset-0 flex flex-col justify-end p-6 md:p-8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
              >
                <p className="text-[8.5px] uppercase tracking-[0.22em] text-white/58 mb-1.5">{active.eyebrow}</p>
                <h3 className="text-[18px] md:text-[22px] font-light text-white leading-snug mb-4">{active.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => navigate(active.link_to)}
                  className="self-start h-9 min-h-9 rounded-full border border-white/30 bg-white/15 backdrop-blur-sm px-4 text-[9px] uppercase tracking-[0.14em] text-white hover:bg-white/25"
                >
                  Voir la gamme
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`side0-${active.key}`}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...PHOTO_TRANSITION, delay: 0.06 }}
                >
                  <PhotoSlot src={active.side_image_1_url} alt={`${active.label} boisson 1`} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`side1-${active.key}`}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...PHOTO_TRANSITION, delay: 0.12 }}
                >
                  <PhotoSlot src={active.side_image_2_url} alt={`${active.label} boisson 2`} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HomeSplitGammes.tsx
git commit -m "feat: HomeSplitGammes fetches from Supabase via useSplitGammes hook"
```

---

## Task 5 — Créer la page admin `AdminSplitGammes.tsx`

**Files:**
- Create: `src/pages/admin/AdminSplitGammes.tsx`

Même pattern que `AdminCarousel.tsx` : liste avec drag & drop + modal d'édition HeroUI compound. Pas de bouton créer/supprimer (4 onglets fixes).

- [ ] **Step 1: Créer `src/pages/admin/AdminSplitGammes.tsx`**

```tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, Upload, X, GripVertical } from 'lucide-react';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { supabase } from '../../lib/supabaseClient';
import { uploadPublicImage } from '../../lib/storageUpload';
import { DashEyebrow, DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import type { SplitGammeRow } from '../../hooks/useSplitGammes';

type UploadField = 'main_image_url' | 'side_image_1_url' | 'side_image_2_url';

type FormState = {
  label: string;
  eyebrow: string;
  title: string;
  link_to: string;
  main_image_url: string;
  side_image_1_url: string;
  side_image_2_url: string;
};

const EMPTY_FORM: FormState = {
  label: '', eyebrow: '', title: '', link_to: '',
  main_image_url: '', side_image_1_url: '', side_image_2_url: '',
};

export default function AdminSplitGammes() {
  const [gammes, setGammes] = useState<SplitGammeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SplitGammeRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState<UploadField | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const mainRef = useRef<HTMLInputElement>(null);
  const side1Ref = useRef<HTMLInputElement>(null);
  const side2Ref = useRef<HTMLInputElement>(null);
  const fileRefs: Record<UploadField, React.RefObject<HTMLInputElement>> = {
    main_image_url: mainRef,
    side_image_1_url: side1Ref,
    side_image_2_url: side2Ref,
  };

  const modalOverlay = useOverlayState({
    isOpen: modalOpen,
    onOpenChange: (open) => { if (!open) setModalOpen(false); },
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await (supabase as any)
      .from('home_split_gammes')
      .select('*')
      .order('position', { ascending: true });
    if (e) setError(e.message);
    else { setGammes(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (g: SplitGammeRow) => {
    setEditing(g);
    setForm({
      label: g.label,
      eyebrow: g.eyebrow,
      title: g.title,
      link_to: g.link_to,
      main_image_url: g.main_image_url ?? '',
      side_image_1_url: g.side_image_1_url ?? '',
      side_image_2_url: g.side_image_2_url ?? '',
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (field: UploadField, file: File, key: string) => {
    setUploading(field);
    setError(null);
    try {
      const url = await uploadPublicImage('split-gammes-images', file, key);
      setForm((f) => ({ ...f, [field]: url }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!editing) return;
    const payload = {
      label: form.label.trim(),
      eyebrow: form.eyebrow.trim(),
      title: form.title.trim(),
      link_to: form.link_to.trim(),
      main_image_url: form.main_image_url.trim() || null,
      side_image_1_url: form.side_image_1_url.trim() || null,
      side_image_2_url: form.side_image_2_url.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error: e } = await (supabase as any)
      .from('home_split_gammes')
      .update(payload)
      .eq('id', editing.id);
    if (e) { setError(e.message); return; }
    setModalOpen(false);
    load();
  };

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggingId) setDragOverId(id);
  };
  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    const from = gammes.findIndex((g) => g.id === draggingId);
    const to = gammes.findIndex((g) => g.id === targetId);
    if (from < 0 || to < 0) return;
    const reordered = [...gammes];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const updated = reordered.map((g, i) => ({ ...g, position: i + 1 }));
    setGammes(updated);
    setDraggingId(null);
    setDragOverId(null);
    await Promise.all(
      updated.map((g) =>
        (supabase as any).from('home_split_gammes').update({ position: g.position }).eq('id', g.id)
      )
    );
  };
  const handleDragEnd = () => { setDraggingId(null); setDragOverId(null); };

  const UPLOAD_ZONES: { field: UploadField; label: string; aspect: string }[] = [
    { field: 'main_image_url',   label: 'Photo principale (gauche)', aspect: 'aspect-[3/2]' },
    { field: 'side_image_1_url', label: 'Photo côté — haut',         aspect: 'aspect-square' },
    { field: 'side_image_2_url', label: 'Photo côté — bas',          aspect: 'aspect-square' },
  ];

  return (
    <div className={DASH_MAIN_PAD}>
      <DashEyebrow>Contenu</DashEyebrow>
      <DashPageHeader title="Choisis ton moment" />

      {error && <AdminErrorAlert message={error} onRetry={() => setError(null)} />}

      {loading ? (
        <p className="text-sm text-black/45 mt-6">Chargement…</p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-black/35 mb-1">
            Glisser-déposer pour réordonner les onglets
          </p>
          {gammes.map((g) => (
            <div
              key={g.id}
              draggable
              onDragStart={() => handleDragStart(g.id)}
              onDragOver={(e) => handleDragOver(e, g.id)}
              onDrop={(e) => handleDrop(e, g.id)}
              onDragEnd={handleDragEnd}
              className={[
                'flex items-center gap-3 rounded-[8px] border bg-white p-4 transition-all duration-150 cursor-grab active:cursor-grabbing select-none',
                draggingId === g.id ? 'opacity-40 border-noir/30' : 'border-noir/[0.08]',
                dragOverId === g.id && draggingId !== g.id ? 'border-noir/50 ring-1 ring-noir/20' : '',
              ].join(' ')}
            >
              <GripVertical size={14} className="flex-shrink-0 text-black/25" />
              <div className="flex gap-1.5 flex-shrink-0">
                {(['main_image_url', 'side_image_1_url', 'side_image_2_url'] as UploadField[]).map((field) => (
                  <div key={field} className="h-12 w-12 rounded-[6px] overflow-hidden bg-noir/[0.05]">
                    {g[field]
                      ? <img src={g[field] as string} alt="" className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center"><Upload size={12} className="text-black/20" /></div>
                    }
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-black/40 truncate">{g.eyebrow}</p>
                <p className="text-[13px] font-light text-black truncate">{g.title}</p>
              </div>
              <Button isIconOnly size="sm" variant="ghost" onPress={() => openEdit(g)} aria-label="Modifier">
                <Pencil size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file inputs */}
      {(['main_image_url', 'side_image_1_url', 'side_image_2_url'] as UploadField[]).map((field) => (
        <input
          key={field}
          ref={fileRefs[field]}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && editing) handleFileUpload(field, f, editing.key);
            e.target.value = '';
          }}
        />
      ))}

      <Modal state={modalOverlay}>
        <Modal.Backdrop variant="blur" isDismissable>
          <Modal.Container scroll="inside" placement="center" size="full" className="mx-auto max-h-[92vh] w-[min(100vw-1rem,560px)] shadow-2xl">
            <Modal.Dialog className="flex max-h-[92vh] flex-col overflow-hidden rounded-[2px] border border-noir/[0.08] bg-white shadow-xl">
              <Modal.Header className="relative shrink-0 border-b border-noir/[0.06] px-5 py-4">
                <Modal.Heading className="font-display text-[17px] font-normal tracking-[0.02em] text-black pr-10">
                  {editing?.label} — modifier
                </Modal.Heading>
                <Modal.CloseTrigger className="absolute right-3 top-3 shrink-0 rounded-[2px] border border-transparent text-black/45 hover:bg-noir/[0.05] hover:text-black" />
              </Modal.Header>
              <Modal.Body className="flex-1 overflow-y-auto px-5 py-5">
                <div className="flex flex-col gap-4">
                  {([
                    { key: 'label',   label: 'Label onglet', placeholder: 'Wellness' },
                    { key: 'eyebrow', label: 'Eyebrow',      placeholder: 'Wellness · PessÓra' },
                    { key: 'title',   label: 'Titre',        placeholder: 'Un concentré de bien-être au naturel' },
                    { key: 'link_to', label: 'Lien CTA',     placeholder: '/menu?gamme=wellness' },
                  ] as const).map(({ key, label, placeholder }) => (
                    <label key={key} className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">{label}</span>
                      <input
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="rounded-[6px] border border-noir/[0.15] px-3 py-2 text-[13px] outline-none focus:border-noir/40"
                      />
                    </label>
                  ))}

                  {UPLOAD_ZONES.map(({ field, label, aspect }) => (
                    <div key={field} className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">{label}</span>
                      {form[field] ? (
                        <div className={`relative rounded-[6px] overflow-hidden border border-noir/[0.12] ${aspect}`}>
                          <img src={form[field]} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, [field]: '' }))}
                            className="absolute top-2 right-2 bg-white/90 rounded-full p-1 text-black/60 hover:text-black"
                            aria-label="Supprimer la photo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileRefs[field].current?.click()}
                          disabled={uploading !== null}
                          className="flex items-center justify-center gap-2 rounded-[6px] border border-dashed border-noir/[0.2] py-6 text-[12px] text-black/40 hover:border-noir/40 hover:text-black/60 transition-colors disabled:opacity-50"
                        >
                          <Upload size={14} />
                          {uploading === field ? 'Envoi…' : 'Choisir une photo'}
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onPress={() => setModalOpen(false)}>Annuler</Button>
                    <Button
                      onPress={save}
                      isDisabled={!form.label.trim() || !form.title.trim() || uploading !== null}
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminSplitGammes.tsx
git commit -m "feat: AdminSplitGammes — CRUD textes + upload 3 photos + drag-drop"
```

---

## Task 6 — Ajouter "Moments" à la navigation admin

**Files:**
- Modify: `src/pages/admin/AdminLayout.tsx`

Contexte : le tableau `NAV` se trouve lignes 9-25. Les imports lucide-react sont ligne 3. Ajouter `LayoutList` aux imports et une entrée nav après "Carrousel".

- [ ] **Step 1: Ajouter `LayoutList` aux imports lucide-react**

Ligne 3 actuelle :
```ts
import { LayoutDashboard, Users, CalendarDays, Package, Heart, LogOut, Megaphone, ArrowLeft, Store, Layers, Images } from 'lucide-react';
```
Remplacer par :
```ts
import { LayoutDashboard, Users, CalendarDays, Package, Heart, LogOut, Megaphone, ArrowLeft, Store, Layers, Images, LayoutList } from 'lucide-react';
```

- [ ] **Step 2: Ajouter l'entrée nav "Moments" après "Carrousel"**

Après :
```ts
  { label: 'Carrousel', shortLabel: 'Carousel', icon: Images, path: '/admin/carousel' },
```
Ajouter :
```ts
  { label: 'Moments', shortLabel: 'Moments', icon: LayoutList, path: '/admin/moments' },
```

- [ ] **Step 3: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminLayout.tsx
git commit -m "feat: add Moments to admin nav"
```

---

## Task 7 — Ajouter la route `/admin/moments` dans App.tsx

**Files:**
- Modify: `src/App.tsx`

Contexte : `AdminCarousel` est lazy-importé ligne 56 et sa route est lignes 210-214. Reproduire le même pattern pour `AdminSplitGammes`.

- [ ] **Step 1: Ajouter le lazy import**

Après la ligne :
```ts
const AdminCarousel = lazy(() => import('./pages/admin/AdminCarousel'));
```
Ajouter :
```ts
const AdminSplitGammes = lazy(() => import('./pages/admin/AdminSplitGammes'));
```

- [ ] **Step 2: Ajouter la route**

Après le bloc de route `/admin/carousel` :
```tsx
<Route path="/admin/carousel" element={
  <ProtectedAdminRoute>
    <AdminLayout><AdminCarousel /></AdminLayout>
  </ProtectedAdminRoute>
} />
```
Ajouter :
```tsx
<Route path="/admin/moments" element={
  <ProtectedAdminRoute>
    <AdminLayout><AdminSplitGammes /></AdminLayout>
  </ProtectedAdminRoute>
} />
```

- [ ] **Step 3: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 4: Commit final**

```bash
git add src/App.tsx
git commit -m "feat: route /admin/moments — AdminSplitGammes"
```

---

## Vérification finale

- [ ] `npm run dev` — démarrer le dev server
- [ ] Naviguer sur `/` — vérifier que "Choisis ton moment" affiche toujours les 4 onglets avec textes (venant de la DB) et placeholders "Photo à venir" pour les images
- [ ] Naviguer sur `/admin/moments` en tant qu'admin — vérifier la liste des 4 gammes
- [ ] Cliquer "Modifier" sur Wellness — vérifier que les champs sont pré-remplis
- [ ] Uploader une photo principale — vérifier l'aperçu dans le modal
- [ ] Sauvegarder — vérifier que la photo apparaît sur `/` sans rechargement forcé
- [ ] Drag un onglet sur un autre — vérifier le réordonnancement
