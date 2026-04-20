import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'bionatural_favorites';

export interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  description: string;
}

function readFromStorage(key: string): FavoriteProduct[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function writeToStorage(key: string, data: FavoriteProduct[]) {
  localStorage.setItem(key, JSON.stringify(data));
  // Disparar evento personalizado para sincronizar otras instancias del hook en la misma pestaña
  window.dispatchEvent(new CustomEvent('favorites:changed', { detail: { key } }));
}

export function useFavorites(userEmail: string) {
  const key = `${STORAGE_KEY}_${userEmail}`;

  const [favorites, setFavorites] = useState<FavoriteProduct[]>(() => readFromStorage(key));

  // Escuchar cambios desde otras instancias del hook (misma pestaña)
  useEffect(() => {
    const handleChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === key) {
        setFavorites(readFromStorage(key));
      }
    };
    window.addEventListener('favorites:changed', handleChange);
    return () => window.removeEventListener('favorites:changed', handleChange);
  }, [key]);

  // Escuchar cambios desde otras pestañas
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setFavorites(readFromStorage(key));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const isFavorite = useCallback(
    (id: string | number) => favorites.some(f => f.id === String(id)),
    [favorites]
  );

  const toggleFavorite = useCallback((product: FavoriteProduct) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === String(product.id));
      const next = exists
        ? prev.filter(f => f.id !== String(product.id))
        : [...prev, { ...product, id: String(product.id) }];
      writeToStorage(key, next);
      return next;
    });
  }, [key]);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id);
      writeToStorage(key, next);
      return next;
    });
  }, [key]);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
