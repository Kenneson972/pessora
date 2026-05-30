// src/pages/admin/AdminInfosBar.tsx
// Écran admin : infos bar (adresse, horaires, contact). Source unique pour le footer + PessoBot.
import { useEffect, useState } from 'react';
import { Loader2, Save, Plus, Trash2, Check } from 'lucide-react';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import { AdminErrorAlert } from '../../components/dashboard/AdminErrorAlert';
import { useBarSettings } from '../../hooks/useBarSettings';
import type {
  BarAddress,
  BarContact,
  BarHours,
  BarSubscriptionInfo,
  BarSubscriptionPlan,
} from '../../types/database';

const EMPTY_ORA_PLUS: BarSubscriptionPlan = {
  name: 'Óra+',
  tagline: '',
  price: '',
  period: '/ mois',
  highlight: '',
  benefits: [],
  cta_url: '',
};

const inputClass =
  'w-full h-10 bg-surface-muted rounded-[2px] border border-noir/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

const labelClass =
  'mb-1.5 block text-[9px] font-normal uppercase tracking-[0.2em] text-black/35';

const sectionTitleClass =
  'text-[11px] font-normal uppercase tracking-[0.18em] text-black/50';

const cardClass =
  'rounded-[2px] border border-noir/[0.06] bg-white p-6';

const AdminInfosBar = () => {
  useEffect(() => { document.title = 'Informations bar — Admin PessÓra'; }, []);
  const { settings, loading, error, update } = useBarSettings();
  const [address, setAddress] = useState<BarAddress | null>(null);
  const [hours, setHours] = useState<BarHours>([]);
  const [contact, setContact] = useState<BarContact | null>(null);
  const [oraPlus, setOraPlus] = useState<BarSubscriptionPlan>(EMPTY_ORA_PLUS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!settings) return;
    setAddress(settings.address);
    setHours(settings.hours);
    setContact(settings.contact);
    setOraPlus({
      ...EMPTY_ORA_PLUS,
      ...(settings.subscription_info?.ora_plus ?? {}),
    });
  }, [settings]);

  const setAddressField = (k: keyof BarAddress, v: string) =>
    setAddress((prev) => (prev ? { ...prev, [k]: v } : prev));

  const setContactField = (k: keyof BarContact, v: string) =>
    setContact((prev) => (prev ? { ...prev, [k]: v } : prev));

  const setHourField = (index: number, k: 'label' | 'value', v: string) =>
    setHours((prev) => prev.map((row, i) => (i === index ? { ...row, [k]: v } : row)));

  const addHourRow = () =>
    setHours((prev) => [...prev, { label: '', value: '' }]);

  const removeHourRow = (index: number) =>
    setHours((prev) => prev.filter((_, i) => i !== index));

  const setOraField = <K extends keyof BarSubscriptionPlan>(k: K, v: BarSubscriptionPlan[K]) =>
    setOraPlus((prev) => ({ ...prev, [k]: v }));

  const setOraBenefit = (index: number, value: string) =>
    setOraPlus((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => (i === index ? value : b)),
    }));

  const addOraBenefit = () =>
    setOraPlus((prev) => ({ ...prev, benefits: [...prev.benefits, ''] }));

  const removeOraBenefit = (index: number) =>
    setOraPlus((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));

  const handleSave = async () => {
    if (!address || !contact) return;
    setSaving(true);
    setSaveError(null);
    try {
      const cleanedOra: BarSubscriptionPlan = {
        ...oraPlus,
        benefits: oraPlus.benefits.map((b) => b.trim()).filter(Boolean),
      };
      const subscriptionInfo: BarSubscriptionInfo = cleanedOra.name?.trim()
        ? { ora_plus: cleanedOra }
        : {};

      await update({
        address: { ...address, full: buildFullAddress(address) },
        hours: hours.filter((h) => h.label.trim() || h.value.trim()),
        contact,
        subscription_info: subscriptionInfo,
      });
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !address || !contact) {
    return (
      <div className="flex items-center gap-2 px-6 py-10 text-black/40">
        <Loader2 className="animate-spin" size={18} />
        Chargement…
      </div>
    );
  }

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Infos bar"
        subtitle="Adresse, horaires et contact — source unique pour le footer et PessoBot."
        action={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-[2px] bg-noir px-5 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        }
      />
      <div className={DASH_MAIN_PAD}>
        {error && <AdminErrorAlert message={error} />}
        {saveError && <AdminErrorAlert message={saveError} />}
        {savedAt && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-[2px] border border-sapin-muted bg-sapin-subtle px-3 py-2 text-[11px] text-sapin">
            <Check size={14} /> Infos enregistrées.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Adresse ─────────────────────────────────────────────── */}
          <section className={cardClass}>
            <h2 className={sectionTitleClass}>Adresse</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass} htmlFor="street">Rue / Lieu-dit</label>
                <input
                  id="street"
                  className={inputClass}
                  value={address.street}
                  onChange={(e) => setAddressField('street', e.target.value)}
                  placeholder="C.C. La Véranda - Cluny"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="postal">Code postal</label>
                <input
                  id="postal"
                  className={inputClass}
                  value={address.postal_code}
                  onChange={(e) => setAddressField('postal_code', e.target.value)}
                  placeholder="97200"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="city">Ville</label>
                <input
                  id="city"
                  className={inputClass}
                  value={address.city}
                  onChange={(e) => setAddressField('city', e.target.value)}
                  placeholder="Fort-de-France"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="country">Pays</label>
                <input
                  id="country"
                  className={inputClass}
                  value={address.country}
                  onChange={(e) => setAddressField('country', e.target.value)}
                  placeholder="Martinique"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="maps">Lien Google Maps</label>
                <input
                  id="maps"
                  className={inputClass}
                  value={address.maps_url}
                  onChange={(e) => setAddressField('maps_url', e.target.value)}
                  placeholder="https://maps.google.com/…"
                />
              </div>
              <div className="md:col-span-2 text-[10px] text-black/35">
                Adresse complète générée : <span className="text-black/55">{buildFullAddress(address)}</span>
              </div>
            </div>
          </section>

          {/* ── Contact ─────────────────────────────────────────────── */}
          <section className={cardClass}>
            <h2 className={sectionTitleClass}>Contact</h2>
            <div className="mt-5 grid grid-cols-1 gap-4">
              <div>
                <label className={labelClass} htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  value={contact.email}
                  onChange={(e) => setContactField('email', e.target.value)}
                  placeholder="pessora.mq@gmail.com"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">Téléphone</label>
                <input
                  id="phone"
                  type="tel"
                  className={inputClass}
                  value={contact.phone}
                  onChange={(e) => setContactField('phone', e.target.value)}
                  placeholder="+596 696 XX XX XX"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="insta">Handle Instagram</label>
                <input
                  id="insta"
                  className={inputClass}
                  value={contact.instagram}
                  onChange={(e) => setContactField('instagram', e.target.value)}
                  placeholder="@pessora.mq"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="insta-url">URL Instagram</label>
                <input
                  id="insta-url"
                  className={inputClass}
                  value={contact.instagram_url}
                  onChange={(e) => setContactField('instagram_url', e.target.value)}
                  placeholder="https://www.instagram.com/pessora.mq/"
                />
              </div>
            </div>
          </section>

          {/* ── Óra+ (abonnement) ─────────────────────────────────── */}
          <section className={`${cardClass} lg:col-span-2`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className={sectionTitleClass}>Abonnement Óra+</h2>
                <p className="mt-1 text-[11px] text-black/45">
                  PessoBot utilise ces infos pour pitcher l’abonnement aux membres free.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="ora-name">Nom commercial</label>
                <input
                  id="ora-name"
                  className={inputClass}
                  value={oraPlus.name}
                  onChange={(e) => setOraField('name', e.target.value)}
                  placeholder="Óra+"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="ora-price">Prix</label>
                <input
                  id="ora-price"
                  className={inputClass}
                  value={oraPlus.price}
                  onChange={(e) => setOraField('price', e.target.value)}
                  placeholder="24,90€"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="ora-period">Période</label>
                <input
                  id="ora-period"
                  className={inputClass}
                  value={oraPlus.period}
                  onChange={(e) => setOraField('period', e.target.value)}
                  placeholder="/ mois"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="ora-cta">URL d’abonnement</label>
                <input
                  id="ora-cta"
                  className={inputClass}
                  value={oraPlus.cta_url}
                  onChange={(e) => setOraField('cta_url', e.target.value)}
                  placeholder="https://pessora.mq/ora-plus"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass} htmlFor="ora-tagline">Tagline</label>
                <input
                  id="ora-tagline"
                  className={inputClass}
                  value={oraPlus.tagline}
                  onChange={(e) => setOraField('tagline', e.target.value)}
                  placeholder="Remises au bar, bilan bien-être, événements en priorité — sans engagement."
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass} htmlFor="ora-highlight">Accroche prix (highlight)</label>
                <input
                  id="ora-highlight"
                  className={inputClass}
                  value={oraPlus.highlight}
                  onChange={(e) => setOraField('highlight', e.target.value)}
                  placeholder="Rentable dès la 4ᵉ boisson"
                />
              </div>

              <div className="md:col-span-2 mt-2">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className={labelClass}>Avantages (bullet points)</span>
                  <button
                    type="button"
                    onClick={addOraBenefit}
                    className="inline-flex items-center gap-1.5 rounded-[2px] border border-noir/10 bg-surface-muted px-3 py-2 text-[10px] font-normal uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-noir/20 hover:text-black"
                  >
                    <Plus size={13} /> Avantage
                  </button>
                </div>
                <div className="space-y-2">
                  {oraPlus.benefits.length === 0 && (
                    <p className="text-[12px] text-black/40">
                      Aucun avantage défini. Ajoutez au moins 3 bullet points (ex. « Jusqu’à -50% sur les boissons »).
                    </p>
                  )}
                  {oraPlus.benefits.map((benefit, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_auto] gap-3">
                      <input
                        className={inputClass}
                        value={benefit}
                        onChange={(e) => setOraBenefit(idx, e.target.value)}
                        placeholder={`Avantage ${idx + 1}`}
                        aria-label={`Avantage Óra+ ${idx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOraBenefit(idx)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-[2px] border border-noir/10 text-black/45 transition-colors hover:border-red-400/40 hover:text-red-600"
                        aria-label="Supprimer cet avantage"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Horaires ────────────────────────────────────────────── */}
          <section className={`${cardClass} lg:col-span-2`}>
            <div className="flex items-center justify-between gap-4">
              <h2 className={sectionTitleClass}>Horaires d’ouverture</h2>
              <button
                type="button"
                onClick={addHourRow}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-noir/10 bg-surface-muted px-3 py-2 text-[10px] font-normal uppercase tracking-[0.14em] text-black/60 transition-colors hover:border-noir/20 hover:text-black"
              >
                <Plus size={13} /> Ligne
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {hours.length === 0 && (
                <p className="text-[12px] text-black/40">
                  Aucun horaire défini. Ajoutez une ligne (ex. <em>Lundi – Vendredi</em> / <em>9h30 – 18h</em>).
                </p>
              )}
              {hours.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-3">
                  <input
                    className={inputClass}
                    value={row.label}
                    onChange={(e) => setHourField(idx, 'label', e.target.value)}
                    placeholder="Lundi - Vendredi"
                    aria-label={`Libellé horaire ${idx + 1}`}
                  />
                  <input
                    className={inputClass}
                    value={row.value}
                    onChange={(e) => setHourField(idx, 'value', e.target.value)}
                    placeholder="9h30 - 18h"
                    aria-label={`Valeur horaire ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeHourRow(idx)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[2px] border border-noir/10 text-black/45 transition-colors hover:border-red-400/40 hover:text-red-600"
                    aria-label="Supprimer cette ligne"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <p className="mt-8 text-[10px] uppercase tracking-[0.18em] text-black/30">
          Ces informations sont utilisées par le footer public et transmises à PessoBot (assistant nutrition) à chaque conversation.
        </p>
      </div>
    </div>
  );
};

function buildFullAddress(a: BarAddress): string {
  const parts = [a.street, [a.postal_code, a.city].filter(Boolean).join(' '), a.country]
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.join(', ');
}

export default AdminInfosBar;
