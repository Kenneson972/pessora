import { describe, it, expect } from 'vitest';
import {
  isAdminHost,
  doitRefuserConnexionAdmin,
  doitAfficherPorteAdmin,
  ADMIN_LOGIN_URL,
  ADMIN_HOST,
} from '../lib/adminOrigin';

/**
 * La garde de l'ecran de connexion.
 *
 * Pourquoi ce test existe : le 14/09, une garde refusait TOUT compte admin, y compris
 * sur l'hote de l'admin. tsc, les tests et la revue statique etaient verts ; le defaut
 * n'a ete vu qu'en mesurant la prod. Le cas « hote admin » n'est PAS couvrable par une
 * recette locale (l'hote y est localhost) — ce test est la seule couverture possible.
 *
 * La question posee ici n'est pas « le message existe-t-il ? » (vrai, et insuffisant)
 * mais celle de la personne concernee : « sur l'hote admin, suis-je refusee ? -> non ».
 *
 * Ce test a ete verifie FALSIFIABLE : en retirant la clause d'hote de
 * doitRefuserConnexionAdmin, il echoue sur le seul cas de l'hote admin.
 */
describe('isAdminHost — reconnaitre l hote de l admin', () => {
  it('reconnait admin.pessora.fr, avec ou sans port de preview', () => {
    expect(isAdminHost('admin.pessora.fr')).toBe(true);
    expect(isAdminHost('admin.pessora.fr:4173')).toBe(true);
  });

  it('ne reconnait PAS le site public — le cas de Catherine sur www', () => {
    expect(isAdminHost('www.pessora.fr')).toBe(false);
    expect(isAdminHost('pessora.fr')).toBe(false);
    expect(isAdminHost('localhost:5173')).toBe(false);
    expect(isAdminHost('')).toBe(false);
  });
});

describe('doitRefuserConnexionAdmin — la garde, sur le vrai chemin', () => {
  it('🔴 sur l hote ADMIN, un admin n est JAMAIS refuse (le defaut du 14/09)', () => {
    expect(doitRefuserConnexionAdmin('admin', 'admin.pessora.fr')).toBe(false);
    expect(doitRefuserConnexionAdmin('admin', 'admin.pessora.fr:4173')).toBe(false);
  });

  it('sur le site public, un admin est refuse — sa session ne suivrait pas', () => {
    expect(doitRefuserConnexionAdmin('admin', 'www.pessora.fr')).toBe(true);
  });

  it('un membre n est jamais refuse, d aucun cote', () => {
    expect(doitRefuserConnexionAdmin('member', 'www.pessora.fr')).toBe(false);
    expect(doitRefuserConnexionAdmin('member', 'admin.pessora.fr')).toBe(false);
    expect(doitRefuserConnexionAdmin(undefined, 'www.pessora.fr')).toBe(false);
  });
});

describe('la porte nommee', () => {
  it('pointe la CONNEXION de l admin, pas sa racine', () => {
    expect(ADMIN_LOGIN_URL).toBe(`https://${ADMIN_HOST}/connexion`);
    expect(ADMIN_LOGIN_URL.endsWith('/connexion')).toBe(true);
  });

  it('🔴 s affiche sur le site public, et JAMAIS sur l hote admin', () => {
    // La page de connexion est PARTAGEE entre les deux hotes : sur admin.pessora.fr,
    // la porte renverrait vers la page ou l'on est deja (mesure @vela).
    expect(doitAfficherPorteAdmin('www.pessora.fr')).toBe(true);
    expect(doitAfficherPorteAdmin('admin.pessora.fr')).toBe(false);
    expect(doitAfficherPorteAdmin('admin.pessora.fr:4173')).toBe(false);
  });
});
