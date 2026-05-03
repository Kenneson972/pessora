import { z } from 'zod';

/** Types de projet — valeur envoyée avec le formulaire (préparation backend / webhook). */
export const partnershipTypeKeys = [
  'evenement_popup',
  'sponsoring',
  'offre_produit',
  'lieu_collaboration',
  'media_presse',
  'autre',
] as const;

export type PartnershipTypeKey = (typeof partnershipTypeKeys)[number];

export const partnershipTypeLabels: Record<PartnershipTypeKey, string> = {
  evenement_popup: 'Événement ou pop-up',
  sponsoring: 'Sponsoring / visibilité',
  offre_produit: 'Offre produits / corners',
  lieu_collaboration: 'Lieu ou animation commune',
  media_presse: 'Média / presse',
  autre: 'Autre projet',
};

export const contactPartnershipSchema = z.object({
  organisation: z.string().trim().min(2, 'Indiquez le nom de votre structure.').max(120),
  contactName: z.string().trim().min(2, 'Indiquez votre nom.').max(80),
  email: z
    .string()
    .trim()
    .email({ message: 'Adresse e-mail invalide. Exemple : contact@votre-structure.com' })
    .max(254),
  phone: z.string().trim().max(40),
  partnershipType: z.enum(partnershipTypeKeys, {
    required_error: 'Choisissez un type de projet.',
    invalid_type_error: 'Choisissez un type de projet.',
  }),
  message: z
    .string()
    .trim()
    .min(20, 'Décrivez votre projet en quelques lignes (minimum 20 caractères).')
    .max(4000),
  acceptPrivacy: z.boolean().refine((v) => v === true, {
    message: 'Veuillez accepter la politique de confidentialité.',
  }),
});

export type ContactPartnershipFormValues = z.infer<typeof contactPartnershipSchema>;
