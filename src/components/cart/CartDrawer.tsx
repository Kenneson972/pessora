import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, cn } from '@heroui/react';
import { Sheet } from '@heroui-pro/react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../store/cartStore';
import { barInfo } from '../../data/infoData';
import { formatEurFr } from '../../lib/oraPricing';
import { displayBarLineUnit } from '../../lib/cartDisplayPrice';
import { useIsOraPlus } from '../../hooks/useIsOraPlus';
import { useCheckout } from '../../hooks/useCheckout';
import { PickupTimePicker } from './PickupTimePicker';
import { useBarStatus } from '../../providers/BarStatusProvider';
import { useAuth } from '../../contexts/AuthContext';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sapin/30 focus-visible:ring-offset-2';

export function CartDrawer() {
  const items = useCart((s) => s.items);
  const isOpen = useCart((s) => s.isOpen);
  const closeCart = useCart((s) => s.closeCart);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeLine = useCart((s) => s.removeLine);
  const clearCart = useCart((s) => s.clearCart);

  const [pickupTime, setPickupTime] = useState('');
  const { isAuthenticated } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const { checkout, isLoading: isCheckingOut, error: checkoutError } = useCheckout(pickupTime, guestName, guestPhone);
  const barStatus = useBarStatus();
  const { isOraPlus } = useIsOraPlus();

  const total = items.reduce(
    (sum, x) => sum + displayBarLineUnit(x, isOraPlus) * x.quantity,
    0,
  );
  const hasItems = items.length > 0;
  const isGuest = !isAuthenticated;
  const guestNameValid = guestName.trim().length >= 2;
  const guestPhoneValid = (() => {
    const p = guestPhone.replace(/[\s.-]/g, '');
    return /^(?:\+596\d{9}|0\d{9}|596\d{9})$/.test(p);
  })();
  const guestFormValid = !isGuest || (guestNameValid && guestPhoneValid);
  const hasGammeItems = items.some((x) => x.source === 'gamme');
  const gammeBlockedGuest = isGuest && hasGammeItems;
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

            <Sheet.Body className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-5">
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
                      'inline-flex h-11 min-h-[44px] items-center justify-center rounded-full border border-noir/[0.12] px-6 text-[10px] font-normal uppercase tracking-[0.14em] text-black transition-colors hover:bg-noir/[0.03]',
                    )}
                  >
                    La carte
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((line) => {
                    const lineUnit = displayBarLineUnit(line, isOraPlus);
                    return (
                    <li
                      key={`${line.productId}-${line.optionsKey}`}
                      className="border-b border-noir/[0.05] pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-noir/[0.08] bg-surface-product-well text-[18px]"
                          aria-hidden
                        >
                          {line.image && (line.image.startsWith('http') || line.image.startsWith('/')) ? (
                            <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
                          ) : (
                            line.image ?? '◆'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-black truncate">{line.name}</p>
                              {line.optionLabels.length > 0 && (
                                <p className="mt-0.5 text-[10px] text-black/45 truncate">{line.optionLabels.join(' · ')}</p>
                              )}
                            </div>
                            <span className="shrink-0 text-[13px] font-normal tabular-nums text-black">
                              {formatEurFr(lineUnit * line.quantity)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="inline-flex items-center rounded-full border border-noir/[0.1]">
                              <Button
                                type="button" variant="ghost" isIconOnly size="sm"
                                aria-label={`Diminuer ${line.name}`}
                                className="h-8 w-8 min-w-8"
                                onPress={() => updateQuantity(line.productId, line.optionsKey, line.quantity - 1)}
                              ><Minus className="h-3 w-3" strokeWidth={1.35} /></Button>
                              <span className="w-6 text-center text-[12px] text-black">{line.quantity}</span>
                              <Button
                                type="button" variant="ghost" isIconOnly size="sm"
                                aria-label={`Augmenter ${line.name}`}
                                className="h-8 w-8 min-w-8"
                                onPress={() => updateQuantity(line.productId, line.optionsKey, line.quantity + 1)}
                              ><Plus className="h-3 w-3" strokeWidth={1.35} /></Button>
                            </div>
                            <Button
                              type="button" variant="ghost" isIconOnly size="sm"
                              aria-label={`Retirer ${line.name}`}
                              className="ml-auto h-8 w-8 text-black/25 hover:text-red-500"
                              onPress={() => removeLine(line.productId, line.optionsKey)}
                            ><Trash2 className="h-3.5 w-3.5" strokeWidth={1.25} /></Button>
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
              {isGuest && (
                <div className="flex gap-2 px-4 pb-2 md:px-5">
                  <input
                    type="text"
                    placeholder="Votre nom"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="h-10 min-h-[40px] w-full rounded-full border border-noir/[0.12] bg-white px-4 text-[12px] text-black placeholder:text-black/30 outline-none focus:border-noir/30"
                  />
                  <input
                    type="tel"
                    placeholder="06 XX XX XX XX"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="h-10 min-h-[40px] w-full rounded-full border border-noir/[0.12] bg-white px-4 text-[12px] text-black placeholder:text-black/30 outline-none focus:border-noir/30"
                  />
                  {guestName && !guestNameValid && (
                    <p className="text-[9px] text-red-400">2 caractères minimum</p>
                  )}
                  {guestPhone && !guestPhoneValid && (
                    <p className="text-[9px] text-red-400">Format : 06 XX XX XX XX</p>
                  )}
                </div>
              )}
              <Sheet.Footer className="flex flex-col border-t border-noir/[0.06] bg-white px-4 py-2 md:px-5">
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-[8px] font-normal uppercase tracking-[0.16em] text-black/40">Total</span>
                  <span className="text-[15px] font-normal tabular-nums text-black">{formatEurFr(total)}</span>
                </div>
                {!barStatus.loading && (
                  <p className="mb-1 text-[9px] text-black/35 text-center">{barStatus.isOpen ? `⏱ ~${barStatus.estimatedWaitMinutes} min` : '🔴 Bar fermé'}</p>
                )}
                {checkoutError && <p className="mb-1 text-[9px] text-red-500">{checkoutError}</p>}

                {gammeBlockedGuest ? (
                  <div className="mb-1 rounded-[2px] border border-sapin/15 bg-sapin-subtle px-3 py-2 text-center">
                    <p className="mb-0.5 text-[12px] font-medium text-black">Créez un compte pour commander</p>
                    <p className="mb-1.5 text-[10px] text-black/50">Les gammes nécessitent un compte pour le suivi.</p>
                    <Link
                      to="/inscription"
                      className="inline-flex h-8 min-h-[36px] items-center gap-1 rounded-full bg-sapin px-4 text-[9px] font-medium uppercase tracking-[0.1em] text-white hover:bg-sapin/90 transition-colors"
                      onClick={closeCart}
                    >
                      Créer mon compte
                    </Link>
                  </div>
                ) : (
                  <p className="text-[8px] text-black/30 text-center">Paiement sécurisé Stripe</p>
                )}
                <div className="flex flex-col gap-1">
                  {hasItems && (
                    <Button
                      type="button"
                      isDisabled={isCheckingOut || !guestFormValid || gammeBlockedGuest}
                      onPress={checkout}
                      className={cn(
                        focusRing,
                        'flex h-10 min-h-10 w-full items-center justify-center rounded-full bg-sapin text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-sapin/85',
                      )}
                    >
                      {isCheckingOut ? 'Redirection…' : 'Payer ma commande'}
                    </Button>
                  )}
                  <a
                    href={telHref}
                    className={cn(focusRing, 'flex items-center justify-center min-h-[36px] rounded-full text-[9px] font-normal uppercase tracking-[0.12em] text-black/50 transition-colors hover:text-black')}
                  >
                    Appeler le bar
                  </a>
                  <button
                    type="button"
                    className={cn(focusRing, 'inline-flex items-center justify-center min-h-[36px] rounded-full text-[8px] uppercase tracking-[0.12em] text-black/30 hover:text-black/50')}
                    onClick={() => {
                      if (confirmClear) { clearCart(); setPickupTime(''); setGuestName(''); setGuestPhone(''); setConfirmClear(false); }
                      else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); }
                    }}
                  >
                    {confirmClear ? 'Confirmer ?' : 'Vider le panier'}
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
