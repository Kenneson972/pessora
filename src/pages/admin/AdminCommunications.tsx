import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, Loader2, Download, Mail, Megaphone } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { SiteAnnouncement, NewsletterSubscriber } from '../../types/database';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';

type AnnouncementType = SiteAnnouncement['type'];

const TYPE_OPTIONS: AnnouncementType[] = ['featured', 'promo', 'event', 'alert'];
const TYPE_LABELS: Record<AnnouncementType, string> = {
  featured: 'Coup de projecteur',
  promo: 'Promo / Offre',
  event: 'Événement',
  alert: 'Alerte / Info',
};

const EMPTY_FORM = {
  type: 'promo' as AnnouncementType,
  title: '',
  subtitle: '',
  message: '',
  image_url: '',
  cta_label: '',
  cta_url: '',
  price: '',
  expires_at: '',
  active: false,
  dismiss_mode: 'once_daily' as SiteAnnouncement['dismiss_mode'],
  priority: '0',
};

type FormState = typeof EMPTY_FORM;

function announcementToForm(a: SiteAnnouncement): FormState {
  return {
    type: a.type,
    title: a.title,
    subtitle: a.subtitle ?? '',
    message: a.message ?? '',
    image_url: a.image_url ?? '',
    cta_label: a.cta_label ?? '',
    cta_url: a.cta_url ?? '',
    price: a.price != null ? String(a.price) : '',
    expires_at: a.expires_at ?? '',
    active: a.active,
    dismiss_mode: a.dismiss_mode,
    priority: String(a.priority),
  };
}

const AdminCommunications = () => {
  const [tab, setTab] = useState<'popups' | 'newsletter'>('popups');
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [commConfirm, setCommConfirm] = useState<
    { kind: 'announcement'; id: string } | { kind: 'subscriber'; id: string } | null
  >(null);
  const [commConfirmLoading, setCommConfirmLoading] = useState(false);

  const closeCommConfirm = useCallback(() => setCommConfirm(null), []);

  const loadAnnouncements = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('site_announcements')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data as SiteAnnouncement[]);
  }, []);

  const loadSubscribers = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setSubscribers(data as NewsletterSubscriber[]);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAnnouncements(), loadSubscribers()]);
    setLoading(false);
  }, [loadAnnouncements, loadSubscribers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setField = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'type' && value === 'alert') next.dismiss_mode = 'once_session';
      if (key === 'type' && value !== 'alert' && prev.dismiss_mode === 'once_session') next.dismiss_mode = 'once_daily';
      return next;
    });

  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditId('new');
  };

  const openEdit = (a: SiteAnnouncement) => {
    setForm(announcementToForm(a));
    setFormError(null);
    setEditId(a.id);
  };

  const closeForm = () => {
    setEditId(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError('Le titre est requis.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      type: form.type,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      message: form.message.trim() || null,
      image_url: form.image_url.trim() || null,
      cta_label: form.cta_label.trim() || null,
      cta_url: form.cta_url.trim() || null,
      price: form.type === 'featured' && form.price ? parseFloat(form.price) : null,
      expires_at: form.expires_at || null,
      active: form.active,
      dismiss_mode: (form.type === 'alert' ? 'once_session' : form.dismiss_mode) as SiteAnnouncement['dismiss_mode'],
      priority: parseInt(form.priority, 10) || 0,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      if (editId === 'new') {
        const { error } = await db.from('site_announcements').insert(payload);
        if (error) throw new Error(error.message);
      } else if (editId) {
        const { error } = await db.from('site_announcements').update(payload).eq('id', editId);
        if (error) throw new Error(error.message);
      }
      closeForm();
      await loadAnnouncements();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const runCommDelete = useCallback(async () => {
    if (!commConfirm) return;
    setCommConfirmLoading(true);
    const { id, kind } = commConfirm;
    setDeleting(id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      if (kind === 'announcement') {
        const { error } = await db.from('site_announcements').delete().eq('id', id);
        if (error) throw new Error(error.message);
        setEditId((prev) => (prev === id ? null : prev));
        await loadAnnouncements();
      } else {
        const { error } = await db.from('newsletter_subscribers').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await loadSubscribers();
      }
      setCommConfirm(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
      setCommConfirmLoading(false);
    }
  }, [commConfirm, loadAnnouncements, loadSubscribers]);

  const handleToggleActive = async (a: SiteAnnouncement) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('site_announcements').update({ active: !a.active }).eq('id', a.id);
    loadAnnouncements();
  };

  const exportCsv = () => {
    const header = 'email,date_inscription\n';
    const rows = subscribers.map((s) => `${s.email},${s.created_at}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pessora-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputClass =
    'w-full h-11 bg-surface-muted rounded-[2px] border border-noir/[0.08] px-3 text-base sm:text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-black/40">
        <Loader2 className="animate-spin" size={18} />
        Chargement…
      </div>
    );
  }

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Communication"
        subtitle="Popups d’accueil et inscriptions newsletter."
      />
      <div className={DASH_MAIN_PAD}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex gap-1 rounded-[2px] border border-noir/[0.08] bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('popups')}
            className={`flex min-h-[44px] items-center gap-2 rounded-[2px] px-4 text-[10px] font-normal uppercase tracking-[0.12em] ${
              tab === 'popups' ? 'bg-noir text-white' : 'text-black/45 hover:text-black'
            }`}
          >
            <Megaphone size={14} />
            Popups
          </button>
          <button
            type="button"
            onClick={() => setTab('newsletter')}
            className={`flex min-h-[44px] items-center gap-2 rounded-[2px] px-4 text-[10px] font-normal uppercase tracking-[0.12em] ${
              tab === 'newsletter' ? 'bg-noir text-white' : 'text-black/45 hover:text-black'
            }`}
          >
            <Mail size={14} />
            Newsletter
          </button>
        </div>
      </div>

      {tab === 'popups' && (
        <div>
          <div className="mb-6 flex justify-end">
            {editId === null && (
              <button
                type="button"
                onClick={openNew}
                className="flex h-11 items-center gap-2 rounded-[2px] bg-noir px-5 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite"
              >
                <Plus size={14} /> Nouvelle annonce
              </button>
            )}
          </div>

          {editId !== null && (
            <div className="mb-8 rounded-[2px] border border-noir/[0.06] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-normal uppercase tracking-[0.14em] text-black/40">
                  {editId === 'new' ? 'Nouvelle annonce' : 'Modifier'}
                </p>
                <button type="button" onClick={closeForm} className="flex h-11 w-11 items-center justify-center text-black/35 hover:text-black" aria-label="Fermer">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Type</label>
                  <select className={inputClass} value={form.type} onChange={(e) => setField('type', e.target.value as AnnouncementType)}>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-4 pb-1">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setField('active', e.target.checked)}
                      className="h-4 w-4 accent-black"
                    />
                    <span className="text-[11px] text-black/55">Active (affichée si prioritaire)</span>
                  </label>
                </div>
                <div>
                  <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Priorité</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.priority}
                    onChange={(e) => setField('priority', e.target.value)}
                    min={0}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Fermeture</label>
                  <select
                    className={inputClass}
                    value={form.dismiss_mode}
                    disabled={form.type === 'alert'}
                    onChange={(e) =>
                      setField('dismiss_mode', e.target.value as SiteAnnouncement['dismiss_mode'])
                    }
                  >
                    <option value="once_daily">1× par jour</option>
                    <option value="once_session">1× par session</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Titre *</label>
                  <input className={inputClass} value={form.title} onChange={(e) => setField('title', e.target.value)} />
                </div>
                {form.type !== 'alert' && (
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Sous-titre / badge</label>
                    <input className={inputClass} value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Message</label>
                  <textarea
                    className={`${inputClass} h-24 resize-none py-2.5`}
                    value={form.message}
                    onChange={(e) => setField('message', e.target.value)}
                  />
                </div>
                {form.type === 'featured' && (
                  <div>
                    <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Prix (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={form.price}
                      onChange={(e) => setField('price', e.target.value)}
                    />
                  </div>
                )}
                {form.type !== 'alert' && (
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Image (URL)</label>
                    <input
                      className={inputClass}
                      value={form.image_url}
                      onChange={(e) => setField('image_url', e.target.value)}
                      placeholder="https://… ou chemin /public/…"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Fin de validité (date)</label>
                  <input type="date" className={inputClass} value={form.expires_at} onChange={(e) => setField('expires_at', e.target.value)} />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Bouton CTA</label>
                    <input className={inputClass} value={form.cta_label} onChange={(e) => setField('cta_label', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Lien CTA</label>
                    <input
                      className={inputClass}
                      value={form.cta_url}
                      onChange={(e) => setField('cta_url', e.target.value)}
                      disabled={form.type === 'alert'}
                      placeholder="/menu ou https://"
                    />
                  </div>
                </div>
              </div>
              {formError && <p className="mt-4 text-[11px] text-red-600/90">{formError}</p>}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 rounded-[2px] bg-noir px-6 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-40"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-11 rounded-[2px] border border-noir/15 px-6 text-[10px] font-light uppercase tracking-[0.12em] text-black/50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {announcements.length === 0 ? (
            <p className="text-[12px] text-black/40">Aucune annonce. Créez-en une pour l’afficher sur l’accueil.</p>
          ) : (
            <div className="overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white">
              <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-noir/[0.06] bg-noir/[0.02] text-[9px] font-normal uppercase tracking-[0.18em] text-black/35">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Titre</th>
                    <th className="px-4 py-3 text-center">Actif</th>
                    <th className="px-4 py-3 text-center">Prio</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a) => (
                    <tr key={a.id} className="border-b border-noir/[0.04] hover:bg-noir/[0.02]">
                      <td className="px-4 py-3 text-black/55">{TYPE_LABELS[a.type]}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-normal text-black">{a.title}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(a)}
                          className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${a.active ? 'bg-noir' : 'bg-noir/20'}`}
                          aria-label={a.active ? 'Désactiver' : 'Activer'}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                              a.active ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-black/45">{a.priority}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => openEdit(a)} className="mr-2 inline-flex h-11 w-11 items-center justify-center text-black/40 hover:text-black">
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommConfirm({ kind: 'announcement', id: a.id })}
                          disabled={deleting === a.id}
                          className="inline-flex h-11 w-11 items-center justify-center text-black/35 hover:text-red-600 disabled:opacity-40"
                        >
                          {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'newsletter' && (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[12px] text-black/45">
              {subscribers.length} contact{subscribers.length !== 1 ? 's' : ''} — export CSV pour Mailchimp / Brevo / envoi manuel.
            </p>
            {subscribers.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="flex h-11 items-center gap-2 rounded-[2px] border border-noir/15 px-4 text-[10px] font-normal uppercase tracking-[0.12em] text-black/70 hover:border-noir/30"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
          {subscribers.length === 0 ? (
            <p className="text-[12px] text-black/40">Aucune inscription pour l’instant — le formulaire est dans le pied de page du site.</p>
          ) : (
            <div className="overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white">
              <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-noir/[0.06] bg-noir/[0.02] text-[9px] font-normal uppercase tracking-[0.18em] text-black/35">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Inscription</th>
                    <th className="px-4 py-3 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s.id} className="border-b border-noir/[0.04]">
                      <td className="px-4 py-3 font-normal text-black">{s.email}</td>
                      <td className="px-4 py-3 text-black/45">
                        {new Date(s.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setCommConfirm({ kind: 'subscriber', id: s.id })}
                          disabled={deleting === s.id}
                          className="inline-flex h-11 w-11 items-center justify-center text-black/35 hover:text-red-600 disabled:opacity-40"
                          aria-label="Supprimer"
                        >
                          {deleting === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      <ConfirmDialog
        open={commConfirm !== null}
        title={
          commConfirm?.kind === 'subscriber'
            ? 'Retirer cet email de la liste ?'
            : 'Supprimer cette annonce ?'
        }
        description={
          commConfirm?.kind === 'subscriber'
            ? 'L’adresse sera définitivement retirée de la liste newsletter.'
            : 'L’annonce ne s’affichera plus sur le site. Cette action est définitive.'
        }
        confirmLabel={commConfirm?.kind === 'subscriber' ? 'Retirer' : 'Supprimer'}
        loadingLabel={commConfirm?.kind === 'subscriber' ? 'Retrait…' : 'Suppression…'}
        loading={commConfirmLoading}
        onClose={closeCommConfirm}
        onConfirm={runCommDelete}
      />
    </div>
  );
};

export default AdminCommunications;
