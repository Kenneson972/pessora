import { describe, it, expect } from 'vitest';
import { formatSurveyDetails } from '../lib/challengeRegistrantDetails';

describe('formatSurveyDetails', () => {
  it('formate les 4 champs connus quand ils sont présents', () => {
    const result = formatSurveyDetails({
      bilan_offert: 'Oui',
      objectif_principal: 'Perte de poids',
      objectif_autre: '',
      complement_revenus: 'pas_pour_le_moment',
    });
    expect(result).toEqual([
      { key: 'bilan_offert', label: 'Bilan offert', value: 'Oui' },
      { key: 'objectif_principal', label: 'Objectif principal', value: 'Perte de poids' },
      { key: 'complement_revenus', label: 'Complément de revenus', value: 'Pas pour le moment' },
    ]);
  });

  it('inclut objectif_autre uniquement si objectif_principal vaut Autre', () => {
    const result = formatSurveyDetails({
      objectif_principal: 'Autre',
      objectif_autre: 'Reprendre le sport après une blessure',
    });
    expect(result).toContainEqual({
      key: 'objectif_autre',
      label: 'Précision objectif',
      value: 'Reprendre le sport après une blessure',
    });
  });

  it('ignore objectif_autre si objectif_principal ne vaut pas Autre', () => {
    const result = formatSurveyDetails({
      objectif_principal: 'Perte de poids',
      objectif_autre: 'Ne devrait pas apparaître',
    });
    expect(result.find((r) => r.key === 'objectif_autre')).toBeUndefined();
  });

  it('traduit la valeur complement_revenus vers un libellé lisible', () => {
    const result = formatSurveyDetails({
      complement_revenus: 'decouvrir_opportunite_herbalife',
    });
    expect(result[0].value).toBe("Intéressé(e) — à recontacter");
  });

  it('rend un tableau vide si details est null ou pas un objet', () => {
    expect(formatSurveyDetails(null)).toEqual([]);
    expect(formatSurveyDetails('pas un objet')).toEqual([]);
    expect(formatSurveyDetails(undefined)).toEqual([]);
  });

  it('ignore les champs vides ou absents', () => {
    const result = formatSurveyDetails({ objectif_principal: '', bilan_offert: undefined });
    expect(result).toEqual([]);
  });
});
