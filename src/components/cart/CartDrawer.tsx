import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, cn } from '@heroui/react';
import { Sheet } from '@heroui-pro/react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../store/cartStore';
import { barInfo } from '../../data/infoData';
import { categoryNames } from '../../data/menuData';
import type { MenuItem } from '../../data/menuData';
import { formatEurFr } from '../../lib/oraPricing';
import { displayBarLineUnit } from '../../lib/cartDisplayPrice';
import { useIsOraPlus } from '../../hooks/useIsOraPlus';
import { useCheckout } from '../../hooks/useCheckout';
import { PickupTimePicker } from './PickupTimePicker';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/25 focus-visible:ring-offset-2';

export function CartDrawer() {
  const items = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const closeCart = useCart((s) => s.closeCart);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeLine = useCart((s) => s.removeLine);
  const clearCart = useCart((s) => s.clearCart);

  const [pickupTime, setPickupTime] = useState('');

  const { checkout, isLoading: isCheckingOut, error: checkoutError } = useCheckout(pickupTime);
  const { isOraPlus } = useIsOraPlus();

  const total = items.reduce(
    (sum, x) => sum + displayBarLineUnit(x, isOraPlus) * x.quantity,
    0,
  );
  const hasStripe = items.length > 0;
  const telHref = `tel:${barInfo.contact.phone.replace(/\s/g, '').replace(/X/g, '')}`;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) closeCart();
    },
    [closeCart],
  );

  return (
    <Sheet isOpen={isOpen} onOpenChange={handleOpenChange} placement="right">
      <Sheet.Backdrop variant="opaque">
        <Sheet.Content className="w-full max-w-md">
          <Sheet.Dialog className="flex h-full flex-col border-l border-noir/[0.08] bg-white shadow-[0_0_40px_rgba(0,0,0,0.08)]">
            <Sheet.Header className="flex flex-row items-center justify-between border-b border-noir/[0.06] px-5 py-4 md:px-6">
              <div className="flex items-center gap-3">
                <ShoppingBag
                  className="h-4 w-4 text-black/50"
                  strokeWidth={1.35}
                  aria-hidden
                />
                <Sheet.Heading className="text-[10px] font-normal uppercase tracking-[0.2em] text-black">
                  Panier
                </Sheet.Heading>
              </div>
              <Sheet.CloseTrigger
                aria-label="Fermer le panier"
                className={cn(
                  focusRing,
                  'static ml-auto text-black/45 transition-colors hover:text-black',
                )}
              />
            </Sheet.Header>

            <Sheet.Body className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                  <p className="text-[11px] font-light leading-relaxed text-black/45">
                    Votre sélection est vide. Explorez la carte et ajoutez vos boissons.
                  </p>
                  <Link
                    to="/menu"
                    onClick={closeCart}
                    className={cn(
                      focusRing,
                      'inline-flex h-10 min-h-10 items-center justify-center rounded-full border border-noir/[0.12] px-6 text-[10px] font-normal uppercase tracking-[0.14em] text-black transition-colors hover:bg-noir/[0.03]',
                    )}
                  >
                    La carte
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-5">
                  {items.map((line) => {
                    const lineUnit = displayBarLineUnit(line, isOraPlus);
                    return (
                    <li
                      key={`${line.productId}-${line.optionsKey}`}
                      className="border-b border-noir/[0.05] pb-5 last:border-0 last:pb-0"
                    >
                      <div className="flex gap-4">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-noir/[0.08] bg-surface-product-well text-[22px]"
                          aria-hidden
                        >
                          {line.image ?? '◆'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-black">
                            {line.name}
                          </p>
                          <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-black/35">
                            {categoryNames[line.category as MenuItem['category']] ?? line.category}
                          </p>
                          <ul className="mt-2 space-y-0.5">
                            {line.optionLabels.map((label, idx) => (
                              <li
                                key={`${line.optionsKey}-${idx}`}
                                className="text-[10px] font-light text-black/50"
                              >
                                {label}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="inline-flex items-center rounded-full border border-noir/[0.1]">
                              <Button
                                type="button"
                                variant="ghost"
                                isIconOnly
                                size="sm"
                                aria-label={`Diminuer ${line.name}`}
                                className="h-11 w-11 min-w-11"
                                onPress={() =>
                                  updateQuantity(
                                    line.productId,
                                    line.optionsKey,
                                    line.quantity - 1,
                                  )
                                }
                              >
                                <Minus className="h-3.5 w-3.5" strokeWidth={1.35} />
                              </Button>
                              <span className="w-7 text-center text-[12px] text-black">
                                {line.quantity}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                isIconOnly
                                size="sm"
                                aria-label={`Augmenter ${line.name}`}
                                className="h-11 w-11 min-w-11"
                                onPress={() =>
                                  updateQuantity(
                                    line.productId,
                                    line.optionsKey,
                                    line.quantity + 1,
                                  )
                                }
                              >
                                <Plus className="h-3.5 w-3.5" strokeWidth={1.35} />
                              </Button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[12px] font-normal tabular-nums text-black">
                                {formatEurFr(lineUnit * line.quantity)}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                isIconOnly
                                size="sm"
                                aria-label={`Retirer ${line.name} du panier`}
                                className="text-black/35 hover:text-black"
                                onPress={() => removeLine(line.productId, line.optionsKey)}
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={1.25} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                  })}
                </ul>
              )}
            </Sheet.Body>

            {items.length > 0 && (
              <>
              <PickupTimePicker
                businessHours={barInfo.hours}
                value={pickupTime}
                onChange={setPickupTime}
              />
              <Sheet.Footer className="flex flex-col border-t border-noir/[0.06] bg-white px-5 py-5 md:px-6">
                <div className="mb-5 flex items-baseline justify-between gap-4">
                  <span className="text-[9px] font-normal uppercase tracking-[0.18em] text-black/45">
                    Total
                  </span>
                  <span className="text-[18px] font-light tabular-nums tracking-tight text-black">
                    {formatEurFr(total)}
                  </span>
                </div>

                {checkoutError && (
                  <p className="mb-3 text-[10px] text-red-500">{checkoutError}</p>
                )}

                <p className="mb-4 text-[10px] font-light leading-relaxed text-black/40">
                  Paiement sécurisé en ligne via Stripe.
                </p>
                <div className="flex flex-col gap-2">
                  {hasStripe && (
                    <Button
                      type="button"
                      isDisabled={isCheckingOut}
                      onPress={checkout}
                      className={cn(
                        focusRing,
                        'flex h-12 min-h-12 w-full items-center justify-center rounded-full bg-noir text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite',
                      )}
                    >
                      {isCheckingOut ? 'Redirection…' : 'Payer ma commande'}
                    </Button>
                  )}
                  <a
                    href={telHref}
                    className={cn(
                      focusRing,
                      'flex items-center justify-center min-h-[44px] rounded-full text-[10px] font-normal uppercase tracking-[0.14em] text-black/55 transition-colors hover:text-black',
                    )}
                  >
                    Appeler le bar
                  </a>
                  <button
                    type="button"
                    className={cn(
                      focusRing,
                      'inline-flex items-center justify-center min-h-[44px] rounded-full text-[9px] uppercase tracking-[0.14em] text-black/35 hover:text-black/55',
                    )}
                    onClick={() => clearCart()}
                  >
                    Vider le panier
                  </button>
                </div>
              </Sheet.Footer>
              </>
            )}
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
