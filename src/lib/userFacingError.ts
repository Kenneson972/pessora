/**
 * Messages utilisateur (FR) — éviter d’afficher les codes techniques bruts.
 */

export function formatAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_credentials') || m.includes('invalid email or password')) {
    return 'Adresse e-mail ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.';
  }
  if (m.includes('email not confirmed')) {
    return 'Votre e-mail n’est pas encore confirmé. Ouvrez le lien reçu dans votre boîte mail.';
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Trop de tentatives. Patientez une minute avant de réessayer.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Connexion interrompue. Vérifiez votre réseau et réessayez.';
  }
  return 'Connexion impossible pour le moment. Réessayez ou écrivez-nous depuis la page Contact.';
}

export function formatRegisterError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('user already') || m.includes('already been registered')) {
    return 'Un compte existe déjà avec cette adresse. Connectez-vous ou utilisez une autre adresse e-mail.';
  }
  if (m.includes('password') && (m.includes('short') || m.includes('weak') || m.includes('least'))) {
    return 'Mot de passe trop court ou trop simple. Utilisez au moins 8 caractères.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Connexion interrompue. Vérifiez votre réseau et réessayez.';
  }
  return 'Impossible de créer le compte. Vérifiez les champs ou contactez-nous depuis la page Contact.';
}

type DataContext = 'members' | 'events' | 'products' | 'generic';

export function formatSupabaseDataError(message: string, context: DataContext = 'generic'): string {
  const m = message.toLowerCase();
  if (/permission denied|rls|policy|jwt|not authorized/i.test(m)) {
    return 'Accès refusé par la base de données. Vérifiez votre rôle (admin) et les règles de sécurité (RLS) sur Supabase.';
  }
  if (/network|fetch|failed to fetch|load failed/i.test(m)) {
    return 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.';
  }
  const intro: Record<DataContext, string> = {
    members: 'La liste des membres n’a pas pu être chargée.',
    events: 'Les événements n’ont pas pu être chargés.',
    products: 'Les produits n’ont pas pu être chargés.',
    generic: 'Les données n’ont pas pu être chargées.',
  };
  return `${intro[context]} Réessayez dans un instant. Si le problème continue, utilisez la page Contact.`;
}

export function formatMutationError(message: string): string {
  const m = message.toLowerCase();
  if (/permission denied|rls|policy/i.test(m)) {
    return 'Enregistrement refusé : droits insuffisants ou règle de sécurité sur la base.';
  }
  if (/network|fetch/i.test(m)) {
    return 'Enregistrement impossible : connexion au serveur interrompue.';
  }
  return 'L’enregistrement a échoué. Vérifiez les champs et réessayez.';
}
