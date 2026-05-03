# Mes Bilans — Espace Membre

## Objectif

Créer une page **intégrée à l'espace membre** pour que les utilisateurs connectés puissent :

1. **Voir l'historique** de leurs bilans (passés et à venir) avec statut
2. **Réserver un nouveau bilan** avec un formulaire simplifié (champs pré-remplis depuis le profil)
3. **Annuler** une réservation en attente

Actuellement, le lien "Bilans bien-être" dans la sidebar membre redirige vers la page publique `/bilan-bien-etre`. Il doit désormais pointer vers l'espace membre.

---

## Architecture

### Nouveau fichier

- `src/pages/member/MesBilans.tsx` — composant principal de la page

### Fichiers modifiés

- `src/components/member/MemberLayout.tsx` — changer le lien `Bilans bien-être` de `/bilan-bien-etre` vers `${prefix}/bilans`
- `src/App.tsx` — ajouter la route lazy `{ segment: 'bilans', element: <MesBilans /> }` dans la liste des routes membres

### Pas de nouveau hook

Le composant `MesBilans.tsx` charge les données directement via `useEffect` + `supabase` (comme `Dashboard.tsx`, pas de hook séparé pour rester simple). La logique de réservation (`onSubmit`) est intégrée dans le composant.

---

## Structure de la page

```
DashPageHeader
  breadcrumb: "Bilan personnalisé"
  title: "Mes bilans bien-être"
  subtitle: "Gérez vos rendez-vous et réservez un nouveau bilan en un clic."

─── Section 1 : Mes bilans (historique) ───

  [Loading → spinner ou skeleton]
  [Empty → "Aucun bilan pour le moment" + CTA "Réserver"]
  [Liste → DashCard avec lignes]

  Chaque ligne :
    [Date tile]  Bilan · {date formatée}
                 à {heure} · {statut pastille + libellé}
                                       [Annuler si en_attente]

  Stats en haut : compteur "X bilans confirmés"

─── Separator ───

─── Section 2 : Nouveau bilan ───

  CalendarPicker (réutilisé/compatible avec la page publique)
  Créneaux disponibles pour la date sélectionnée

  Formulaire minimal :
    - Nom, prénom, téléphone, email : invisibles, pré-remplis depuis `user`
    - Message (textarea, optionnel)
    - Checkbox privacyAccepted
    - Bouton "Confirmer mon Bilan Bien-être"

  [Succès → message de confirmation + récap]

─── Fin ───
```

---

## Data flow

### Chargement initial

```typescript
// Historique des réservations du user
supabase
  .from('bilan_bookings')
  .select('*')
  .eq('user_id', user.id)
  .order('date_rdv', { ascending: false })
```

### Réservation (identique à la page publique)

1. Insérer dans `bilan_bookings` : `{ slot_id, user_id, nom, prenom, telephone, email, date_rdv, heure_rdv, statut: 'en_attente', notes }`
2. Mettre à jour `bilan_slots` : `{ disponible: false }`
3. Afficher l'état de succès

### Annulation

1. modal de confirmation
2. `supabase.from('bilan_bookings').update({ statut: 'annule' }).eq('id', bookingId)`
3. Le slot redevient disponible
4. Rafraîchir la liste

---

## Composants dashboard réutilisés

Mêmes composats que les autres pages membre (`Dashboard.tsx`, `MesEvenements.tsx`) :

- `DashPageHeader` — header éditorial
- `DashCard` — carte pour l'historique
- `DashBtn` — boutons (annuler, réserver)
- `DashEyebrow` — petits labels
- `DASH_MAIN_PAD` — padding standard

---

## États à gérer

- **Loading** : spinner/skeleton pendant le chargement des réservations et des slots
- **Empty** : "Aucun bilan pour le moment" + CTA
- **Error (fetch)** : message d'erreur si les créneaux ne chargent pas
- **Error (submit)** : message d'erreur si la réservation échoue
- **Success (submit)** : message de confirmation + récap
- **Cancel confirmation** : modal avant annulation

---

## Non inclus (v1)

- **Pas de notion de quota Óra+** : le bilan n'est pas limité, c'est juste un bénéfice de l'abonnement
- **Pas d'édition** : on ne peut pas modifier une réservation existante, seulement l'annuler
- **Pas de réservation pour un proche** : le bilan est lié au profil connecté
