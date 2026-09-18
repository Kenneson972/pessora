/**
 * Protocole Gamme Skin — ordre d'application.
 *
 * 🔴 RÈGLE DE SOURÇAGE — la SEULE source qui compte est la fiche produit PUBLIÉE
 * (`gamme_products.description`, celle que le site rend sur /nos-produits/skin/<slug>).
 * `src/data/productsData.ts` est un FALLBACK statique : il porte des phrases qui ne
 * sont PAS sur la fiche live (relevé @vela 17/09 : « Prépare la peau à recevoir les
 * soins suivants. » n'existe que dans le fallback). Ne jamais citer le fallback.
 *
 * Vérification des citations ci-dessous, mot pour mot contre la base le 17/09/2026 :
 *   Gel Nettoyant Resurface  → « …Convient à tous les types de peau. UTILISATION QUOTIDIENNE MATIN ET SOIR. »
 *   Gel Contour Yeux         → « …apaise et lisse le regard. APPLIQUER MATIN ET SOIR PAR TAPOTEMENTS LÉGERS. »
 * Ce sont les DEUX seules fiches Skin qui parlent d'usage ou de fréquence. Les autres
 * (Lotion Tonique « Tonifie et revitalise le teint », FPS 30 « Protection solaire +
 * hydratation intense », sérums) ne disent ni ordre ni durée : on ne leur en prête pas.
 *
 * `notice` n'est donc JAMAIS une reformulation : soit la phrase est sur la fiche live
 * et on la recopie telle quelle, soit il n'y a pas de citation.
 */
export type SkinProductNotice = {
  /** Nom EXACT du produit au catalogue (aucun appariement approximatif : la citation
   *  doit pointer un produit, pas une famille — deux « contour yeux » coexistent). */
  source: string;
  /** Phrase recopiée littéralement de la fiche publiée. */
  text: string;
};

export const SKIN_PRODUCT_NOTICES: SkinProductNotice[] = [
  { source: 'Gel Nettoyant Resurface', text: 'Utilisation quotidienne matin et soir.' },
  { source: 'Gel Contour Yeux', text: 'Appliquer matin et soir par tapotements légers.' },
];

export type SkinProtocolStep = {
  /** Le geste, à l'infinitif. */
  geste: string;
  /** Fragments de nom produit servant à retrouver les produits au catalogue. */
  keyword: string[];
};

export const SKIN_PROTOCOL_STEPS: SkinProtocolStep[] = [
  { geste: 'Nettoyer', keyword: ['nettoyant'] },
  { geste: 'Tonifier', keyword: ['tonique'] },
  // 17/09 — « Traiter » était le SEUL des cinq gestes sans source dans ses fiches :
  // vérifié sur les 15 produits Skin actifs en base, « traiter » n'apparaît dans aucune
  // description. C'est aussi le seul mot vague du bloc. Remplacé par ce que l'étape
  // contient vraiment, avec le mot qu'emploie déjà son catalogue (la sous-catégorie
  // s'appelle `serum`) : « Les sérums ». Les quatre autres gestes restent — « nettoie »,
  // « tonifie », « contour des yeux », « hydratation / protection » sont ses mots.
  //
  // `tension` : « Crème Tension Ultime » n'était dans aucune étape, alors que sa fiche est
  // de sous-catégorie `serum` (mesuré en base le 17/09). Elle appartient donc ici.
  { geste: 'Les sérums', keyword: ['sérum', 'serum', 'tension'] },
  // `yeux` : « Crème Hydrant Yeux » manquait aussi — sa sous-catégorie est `contour` et sa
  // fiche dit « Hydratation intense contour yeux ». L'appariement se fait sur le NOM, et
  // son nom ne porte pas le mot « contour » : d'où le mot-clé `yeux`.
  { geste: 'Le contour des yeux', keyword: ['contour yeux', 'contour des yeux', 'yeux'] },
  { geste: 'Hydrater & protéger', keyword: ['fps'] },
];

/**
 * ⚠️ Pourquoi on n'apparie PAS sur `subcategory` alors que la colonne existe et qu'elle a
 * servi à trouver les deux produits ci-dessus : elle mélange ce qui est tranché et ce qui
 * ne l'est pas. `nettoyage` couvre « Gommage », « Exfoliant » et « Masque d'Argile » —
 * trois produits qu'Élise a explicitement laissés en **question** pour Catherine (une
 * sixième étape ?) — et `serum` couvre aussi « Crème de Nuit », qui est dans la même
 * question. Une règle par sous-catégorie les rangerait d'office : on écrirait son
 * protocole à sa place. La garde `skinProtocol.test.ts` verrouille les deux côtés :
 * les 9 produits rangés ET les 6 qui ne doivent être attrapés par AUCUNE étape.
 */

/**
 * Assets PACKSHOT — canevas large où le produit n'occupe qu'une bande étroite et
 * centrée. Mesuré au canvas le 17/09/2026 (boîte d'encre réelle de chaque image) :
 *
 *   pc-511k-fr.png (Nettoyant)      1280×658 — encre 118×454 px (9 % de la largeur)
 *   pc-0829-fr.png (Sérum Rides)    1280×658 — encre  109×549 px
 *   pc-508k-fr.png (Niacinamide)    1280×658 — encre  141×352 px
 *   pc-2561-fr.png (Gel Contour)    1280×658 — encre  230×546 px
 *   pc-515k-fr.png (Crème Contour)  1280×658 — encre   83×272 px
 *   pc-0828-fr.png (FPS 30)         1280×658 — encre  109×549 px
 *   lotion-tonique-revitalisant.jpg  555×555 — encre  166×505 px
 *
 * Dans un carré de 44 px en `object-contain`, ces produits rendent une bande de ~4 px
 * (relevé @vela) : la vignette est chargée, mais illisible. Ces assets se cadrent donc
 * dans un puits PORTRAIT avec `object-cover` — le contenant recadre, le produit remplit.
 *
 * Clé = dernier segment de l'URL (l'asset, pas le produit) : deux produits qui partagent
 * un visuel partagent son cadrage, et une image remplacée par Catherine sort de la liste
 * → repli carré `object-contain`, jamais un recadrage hasardeux sur une photo inconnue.
 */
export const SKIN_PORTRAIT_ASSETS: string[] = [
  'pc-511k-fr.png',
  'pc-0829-fr.png',
  'pc-508k-fr.png',
  'pc-2561-fr.png',
  'pc-515k-fr.png',
  'pc-0828-fr.png',
  'lotion-tonique-revitalisant.jpg',
];
