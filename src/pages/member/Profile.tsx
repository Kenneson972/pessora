// src/pages/member/Profile.tsx
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, LogOut } from 'lucide-react';
import { CellSwitch } from '@heroui-pro/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';

type PrefsShape = {
  notifications: boolean;
  newsletter: boolean;
};

const defaultPrefs = (): PrefsShape => ({
  notifications: true,
  newsletter: true,
});

function prefsFromUser(preferences: Record<string, boolean> | null | undefined): PrefsShape {
  const base = defaultPrefs();
  if (!preferences) return base;
  return {
    notifications:
      typeof preferences.notifications === 'boolean' ? preferences.notifications : base.notifications,
    newsletter:
      typeof preferences.newsletter === 'boolean' ? preferences.newsletter : base.newsletter,
  };
}

const Profile = () => {
  useEffect(() => { document.title = 'Mon profil — PessÓra'; }, []);
  const { user, logout, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [prefs, setPrefs] = useState<PrefsShape>(defaultPrefs);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setPhone(user.phone ?? '');
    setPrefs(prefsFromUser(user.preferences ?? undefined));
  }, [
    user?.id,
    user?.firstName,
    user?.lastName,
    user?.phone,
    user?.preferences,
  ]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—';

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const mergedPreferences: Record<string, boolean> = {
        ...(user.preferences ?? {}),
        notifications: prefs.notifications,
        newsletter: prefs.newsletter,
      };
      await updateProfile({
        firstName,
        lastName,
        phone,
        preferences: mergedPreferences,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const setPref = (key: keyof PrefsShape, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <DashPageHeader title="Mon profil" subtitle="Informations personnelles et préférences." />
      <div className={DASH_MAIN_PAD}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left — Identity */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-white rounded-[2px] p-8 text-center border border-noir/[0.06]">
          <div className="w-24 h-24 bg-noir/[0.04] rounded-full mx-auto mb-6 flex items-center justify-center">
            <span
              className="text-3xl font-light text-black/40"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {(firstName[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
            </span>
          </div>
          <h2
            className="font-display font-normal text-[22px] text-black mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {firstName} {lastName}
          </h2>
          <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-black/50 mb-6">
            Membre depuis {memberSince}
          </p>
        </div>

        <div className="bg-surface-muted rounded-[2px] p-6 border border-noir/[0.06]">
          <p className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/50 mb-5">
            Préférences
          </p>
          <div className="flex flex-col gap-2">
            {([
              { key: 'notifications' as const, label: 'Notifications' },
              { key: 'newsletter' as const, label: 'Newsletter' },
            ]).map(({ key, label }) => (
              <CellSwitch
                key={key}
                aria-label={label}
                isSelected={prefs[key]}
                onChange={(value) => setPref(key, value)}
                className="bg-transparent"
              >
                <CellSwitch.Trigger className="rounded-[2px] bg-white hover:bg-noir/[0.03] shadow-none px-4 py-3 transition-colors border border-noir/[0.06]">
                  <CellSwitch.Label className="text-[12px] font-light text-black/60">
                    {label}
                  </CellSwitch.Label>
                  <CellSwitch.Control />
                </CellSwitch.Trigger>
              </CellSwitch>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Forms */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="bg-white rounded-[2px] p-8 border border-noir/[0.06]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[13px] font-normal text-black">Informations Personnelles</h3>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !user}
              className="min-h-[44px] inline-flex items-center text-[10px] font-normal uppercase tracking-[0.1em] text-black/50 hover:text-black transition-colors duration-200 disabled:opacity-40"
            >
              {saving ? 'Sauvegarde…' : saveSuccess ? 'Sauvegardé ✓' : 'Sauvegarder'}
            </button>
          </div>

          {saveError && (
            <p className="text-[11px] text-red-500/80 mb-4" role="alert">{saveError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Prénom', Icon: User, value: firstName, onChange: setFirstName, type: 'text' },
              { label: 'Nom', Icon: User, value: lastName, onChange: setLastName, type: 'text' },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-2">
                <label className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/50 flex items-center gap-1.5">
                  <field.Icon size={11} strokeWidth={1.3} />
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  autoComplete="given-name"
                  className="w-full h-11 bg-noir/[0.03] rounded-[2px] px-4 text-base font-normal text-black border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 transition-colors duration-200"
                />
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/50 flex items-center gap-1.5">
                <Mail size={11} strokeWidth={1.3} /> Email
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                autoComplete="email"
                className="w-full h-11 bg-noir/[0.03] rounded-[2px] px-4 text-base font-normal text-black/40 border border-transparent cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/50 flex items-center gap-1.5">
                <Phone size={11} strokeWidth={1.3} /> Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+596 696 00 00 00"
                autoComplete="tel"
                className="w-full h-11 bg-noir/[0.03] rounded-[2px] px-4 text-base font-normal text-black border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2px] p-8 border border-noir/[0.06]">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-9 h-9 bg-noir/[0.04] rounded-[2px] flex shrink-0 items-center justify-center text-black/50">
              <Shield size={17} strokeWidth={1.3} aria-hidden />
            </div>
            <div>
              <h4 className="text-[13px] font-normal text-black mb-1">Sécurité</h4>
              <p className="text-[11px] font-light text-black/40">Nouveau mot de passe (min. 8 caractères).</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {passwordError && (
              <p className="md:col-span-2 text-[11px] text-red-500/80" role="alert">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="md:col-span-2 text-[11px] text-emerald-700/90" role="status">
                Mot de passe mis à jour.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="profile-new-password" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/50">
                Nouveau mot de passe
              </label>
              <input
                id="profile-new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full h-11 bg-noir/[0.03] rounded-[2px] px-4 text-base font-normal text-black border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 transition-colors duration-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="profile-confirm-password" className="text-[9px] font-normal uppercase tracking-[0.2em] text-black/50">
                Confirmer
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full h-11 bg-noir/[0.03] rounded-[2px] px-4 text-base font-normal text-black border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20 transition-colors duration-200"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving || !newPassword}
                className="min-h-[44px] rounded-[2px] bg-noir px-6 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/40 focus-visible:ring-offset-2"
              >
                {passwordSaving ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </button>
            </div>
          </form>
        </div>

        <button type="button"
          onClick={logout}
          className="bg-white rounded-[2px] p-6 text-left hover:bg-red-50/40 transition-colors duration-200 border border-noir/[0.06] group w-full"
        >
          <div className="w-9 h-9 bg-noir/[0.04] rounded-[2px] flex items-center justify-center text-black/50 mb-4 group-hover:bg-red-50 group-hover:text-red-500 transition-colors duration-200">
            <LogOut size={17} strokeWidth={1.3} aria-hidden />
          </div>
          <h4 className="text-[13px] font-normal text-black mb-1 group-hover:text-red-600 transition-colors duration-200">
            Déconnexion
          </h4>
          <p className="text-[11px] font-light text-black/40">Se déconnecter</p>
        </button>
      </div>
      </div>
      </div>
    </div>
  );
};

export default Profile;
