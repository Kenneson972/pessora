# Design — Newsletter Admin + Envoi Resend

**Date :** 2026-06-03

## Objectif

Permettre à l'admin de composer et envoyer des newsletters aux abonnés via Resend.

## 1. Edge Function `send-newsletter`

**Fichier :** `supabase/functions/send-newsletter/index.ts`

- `verifyAdmin` — réservé aux admins
- Reçoit `{ subject, body }` — texte brut
- Fetch `newsletter_subscribers` (tous, actifs)
- Envoi via Resend API : `from: PessÓra <noreply@pessora.fr>`, `bcc: [tous les abonnés]`
- Retourne `{ success: true, count: N }`
- Pattern : copier `send-contact-email`

## 2. Admin Composer

**Fichier :** `src/pages/admin/AdminCommunications.tsx`

Dans l'onglet "Newsletter" existant :
- Formulaire : sujet + textarea (corps du message)
- Bouton "Envoyer à X abonnés"
- ConfirmDialog avant envoi
- Statut : idle / sending / sent / error
- Historique du dernier envoi (stocké en state local)
- L'export CSV et la liste des abonnés restent inchangés

## Fichiers

| Action | Fichier |
|--------|---------|
| CRÉER | `supabase/functions/send-newsletter/index.ts` |
| MODIFIER | `src/pages/admin/AdminCommunications.tsx` |
