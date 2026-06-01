interface EventJsonLdProps {
  name: string;
  description?: string | null;
  startDate: string;
  location?: string | null;
  image?: string | null;
  url: string;
}

export function EventJsonLd({ name, description, startDate, location, image, url }: EventJsonLdProps) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    ...(description ? { description } : {}),
    startDate,
    ...(location
      ? { location: { '@type': 'Place', name: location, address: location } }
      : {}),
    ...(image ? { image } : {}),
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload, null, 2) }}
    />
  );
}

interface EventItemListJsonLdProps {
  items: Array<{ name: string; startDate: string; url: string }>;
}

export function EventItemListJsonLd({ items }: EventItemListJsonLdProps) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: item.name,
        startDate: item.startDate,
        url: item.url,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload, null, 2) }}
    />
  );
}
