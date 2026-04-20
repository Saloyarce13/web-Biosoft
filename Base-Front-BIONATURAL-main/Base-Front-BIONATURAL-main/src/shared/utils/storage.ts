/**
 * Sistema centralizado de almacenamiento local con persistencia
 * para simular backend mientras se visualiza en Figma o prototipo
 */

const STORAGE_KEYS = {
  PRODUCTS: 'bionatural_products',
  CLIENTS: 'bionatural_clients',
  PROVIDERS: 'bionatural_providers',
  CATEGORIES: 'bionatural_categories',
  PURCHASES: 'bionatural_purchases',
  ORDERS: 'bionatural_orders',
  SALES: 'bionatural_sales',
  USERS: 'bionatural_users',
  ROLES: 'bionatural_roles',
  EMPLOYEES: 'bionatural_employees',
} as const;

/**
 * Obtener datos del localStorage
 */
export function getStorageData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error al leer ${key} del localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Guardar datos en localStorage
 */
export function setStorageData<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error al guardar ${key} en localStorage:`, error);
    return false;
  }
}

/**
 * Eliminar datos del localStorage
 */
export function removeStorageData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error al eliminar ${key} del localStorage:`, error);
  }
}

/**
 * Limpiar todo el localStorage de Bionatural
 */
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorageData(key);
  });
}

/**
 * Hook personalizado para usar almacenamiento con persistencia
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Función para obtener el valor inicial
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error al leer localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // Estado con el valor del localStorage
  const [storedValue, setStoredValue] = React.useState<T>(readValue);

  // Función para guardar
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Permitir funciones para actualizar basado en el valor previo
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en estado
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error al guardar localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

import React, { useState, useEffect } from 'react';

export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Obtener valor inicial del localStorage o usar el valor por defecto
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error al cargar ${key}:`, error);
      return initialValue;
    }
  });

  // Guardar en localStorage cada vez que cambie el estado
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error al guardar ${key}:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Funciones de validación comunes
 */
export const validators = {
  required: (value: any, fieldName: string): string | null => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} es obligatorio`;
    }
    return null;
  },

  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return 'El email no tiene un formato válido';
    }
    return null;
  },

  phone: (value: string): string | null => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'El número de teléfono no es válido';
    }
    return null;
  },

  positiveNumber: (value: any, fieldName: string): string | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} debe ser mayor a 0`;
    }
    return null;
  },

  nonNegativeNumber: (value: any, fieldName: string): string | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return `${fieldName} no puede ser negativo`;
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string): string | null => {
    if (value && value.length < min) {
      return `${fieldName} debe tener al menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string): string | null => {
    if (value && value.length > max) {
      return `${fieldName} no puede tener más de ${max} caracteres`;
    }
    return null;
  },

  minimumCOPAmount: (value: any, minAmount: number, fieldName: string): string | null => {
    const num = parseFloat(value);
    if (isNaN(num) || num < minAmount) {
      // Importar formatCOP desde currency.ts para mostrar en mensaje
      const { formatCOP } = require('../constants/currency');
      return `${fieldName} debe ser mínimo ${formatCOP(minAmount)}`;
    }
    return null;
  },
};

/**
 * Utilidad para validar múltiples campos
 */
export function validateFields(validations: Array<() => string | null>): string[] {
  const errors: string[] = [];
  validations.forEach(validation => {
    const error = validation();
    if (error) {
      errors.push(error);
    }
  });
  return errors;
}

/**
 * Generar ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatear fecha
 */
export function formatDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Obtener fecha actual
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Importar y exportar utilidades de moneda COP
 */
export { formatCOP, parseCOP, MIN_PRICES, COP_CONFIG } from '../constants/currency';

export { STORAGE_KEYS };
