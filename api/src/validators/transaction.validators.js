// src/validators/transaction.validators.js

const { z } = require('zod');

const createTransactionSchema = z.object({
  type: z
    .enum(['STOCK_IN', 'STOCK_OUT', 'PURCHASE_STATUS_CHANGED', 'SALE_STATUS_CHANGED', 'PASSWORD_CHANGED'])
    .optional(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'El monto debe ser un número válido con máximo 2 decimales')
    .transform(val => parseFloat(val))
    .refine(val => val >= 0, 'El monto no puede ser negativo')
    .optional(),
  userId: z.coerce.number().int().positive().optional().or(z.null()),
  purchaseId: z.coerce.number().int().positive().optional().or(z.null()),
  saleId: z.coerce.number().int().positive().optional().or(z.null()),
  metadata: z.record(z.any()).optional()
});

module.exports = {
  createTransactionSchema
};
