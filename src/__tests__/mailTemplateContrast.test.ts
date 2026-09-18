import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';

/**
 * GARDE DES MAILS — 8 surfaces, contraste, palette et porte de sortie.
 *
 * ── POURQUOI CETTE GARDE EXISTE ─────────────────────────────────────────────
 * Défaut mesuré le 17/09 dans le lot newsletter : la ligne d'adresse du pied de mail
 * était en `#888` à 11 px — `3,20:1` sur `#f5f3f0`, sous AA. C'est exactement la
 * couleur que le brief nomme comme piège (« jamais le #888 ») : elle avait été évitée
 * pour le lien de sortie, puis réutilisée une ligne plus bas.
 *
 * Le point de fond : **aucun autre instrument ne voit ces fichiers.** Le cliquet de
 * contraste scanne `src/**` et cherche des classes `text-*` ; le corps des mails vit
 * dans `supabase/functions/**` et `email-templates/**`, en **styles en ligne**
 * (`color:#888`). Hors de portée deux fois. Un critère sans instrument est un critère
 * de bonne volonté : celui-ci est exécutable.
 *
 * ── LES 8 SURFACES (mesurées, pas supposées) ────────────────────────────────
 * 3 fonctions qui rendent un document de mail + 5 templates d'authentification.
 * Elles ont été trouvées par le haut (`<!DOCTYPE html`) **et** par le bas : la
 * recherche d'un `color:` en ligne sous `supabase/**` ne rend que ces 3 fichiers.
 *
 * ── LES CINQ RÈGLES ────────────────────────────────────────────────────────
 * ① toute couleur de TEXTE d'une surface doit être DÉCLARÉE ici (une encre non
 *   déclarée fait tomber le test en la nommant, avec son fichier et sa ligne) ;
 * ② les fonds sont vérifiés **dans les deux sens** : aucun fond employé sans être
 *   déclaré, aucun fond déclaré qui ne soit plus employé — sinon les couples
 *   seraient recomptés sur un fond qui n'existe plus (un vert qui ne décrit plus) ;
 * ③ chaque couple déclaré (encre × fond) est recomputé : `≥ 4,5:1`, avec le rapport
 *   mesuré dans le message d'échec ;
 * ④ la PORTE DE SORTIE : sur une surface de liste, le lien visible et l'en-tête
 *   `List-Unsubscribe` doivent exister **et** viser la bonne porte (voir plus bas).
 *   Sur les autres surfaces : aucune ancre sans texte (le lien-image est invisible
 *   chez qui bloque les images — c'est le vrai risque) ;
 * ⑤ anti-régression de la porte : la fonction de désinscription doit refuser toute
 *   méthode non-POST **avant** tout appel qui écrit.
 *
 * ── DÉCOUVERTE : LA TABLE N'EST PAS LA SEULE PORTE D'ENTRÉE ────────────────
 * Un 9ᵉ mail né demain ne doit pas passer inaperçu parce que personne n'a pensé à
 * la table. Le test « aucune surface non déclarée » découvre donc les documents HTML
 * sous `supabase/`, `email-templates/` et `src/`, **et** les fragments à encre en
 * ligne sous `supabase/**` (un pied de mail vivant dans un `.ts` sans `<!DOCTYPE html`
 * échapperait aux deux autres instruments).
 *
 * ⚠️ Le motif de découverte est `<!DOCTYPE html>`, **jamais** `<html` seul : mesuré sur
 * ce dépôt, `<html` en insensible à la casse rend **28** fichiers de `src/**` qui sont
 * des génériques TypeScript (`useRef<HTMLInputElement>`, `<HTMLDivElement>`), pas des
 * mails. Si ce motif est un jour élargi, il doit rester sensible à la casse.
 *
 * ── CE QUE CETTE GARDE NE FAIT PAS, DIT FRANCHEMENT ───────────────────────
 * - Les couples encre × fond sont **déclarés à la main** : l'appariement ne se déduit
 *   pas du HTML. Mesuré : une passe automatique « dernier fond déclaré avant l'encre »
 *   produit des couples qui n'existent pas (`#3a3a3a` « sur `#1E3529` = 1,16:1 » alors
 *   que ce texte est sur `#ffffff`). Un appariement deviné vaut moins qu'une table
 *   courte et relue.
 * - Les 5 templates d'authentification vivent **aussi** dans le Dashboard Supabase :
 *   cette garde protège **le fichier du dépôt**. Le collage est un geste manuel, et
 *   aucun instrument d'ici ne le couvre.
 * - Un fragment de mail **sans aucune couleur en ligne** échappe à la découverte —
 *   mais il n'y a alors rien à mesurer : c'est le périmètre de la garde, pas un angle
 *   mort. Un fragment à encre, lui, est attrapé.
 */

const RACINE = process.cwd();
const SEUIL_AA = 4.5;

/**
 * Une encre déclarée, avec son fond.
 *
 * `opacite` existe parce qu'une opacité n'est PAS une couleur mais change le contraste :
 * mesuré sur ce dépôt, `#1E3529` posé avec `opacity:0.5` sur blanc rend `#8E9A94` =
 * **2,92:1**. Une encre déclarée comme opaque décrit alors un texte qui n'existe pas.
 */
type Encre = { couleur: string; fond: string; ou: string; opacite?: number };
type Surface = {
  fichier: string;
  nom: string;
  famille: 'liste' | 'transactionnel' | 'auth';
  sortieExigee: boolean;
  encres: Encre[];
  fonds: string[];
};

/** Le pied commun aux mails du bar (pied gris chaud, encres maison). */
const FONDS_DU_BAR = ['#1E3529', '#ffffff', '#f5f3f0', '#f9f7f4'];

/**
 * Les 5 templates d'authentification partagent un seul squelette — vérifié :
 * mêmes fonds, mêmes encres, même ordre pour les cinq. Une table, cinq fichiers.
 */
const TEMPLATES_AUTH = [
  'email-templates/01-confirmation.html',
  'email-templates/02-invitation.html',
  'email-templates/03-magic-link.html',
  'email-templates/04-reset-password.html',
  'email-templates/05-change-email.html',
];

const ENCRES_TEMPLATE_AUTH: Encre[] = [
  { couleur: '#1E3529', fond: '#ffffff', ou: 'sur-titre « Bar Protéiné & Bien-Être »' },
  { couleur: '#1E3529', fond: '#ffffff', ou: 'titre du message (h2)' },
  { couleur: '#3a3a3a', fond: '#ffffff', ou: 'corps du message' },
  { couleur: '#ffffff', fond: '#1E3529', ou: "bouton d'action" },
  { couleur: '#6b6b6b', fond: '#ffffff', ou: 'mention « pas à l’origine de cette demande »' },
  { couleur: '#1E3529', fond: '#f5f3f0', ou: 'nom du bar (pied)' },
  { couleur: '#6b6b6b', fond: '#f5f3f0', ou: 'adresse et mention automatique (pied)' },
];

const SURFACES: Surface[] = [
  {
    fichier: 'supabase/functions/send-newsletter/index.ts',
    nom: 'newsletter — campagne (mail de liste)',
    famille: 'liste',
    sortieExigee: true,
    fonds: FONDS_DU_BAR,
    encres: [
      { couleur: 'rgba(255,255,255,0.55)', fond: '#1E3529', ou: 'sur-titre du bandeau' },
      { couleur: '#1E3529', fond: '#ffffff', ou: 'titre du message (h2)' },
      { couleur: '#3a3a3a', fond: '#ffffff', ou: 'corps du message' },
      { couleur: '#1E3529', fond: '#f5f3f0', ou: 'nom du bar (pied)' },
      { couleur: '#6b6b6b', fond: '#f5f3f0', ou: "ligne d'adresse (pied, 11 px)" },
      { couleur: '#3a3a3a', fond: '#f5f3f0', ou: 'mention « vous recevez cet e-mail » et lien « Se désinscrire »' },
    ],
  },
  {
    fichier: 'supabase/functions/newsletter-request-resubscribe/index.ts',
    nom: 'newsletter — demande de réinscription (mail transactionnel)',
    famille: 'transactionnel',
    sortieExigee: false,
    fonds: FONDS_DU_BAR,
    encres: [
      { couleur: '#1E3529', fond: '#ffffff', ou: 'titre du message (h2)' },
      { couleur: '#3a3a3a', fond: '#ffffff', ou: 'corps du message' },
      { couleur: '#ffffff', fond: '#1E3529', ou: 'bouton « Confirmer mon inscription »' },
      { couleur: '#6b6b6b', fond: '#ffffff', ou: 'mention « pas à l’origine de cette demande »' },
      { couleur: '#6b6b6b', fond: '#f5f3f0', ou: 'adresse (pied)' },
    ],
  },
  {
    fichier: 'supabase/functions/_shared/sendOrderConfirmation.ts',
    nom: 'commande confirmée (mail transactionnel)',
    famille: 'transactionnel',
    sortieExigee: false,
    fonds: ['#1E3529', '#ffffff', '#F7F5F1'],
    encres: [
      { couleur: '#ffffff', fond: '#1E3529', ou: 'enseigne (bandeau)' },
      { couleur: 'rgba(255,255,255,0.55)', fond: '#1E3529', ou: 'sur-titre du bandeau' },
      { couleur: '#1E3529', fond: '#ffffff', ou: 'titre de remerciement (h1)' },
      { couleur: '#1E3529', fond: '#ffffff', ou: 'lignes d’articles et total' },
      { couleur: '#1E3529', fond: '#ffffff', ou: 'montant total' },
      {
        couleur: '#6b6b6b',
        fond: '#ffffff',
        ou: 'étiquette « Paiement confirmé » (11 px) — une opacité n’est pas une encre',
      },
      { couleur: '#555', fond: '#ffffff', ou: 'numéro de commande et instructions de retrait' },
      { couleur: '#ffffff', fond: '#1E3529', ou: 'bouton « Suivre ma commande »' },
      { couleur: '#6b6b6b', fond: '#ffffff', ou: '« Des questions ? »' },
      { couleur: '#1E3529', fond: '#ffffff', ou: 'lien WhatsApp (téléphone)' },
      { couleur: '#6b6b6b', fond: '#F7F5F1', ou: 'signature © — hors de la carte blanche' },
    ],
  },
  ...TEMPLATES_AUTH.map((fichier) => ({
    fichier,
    nom: 'templates d’authentification — ' + fichier.split('/').pop(),
    famille: 'auth' as const,
    sortieExigee: false,
    fonds: FONDS_DU_BAR,
    encres: ENCRES_TEMPLATE_AUTH,
  })),
];

const FICHIER_AUTH = 'supabase/functions/newsletter-unsubscribe/index.ts';
const DECLAREES = new Set(SURFACES.map((s) => s.fichier));

// --- lecture -----------------------------------------------------------------
function lire(cheminRelatif: string): string {
  return readFileSync(resolve(RACINE, cheminRelatif), 'utf8');
}

function existe(cheminRelatif: string): boolean {
  try {
    lire(cheminRelatif);
    return true;
  } catch {
    return false;
  }
}

const SOURCE: Record<string, string> = {};
for (const s of SURFACES) SOURCE[s.fichier] = lire(s.fichier);
SOURCE[FICHIER_AUTH] = lire(FICHIER_AUTH);

// --- découverte --------------------------------------------------------------
const IGNORES = ['node_modules', 'dist', '.git', '__tests__', '.superpowers', '.cursor', '.agents'];

function fichiersSous(racine: string, extensions: string[]): string[] {
  const trouves: string[] = [];
  const parcourir = (dossier: string) => {
    let entrees;
    try {
      entrees = readdirSync(resolve(RACINE, dossier), { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entrees) {
      if (IGNORES.includes(e.name)) continue;
      const chemin = dossier + '/' + e.name;
      if (e.isDirectory()) parcourir(chemin);
      else if (extensions.some((x) => e.name.endsWith(x))) trouves.push(chemin);
    }
  };
  parcourir(racine);
  return trouves;
}

/** Toute surface qui rend un document de mail, où qu'elle vive. */
function documentsDeMail(): string[] {
  return ['supabase', 'email-templates', 'src']
    .flatMap((r) => fichiersSous(r, ['.ts', '.html']))
    .filter((f) => SOURCE[f] === undefined && /<!DOCTYPE html/i.test(lire(f)))
    .sort();
}

/** Fragments : un `.ts` serveur qui pose une encre en ligne est une surface de mail. */
function fragmentsAEncre(): string[] {
  return fichiersSous('supabase', ['.ts'])
    .filter((f) => /(?<!background-)color:\s*#/i.test(lire(f)))
    .sort();
}

// --- extraction --------------------------------------------------------------
const MOTIF_ENCRE = /(?<!background-)color:\s*(#[0-9A-Fa-f]{3,8}|rgba?\([^)]*\))/g;
const MOTIF_FOND = /background-color:\s*(#[0-9A-Fa-f]{3,8})/g;

function avecLigne(texte: string, motif: RegExp): { valeur: string; ligne: number }[] {
  const out: { valeur: string; ligne: number }[] = [];
  texte.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(motif)) out.push({ valeur: m[1], ligne: i + 1 });
  });
  return out;
}

// --- contraste WCAG ----------------------------------------------------------
const canal = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const luminance = (rgb: [number, number, number]) =>
  0.2126 * canal(rgb[0]) + 0.7152 * canal(rgb[1]) + 0.0722 * canal(rgb[2]);

function versRgb(couleur: string, fond: [number, number, number] = [255, 255, 255]): [number, number, number] {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(couleur.trim());
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(couleur.trim());
  if (rgba) {
    const [, r, g, b, a] = rgba;
    const alpha = a === undefined ? 1 : Number(a);
    const melange = (c1: number, c2: number) => Math.round(alpha * c1 + (1 - alpha) * c2);
    return [melange(Number(r), fond[0]), melange(Number(g), fond[1]), melange(Number(b), fond[2])];
  }
  throw new Error('couleur illisible : ' + couleur);
}

/** Applique une opacité déclarée : l'encre est mélangée à son fond avant toute mesure. */
function avecOpacite(couleur: string, fond: string, opacite?: number): string {
  if (opacite === undefined || opacite >= 1) return couleur;
  const f = versRgb(fond);
  const c = versRgb(couleur, f);
  const melange = (a: number, b: number) => Math.round(opacite * a + (1 - opacite) * b);
  const hexa = [melange(c[0], f[0]), melange(c[1], f[1]), melange(c[2], f[2])]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  return '#' + hexa;
}

function contraste(avant: string, arriere: string, opacite?: number): number {
  const fond = versRgb(arriere);
  const l1 = luminance(versRgb(avecOpacite(avant, arriere, opacite), fond));
  const l2 = luminance(fond);
  const [clair, sombre] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (clair + 0.05) / (sombre + 0.05);
}

// --- tests -------------------------------------------------------------------
describe('mails — découverte des surfaces', () => {
  it('aucune surface de mail n’échappe à la table (documents et fragments)', () => {
    const vues = [...new Set([...documentsDeMail(), ...fragmentsAEncre()])];
    const intrus = vues.filter((f) => !DECLAREES.has(f));
    expect(
      intrus,
      'Des surfaces de mail existent sans être déclarées dans la table de cette garde.\n' +
        'Soit on les déclare (encres + fonds + porte de sortie), soit elles ne rendent pas de mail :\n' +
        intrus.map((f) => '  ' + f).join('\n'),
    ).toEqual([]);
  });

  it('aucune surface déclarée n’a disparu du dépôt', () => {
    const disparues = SURFACES.filter((s) => !existe(s.fichier)).map(
      (s) => 'surface déclarée mais absente : ' + s.fichier,
    );
    expect(disparues, 'La table déclare des fichiers qui n’existent plus :\n' + disparues.join('\n')).toEqual([]);
  });
});

describe('mails — une surface à la fois', () => {
  for (const surface of SURFACES) {
    describe(surface.nom + ' (' + surface.fichier + ')', () => {
      const source = SOURCE[surface.fichier];
      const relatif = relative(RACINE, resolve(RACINE, surface.fichier));

      it('① aucune encre non déclarée', () => {
        const declarees = new Set(surface.encres.map((e) => e.couleur.toLowerCase()));
        const intrus = avecLigne(source, MOTIF_ENCRE)
          .filter(({ valeur }) => !declarees.has(valeur.toLowerCase()))
          .map(({ valeur, ligne }) => relatif + ':' + ligne + ' — encre non déclarée : ' + valeur);
        expect(
          intrus,
          'Cette surface de mail utilise des couleurs de texte absentes de la table de la garde.\n' +
            'Soit on les ajoute avec leur fond (et le contraste est recomputé), soit on ne les emploie pas :\n' +
            intrus.join('\n'),
        ).toEqual([]);
      });

      it('② les fonds déclarés existent, et aucun fond n’est posé sans être déclaré', () => {
        const declarees = new Set(surface.fonds.map((f) => f.toLowerCase()));
        const employes = avecLigne(source, MOTIF_FOND);
        const nonDeclares = employes
          .filter(({ valeur }) => !declarees.has(valeur.toLowerCase()))
          .map(({ valeur, ligne }) => relatif + ':' + ligne + ' — fond non déclaré : ' + valeur);
        const employesSet = new Set(employes.map(({ valeur }) => valeur.toLowerCase()));
        const introuvables = surface.fonds
          .filter((f) => !employesSet.has(f.toLowerCase()))
          .map((f) => 'fond déclaré dans la garde mais absent de la surface : ' + f + ' — la table a dérivé');
        const echecs = [...nonDeclares, ...introuvables];
        expect(
          echecs,
          'Désynchronisation entre la table des fonds et la surface : les couples encre × fond seraient ' +
            'recomputés sur un fond qui n’existe plus (un vert qui ne décrit plus le mail).\n' +
            echecs.join('\n'),
        ).toEqual([]);
      });

      it('③ chaque couple encre × fond déclaré passe AA (≥ 4,5:1)', () => {
        const echecs = surface.encres
          .map((e) => ({
            ...e,
            ratio: contraste(e.couleur, e.fond, e.opacite),
            effective: avecOpacite(e.couleur, e.fond, e.opacite),
          }))
          .filter((e) => e.ratio < SEUIL_AA)
          .map(
            (e) =>
              e.ou +
              ' : ' +
              e.couleur +
              (e.opacite !== undefined ? ' à ' + Math.round(e.opacite * 100) + ' % (= ' + e.effective + ')' : '') +
              ' sur ' +
              e.fond +
              ' → ' +
              e.ratio.toFixed(2) +
              ':1',
          );
        expect(
          echecs,
          'Encre sous AA dans un mail — ce texte est illisible à l’écran :\n' +
            echecs.join('\n') +
            '\nRemède : employer une encre DÉCLARÉE plutôt qu’une opacité, ou remonter l’opacité jusqu’à 4,5:1.',
        ).toEqual([]);
      });

      it('⑥ toute opacité de texte est déclarée, et aucune ne dort dans la table', () => {
        const trouvees = [...source.matchAll(/opacity:\s*([\d.]+)/g)].map((m) => Number(m[1]));
        const declarees = surface.encres.filter((e) => e.opacite !== undefined).map((e) => e.opacite as number);
        const vu = [...trouvees].sort().join(', ') || 'aucune';
        const attendu = [...declarees].sort().join(', ') || 'aucune';
        expect(
          vu,
          'Les opacités trouvées ne correspondent pas aux opacités déclarées.\n' +
            'Une opacité NON déclarée est comptée comme opaque par la règle ③ : une encre à 50 % peut être ' +
            'à 2,91:1 et passer pour 13:1. Une opacité déclarée puis retirée du code laisse la table mentir.\n' +
            'trouvées dans ' +
            surface.fichier +
            ' : ' +
            vu +
            '\ndéclarées dans la table : ' +
            attendu,
        ).toBe(attendu);
      });

      if (surface.sortieExigee) {
        it('④ la sortie visible existe, et la sortie annoncée vise une porte qui l’honore', () => {
          // porte humaine : la page du site, qui sait faire le POST signé
          expect(
            /unsubscribeUrl\s*=\s*`\$\{siteUrl\}\/newsletter\/desinscription/.test(source),
            'le lien de sortie visible ne pointe plus la page /newsletter/desinscription du site',
          ).toBe(true);

          // porte machine : l'en-tête List-Unsubscribe, posté par le fournisseur SANS JavaScript
          const entete = source.split('\n').find((l) => /'List-Unsubscribe':/.test(l)) ?? '';
          expect(entete, 'l’en-tête List-Unsubscribe a disparu du mail de liste').not.toBe('');
          const declaration = source.match(/const oneClickUrl[^\n]*/)?.[0] ?? '';
          expect(
            declaration,
            'la sortie annoncée ne vise plus la fonction : un POST de fournisseur sur la page SPA ' +
              'rend un 405 et personne n’est désinscrit (mesuré le 18/09 : 405, 0 octet)',
          ).toContain('/functions/v1/newsletter-unsubscribe');
          expect(entete, 'l’en-tête doit viser la porte machine, pas la page humaine').toContain('oneClickUrl');
        });
      } else {
        it('④ aucune ancre sans texte', () => {
          const ancres = [...source.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/gi)];
          const muettes = ancres
            .map((m, i) => ({ i, texte: m[1].replace(/<[^>]+>/g, '').trim() }))
            .filter((a) => a.texte.length === 0)
            .map((a) => 'ancre ' + (a.i + 1) + ' sans texte — un lien posé en image disparaît chez qui bloque les images');
          expect(ancres.length, 'aucune ancre trouvée dans cette surface de mail').toBeGreaterThan(0);
          expect(muettes, muettes.join('\n')).toEqual([]);
        });
      }
    });
  }
});

describe('mails — la porte de sortie ne se rouvre pas toute seule', () => {
  it('la fonction de désinscription refuse toute méthode non-POST avant d’écrire', () => {
    const source = SOURCE[FICHIER_AUTH];
    const garde = source.indexOf("req.method !== 'POST'");
    const ecriture = source.indexOf("supabase.rpc('fn_unsubscribe'");
    expect(garde, 'la fonction ne refuse plus les méthodes non-POST : un scanner d’e-mails peut vider la liste').toBeGreaterThan(-1);
    expect(ecriture, 'l’appel qui écrit (fn_unsubscribe) a disparu de la fonction').toBeGreaterThan(-1);
    expect(
      garde,
      'la sortie non-POST doit être rendue AVANT tout appel qui écrit — sinon un simple GET désabonne',
    ).toBeLessThan(ecriture);
  });
});
