import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Button, Card } from '@heroui/react';
import type { LucideIcon } from 'lucide-react';
import {
  Plus, Minus, Check, Leaf, Wheat, Pill,
  ShoppingBag, ArrowRight,
  Sparkles, Dumbbell, Milk, Zap, Leaf as LeafIcon, Droplets,
  Coffee, Nut, Sprout,
} from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { useState } from 'react';
import { boosters, milkOptions, categoryNames, type MenuItem } from '../data/menuData';
import { useCart } from '../store/cartStore';
import { buildDrinkCartOptions } from '../lib/cartLine';
import { useMenuCatalog } from '../hooks/useMenuCatalog';
import { useAuth } from '../contexts/AuthContext';
import { DrinkDetailAdminEdit } from '../components/admin/DrinkDetailAdminEdit';
import { formatEurFr, oraMemberUnitPrice, ORA_PLUS_MAX_DRINK_DISCOUNT } from '../lib/oraPricing';
import { oraPlusPricing } from '../data/oraPlusData';

type TabId = 'ingredients' | 'nutrition' | 'benefits';

function sameMarketingLine(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return norm(a) === norm(b);
}

const TAB_PANEL_PREFIX = 'drink-detail-panel';
const TAB_PREFIX = 'drink-detail-tab';

/** Même axe optique que Menu / fiches produit : bloc centré, pas full-bleed désaligné. */
const DRINK_LAYOUT = 'mx-auto w-full max-w-6xl';

/** Visuel fiche / cross-sell : picto gamme (pas d’emoji produit). */
const CATEGORY_HERO_ICONS: Record<MenuItem['category'], LucideIcon> = {
  wellness: Leaf,
  energie: Zap,
  shakes: Milk,
  coffee: Coffee,
};

const MILK_TYPE_ICONS: Record<string, LucideIcon> = {
  avoine: Wheat,
  amandes: Nut,
  coco: Droplets,
  riz: Sprout,
};

const DrinkDetail = () => {
  const navigate = useNavigate();
  const { drinkId } = useParams<{ drinkId: string }>();
  const { items: catalogItems } = useMenuCatalog();
  const drink = catalogItems.find((item) => item.id === drinkId);
  const [quantity, setQuantity] = useState(1);
  const [selectedMilk, setSelectedMilk] = useState(milkOptions[0].id);
  const [selectedBoosters, setSelectedBoosters] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('ingredients');
  const [justAdded, setJustAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const addLine = useCart((s) => s.addLine);
  const { isAdmin } = useAuth();

  if (!drink) {
    return <Navigate to="/menu" replace />;
  }

  const pitchDuplicatesDescription =
    drink.pitch.trim().length > 0 && sameMarketingLine(drink.description, drink.pitch);

  const toggleBooster = (boosterId: string) => {
    setSelectedBoosters(prev =>
      prev.includes(boosterId)
        ? prev.filter(id => id !== boosterId)
        : [...prev, boosterId]
    );
  };

  const boostersPrice = selectedBoosters.length * 1 * quantity;

  const hasSizes =
    drink.price_small != null &&
    drink.price_medium != null &&
    drink.price_large != null;

  const sizeBasePrice = hasSizes
    ? selectedSize === 'small'
      ? drink.price_small!
      : selectedSize === 'large'
      ? drink.price_large!
      : drink.price_medium!
    : drink.price;

  const calculateTotal = () => {
    const basePrice = sizeBasePrice * quantity;
    return (basePrice + boostersPrice).toFixed(2);
  };

  /** Boisson à tarif membre max (−50 %) + boosters au prix bar */
  const memberTotalEstimate = oraMemberUnitPrice(sizeBasePrice) * quantity + boostersPrice;

  const relatedDrinks = catalogItems
    .filter(item => item.category === drink.category && item.id !== drink.id)
    .slice(0, 3);

  const crossSellDrinks = relatedDrinks.length >= 2
    ? relatedDrinks
    : [
        ...relatedDrinks,
        ...catalogItems.filter(item => item.category !== drink.category && item.id !== drink.id).slice(0, 3 - relatedDrinks.length)
      ];

  const badgeConfig = {
    vegan: { label: 'Vegan', icon: Leaf },
    glutenfree: { label: 'Sans Gluten', icon: Wheat },
    vitamins: { label: '25 Vitamines', icon: Pill },
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'ingredients', label: 'Ingrédients' },
    { id: 'nutrition', label: 'Nutritionnel' },
    { id: 'benefits', label: 'Bénéfices' },
  ];

  const handleAddToCart = () => {
    const { optionsKey, optionLabels, unitPrice, barBasePublic } = buildDrinkCartOptions(
      drink,
      selectedMilk,
      selectedBoosters,
      sizeBasePrice,
      hasSizes ? selectedSize : undefined,
    );
    addLine({
      productId: drink.id,
      name: drink.name,
      unitPrice,
      barBasePublic,
      quantity,
      category: drink.category,
      optionsKey,
      optionLabels,
      image: drink.icon,
      source: 'bar',
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  };

  const boosterIcons: Record<string, LucideIcon> = {
    collagene: Sparkles,
    creatine: Dumbbell,
    proteine: Milk,
    electrolytes: Zap,
    fibres: LeafIcon,
    'aloe-vera': Droplets,
  };

  const CategoryHeroIcon = CATEGORY_HERO_ICONS[drink.category];

  return (
    <div className="min-h-screen bg-white">

      {/* ─── Breadcrumb ─── */}
      <div>
        <PageShell className="py-5">
          <nav aria-label="Fil d'Ariane" className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[10px] uppercase tracking-[0.08em] text-black/40 sm:justify-start sm:text-left ${DRINK_LAYOUT}`}>
            <Link to="/menu" className="hover:text-black transition-colors duration-200">Menu</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/menu?gamme=${drink.category}`} className="hover:text-black transition-colors duration-200">
              {categoryNames[drink.category]}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-black/70" aria-current="page">{drink.name}</span>
          </nav>
        </PageShell>
      </div>

      {/* ─── Main Product Section ─── */}
      <section>
        <PageShell className="py-12 lg:py-20">
        <div className={`grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14 xl:gap-16 ${DRINK_LAYOUT}`}>

          {/* LEFT — Product Visual */}
          <div className="mx-auto w-full max-w-lg space-y-6 lg:mx-0 lg:max-w-none">
            <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-[2px] bg-surface-product-well sm:max-w-lg lg:mx-0 lg:max-w-none">
              <CategoryHeroIcon
                className="pointer-events-none h-[min(42vw,11rem)] w-[min(42vw,11rem)] shrink-0 text-black/[0.09] sm:h-[min(36vw,13rem)] sm:w-[min(36vw,13rem)] md:h-[min(32vw,14rem)] md:w-[min(32vw,14rem)]"
                strokeWidth={0.85}
                aria-hidden
              />
              <div className="absolute top-6 left-6">
                <span className="inline-flex items-center gap-2 bg-white/95 px-4 py-2 rounded-[2px] text-[10px] font-normal uppercase tracking-[0.08em] text-black/70">
                  <CategoryHeroIcon size={14} strokeWidth={1.35} className="text-black/40" aria-hidden />
                  {categoryNames[drink.category]}
                </span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex gap-2">
                {drink.calories && (
                  <span className="bg-white/90 px-3 py-1.5 rounded-[2px] text-[10px] font-normal text-black/70">
                    {drink.calories} kcal
                  </span>
                )}
                {drink.protein && (
                  <span className="bg-noir/85 text-white px-3 py-1.5 rounded-[2px] text-[10px] font-normal">
                    {drink.protein}g prot.
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-noir/[0.05] pt-6 text-center lg:text-left">
              <p className="mb-3 text-[9px] font-normal uppercase tracking-[0.2em] text-black/30">Composition</p>
              <p className="mx-auto max-w-md text-[11px] font-light leading-relaxed text-black/50 lg:mx-0">
                {drink.ingredients.join(' · ')}
              </p>
            </div>
          </div>

          {/* RIGHT — Product Info */}
          <div className="h-fit w-full min-w-0 lg:sticky lg:top-36">

            {drink.badges && drink.badges.length > 0 && (
              <div className="mb-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {drink.badges.map((badge) => {
                  const config = badgeConfig[badge];
                  const IconComponent = config.icon;
                  return (
                    <span key={badge} className="inline-flex items-center gap-1.5 rounded-[2px] border border-noir/[0.08] px-3 py-1.5 text-[9px] font-normal uppercase tracking-[0.08em] text-black/55">
                      <IconComponent size={11} strokeWidth={1.3} />
                      {config.label}
                    </span>
                  );
                })}
              </div>
            )}

            <h1
              className="mb-3 text-center font-display font-normal leading-none tracking-[-0.01em] text-black sm:text-left"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 4vw, 52px)' }}
            >
              {drink.name}
            </h1>

            {pitchDuplicatesDescription ? (
              <p
                className="mx-auto mb-10 max-w-xl text-center font-normal italic leading-[1.35] text-black/55 sm:mx-0 sm:mb-11 sm:text-left"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(17px, 1.9vw, 21px)' }}
              >
                « {drink.pitch} »
              </p>
            ) : (
              <>
                <p className="mx-auto mb-4 max-w-xl text-center text-[13px] font-light leading-relaxed text-black/50 sm:mx-0 sm:text-left">
                  {drink.description}
                </p>
                {drink.pitch.trim() && (
                  <p
                    className="mx-auto mb-10 max-w-xl text-center font-normal italic leading-[1.35] text-black/50 sm:mx-0 sm:mb-11 sm:text-left"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(17px, 1.9vw, 21px)' }}
                  >
                    « {drink.pitch} »
                  </p>
                )}
              </>
            )}

            <div className="mb-8 space-y-3">
              <div className="flex flex-col gap-1 sm:gap-0">
                <p className="text-center text-[9px] font-normal uppercase tracking-[0.2em] text-black/35 sm:text-left">
                  Total estimé
                </p>
                <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 sm:justify-start">
                  <span
                    className="font-display font-normal tabular-nums text-black"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 4vw, 48px)' }}
                  >
                    {Number(calculateTotal()).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    €
                  </span>
                  {selectedBoosters.length > 0 && (
                    <span className="text-[12px] text-black/40">
                      base {sizeBasePrice.toLocaleString('fr-FR')} € + {selectedBoosters.length} booster
                      {selectedBoosters.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="mx-auto flex max-w-xl flex-col gap-2 rounded-[2px] border border-noir/[0.07] bg-surface-muted/80 px-3 py-2.5 sm:mx-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-light leading-snug text-black/60">
                    <span className="font-medium text-black/75">Óra+</span>
                    {' · '}
                    dès {formatEurFr(oraMemberUnitPrice(sizeBasePrice))} la boisson
                    <span className="text-black/40"> (max. −{Math.round(ORA_PLUS_MAX_DRINK_DISCOUNT * 100)}&nbsp;%)</span>
                  </p>
                  <Link
                    to="/ora-plus"
                    className="inline-flex shrink-0 items-center gap-1 text-[10px] font-normal uppercase tracking-[0.12em] text-noir underline-offset-2 hover:underline"
                  >
                    Abonnement {oraPlusPricing.price}/mois
                    <ArrowRight size={12} strokeWidth={1.35} aria-hidden />
                  </Link>
                </div>
                <details className="group border-t border-noir/[0.06] pt-2">
                  <summary className="cursor-pointer list-none text-[10px] font-light text-black/40 transition-colors marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-1 underline-offset-2 group-open:underline">
                      Détail du total indicatif membre
                      <span className="text-[9px] text-black/30" aria-hidden>
                        ▾
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 text-[11px] font-light leading-relaxed text-black/45">
                    Prix public au verre. Avec Óra+, tarif boisson jusqu’à −
                    {Math.round(ORA_PLUS_MAX_DRINK_DISCOUNT * 100)}&nbsp;% : total indicatif{' '}
                    <span className="font-normal text-black/60 tabular-nums">
                      {memberTotalEstimate.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      €
                    </span>
                    {boostersPrice > 0 ? (
                      <span className="text-black/35"> (boosters au prix bar)</span>
                    ) : null}
                    .
                  </p>
                </details>
              </div>
            </div>

            {/* ── Sélecteur de taille ── */}
            {hasSizes && (
              <div className="mb-8">
                <p className="mb-1 text-center text-[9px] font-normal uppercase tracking-[0.2em] text-black/45 sm:text-left">
                  Taille
                </p>
                <p className="mb-3 text-center text-[11px] font-light text-black/35 sm:text-left">
                  Choisissez votre format
                </p>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((s) => {
                    const sPrice =
                      s === 'small'
                        ? drink.price_small!
                        : s === 'medium'
                        ? drink.price_medium!
                        : drink.price_large!;
                    const sLabel = s === 'small' ? 'Petit' : s === 'medium' ? 'Moyen' : 'Grand';
                    const isSelected = selectedSize === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={
                          `flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border py-3 min-h-[44px] text-[9px] font-normal uppercase leading-tight tracking-[0.1em] transition-colors ` +
                          (isSelected
                            ? 'border-noir bg-noir text-white'
                            : 'border-noir/15 text-black/45 hover:border-noir/30 hover:text-black')
                        }
                        aria-pressed={isSelected}
                      >
                        {sLabel}
                        <span className="text-[9px] opacity-70">{sPrice}€</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Customisation lait : coffee uniquement (shakes : base standard sans choix) ── */}
            {drink.category === 'coffee' && (
              <div className="mb-8">
                <p className="mb-1 text-center text-[9px] font-normal uppercase tracking-[0.2em] text-black/45 sm:text-left">
                  Choix du lait végétal
                </p>
                <p className="mb-3 text-center text-[11px] font-light text-black/35 sm:text-left">
                  Inclus — sélectionnez une base
                </p>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5" role="list">
                  {milkOptions.map((milk) => {
                    const MilkIcon = MILK_TYPE_ICONS[milk.id] ?? Droplets;
                    const selected = selectedMilk === milk.id;
                    return (
                      <li key={milk.id} className="min-w-0">
                        <Button
                          type="button"
                          variant="ghost"
                          onPress={() => setSelectedMilk(milk.id)}
                          aria-pressed={selected}
                          aria-label={`Lait ${milk.name}${selected ? ', sélectionné' : ''}`}
                          className={`!flex h-12 min-h-12 w-full items-center justify-between gap-3 rounded-[2px] border px-3 py-0 text-left transition-colors duration-200 ${
                            selected
                              ? 'border-noir bg-noir/[0.05]'
                              : 'border-noir/[0.08] bg-white hover:border-noir/18'
                          }`}
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-2.5">
                            <MilkIcon
                              size={18}
                              strokeWidth={1.25}
                              className="shrink-0 text-black/50"
                              aria-hidden
                            />
                            <span className="truncate text-[12px] font-normal leading-none text-black">
                              {milk.name}
                            </span>
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
                              selected ? 'border-noir bg-noir' : 'border-noir/18 bg-white'
                            }`}
                            aria-hidden
                          >
                            {selected && <Check size={11} className="text-white" strokeWidth={2.5} />}
                          </span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ── Boosters — grille dense, une ligne par option (alignement stable) ── */}
            <div className="mb-10">
              <p className="mb-3 text-center text-[9px] font-normal uppercase tracking-[0.2em] text-black/45 sm:text-left">
                Boosters
              </p>
              <p className="mb-3 text-center text-[11px] font-light text-black/35 sm:text-left">
                +1&nbsp;€ par option sélectionnée
              </p>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5" role="list">
                {boosters.map((booster) => {
                  const BoosterIcon = boosterIcons[booster.id] ?? Sparkles;
                  const selected = selectedBoosters.includes(booster.id);
                  return (
                    <li key={booster.id} className="min-w-0">
                      <Button
                        type="button"
                        variant="ghost"
                        onPress={() => toggleBooster(booster.id)}
                        aria-pressed={selected}
                        aria-label={`${booster.name} — ${booster.description}. Supplément 1 euro${selected ? ', sélectionné' : ''}`}
                        className={`!flex h-12 min-h-12 w-full items-center justify-between gap-3 rounded-[2px] border px-3 py-0 text-left transition-colors duration-200 ${
                          selected
                            ? 'border-noir bg-noir/[0.05]'
                            : 'border-noir/[0.08] bg-white hover:border-noir/18'
                        }`}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2.5">
                          <BoosterIcon
                            size={18}
                            strokeWidth={1.25}
                            className="shrink-0 text-black/50"
                            aria-hidden
                          />
                          <span className="truncate text-[12px] font-normal leading-none text-black">
                            {booster.name}
                          </span>
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
                            selected ? 'border-noir bg-noir' : 'border-noir/18 bg-white'
                          }`}
                          aria-hidden
                        >
                          {selected && <Check size={11} className="text-white" strokeWidth={2.5} />}
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ── Quantity + Add to cart ── */}
            <div className="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <div className="flex shrink-0 items-center justify-center border border-noir/[0.1] rounded-full overflow-hidden sm:justify-start">
                <Button
                  type="button"
                  variant="ghost"
                  isIconOnly
                  aria-label="Diminuer la quantité"
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  isDisabled={quantity === 1}
                  className="flex h-12 w-12 min-w-12 items-center justify-center transition-colors duration-200 hover:bg-noir/[0.06] disabled:opacity-30"
                >
                  <Minus size={14} strokeWidth={1.3} aria-hidden />
                </Button>
                <span className="w-12 text-center text-[16px] font-normal text-black" aria-live="polite" aria-atomic="true">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  isIconOnly
                  aria-label="Augmenter la quantité"
                  onPress={() => setQuantity(quantity + 1)}
                  className="flex h-12 w-12 min-w-12 items-center justify-center transition-colors duration-200 hover:bg-noir/[0.06]"
                >
                  <Plus size={14} strokeWidth={1.3} aria-hidden />
                </Button>
              </div>

              <Button
                type="button"
                variant="primary"
                fullWidth
                onPress={handleAddToCart}
                className="flex h-12 min-h-12 flex-1 items-center justify-center gap-3 rounded-full bg-noir text-[10px] font-normal uppercase tracking-[0.12em] text-white hover:bg-anthracite"
              >
                {justAdded ? (
                  <Check size={16} strokeWidth={1.3} aria-hidden />
                ) : (
                  <ShoppingBag size={16} strokeWidth={1.3} aria-hidden />
                )}
                {justAdded ? 'Ajouté au panier' : 'Ajouter au panier'}
              </Button>
            </div>

            <div className="flex items-start justify-center gap-3 border-t border-noir/[0.06] pt-5 sm:justify-start">
              <Check size={13} className="mt-0.5 shrink-0 text-black/45" strokeWidth={1.5} />
              <p className="max-w-md text-center text-[11px] font-light leading-relaxed text-black/45 sm:max-w-none sm:text-left">
                Préparé à la commande avec des ingrédients frais. 100% végétal, sans compromis sur le goût.
              </p>
            </div>

          </div>
        </div>
        </PageShell>
      </section>

      {/* ─── Tabbed Content Section ─── */}
      <section className="border-t border-noir/[0.05] bg-white" aria-label="Détails produit">
        <PageShell className="py-16 lg:py-24">
          <div className={DRINK_LAYOUT}>
          <div
            role="tablist"
            aria-label="Sections détail produit"
            className="scrollbar-hide mb-12 flex flex-wrap justify-center gap-2 overflow-x-auto pb-1"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${TAB_PREFIX}-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`${TAB_PANEL_PREFIX}-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`h-9 min-h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-6 text-[10px] font-normal uppercase tracking-[0.1em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-noir ${
                  activeTab === tab.id
                    ? 'bg-noir text-white'
                    : 'border border-noir/[0.1] bg-white text-black/45 hover:border-noir/25 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div aria-live="polite" className="w-full">
            <div
              id={`${TAB_PANEL_PREFIX}-ingredients`}
              role="tabpanel"
              aria-labelledby={`${TAB_PREFIX}-ingredients`}
              hidden={activeTab !== 'ingredients'}
            >
              <div className="mx-auto w-full max-w-3xl">
                <div className="divide-y divide-black/[0.05]">
                  {drink.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.28fr)] items-start gap-x-4 gap-y-1 py-4 sm:gap-x-10 sm:py-5 lg:gap-x-14"
                    >
                      <span className="min-w-0 text-[12px] font-normal leading-snug text-black sm:text-[13px]">
                        {ingredient}
                      </span>
                      <span className="min-w-0 border-l border-noir/[0.08] pl-3 text-[10px] font-light leading-relaxed text-black/45 sm:pl-6 sm:text-[11px] lg:pl-8">
                        {getIngredientNote(ingredient)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mx-auto mt-8 max-w-2xl text-center text-[11px] italic text-black/30 sm:text-left">
                  Tous nos ingrédients sont soigneusement sélectionnés pour leur qualité et leur fraîcheur.
                </p>
              </div>
            </div>

            <div
              id={`${TAB_PANEL_PREFIX}-nutrition`}
              role="tabpanel"
              aria-labelledby={`${TAB_PREFIX}-nutrition`}
              hidden={activeTab !== 'nutrition'}
            >
              <div className="mx-auto w-full max-w-md">
                {(drink.calories || drink.protein) ? (
                  <Card className="overflow-hidden rounded-[2px] border border-noir/[0.05] bg-white shadow-none">
                    <div className="bg-noir px-8 py-4 text-white">
                      <h3 className="text-[10px] font-normal uppercase tracking-[0.12em]">Valeurs nutritionnelles par portion</h3>
                    </div>
                    <table className="w-full">
                      <caption className="sr-only">
                        Valeurs nutritionnelles par portion pour {drink.name}
                      </caption>
                      <tbody>
                        {drink.calories && (
                          <tr className="border-b border-noir/[0.05]">
                            <th scope="row" className="px-8 py-5 text-left text-[13px] font-normal text-black/60">Calories</th>
                            <td className="px-8 py-5 text-right font-normal text-black text-[18px]">{drink.calories} kcal</td>
                          </tr>
                        )}
                        {drink.protein && (
                          <tr className="border-b border-noir/[0.05]">
                            <th scope="row" className="px-8 py-5 text-left text-[13px] font-normal text-black/60">Protéines</th>
                            <td className="px-8 py-5 text-right font-normal text-black text-[18px]">{drink.protein}g</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Card>
                ) : (
                  <p className="text-center text-[13px] italic text-black/50">
                    Informations nutritionnelles non disponibles pour cette boisson.
                  </p>
                )}
              </div>
            </div>

            <div
              id={`${TAB_PANEL_PREFIX}-benefits`}
              role="tabpanel"
              aria-labelledby={`${TAB_PREFIX}-benefits`}
              hidden={activeTab !== 'benefits'}
            >
              <div className="mx-auto w-full max-w-xl">
                <div className="divide-y divide-black/[0.05]">
                  {drink.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-2 py-6 text-center"
                    >
                      <span className="text-[10px] font-normal tabular-nums text-black/25">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="max-w-md text-[13px] font-normal leading-relaxed text-black">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>
        </PageShell>
      </section>

      {/* ─── Vous aimerez aussi ─── */}
      {crossSellDrinks.length > 0 && (
        <section className="border-t border-noir/[0.05] bg-white">
          <PageShell className="py-16 lg:py-24">
            <div className={DRINK_LAYOUT}>
            <div className="mb-12 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
              <div>
                <h2
                  className="mb-2 font-display font-normal text-black"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3vw, 40px)' }}
                >
                  Vous aimerez aussi
                </h2>
                <p className="text-[11px] text-black/40">D'autres boissons qui pourraient vous plaire</p>
              </div>
              <Link
                to="/menu"
                className="hidden items-center gap-2 text-[10px] font-normal uppercase tracking-[0.08em] text-black/40 transition-colors duration-200 hover:text-black md:inline-flex"
              >
                Voir tout <ArrowRight size={12} strokeWidth={1.3} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
              {crossSellDrinks.map((item) => {
                const CrossIcon = CATEGORY_HERO_ICONS[item.category];
                return (
                <Link key={item.id} to={`/menu/${item.id}`} className="group block">
                  <div className="bg-surface-muted rounded-[2px] aspect-[3/4] flex items-center justify-center mb-5 overflow-hidden relative">
                    <CrossIcon
                      className="h-20 w-20 text-black/[0.08] transition-transform duration-500 group-hover:scale-[1.06] sm:h-24 sm:w-24"
                      strokeWidth={0.85}
                      aria-hidden
                    />
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {item.calories && (
                        <span className="bg-white/90 px-2.5 py-1 rounded-[2px] text-[10px] font-normal text-black/70">
                          {item.calories} kcal
                        </span>
                      )}
                      {item.protein && (
                        <span className="bg-noir/80 text-white px-2.5 py-1 rounded-[2px] text-[10px] font-normal">
                          {item.protein}g prot.
                        </span>
                      )}
                    </div>
                  </div>
                  <h3
                    className="font-display mb-1 font-normal text-black transition-colors duration-200 group-hover:text-black/55"
                    style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}
                  >
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-black/40 uppercase tracking-[0.08em] mb-2">
                    {item.ingredients.slice(0, 3).join(' · ')}
                  </p>
                  <span className="text-[18px] font-normal text-black">{item.price}€</span>
                </Link>
              );
              })}
            </div>

            <div className="mt-10 text-center md:hidden">
              <Button
                type="button"
                variant="outline"
                onPress={() => navigate('/menu')}
                className="inline-flex h-11 min-h-11 items-center gap-2 rounded-full border-noir/15 px-8 text-[10px] font-normal uppercase tracking-[0.1em] text-black hover:border-noir/40"
              >
                Voir tout le menu <ArrowRight size={12} strokeWidth={1.3} />
              </Button>
            </div>
            </div>
          </PageShell>
        </section>
      )}

      {Array.isArray(drink.gallery) && drink.gallery.length > 0 && (
        <section className="border-t border-noir/[0.05]">
          <PageShell className="py-12">
            <div className="mx-auto w-full max-w-6xl">
              <h2 className="mb-6 font-display text-[22px] font-normal text-black">Photos</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {drink.gallery.map((url) => (
                  <div key={url} className="aspect-square overflow-hidden rounded-[2px] bg-surface-product-well">
                    <img src={url} alt={drink.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </PageShell>
        </section>
      )}

      {isAdmin && <DrinkDetailAdminEdit drinkId={drinkId!} drink={drink} />}
    </div>
  );
};

function getIngredientNote(ingredient: string): string {
  const map: Record<string, string> = {
    'Hibiscus': 'Riche en antioxydants', 'Collagène': 'Peau, ongles & cheveux',
    'Fraise': 'Vitamine C naturelle', 'Citron': 'Détox & fraîcheur',
    'Thé vert cardamome': 'Métabolisme actif', 'Verveine': 'Apaisante & digestive',
    'Menthe': 'Fraîcheur & digestion', 'Yuzu': 'Agrume premium',
    'Aloé Vera': 'Hydratation profonde', 'Baies sauvages': 'Super-antioxydants',
    'Passion': 'Vitamine A & C', 'Rose': 'Propriétés apaisantes',
    'Aloe vera': 'Hydratation profonde', 'Mangue épicée': 'Énergie tropicale',
    'Açaï': 'Superfruit antioxydant', 'Créatine': 'Force & performance',
    'Orange': 'Vitamine C', 'Électrolytes': 'Hydratation optimale',
    'Curaçao': 'Saveur exotique', 'Caféine de Guarana': 'Énergie naturelle',
    'Biotine': 'Cheveux & peau', 'Taurine': 'Endurance & focus',
    'Eau de coco': 'Hydratation naturelle', 'Aloé': 'Détox douce',
    'Electrolytes': 'Anti-crampes', 'Fruit du dragon': 'Superfruit exotique',
    'Cookies': 'Gourmandise', 'Caramel': 'Saveur réconfortante',
    'Chocolat': 'Magnésium & plaisir', 'Cacao': 'Magnésium naturel',
    'Vanille': 'Douceur naturelle', 'Café': 'Énergie & concentration',
    'Spéculos': 'Saveur épicée', 'Poudre de cacao': 'Riche en flavonoïdes',
    'Matcha': 'Antioxydants & zen', 'Framboise': 'Vitamine C & fibres',
    'Lait Végétal': '100% végétal', 'Café arabica': 'Premium & intense',
    'Eau': 'Hydratation pure',
  };
  return map[ingredient] || 'Ingrédient de qualité';
}

export default DrinkDetail;
