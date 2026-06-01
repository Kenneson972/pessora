import { useLocation } from 'react-router-dom';

const BREADCRUMB_LABELS: Record<string, string> = {
  menu: 'Menu',
  concept: 'Le Concept',
  'nos-produits': 'Nos Produits',
  evenements: 'Événements',
  contact: 'Contact',
  'ora-plus': 'Óra+',
  'mon-espace': 'Mon espace',
  'suivi-commande': 'Suivi de commande',
};

export function BreadcrumbJsonLd() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const items = segments.map((seg, i) => {
    const url = `${window.location.origin}/${segments.slice(0, i + 1).join('/')}`;
    const label = BREADCRUMB_LABELS[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      '@type': 'ListItem' as const,
      position: i + 1,
      item: { '@id': url, name: label },
    };
  });

  const payload = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
