import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  stock?: number;
}

export interface UnifiedProduct {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  status?: 'Activo' | 'Inactivo' | 'Descontinuado';
  sku?: string;
  supplier?: string;
  technicalSheet?: string;
  cost?: number;
  margin?: number;
  weight?: number;
  barcode?: string;
  minStock?: number;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
  totalSales?: number;
  lastSaleDate?: string | null;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: UnifiedProduct, quantity?: number) => void;
  updateCartQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  cartItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: UnifiedProduct, quantity = 1) => {
    if (!product.stock || product.stock <= 0) {
      toast.error(`${product.name} está agotado`);
      return;
    }
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const maxQty = product.stock ?? 999;
        if (existing.quantity >= maxQty) {
          toast.error(`Solo hay ${maxQty} unidades disponibles de ${product.name}`);
          return prev;
        }
        const newQty = Math.min(existing.quantity + quantity, maxQty);
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQty } : item);
      }
      return [...prev, {
        id: product.id as number,
        name: product.name,
        price: product.price,
        image: product.image || '',
        quantity: Math.min(quantity, product.stock),
        category: product.category,
        stock: product.stock
      }];
    });
    toast.success(quantity === 1 ? `${product.name} agregado al carrito` : `${product.name} (${quantity}x) agregado al carrito`);
  };

  const updateCartQuantity = (id: number, quantity: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const maxQty = item.stock ?? 999;
      const safeQty = Math.min(Math.max(1, quantity), maxQty);
      if (quantity > maxQty) toast.error(`Solo hay ${maxQty} unidades disponibles`);
      return { ...item, quantity: safeQty };
    }));
  };

  const removeFromCart = (id: number) => {
    const item = cartItems.find(item => item.id === id);
    setCartItems(prev => prev.filter(item => item.id !== id));
    if (item) toast.success(`${item.name} eliminado del carrito`);
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Carrito vaciado');
  };

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      cartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
