const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  email: z
    .string()
    .email('El email no es válido')
    .max(150, 'El email no puede exceder 150 caracteres'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede exceder 72 caracteres'),
  roleId: z.coerce.number().int().positive(),
  phone: z.string().max(30, 'El teléfono no puede exceder 30 caracteres').optional().or(z.literal('')),
  documentType: z.string().max(10, 'El tipo de documento no puede exceder 10 caracteres').optional().or(z.literal('')),
  documentNumber: z.string().max(50, 'El número de documento no puede exceder 50 caracteres').optional().or(z.literal('')),
});

const loginSchema = z.object({
  email: z
    .string()
    .email('El email no es válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .max(72, 'La contraseña no es válida')
});

const verifyEmailSchema = z.object({
  email: z
    .string()
    .email('El email no es válido'),
  code: z
    .string()
    .regex(/^\d{6}$/, 'El código debe ser 6 dígitos')
});

const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .email('El email no es válido')
});

const passwordResetConfirmSchema = z.object({
  email: z
    .string()
    .email('El email no es válido'),
  code: z
    .string()
    .regex(/^\d{6}$/, 'El código debe ser 6 dígitos'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede exceder 72 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un dígito')
    .regex(/[^a-zA-Z0-9]/, 'La contraseña debe contener al menos un carácter especial')
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
};

