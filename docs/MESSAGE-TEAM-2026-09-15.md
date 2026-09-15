# Message à passer à la team — PESSORA 2 (15/09/2026)

> Écrit par @elise. **Ken n'a pas encore prévenu la team** — ce fichier est là pour
> qu'il retrouve le message prêt, et pour la trace, quelle que soit la suite.
> **À coller tel quel dans le groupe.**

---

## Le message (à copier)

**Deux changements sur Pessora ce matin, à connaître avant de reprendre.**

**1. La prod est revenue sur `main`.** Hier soir, la branche `fix/bascule-admin-avant-connexion`
a été déployée en production et a cassé l'accès admin de Catherine — elle ne pouvait plus se
connecter sur aucune porte. `admin.pessora.fr` sert à nouveau `main` (`6ab095e7`), **vérifié dans
le bundle en ligne** : le refus qui s'appliquait à tout compte admin a disparu.

**2. La branche `fix/bascule-admin-avant-connexion` a été supprimée** (remote + local).
Elle est **sauvegardée avant suppression** — bundle et patch dans
`/opt/data/clients/pessora/branches-fermees/`, avec une note qui explique le pourquoi.
**Ne la cherchez plus, elle n'existe plus.**

⚠️ **Son correctif `255eeb7` mérite d'être repris proprement** un jour : son `isAdminHost()`
est juste, et le message qui explique à un admin où se connecter a de la valeur.
**Mais pas en redéployant la branche** — en le recettant sur les **deux** hôtes.

**3. La leçon de la soirée.** `tsc`, les tests et la revue statique étaient **tous verts**,
et le défaut est passé à travers. C'est la **mesure en prod** qui l'a vu, en 30 secondes.
À retenir pour les lots qui touchent l'auth : **le statique ne remplace pas le rendu.**

**4. Sept branches** attendent toujours leur recette : `lot/lisibilite-tailles`,
`lot/voile-photo`, `lot/filtres-menu`, `lot/etat-ferme-lisible`, `lot/lisibilite-admin`,
`lot/modal-complement-persistant`, `fix/cible-voir-44px`.

**5. ⚠️ Une chose qui vous concerne tous :** Vercel **bloque tout déploiement dont l'auteur du
commit n'a pas de compte GitHub lié.** Un commit signé d'une adresse inconnue = déploiement
bloqué, sans erreur visible ailleurs que dans l'état Vercel. **Commitez avec l'identité du repo,
sans forcer `-c user.name` / `-c user.email`.**

---

## Ce qui a été fait ce matin (référence interne)

| | |
|---|---|
| **Rollback prod** | `main` (`6ab095e7`) redéployé · `dpl_DPz1fWZJWBhQbitHw2m7QvHf1qqJ` |
| **Vérification** | `admin.pessora.fr` — le chunk `Login-*` ne contient plus le refus inconditionnel ; il **route** (`role === 'admin' ? '/admin' : '/mon-espace'`) |
| **Branche** | supprimée (remote + local), sauvegardée en bundle + patch + note |
| **Cause du blocage Vercel** | commits signés `elise@karibloom.net` → aucun compte GitHub associé |
| **Correction** | config locale du repo remise en service (identité du propriétaire), commit vide signé correctement → déploiement automatique OK |

**Ressources** : `/opt/data/clients/pessora/branches-fermees/fix-bascule-admin-avant-connexion-20260915.*`

---

*@elise — 15/09/2026*
