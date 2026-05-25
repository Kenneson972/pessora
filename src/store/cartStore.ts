import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { allowCartPersistence } from '../lib/cookieConsent';

export interface CartLine {
  productId: string;
  name: string;
  /** Tarif unitaire **public** (base boisson + 1€ × boosters). Jamais le prix Óra+ figé. */
  unitPrice: number;
  /** Base boisson seule (public), sans boosters — pour appliquer −50 % sur la boisson uniquement quand Óra+. */
  barBasePublic?: number;
  quantity: number;
  category: string;
  optionsKey: string;
  optionLabels: string[];
  /** Emoji ou URL vignette */
  image?: string;
  source: 'bar' | 'gamme';
}

const cartLocalStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: (name) => {
    if (!allowCartPersistence()) return null;
    return localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (!allowCartPersistence()) return;
    localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

interface CartState {
  items: CartLine[];
  isOpen: boolean;
  addLine: (line: CartLine) => void;
  removeLine: (productId: string, optionsKey: string) => void;
  updateQuantity: (productId: string, optionsKey: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addLine: (line) => {
        const items = get().items;
        const i = items.findIndex(
          (x) => x.productId === line.productId && x.optionsKey === line.optionsKey
        );
        if (i >= 0) {
          const next = [...items];
          next[i] = { ...next[i], quantity: next[i].quantity + line.quantity };
          set({ items: next, isOpen: true });
        } else {
          set({ items: [...items, line], isOpen: true });
        }
      },

      removeLine: (productId, optionsKey) => {
        set({
          items: get().items.filter(
            (x) => !(x.productId === productId && x.optionsKey === optionsKey)
          ),
        });
      },

      updateQuantity: (productId, optionsKey, quantity) => {
        if (quantity <= 0) {
          get().removeLine(productId, optionsKey);
          return;
        }
        set({
          items: get().items.map((x) =>
            x.productId === productId && x.optionsKey === optionsKey ? { ...x, quantity } : x
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      /** v2 : `unitPrice` toujours public ; remise Óra+ à l'affichage uniquement (évite −50 % après déconnexion). */
      name: 'pessora-cart-v2',
      storage: createJSONStorage(() => cartLocalStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
