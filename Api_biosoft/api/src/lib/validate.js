const { ZodError } = require('zod');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };

  if (result.error instanceof ZodError) {
    return {
      ok: false,
      error: result.error.issues.map((i) => `${i.path.join('.') || 'field'}: ${i.message}`),
    };
  }

  return { ok: false, error: ['Error de validación'] };
};

module.exports = { validate };

