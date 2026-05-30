import { describe, it, expect, beforeEach } from 'vitest';
import { useCart, type CartLine } from '../store/cartStore';

function makeLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 'prod-1',
    name: 'Test Drink',
    unitPrice: 10,
    quantity: 1,
    category: 'wellness',
    optionsKey: 'default',
    optionLabels: [],
    source: 'bar',
    ...overrides,
  };
}

describe('useCart', () => {
  beforeEach(() => {
    useCart.setState({ items: [], isOpen: false });
  });

  describe('addLine', () => {
    it('ajoute un nouvel article au panier', () => {
      useCart.getState().addLine(makeLine());
      expect(useCart.getState().items).toHaveLength(1);
      expect(useCart.getState().items[0].productId).toBe('prod-1');
    });

    it('fusionne les quantités pour le même produit avec la même optionsKey', () => {
      const line = makeLine({ quantity: 1 });
      useCart.getState().addLine(line);
      useCart.getState().addLine(line);
      expect(useCart.getState().items).toHaveLength(1);
      expect(useCart.getState().items[0].quantity).toBe(2);
    });

    it('ne fusionne pas si optionsKey différente', () => {
      useCart.getState().addLine(makeLine({ optionsKey: 'small' }));
      useCart.getState().addLine(makeLine({ optionsKey: 'large' }));
      expect(useCart.getState().items).toHaveLength(2);
    });

    it('ouvre le panier à chaque ajout', () => {
      useCart.getState().addLine(makeLine());
      expect(useCart.getState().isOpen).toBe(true);
    });
  });

  describe('removeLine', () => {
    it('supprime une ligne par productId + optionsKey', () => {
      useCart.getState().addLine(makeLine({ productId: 'prod-1', optionsKey: 'a' }));
      useCart.getState().addLine(makeLine({ productId: 'prod-2', optionsKey: 'b' }));
      useCart.getState().removeLine('prod-1', 'a');
      expect(useCart.getState().items).toHaveLength(1);
      expect(useCart.getState().items[0].productId).toBe('prod-2');
    });
  });

  describe('updateQuantity', () => {
    it('met à jour la quantité', () => {
      useCart.getState().addLine(makeLine({ quantity: 1 }));
      useCart.getState().updateQuantity('prod-1', 'default', 3);
      expect(useCart.getState().items[0].quantity).toBe(3);
    });

    it('supprime la ligne si quantité <= 0', () => {
      useCart.getState().addLine(makeLine({ quantity: 1 }));
      useCart.getState().updateQuantity('prod-1', 'default', 0);
      expect(useCart.getState().items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('vide tout le panier', () => {
      useCart.getState().addLine(makeLine({ productId: 'p1' }));
      useCart.getState().addLine(makeLine({ productId: 'p2' }));
      useCart.getState().clearCart();
      expect(useCart.getState().items).toHaveLength(0);
    });
  });

  describe('calcul total', () => {
    it('calcule le total du panier', () => {
      useCart.getState().addLine(makeLine({ unitPrice: 10, quantity: 2, productId: 'p1' }));
      useCart.getState().addLine(makeLine({ unitPrice: 5, quantity: 1, productId: 'p2' }));
      const total = useCart.getState().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      expect(total).toBe(25);
    });
  });

  describe('open/close/toggle', () => {
    it('bascule l\'état d\'ouverture', () => {
      expect(useCart.getState().isOpen).toBe(false);
      useCart.getState().openCart();
      expect(useCart.getState().isOpen).toBe(true);
      useCart.getState().closeCart();
      expect(useCart.getState().isOpen).toBe(false);
      useCart.getState().toggleCart();
      expect(useCart.getState().isOpen).toBe(true);
    });
  });
});
