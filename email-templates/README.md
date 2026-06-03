# Templates Email Pessora — Supabase

## Où les mettre
Dashboard Supabase → **Authentication** → **Email Templates**

| # | Template Supabase | Fichier |
|---|-------------------|---------|
| 1 | **Confirm Signup** | `01-confirmation.html` |
| 2 | **Invite User** | `02-invitation.html` |
| 3 | **Magic Link** | `03-magic-link.html` |
| 4 | **Reset Password** | `04-reset-password.html` |
| 5 | **Change Email Address** | `05-change-email.html` |

## Variables Supabase utilisées
Tous les templates utilisent `{{ .ConfirmationURL }}` pour le bouton principal.

## Design
- **Vert sapin** `#2D5A27` — header, boutons, titres
- **Fond** `#F5F2ED` — beige chaud
- **Footer** `#F8F6F3` — discret
- **Police** Georgia, serif — élégance pharmacie
- **Signature** "Votre bien-être, notre nature"

## À faire dans le dashboard
1. Coller le HTML complet dans chaque template
2. Remplacer l'expéditeur par `Pessora <noreply@pessora.fr>` (ou domaine configuré)
3. Tester avec un vrai compte
