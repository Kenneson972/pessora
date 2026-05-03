/** URL vers un fichier dans `public/` (compatible `import.meta.env.BASE_URL`). */
export function publicAsset(rel: string): string {
  const base = import.meta.env.BASE_URL;
  const root = base.endsWith('/') ? base : `${base}/`;
  return `${root}${rel.replace(/^\//, '')}`;
}

/**
 * Incrémenter quand on remplace les binaires sous `public/videos/evenements-communaute*`
 * pour forcer le rechargement (cache HTTP / cache média du navigateur).
 */
export const EVENEMENTS_COMMUNAUTE_ASSET_V = '9';

export function publicAssetWithCache(rel: string, v = EVENEMENTS_COMMUNAUTE_ASSET_V): string {
  return `${publicAsset(rel)}?v=${v}`;
}
