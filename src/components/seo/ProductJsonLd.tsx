interface ProductJsonLdProps {
  name: string;
  description: string;
  image?: string | null;
  price: number;
  category: string;
  url: string;
}

export function ProductJsonLd({ name, description, image, price, category, url }: ProductJsonLdProps) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    ...(image ? { image } : {}),
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url,
    },
    category,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload, null, 2) }}
    />
  );
}

interface ItemListJsonLdProps {
  items: Array<{ name: string; url: string; position: number }>;
}

export function ItemListJsonLd({ items }: ItemListJsonLdProps) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      item: {
        '@type': 'Product',
        name: item.name,
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
