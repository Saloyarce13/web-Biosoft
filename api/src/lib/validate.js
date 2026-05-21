// src/lib/validate.js
const validate = (schema, data) => {
  try {
    const parsed = schema.parse(data);
    return { ok: true, data: parsed };
  } catch (error) {
    const errorMessages = error.errors?.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ') || error.message;
    
    return { ok: false, error: errorMessages };
  }
};

module.exports = { validate };