// src/validators/role.validators.js

const { z } = require('zod');

const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre deve tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  description: z
    .string()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .trim()
    .optional()
});

const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre deve tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim()
    .optional(),
  description: z
    .string()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .trim()
    .optional()
});

const assignPermissionSchema = z.object({
  roleId: z.coerce.number().int().positive(),
  permissionIds: z.array(z.coerce.number().int().positive())
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema
};
