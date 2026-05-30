import { describe, it, expect } from 'vitest';
import { normalizeMenuCategory, productRowToMenuItem } from '../lib/menuCatalog';
import type { Product } from '../types/database';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-id',
    name: 'Test Drink',
    category: 'wellness',
    price: 10,
    price_small: null,
    price_medium: null,
    price_large: null,
    calories: null,
    protein: null,
    description: null,
    ingredients: null,
    benefits: null,
    image_url: null,
    active: true,
    slug: 'test-drink',
    pitch: null,
    icon_emoji: null,
    badges: null,
    carousel_sort: null,
    carousel_badge: null,
    gallery: [],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('normalizeMenuCategory', () => {
  it('passe les catégories valides', () => {
    expect(normalizeMenuCategory('wellness')).toBe('wellness');
    expect(normalizeMenuCategory('energie')).toBe('energie');
    expect(normalizeMenuCategory('shakes')).toBe('shakes');
    expect(normalizeMenuCategory('coffee')).toBe('coffee');
  });

  it('résout les alias', () => {
    expect(normalizeMenuCategory('énergie')).toBe('energie');
    expect(normalizeMenuCategory('energie_drink')).toBe('energie');
    expect(normalizeMenuCategory('energy')).toBe('energie');
    expect(normalizeMenuCategory('shake')).toBe('shakes');
    expect(normalizeMenuCategory('shakes_proteines')).toBe('shakes');
    expect(normalizeMenuCategory('cafe')).toBe('coffee');
    expect(normalizeMenuCategory('café')).toBe('coffee');
  });

  it('retourne null pour une catégorie inconnue', () => {
    expect(normalizeMenuCategory('unknown')).toBeNull();
    expect(normalizeMenuCategory('')).toBeNull();
    expect(normalizeMenuCategory(null as any)).toBeNull();
  });
});

describe('productRowToMenuItem', () => {
  it('convertit un produit BDD valide en MenuItem', () => {
    const product = makeProduct({
      slug: 'glow-my-skin',
      name: 'Glow My Skin',
      category: 'wellness',
      price: 10,
      description: 'Un cocktail beauté',
      pitch: 'Beauté & éclat',
      icon_emoji: '✨',
      calories: 30,
      ingredients: ['Hibiscus', 'Collagène'],
      benefits: ['Peau', 'Articulation'],
      badges: ['vegan', 'glutenfree'],
      price_small: 8,
      price_large: 12,
    });

    const result = productRowToMenuItem(product);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('glow-my-skin');
    expect(result!.name).toBe('Glow My Skin');
    expect(result!.category).toBe('wellness');
    expect(result!.price).toBe(10);
    expect(result!.price_small).toBe(8);
    expect(result!.price_large).toBe(12);
    expect(result!.calories).toBe(30);
    expect(result!.description).toBe('Un cocktail beauté');
    expect(result!.pitch).toBe('Beauté & éclat');
    expect(result!.icon).toBe('✨');
    expect(result!.ingredients).toEqual(['Hibiscus', 'Collagène']);
    expect(result!.benefits).toEqual(['Peau', 'Articulation']);
    expect(result!.badges).toEqual(['vegan', 'glutenfree']);
  });

  it('utilise le slug comme id, sinon l\'id BDD', () => {
    const withSlug = makeProduct({ slug: 'my-slug', id: 'uuid-123' });
    expect(productRowToMenuItem(withSlug)!.id).toBe('my-slug');

    const noSlug = makeProduct({ slug: null, id: 'uuid-456' });
    expect(productRowToMenuItem(noSlug)!.id).toBe('uuid-456');
  });

  it('filtre les badges invalides', () => {
    const product = makeProduct({ category: 'wellness', badges: ['vegan', 'invalid', 'glutenfree', 'autre'] as any });
    expect(productRowToMenuItem(product)!.badges).toEqual(['vegan', 'glutenfree']);
  });

  it('retourne null pour une catégorie non reconnue', () => {
    const product = makeProduct({ category: 'inconnue' });
    expect(productRowToMenuItem(product)).toBeNull();
  });

  it('gère les valeurs par défaut pour les champs null', () => {
    const product = makeProduct({
      category: 'coffee',
      description: null,
      pitch: null,
      ingredients: null,
      benefits: null,
      badges: null,
    });
    const result = productRowToMenuItem(product);
    expect(result!.description).toBe('');
    expect(result!.pitch).toBe('');
    expect(result!.ingredients).toEqual([]);
    expect(result!.benefits).toEqual([]);
    expect(result!.badges).toBeUndefined();
  });
});
