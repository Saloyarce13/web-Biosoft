// src/validators/permission.validators.js

const { z } = require('zod');

const createPermissionSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre deve tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre debe contener solo caracteres alfanuméricos y guiones bajos')
    .toUpperCase(),
  description: z
    .string()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .trim()
    .optional()
});

const updatePermissionSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre deve tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre debe contener solo caracteres alfanuméricos y guiones bajos')
    .toUpperCase()
    .optional(),
  description: z
    .string()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .trim()
    .optional()
});

module.exports = {
  createPermissionSchema,
  updatePermissionSchema
};
