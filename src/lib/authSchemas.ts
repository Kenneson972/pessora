import { z } from 'zod';

/** Connexion — messages FR pour alignement kb-forms / audit Karibloom */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Saisissez votre adresse e-mail.')
    .email({ message: 'Adresse e-mail invalide. Exemple : vous@email.com' })
    .max(254, 'Adresse e-mail trop longue.'),
  password: z.string().min(1, 'Saisissez votre mot de passe.').max(128, 'Mot de passe trop long.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Saisissez votre prénom.')
    .max(80, 'Prénom trop long.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Saisissez votre nom.')
    .max(80, 'Nom trop long.'),
  email: z
    .string()
    .trim()
    .min(1, 'Saisissez votre adresse e-mail.')
    .email({ message: 'Adresse e-mail invalide. Exemple : vous@email.com' })
    .max(254, 'Adresse e-mail trop longue.'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .max(128, 'Mot de passe trop long.'),
  acceptLegal: z.boolean().refine((v) => v === true, {
    message:
      'Veuillez accepter la politique de confidentialité et les CGV pour créer un compte.',
  }),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
