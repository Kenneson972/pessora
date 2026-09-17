/**
 * Protocole Gamme Skin — ordre d'application.
 *
 * RÈGLE DE SOURÇAGE (Karibloom) : chaque `mention` est recopiée MOT POUR MOT de la
 * fiche produit de la cliente (celle déjà publiée sur la page produit). Aucune ligne
 * n'est écrite par nous, aucune ne promet un résultat — on décrit des gestes.
 *
 * `keyword` sert à retrouver les produits réels dans le catalogue (insensible à la
 * casse, sur le nom). Si le catalogue ne renvoie rien, le geste s'affiche seul :
 * jamais de vignette inventée, jamais de nom inventé.
 */
export type SkinProtocolStep = {
  /** Le geste, à l'infinitif. */
  geste: string;
  /** Fragments de nom produit servant à retrouver la vignette dans le catalogue. */
  keyword: string[];
  /** Citation exacte de sa fiche produit, s'il y en a une qui parle de l'ordre ou de la fréquence. */
  mention?: string;
  /** Nom exact du produit d'où sort la citation. */
  mentionSource?: string;
};

export const SKIN_PROTOCOL_STEPS: SkinProtocolStep[] = [
  {
    geste: 'Nettoyer',
    keyword: ['nettoyant'],
    mention: 'Utilisation quotidienne matin et soir.',
    mentionSource: 'Gel Nettoyant Resurface',
  },
  {
    geste: 'Tonifier',
    keyword: ['tonique'],
    mention: 'Prépare la peau à recevoir les soins suivants.',
    mentionSource: 'Lotion Tonique Revitalisant',
  },
  {
    geste: 'Traiter',
    keyword: ['sérum', 'serum'],
  },
  {
    geste: 'Le contour des yeux',
    keyword: ['contour yeux', 'contour des yeux'],
    mention: 'Appliquer matin et soir par tapotements légers.',
    mentionSource: 'Gel Contour Yeux',
  },
  {
    geste: 'Hydrater & protéger',
    keyword: ['fps'],
    mention: 'Protection solaire SPF 30 + hydratation intense, au quotidien.',
    mentionSource: 'Crème Hydratante FPS 30',
  },
];
