// src/validators/employee.validators.js

const { z } = require('zod');

const createEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .max(120, 'El nombre completo no puede exceder 120 caracteres')
    .trim(),
  email: z
    .string()
    .email('El email no es válido')
    .max(150, 'El email no puede exceder 150 caracteres')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 caracteres')
    .max(30, 'El teléfono no puede exceder 30 caracteres')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true)
});

const updateEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .max(120, 'El nombre completo no puede exceder 120 caracteres')
    .trim()
    .optional(),
  email: z
    .string()
    .email('El email no es válido')
    .max(150, 'El email no puede exceder 150 caracteres')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 caracteres')
    .max(30, 'El teléfono no puede exceder 30 caracteres')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional()
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema
};
