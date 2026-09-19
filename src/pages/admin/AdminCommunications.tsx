import { Fragment, useState, useEffect, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, Loader2, Download, Mail, Megaphone, Send, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { SiteAnnouncement, NewsletterSubscriber, ContactRequest } from '../../types/database';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { ProductImageDropzone } from '../../components/admin/ProductImageDropzone';
import { uploadPublicImage } from '../../lib/storageUpload';
import { toJpegSiHeic } from '../../lib/heicToJpeg';
import { NEWSLETTER_TYPES, NEWSLETTER_TYPE_LABELS, NEWSLETTER_TYPE_DRAFTS, type NewsletterType } from '../../lib/newsletterTypes';

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

const CONTACT_TYPE_LABELS: Record<string, string> = {
  info: 'Information',
  reservation: 'Réservation',
  partenariat: 'Partenariat',
  autre: 'Autre',
};

const AdminCommunications = () => {
  const [tab, setTab] = useState<'popups' | 'newsletter' | 'contact'>('popups');
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [commConfirm, setCommConfirm] = useState<
    { kind: 'announcement'; id: string } | { kind: 'subscriber'; id: string } | { kind: 'contact'; id: string } | null
  >(null);
  const [commConfirmLoading, setCommConfirmLoading] = useState(false);
  const [nlType, setNlType] = useState<NewsletterType>('info');
  const [nlSubject, setNlSubject] = useState('');
  const [nlBody, setNlBody] = useState('');
  const [nlImage, setNlImage] = useState('');
  const [nlUploading, setNlUploading] = useState(false);
  const [nlUploadError, setNlUploadError] = useState<string | null>(null);
  const [nlStatus, setNlStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [nlLastSent, setNlLastSent] = useState<{ subject: string; sent: number; total: number; at: string } | null>(null);
  const [nlCampaignId, setNlCampaignId] = useState<string | null>(null);
  const [nlConfirmOpen, setNlConfirmOpen] = useState(false);
  const [nlHistory, setNlHistory] = useState<
    { id: string; type: string; subject: string; created_at: string; sent: number; failed: number; unknown: number; total: number }[]
  >([]);
  // newsletter_sendable — la vue, jamais la table brute (arbitrage #4 du brief) :
  // c'est elle qui décide qui reçoit vraiment, donc c'est elle qui alimente le
  // compteur d'envoi ET l'export CSV.
  const [sendable, setSendable] = useState<{ email: string; consented_at: string }[]>([]);
  // Badge « membre du site » : emails présents dans profiles, une seule requête.
  const [memberEmails, setMemberEmails] = useState<Set<string>>(new Set());
  const [subscriberFilter, setSubscriberFilter] = useState<'all' | 'never_asked'>('all');
  const [subscriptionActionId, setSubscriptionActionId] = useState<string | null>(null);

  // Deux retraits distincts, jamais fusionnés (brief §6, 17/09) : la provenance
  // (elle-même vs l'admin) est une attribution, pas un jugement.
  type NlStatus = 'inscrit' | 'desinscrit_self' | 'desinscrit_admin' | 'jamais_demande';
  const nlSubscriberStatus = (s: NewsletterSubscriber): NlStatus => {
    if (s.unsubscribed_at) return s.unsubscribed_by === 'admin' ? 'desinscrit_admin' : 'desinscrit_self';
    if (!s.consented_at) return 'jamais_demande';
    return 'inscrit';
  };
  const NL_STATUS_LABELS: Record<NlStatus, string> = {
    inscrit: 'Inscrit·e',
    desinscrit_self: 'Désinscrit·e, elle-même',
    desinscrit_admin: 'Retiré·e au bar',
    jamais_demande: 'Jamais demandé',
  };

  const closeCommConfirm = useCallback(() => setCommConfirm(null), []);

  const sendNewsletter = async () => {
    // Reprise : réutilise le campaignId reçu au premier appel, jamais un nouveau
    // sujet/corps — la campagne existante est relue côté serveur (cf. spec §2).
    const isResume = !!nlCampaignId && nlStatus !== 'idle';
    if (!isResume && (!nlSubject.trim() || !nlBody.trim())) return;
    setNlStatus('sending');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    try {
      const payload = isResume
        ? { campaignId: nlCampaignId }
        : { type: nlType, subject: nlSubject.trim(), body: nlBody.trim(), image_url: nlImage.trim() || undefined };
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-newsletter`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erreur');
      const { campaignId, total, sent } = json as { campaignId: string; total: number; sent: number; failed: number; unknown: number };
      setNlCampaignId(campaignId);
      setNlStatus('sent');
      setNlLastSent({ subject: nlSubject.trim() || nlLastSent?.subject || '', sent, total, at: new Date().toISOString() });
      if (sent >= total) {
        setNlSubject('');
        setNlBody('');
        setNlImage('');
        setNlCampaignId(null);
      }
      loadHistory();
    } catch {
      setNlStatus('error');
    }
  };

  const loadAnnouncements = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('site_announcements')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) { setLoadError('Impossible de charger les popups. Vérifiez votre connexion.'); return; }
    setAnnouncements((data ?? []) as SiteAnnouncement[]);
  }, []);

  const loadSubscribers = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { setLoadError('Impossible de charger les abonnés. Vérifiez votre connexion.'); return; }
    const rows = (data ?? []) as NewsletterSubscriber[];
    setSubscribers(rows);

    // Badge « membre du site » : une seule requête, jointure côté client.
    const emails = rows.map((s) => s.email);
    if (emails.length) {
      const { data: profileRows } = await db.from('profiles').select('email').in('email', emails);
      setMemberEmails(new Set((profileRows ?? []).map((p: { email: string | null }) => p.email).filter(Boolean) as string[]));
    } else {
      setMemberEmails(new Set());
    }
  }, []);

  const loadSendable = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('newsletter_sendable')
      .select('email, consented_at')
      .order('consented_at', { ascending: false });
    if (error) { setLoadError('Impossible de charger la liste d\'envoi. Vérifiez votre connexion.'); return; }
    setSendable((data ?? []) as { email: string; consented_at: string }[]);
  }, []);

  const loadHistory = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: campaigns, error: campErr } = await db
      .from('newsletter_campaigns')
      .select('id, type, subject, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (campErr || !campaigns?.length) { setNlHistory([]); return; }
    const ids = campaigns.map((c: { id: string }) => c.id);
    const { data: sends } = await db.from('newsletter_sends').select('campaign_id, status').in('campaign_id', ids);
    const rows = campaigns.map((c: { id: string; type: string; subject: string; created_at: string }) => {
      const forCampaign = (sends ?? []).filter((s: { campaign_id: string }) => s.campaign_id === c.id);
      const sent = forCampaign.filter((s: { status: string }) => s.status === 'delivered').length;
      const failed = forCampaign.filter((s: { status: string }) => s.status === 'failed').length;
      const unknown = forCampaign.filter((s: { status: string }) => s.status === 'unknown').length;
      return { id: c.id, type: c.type, subject: c.subject, created_at: c.created_at, sent, failed, unknown, total: forCampaign.length };
    });
    setNlHistory(rows);
  }, []);

  const loadContactRequests = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { setLoadError('Impossible de charger les demandes de contact. Vérifiez votre connexion.'); return; }
    setContactRequests((data ?? []) as ContactRequest[]);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    await Promise.all([loadAnnouncements(), loadSubscribers(), loadSendable(), loadHistory(), loadContactRequests()]);
    setLoading(false);
  }, [loadAnnouncements, loadSubscribers, loadSendable, loadHistory, loadContactRequests]);

  const toggleContactRead = async (r: ContactRequest) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('contact_requests')
      .update({ read_at: r.read_at ? null : new Date().toISOString() })
      .eq('id', r.id);
    loadContactRequests();
  };

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
      } else if (kind === 'subscriber') {
        const { error } = await db.from('newsletter_subscribers').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await Promise.all([loadSubscribers(), loadSendable()]);
      } else {
        const { error } = await db.from('contact_requests').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await loadContactRequests();
      }
      setCommConfirm(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
      setCommConfirmLoading(false);
    }
  }, [commConfirm, loadAnnouncements, loadSubscribers, loadSendable, loadContactRequests]);

  // Geste admin auditable : passe par fn_admin_set_subscription (SECURITY DEFINER),
  // écrit une date — jamais un UPDATE direct sur newsletter_subscribers (interdit,
  // cf. migration). Confirmation avant l'action.
  const toggleSubscription = useCallback(async (subscriberId: string, action: 'unsubscribe' | 'resubscribe') => {
    setSubscriptionActionId(subscriberId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc('fn_admin_set_subscription', {
        p_subscriber_id: subscriberId,
        p_action: action,
      });
      if (error) throw new Error(error.message);
      await Promise.all([loadSubscribers(), loadSendable()]);
    } catch (e) {
      console.error(e);
    } finally {
      setSubscriptionActionId(null);
    }
  }, [loadSubscribers, loadSendable]);

  const handleToggleActive = async (a: SiteAnnouncement) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('site_announcements').update({ active: !a.active }).eq('id', a.id);
    loadAnnouncements();
  };

  const exportCsv = () => {
    // §6 : email, consented_at, source + l'état en mots — pas un booléen nu.
    const header = 'email,consented_at,source,statut\n';
    const rows = subscribers
      .map((s) => `${s.email},${s.consented_at ?? ''},${s.source},${NL_STATUS_LABELS[nlSubscriberStatus(s)]}`)
      .join('\n');
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
        subtitle="Popups d’accueil, inscriptions newsletter et demandes de contact."
      />
      <div className={DASH_MAIN_PAD}>
      {loadError && !loading && <AdminErrorAlert message={loadError} onRetry={loadAll} />}
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
          <button
            type="button"
            onClick={() => setTab('contact')}
            className={`flex min-h-[44px] items-center gap-2 rounded-[2px] px-4 text-[10px] font-normal uppercase tracking-[0.12em] ${
              tab === 'contact' ? 'bg-noir text-white' : 'text-black/45 hover:text-black'
            }`}
          >
            <MessageSquare size={14} />
            Contact
            {contactRequests.some((r) => !r.read_at) && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
                {contactRequests.filter((r) => !r.read_at).length}
              </span>
            )}
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
                  className="h-11 rounded-[2px] border border-noir/15 px-6 text-[10px] font-normal uppercase tracking-[0.12em] text-black/50"
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
          {/* Composer */}
          <div className="mb-8 rounded-[2px] border border-noir/[0.08] bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Send size={16} strokeWidth={1.5} className="text-sapin" />
              <h3 className="text-[12px] font-medium text-black">Envoyer une newsletter</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-[9px] font-normal uppercase tracking-[0.18em] text-black/60">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {NEWSLETTER_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={nlStatus === 'sending'}
                      onClick={() => {
                        setNlType(t);
                        // Pré-remplissage seulement si rien n'a encore été tapé — ne
                        // jamais écraser un texte déjà saisi par l'admin.
                        if (!nlSubject.trim() && !nlBody.trim()) {
                          setNlSubject(NEWSLETTER_TYPE_DRAFTS[t].subject);
                          setNlBody(NEWSLETTER_TYPE_DRAFTS[t].body);
                        }
                      }}
                      className={`h-9 rounded-full border px-4 text-[10px] font-normal uppercase tracking-[0.1em] transition-colors disabled:opacity-40 ${
                        nlType === t ? 'border-sapin bg-sapin text-white' : 'border-noir/12 text-black/60 hover:border-noir/25 hover:text-black'
                      }`}
                    >
                      {NEWSLETTER_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] font-normal text-black/60">
                  Brouillon — à personnaliser avant l&apos;envoi.
                </p>
              </div>
              <div>
                <label htmlFor="nl-subject" className="mb-1 block text-[9px] font-normal uppercase tracking-[0.18em] text-black/40">
                  Sujet
                </label>
                <input
                  id="nl-subject"
                  type="text"
                  value={nlSubject}
                  onChange={(e) => setNlSubject(e.target.value)}
                  placeholder="Nouveautés chez PessÓra…"
                  maxLength={200}
                  disabled={nlStatus === 'sending'}
                  className="w-full rounded-[2px] border border-noir/[0.12] bg-surface-muted px-4 py-2.5 text-[13px] text-black placeholder:text-black/30 outline-none focus:border-noir/30"
                />
              </div>
              <div>
                <p className="mb-1 text-[9px] font-normal uppercase tracking-[0.18em] text-black/60">
                  Image (optionnel)
                </p>
                <ProductImageDropzone
                  imageUrl={nlImage}
                  uploading={nlUploading}
                  disabled={nlStatus === 'sending'}
                  onFile={async (file) => {
                    setNlUploading(true);
                    setNlUploadError(null);
                    try {
                      const converted = await toJpegSiHeic(file);
                      const url = await uploadPublicImage('newsletter-images', converted, 'campaigns');
                      setNlImage(url);
                    } catch (err) {
                      setNlUploadError(err instanceof Error ? err.message : 'Upload impossible');
                    } finally {
                      setNlUploading(false);
                    }
                  }}
                />
                {nlUploadError && <p className="mt-1.5 text-[11px] text-red-600">{nlUploadError}</p>}
                {nlImage && (
                  <button
                    type="button"
                    onClick={() => setNlImage('')}
                    className="mt-1.5 text-[10px] font-normal text-black/60 underline underline-offset-2 hover:text-black"
                  >
                    Retirer l&apos;image
                  </button>
                )}
              </div>
              <div>
                <label htmlFor="nl-body" className="mb-1 block text-[9px] font-normal uppercase tracking-[0.18em] text-black/40">
                  Message
                </label>
                <textarea
                  id="nl-body"
                  value={nlBody}
                  onChange={(e) => setNlBody(e.target.value)}
                  placeholder="Bonjour à tous,

Nous sommes ravis de vous annoncer…"
                  rows={8}
                  maxLength={50000}
                  disabled={nlStatus === 'sending'}
                  className="w-full rounded-[2px] border border-noir/[0.12] bg-surface-muted px-4 py-2.5 text-[13px] leading-relaxed text-black placeholder:text-black/30 outline-none focus:border-noir/30 resize-y"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {(() => {
                  // 3 états stricts (spec §5) : Envoyer / Envoi en cours (désactivé
                  // dès le clic, avant tout appel réseau) / Envoyé ou Reprendre selon
                  // que sent === total. Le compteur vient de la vue newsletter_sendable,
                  // jamais de subscribers.length (qui inclut aussi les tests/désabonnés).
                  const isPartial = nlLastSent && nlLastSent.sent < nlLastSent.total && nlStatus === 'sent';
                  const label = nlStatus === 'sending'
                    ? `Envoi à ${sendable.length} contact${sendable.length !== 1 ? 's' : ''}…`
                    : isPartial
                      ? `Reprendre (${nlLastSent!.total - nlLastSent!.sent} restants)`
                      : sendable.length === 0
                        ? "Personne n'a dit oui — rien à envoyer"
                        : `Envoyer à ${sendable.length} contact${sendable.length !== 1 ? 's' : ''}`;
                  return (
                    <button
                      type="button"
                      onClick={() => (isPartial ? sendNewsletter() : setNlConfirmOpen(true))}
                      disabled={(!isPartial && (!nlSubject.trim() || !nlBody.trim())) || nlStatus === 'sending' || nlUploading || sendable.length === 0}
                      className="inline-flex h-11 min-h-[44px] items-center gap-2 rounded-[2px] bg-sapin px-6 text-[10px] font-medium uppercase tracking-[0.1em] text-white hover:bg-sapin/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {nlStatus === 'sending' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {label}
                    </button>
                  );
                })()}

                {nlStatus === 'sent' && nlLastSent && nlLastSent.sent >= nlLastSent.total && (
                  <p className="text-[12px] font-medium text-sapin">Envoyé à {nlLastSent.sent} destinataire{nlLastSent.sent !== 1 ? 's' : ''} ✓</p>
                )}
                {nlStatus === 'sent' && nlLastSent && nlLastSent.sent < nlLastSent.total && (
                  <p className="text-[12px] font-medium text-black/70">
                    Envoyé à {nlLastSent.sent}/{nlLastSent.total} — {nlLastSent.total - nlLastSent.sent} pas encore confirmé{nlLastSent.total - nlLastSent.sent !== 1 ? 's' : ''}.
                  </p>
                )}
                {nlStatus === 'error' && (
                  <p className="text-[12px] font-medium text-red-600">Erreur lors de l&apos;envoi. Réessayez.</p>
                )}
              </div>

              {(nlSubject.trim() || nlBody.trim()) && (
                <div className="pt-2">
                  <p className="mb-2 text-[9px] font-normal uppercase tracking-[0.18em] text-black/60">Aperçu téléphone</p>
                  <div className="mx-auto w-[300px] overflow-hidden rounded-[10px] border border-noir/[0.12] bg-white shadow-sm">
                    <div className="bg-sapin px-5 py-4 text-center">
                      <p className="text-[10px] font-normal uppercase tracking-[0.08em] text-white/70">PessÓra</p>
                    </div>
                    {nlImage && <img src={nlImage} alt="" className="block w-full" />}
                    <div className="px-4 py-4">
                      <p className="mb-2 font-serif text-[15px] font-normal text-black">{nlSubject || 'Sujet…'}</p>
                      <p className="whitespace-pre-line text-[12px] leading-relaxed text-black/70">{nlBody || 'Message…'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {nlLastSent && (
            <div className="mb-6 rounded-[2px] border border-sapin/[0.15] bg-sapin-subtle px-5 py-3 text-[12px] text-black/60">
              Dernier envoi : <span className="font-medium text-black">{nlLastSent.subject}</span> — {nlLastSent.sent}/{nlLastSent.total} destinataire{nlLastSent.total !== 1 ? 's' : ''} le {new Date(nlLastSent.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[12px] text-black/60">
              {sendable.length} contact{sendable.length !== 1 ? 's' : ''} recevront cette newsletter — celles qui ont dit oui.
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
          {(() => {
            const excluded = subscribers.filter((s) => nlSubscriberStatus(s) !== 'inscrit').length;
            return (
              <p className="mb-6 text-[11px] font-normal text-black/60">
                {excluded} personne{excluded !== 1 ? 's' : ''} {excluded !== 1 ? 'ont' : 'a'} dit non ou n&apos;{excluded !== 1 ? 'ont' : 'a'} jamais été demandée{excluded !== 1 ? 's' : ''} : elle{excluded !== 1 ? 's' : ''} ne recev{excluded !== 1 ? 'ront' : 'ra'} rien.
              </p>
            );
          })()}

          {nlHistory.length > 0 && (
            <div className="mb-8 overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white">
              <div className="border-b border-noir/[0.06] bg-noir/[0.02] px-4 py-2.5">
                <p className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/60">Historique des envois</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-noir/[0.06] text-[9px] font-normal uppercase tracking-[0.18em] text-black/60">
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Sujet</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Résultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nlHistory.map((h) => (
                      <tr key={h.id} className="border-b border-noir/[0.04] last:border-0">
                        <td className="px-4 py-2.5 text-black/60">{NEWSLETTER_TYPE_LABELS[h.type as NewsletterType] ?? h.type}</td>
                        <td className="max-w-[220px] truncate px-4 py-2.5 font-normal text-black">{h.subject}</td>
                        <td className="px-4 py-2.5 text-black/60">
                          {new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2.5 text-black/60">
                          {h.sent}/{h.total} partis
                          {h.failed + h.unknown > 0 && <span className="text-black/40"> — {h.failed} échoué{h.failed !== 1 ? 's' : ''}, {h.unknown} inconnu{h.unknown !== 1 ? 's' : ''}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubscriberFilter('all')}
              className={`h-9 rounded-full border px-4 text-[10px] font-normal uppercase tracking-[0.1em] transition-colors ${
                subscriberFilter === 'all' ? 'border-sapin bg-sapin text-white' : 'border-noir/12 text-black/60 hover:border-noir/25'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setSubscriberFilter('never_asked')}
              className={`h-9 rounded-full border px-4 text-[10px] font-normal uppercase tracking-[0.1em] transition-colors ${
                subscriberFilter === 'never_asked' ? 'border-sapin bg-sapin text-white' : 'border-noir/12 text-black/60 hover:border-noir/25'
              }`}
            >
              Jamais demandé
            </button>
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
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Provenance</th>
                    <th className="px-4 py-3">Inscription</th>
                    <th className="px-4 py-3 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers
                    .filter((s) => subscriberFilter === 'all' || nlSubscriberStatus(s) === 'jamais_demande')
                    .map((s) => {
                      const status = nlSubscriberStatus(s);
                      const isMember = memberEmails.has(s.email);
                      return (
                        <tr key={s.id} className="border-b border-noir/[0.04]">
                          <td className="px-4 py-3 font-normal text-black">
                            {s.email}
                            {isMember && (
                              <span className="ml-2 rounded-full border border-sapin/25 bg-sapin-subtle px-2 py-0.5 text-[9px] font-normal uppercase tracking-[0.08em] text-sapin">
                                Membre du site
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-black/70">{NL_STATUS_LABELS[status]}</td>
                          <td className="px-4 py-3 text-black/60">
                            {s.source}
                            {s.consented_at && (
                              <span className="text-black/40"> · {new Date(s.consented_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-black/60">
                            {new Date(s.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {status === 'desinscrit_self' || status === 'desinscrit_admin' ? (
                                <button
                                  type="button"
                                  onClick={() => toggleSubscription(s.id, 'resubscribe')}
                                  disabled={subscriptionActionId === s.id}
                                  className="h-9 rounded-[2px] border border-noir/12 px-3 text-[10px] font-normal uppercase tracking-[0.08em] text-black/60 hover:border-noir/25 hover:text-black disabled:opacity-40"
                                >
                                  {subscriptionActionId === s.id ? '…' : 'Réabonner'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleSubscription(s.id, 'unsubscribe')}
                                  disabled={subscriptionActionId === s.id}
                                  className="h-9 rounded-[2px] border border-noir/12 px-3 text-[10px] font-normal uppercase tracking-[0.08em] text-black/60 hover:border-noir/25 hover:text-black disabled:opacity-40"
                                >
                                  {subscriptionActionId === s.id ? '…' : 'Désabonner'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setCommConfirm({ kind: 'subscriber', id: s.id })}
                                disabled={deleting === s.id}
                                className="inline-flex h-9 w-9 items-center justify-center text-black/35 hover:text-red-600 disabled:opacity-40"
                                aria-label="Supprimer"
                              >
                                {deleting === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'contact' && (
        <div>
          <p className="mb-6 text-[12px] text-black/45">
            {contactRequests.length} demande{contactRequests.length !== 1 ? 's' : ''} — envoyées aussi par email, cette liste est le filet si un message est perdu.
          </p>
          {contactRequests.length === 0 ? (
            <p className="text-[12px] text-black/40">Aucune demande de contact pour l’instant.</p>
          ) : (
            <div className="overflow-hidden rounded-[2px] border border-noir/[0.06] bg-white">
              <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-noir/[0.06] bg-noir/[0.02] text-[9px] font-normal uppercase tracking-[0.18em] text-black/35">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Reçu</th>
                    <th className="px-4 py-3 text-center">Lu</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contactRequests.map((r) => (
                    <Fragment key={r.id}>
                      <tr
                        className={`border-b border-noir/[0.04] hover:bg-noir/[0.02] ${!r.read_at ? 'bg-sapin-subtle/40' : ''}`}
                      >
                        <td className="px-4 py-3 text-black/55">{CONTACT_TYPE_LABELS[r.type] ?? r.type}</td>
                        <td className="max-w-[160px] truncate px-4 py-3 font-normal text-black">{r.nom}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-black/60">{r.email}</td>
                        <td className="px-4 py-3 text-black/45">
                          {new Date(r.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleContactRead(r)}
                            className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${r.read_at ? 'bg-noir' : 'bg-noir/20'}`}
                            aria-label={r.read_at ? 'Marquer comme non lu' : 'Marquer comme lu'}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                r.read_at ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedContactId((prev) => (prev === r.id ? null : r.id))}
                            className="mr-2 inline-flex h-11 w-11 items-center justify-center text-black/40 hover:text-black"
                            aria-label="Voir le message"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCommConfirm({ kind: 'contact', id: r.id })}
                            disabled={deleting === r.id}
                            className="inline-flex h-11 w-11 items-center justify-center text-black/35 hover:text-red-600 disabled:opacity-40"
                          >
                            {deleting === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </td>
                      </tr>
                      {expandedContactId === r.id && (
                        <tr className="border-b border-noir/[0.04] bg-surface-muted/40">
                          <td colSpan={6} className="whitespace-pre-wrap px-4 py-4 text-[12px] leading-relaxed text-black/70">
                            {r.message}
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
        open={nlConfirmOpen}
        title="Envoyer la newsletter ?"
        description={`La newsletter "${nlSubject.trim()}" sera envoyée à ${sendable.length} personne${sendable.length !== 1 ? 's' : ''} — celles qui ont dit oui. Tu ne pourras plus le modifier après l'envoi.`}
        confirmLabel="Envoyer"
        loadingLabel="Envoi…"
        loading={nlStatus === 'sending'}
        onClose={() => setNlConfirmOpen(false)}
        onConfirm={async () => {
          setNlConfirmOpen(false);
          await sendNewsletter();
        }}
      />

      <ConfirmDialog
        open={commConfirm !== null}
        title={
          commConfirm?.kind === 'subscriber'
            ? 'Retirer cet email de la liste ?'
            : commConfirm?.kind === 'contact'
              ? 'Supprimer cette demande de contact ?'
              : 'Supprimer cette annonce ?'
        }
        description={
          commConfirm?.kind === 'subscriber'
            ? 'L’adresse sera définitivement retirée de la liste newsletter.'
            : commConfirm?.kind === 'contact'
              ? 'Le message a aussi été envoyé par email — cette suppression ne retire que la trace en base.'
              : 'L’annonce ne s’affichera plus sur le site. Cette action est définitive.'
        }
        confirmLabel="Supprimer"
        loadingLabel={commConfirm?.kind === 'subscriber' ? 'Retrait…' : 'Suppression…'}
        loading={commConfirmLoading}
        onClose={closeCommConfirm}
        onConfirm={runCommDelete}
      />
    </div>
  );
};

export default AdminCommunications;
