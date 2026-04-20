/**
 * Constantes y utilidades para manejo de Pesos Colombianos (COP)
 */

// Moneda y configuración locale
export const COP_CONFIG = {
  locale: 'es-CO',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

// Montos mínimos
export const MIN_PRICES = {
  PRODUCT_PRICE: 1000, // Precio mínimo de producto: 1,000 COP
  PRODUCT_COST: 1000, // Costo mínimo de producto: 1,000 COP
} as const;

/**
 * Formateador de moneda COP
 * Convierte un número a formato de Pesos Colombianos: $1,000,000.00
 * 
 * @param amount - Cantidad a formatear
 * @returns String formateado en COP (ej: "$1,000,000.00")
 * 
 * @example
 * formatCOP(1000) // "$1,000.00"
 * formatCOP(1500000) // "$1,500,000.00"
 */
export function formatCOP(amount: number | string | null | undefined): string {
  if (!amount && amount !== 0) {
    return '$0.00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat(COP_CONFIG.locale, {
    style: 'currency',
    currency: COP_CONFIG.currency,
    minimumFractionDigits: COP_CONFIG.minimumFractionDigits,
    maximumFractionDigits: COP_CONFIG.maximumFractionDigits,
  }).format(numAmount);
}

/**
 * Parsear valor formateado a número
 * Convierte "$1,000,000.00" a 1000000
 * 
 * @param formattedValue - Valor formateado
 * @returns Número sin formato
 */
export function parseCOP(formattedValue: string): number {
  // Remover símbolo $, espacios y separadores de miles
  const cleaned = formattedValue.replace(/[^\d\.,-]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Crear formateador reutilizable
 */
export const copFormatter = new Intl.NumberFormat(COP_CONFIG.locale, {
  style: 'currency',
  currency: COP_CONFIG.currency,
  minimumFractionDigits: COP_CONFIG.minimumFractionDigits,
  maximumFractionDigits: COP_CONFIG.maximumFractionDigits,
});
