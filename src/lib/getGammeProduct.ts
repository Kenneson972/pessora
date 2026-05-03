import { toSlug } from './toSlug';
import { rangesData } from '../data/productsData';

export type GammeProductStatic = {
  name: string;
  description: string;
  price: string;
  image?: string;
  ingredients?: string[];
  benefits?: string[];
};

export function getGammeProduct(
  rangeId: string,
  slug: string,
): { product: GammeProductStatic; rangeName: string; rangeHeroImage: string } | null {
  const range = rangesData[rangeId as keyof typeof rangesData];
  if (!range) return null;

  const product = range.products.find((p) => toSlug(p.name) === slug);
  if (!product) return null;

  return {
    product,
    rangeName: range.title,
    rangeHeroImage: range.heroImage,
  };
}
