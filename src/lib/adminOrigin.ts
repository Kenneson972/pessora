/**
 * L'admin vit sur admin.pessora.fr, le site public sur www.pessora.fr.
 *
 * La session Supabase est rangee dans le localStorage de l'ORIGINE qui l'a creee :
 * elle ne suit donc PAS une bascule d'hote. Un compte admin connecte sur www arrive
 * sur admin.pessora.fr sans session, et retombe sur un ecran de connexion identique,
 * sans un mot — la panne fait alors porter l'erreur au mot de passe.
 *
 * Regle : on se connecte la ou la session va vivre.
 *
 * ⚠️ Cette fonction est la SEULE source de l'origine admin — ne pas recoder la chaine.
 * ⚠️ Les deux fonctions prennent l'hote en parametre OPTIONNEL : c'est ce qui permet
 *    de les tester hors navigateur. Sans ce parametre, le cas « hote admin » ne serait
 *    couvrable nulle part — il ne se reproduit pas dans une preview locale (localhost).
 */
export const ADMIN_ORIGIN = 'https://admin.pessora.fr';
export const ADMIN_HOST = 'admin.pessora.fr';
export const ADMIN_LOGIN_URL = `${ADMIN_ORIGIN}/connexion`;

/**
 * Le site public — distinct de l'admin. Dans le bundle admin (AdminApp.tsx), la route
 * "/" fait Navigate vers "/admin" : un <Link to="/"> de react-router-dom y boucle sur
 * le dashboard au lieu de sortir vers le site. "Retour au site" doit donc être une
 * vraie sortie d'origine (<a href>), jamais un <Link> interne au routeur admin.
 */
export const PUBLIC_ORIGIN = 'https://www.pessora.fr';

/**
 * L'hote courant est-il celui de l'admin ?
 * Le port est ignore (une preview sert admin.pessora.fr:4173).
 */
export const isAdminHost = (host?: string): boolean => {
  const h = host ?? (typeof window !== 'undefined' ? window.location.host : '');
  return h.split(':')[0] === ADMIN_HOST;
};

/**
 * Faut-il REFUSER cette connexion ?
 *
 * Oui, et seulement sur le mauvais hote. Sur admin.pessora.fr, un admin se connecte
 * normalement : c'est SA porte.
 *
 * 🔴 La version du 14/09 testait `role === 'admin'` sans la clause d'hote : elle refusait
 *    donc aussi le BON chemin, et Catherine ne pouvait plus entrer du tout. Le defaut
 *    etait invisible en tsc/tests/revue — il n'a ete vu qu'en mesurant la prod.
 *    La question qui le couvre n'est pas « le message existe ? » mais
 *    « sur l'hote admin, suis-je refusee ? -> non, jamais ».
 */
export const doitRefuserConnexionAdmin = (role?: string, host?: string): boolean =>
  role === 'admin' && !isAdminHost(host);
