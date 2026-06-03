# Templates Email PessÓra — Supabase

## Où les mettre
Dashboard Supabase → **Authentication** → **Email Templates**

| # | Template Supabase | Fichier | Icône |
|---|-------------------|---------|-------|
| 1 | **Confirm Signup** | `01-confirmation.html` | 🧪 |
| 2 | **Invite User** | `02-invitation.html` | 💌 |
| 3 | **Magic Link** | `03-magic-link.html` | 🔐 |
| 4 | **Reset Password** | `04-reset-password.html` | 🔑 |
| 5 | **Change Email Address** | `05-change-email.html` | ✉️ |

## Variables Supabase utilisées
Tous les templates utilisent `{{ .ConfirmationURL }}` pour le bouton principal.

## Design
- **Vert sapin** `#1E3529` — header, boutons, titres (identique au site)
- **Fond** `#F9F7F4` — chaud, neutre
- **Footer** `#F5F3F0` — discret
- **Police** Georgia (titres) + system sans-serif (corps) — lisible partout
- **Signature** "Bar Protéiné & Bien-Être" — cohérent avec la marque
- **Boutons** radius 2px — aligné avec le design system du site
- Chaque template a une icône distincte pour différencier le type d'email

## À faire dans le dashboard Supabase
1. Coller le HTML complet dans chaque template
2. Configurer l'expéditeur : `PessÓra <noreply@pessora.fr>`
3. Tester avec un vrai compte
