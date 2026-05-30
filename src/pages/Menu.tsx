import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Skeleton, cn } from '@heroui/react';
import { EmptyState, Segment } from '@heroui-pro/react';
import { ShoppingBag } from 'lucide-react';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ItemListJsonLd } from '../components/seo/ProductJsonLd';
import { ProductCard } from '../components/ui/ProductCard';
import { categoryNames, type MenuItem } from '../data/menuData';
import { useMenuCatalog } from '../hooks/useMenuCatalog';
import { useFadeUpWhenVisible, useStaggerReveal } from '../lib/motionReveal';
import { formatEurFr } from '../lib/oraPricing';
import { useIsOraPlus } from '../hooks/useIsOraPlus';
import { OraPlusTeaserStrip } from '../components/common/OraPlusTeaserStrip';
import { DrinkOptionsModal } from '../components/cart/DrinkOptionsModal';

function normalizeStr(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function itemMatchesQuery(item: MenuItem, query: string): boolean {
  const q = normalizeStr(query.trim());
  if (!q) return true;
  const blob = normalizeStr(
    [item.name, item.description ?? '', categoryNames[item.category]].join(' ')
  );
  return blob.includes(q);
}

function formatMacros(item: MenuItem): string | undefined {
  const parts: string[] = [];
  if (item.protein)  parts.push(`${item.protein}g protéines`);
  if (item.calories) parts.push(`${item.calories} kcal`);
  return parts.length ? parts.join(' · ') : undefined;
}

/** Ordre d'affichage des sections « Tout » (grille unique, même densité pour toutes les gammes). */
const CATEGORY_GROUPS = [
  { label: 'Wellness', key: 'wellness' as const },
  { label: 'Énergie Drink', key: 'energie' as const },
  { label: 'Shakes Protéinés', key: 'shakes' as const },
  { label: 'Coffee', key: 'coffee' as const },
];
const PRODUCT_GRID_CLASS =
  'grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-8';

const CARD_ITEM_CLASS = 'min-w-0';

function MenuGridSkeleton() {
  return (
    <div className={PRODUCT_GRID_CLASS}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className={`${CARD_ITEM_CLASS} overflow-hidden rounded-[2px] border border-noir/[0.08] bg-ivory`}>
          <Skeleton className="aspect-[5/6] w-full rounded-none bg-noir/[0.06]" />
          <Card.Content className="space-y-2.5 p-3">
            <Skeleton className="h-2.5 w-1/3 rounded-[1px] bg-noir/[0.08]" />
            <Skeleton className="h-2.5 w-3/4 rounded-[1px] bg-noir/[0.06]" />
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

const Menu = () => {
  useEffect(() => { document.title = 'Carte — PessÓra'; }, []);
  const { items: catalogItems, loading } = useMenuCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSizes, setSelectedSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>({});
  const [optionsItem, setOptionsItem] = useState<MenuItem | null>(null);
  const { container: staggerContainer, item: staggerItem } = useStaggerReveal();
  const fadeCta = useFadeUpWhenVisible();
  const { effectiveUnitPrice } = useIsOraPlus();

  const searchQuery = (searchParams.get('q') ?? '').trim();
  const isSearchMode = searchQuery.length > 0;

  const filterKey = searchParams.get('gamme');
  const activeCategory = !filterKey ? null : filterKey as MenuItem['category'];

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  /** En recherche, respecter ?gamme= : une seule section si filtre actif (sinon toutes les gammes). */
  const searchSections = useMemo(() => {
    if (!isSearchMode) return [];
    const groups = activeCategory
      ? CATEGORY_GROUPS.filter((g) => g.key === activeCategory)
      : CATEGORY_GROUPS;
    return groups
      .map(({ label, key }) => {
        const items = catalogItems
          .filter((i) => i.category === key)
          .filter((i) => itemMatchesQuery(i, searchQuery));
        return { label, key, items };
      })
      .filter((s) => s.items.length > 0);
  }, [isSearchMode, searchQuery, catalogItems, activeCategory]);

  const searchTotalCount = useMemo(
    () => searchSections.reduce((n, s) => n + s.items.length, 0),
    [searchSections]
  );

  const renderCard = (menuItem: MenuItem) => {
    const hasSizes =
      menuItem.price_small != null &&
      menuItem.price_medium != null &&
      menuItem.price_large != null;
    const selectedSize = hasSizes ? (selectedSizes[menuItem.id] ?? 'medium') : null;
    const effectivePrice = hasSizes
      ? selectedSize === 'small'
        ? menuItem.price_small!
        : selectedSize === 'large'
        ? menuItem.price_large!
        : menuItem.price_medium!
      : menuItem.price;

    const cardFooter = (
      <div className="mt-1.5">
        <div className="flex items-center gap-1">
          {hasSizes && (
            <div className="flex flex-1 gap-1">
              {(['small', 'medium', 'large'] as const).map((s) => {
                const sPrice =
                  s === 'small'
                    ? menuItem.price_small!
                    : s === 'medium'
                    ? menuItem.price_medium!
                    : menuItem.price_large!;
                const sLabel = s === 'small' ? 'P' : s === 'medium' ? 'M' : 'G';
                const isSelected = selectedSize === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSizes((prev) => ({ ...prev, [menuItem.id]: s }))}
                    className={cn(
                      'flex-1 rounded-[2px] border py-1 text-[7px] font-normal uppercase tracking-[0.08em] transition-colors',
                      isSelected
                        ? 'border-sapin bg-sapin text-white'
                        : 'border-noir/12 text-black/40 hover:border-noir/25 hover:text-black',
                    )}
                    aria-pressed={isSelected}
                  >
                    {sLabel} {sPrice}€
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => setOptionsItem(menuItem)}
            className="flex shrink-0 items-center justify-center gap-1 rounded-[2px] border border-noir/[0.1] px-2.5 py-1 text-[7px] font-normal uppercase tracking-[0.12em] text-black/45 transition-colors hover:border-noir/25 hover:text-noir"
          >
            <ShoppingBag className="h-2.5 w-2.5" strokeWidth={1.4} aria-hidden />
            Ajouter
          </button>
        </div>
      </div>
    );

    return (
      <motion.div key={menuItem.id} variants={staggerItem} className={CARD_ITEM_CLASS}>
        <ProductCard
          tag={categoryNames[menuItem.category]}
          name={menuItem.name}
          macros={formatMacros(menuItem)}
          price={`${effectivePrice}€`}
          oraMemberHint={formatEurFr(effectiveUnitPrice(effectivePrice))}
          icon={menuItem.icon}
          image={menuItem.image_url}
          linkTo={`/menu/${menuItem.id}`}
          density="compact"
          footer={cardFooter}
        />
      </motion.div>
    );
  };

  const productGridMotionProps = {
    variants: staggerContainer,
    initial: false,
    animate: 'visible' as const,
  };

  const singleItems = activeCategory ? catalogItems.filter((i) => i.category === activeCategory) : [];

  return (
    <div className="min-h-screen bg-white">
      <ItemListJsonLd
        items={catalogItems.map((item, index) => ({
          name: item.name,
          url: `${window.location.origin}/menu/${item.id}`,
          position: index + 1,
        }))}
      />

      {/* ─── Hero typographique ─── */}
      <section className="bg-sapin px-4 py-20 md:py-28 text-center">
        <h1
          className="font-display font-normal leading-[0.9] text-white"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 7vw, 80px)' }}
        >
          La Carte
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-[16px] font-light leading-relaxed text-white/55">
          Boissons protéinées, shakes & coffee — préparés minute à Fort-de-France
        </p>
      </section>

      {isSearchMode && (
        <div className="border-b border-noir/[0.06] bg-surface-muted px-4 md:px-10 lg:px-[72px]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-3.5">
            <p className="text-[11px] font-light tracking-[0.03em] text-black/55">
              {searchTotalCount > 0 ? (
                <>
                  <span className="text-black/35">
                    {searchTotalCount} résultat{searchTotalCount !== 1 ? 's' : ''} pour{' '}
                  </span>
                  <span className="font-normal text-black">« {searchQuery} »</span>
                </>
              ) : (
                <>
                  <span className="text-black/35">Aucun résultat pour </span>
                  <span className="font-normal text-black">« {searchQuery} »</span>
                </>
              )}
            </p>
            <Button
              type="button"
              variant="ghost"
              onPress={clearSearch}
              className="h-11 min-h-[44px] rounded-full border border-noir/12 px-4 text-[10px] font-light uppercase tracking-[0.14em] text-black/50 hover:text-black"
            >
              Effacer
            </Button>
          </div>
        </div>
      )}

      {/* Filtre par gamme — Segment HeroUI Pro */}
      {!isSearchMode && (
        <div className="border-b border-noir/[0.06] bg-white px-4 md:px-10 lg:px-[72px]">
          <div className="mx-auto flex max-w-7xl justify-center py-4 md:py-5">
            <Segment
              size="sm"
              selectedKey={filterKey ?? 'all'}
              onSelectionChange={(key) => {
                if (!key || key === 'all') {
                  const next = new URLSearchParams(searchParams);
                  next.delete('gamme');
                  setSearchParams(next, { replace: true });
                } else {
                  const next = new URLSearchParams(searchParams);
                  next.set('gamme', key as string);
                  setSearchParams(next, { replace: true });
                }
              }}
              aria-label="Filtrer par gamme"
            >
              <Segment.Item id="all">
                <Segment.Separator />
                Tout
              </Segment.Item>
              <Segment.Item id="wellness">
                <Segment.Separator />
                Wellness
              </Segment.Item>
              <Segment.Item id="energie">
                <Segment.Separator />
                Énergie
              </Segment.Item>
              <Segment.Item id="shakes">
                <Segment.Separator />
                Shakes
              </Segment.Item>
              <Segment.Item id="coffee">
                <Segment.Separator />
                Coffee
              </Segment.Item>
            </Segment>
          </div>
        </div>
      )}

      <div className="px-4 pb-5 md:px-10 lg:px-[72px]">
        <div className="mx-auto max-w-7xl">
          <OraPlusTeaserStrip variant="muted" />
        </div>
      </div>

      {/* Products — un seul grid unifié, le filtre onglet gère la catégorie */}
      <div className="px-4 pb-16 md:px-10 lg:px-[72px]">
        <div className="mx-auto max-w-7xl">
        {loading && catalogItems.length === 0 ? (
          <section className="pt-10 md:pt-12">
            <MenuGridSkeleton />
          </section>
        ) : isSearchMode ? (
          searchSections.length > 0 ? (
            searchSections.map(({ label, key, items }) => (
              <section key={key} className="pt-10 first:pt-6 md:pt-12 md:first:pt-8">
                <SectionTitle title={label} />
                <motion.div key={`search-${key}`} className={PRODUCT_GRID_CLASS} {...productGridMotionProps}>
                  {items.map(renderCard)}
                </motion.div>
              </section>
            ))
          ) : (
            <EmptyState className="my-10 rounded-[2px] border border-noir/[0.08] bg-surface-muted px-6 py-12 md:py-14">
              <EmptyState.Header>
                <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
                  Aucun résultat
                </EmptyState.Title>
                <EmptyState.Description className="text-[12px] font-light text-black/45">
                  Essayez un autre mot-clé ou effacez la recherche.
                </EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button
                  type="button"
                  variant="ghost"
                  onPress={clearSearch}
                  className="h-10 rounded-full border border-noir/15 px-5 text-[10px] font-light uppercase tracking-[0.14em] text-black/55 transition-colors hover:border-noir/30 hover:text-noir"
                >
                  Effacer la recherche
                </Button>
              </EmptyState.Content>
            </EmptyState>
          )
        ) : !filterKey ? (
          /* Mode « Tout » : groupé par gamme avec titres de section */
          CATEGORY_GROUPS.map(({ label, key }) => {
            const items = catalogItems.filter((i) => i.category === key);
            if (items.length === 0) return null;
            return (
              <section key={key} className="pt-10 first:pt-0 md:pt-14 md:first:pt-0">
                <SectionTitle title={label} />
                <motion.div className={PRODUCT_GRID_CLASS} {...productGridMotionProps}>
                  {items.map(renderCard)}
                </motion.div>
              </section>
            );
          })
        ) : (
          <section>
            {singleItems.length > 0 ? (
              <motion.div className={PRODUCT_GRID_CLASS} {...productGridMotionProps}>
                {singleItems.map(renderCard)}
              </motion.div>
            ) : (
              <EmptyState className="my-10 rounded-[2px] border border-noir/[0.08] bg-surface-muted px-6 py-12 md:py-14">
                <EmptyState.Header>
                  <EmptyState.Title className="font-display text-[16px] font-normal text-black/75">
                    Aucun produit
                  </EmptyState.Title>
                  <EmptyState.Description className="text-[12px] font-light text-black/45">
                    Cette gamme n'affiche aucun produit pour le moment.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            )}
          </section>
        )}
        </div>
      </div>

      <DrinkOptionsModal item={optionsItem} onClose={() => setOptionsItem(null)} />

      {/* Bilan CTA — fond large avec contenu contraint */}
      <div className="bg-surface-muted px-4 md:px-10 lg:px-[72px]">
        <div className="mx-auto max-w-7xl py-16">
          <motion.div
            className="text-center md:flex md:items-end md:justify-between md:gap-10 md:text-left"
            {...fadeCta}
          >
            <div>
              <p className="mb-3 text-[8px] font-light uppercase tracking-[0.48em] text-black/40">Bilan Bien-être</p>
              <h3
                className="font-display font-normal leading-[1.0] text-black"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 3vw, 38px)',
                }}
              >
                30 minutes<br /><em className="italic text-black/45">offertes</em>
              </h3>
            </div>
            <Link to="/bilan-bien-etre" className="text-editorial-link-underline mt-8 inline-block md:mt-0 md:flex-shrink-0">
              Réserver mon bilan
            </Link>
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default Menu;
