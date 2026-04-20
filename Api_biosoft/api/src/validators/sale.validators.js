// src/validators/sale.validators.js

const { z } = require('zod');

const createSaleSchema = z.object({
  clientId: z.coerce.number().int().positive('El ID del cliente debe ser un número positivo'),
  employeeId: z.coerce.number().int().positive().optional().or(z.null()),
  notes: z
    .string()
    .min(5, 'Las notas deben tener al menos 5 caracteres')
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  saleDate: z.string().datetime().optional(),
  items: z.array(
    z.object({
      productId: z.coerce.number().int().positive('El ID del producto debe ser un número positivo'),
      quantity: z.coerce.number().int().min(1, 'La cantidad debe ser mayor a 0'),
      unitPrice: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, 'El precio debe ser un número válido con máximo 2 decimales')
        .transform(val => parseFloat(val))
        .refine(val => val >= 0, 'El precio no puede ser negativo')
    })
  ).min(1, 'La venta debe tener al menos un producto')
});

const updateSaleSchema = z.object({
  status: z
    .enum(['REGISTERED', 'COMPLETED', 'CANCELLED', 'ANNULED'])
    .optional(),
  notes: z
    .string()
    .min(5, 'Las notas deben tener al menos 5 caracteres')
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  employeeId: z.coerce.number().int().positive().optional().or(z.null())
});

const saleIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

module.exports = {
  createSaleSchema,
  updateSaleSchema,
  saleIdSchema
};
