const COMPLEMENT_REVENUS_LABELS: Record<string, string> = {
  decouvrir_opportunite_herbalife: 'Intéressé(e) — à recontacter',
  pas_pour_le_moment: 'Pas pour le moment',
};

const FIELD_LABELS: Record<string, string> = {
  bilan_offert: 'Bilan offert',
  objectif_principal: 'Objectif principal',
  objectif_autre: 'Précision objectif',
  complement_revenus: 'Complément de revenus',
};

const FIELD_ORDER = ['bilan_offert', 'objectif_principal', 'objectif_autre', 'complement_revenus'];

export interface SurveyDetailEntry {
  key: string;
  label: string;
  value: string;
}

function readString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === 'string' ? v.trim() : '';
}

/** Formate `event_registrations.post_registration_details` (JSON) pour affichage admin. */
export function formatSurveyDetails(details: unknown): SurveyDetailEntry[] {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return [];
  const obj = details as Record<string, unknown>;
  const objectifPrincipal = readString(obj, 'objectif_principal');

  const entries: SurveyDetailEntry[] = [];
  for (const key of FIELD_ORDER) {
    if (key === 'objectif_autre' && objectifPrincipal !== 'Autre') continue;
    const raw = readString(obj, key);
    if (raw === '') continue;
    const value = key === 'complement_revenus' ? (COMPLEMENT_REVENUS_LABELS[raw] ?? raw) : raw;
    entries.push({ key, label: FIELD_LABELS[key], value });
  }
  return entries;
}
