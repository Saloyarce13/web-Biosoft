// src/lib/validateEmail.js
// Valida que un email tenga formato correcto Y que el dominio tenga registros MX reales.
// Esto evita registros con dominios inexistentes como "gmaill.com", "hotmial.com", etc.

const dns = require('dns').promises;

// Caché simple para no hacer DNS lookup repetido del mismo dominio
const domainCache = new Map(); // domain -> { valid: bool, ts: number }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Verifica si un dominio tiene registros MX (puede recibir correos).
 * @param {string} domain
 * @returns {Promise<boolean>}
 */
const hasMxRecords = async (domain) => {
  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.valid;
  }

  try {
    const records = await dns.resolveMx(domain);
    const valid = Array.isArray(records) && records.length > 0;
    domainCache.set(domain, { valid, ts: Date.now() });
    return valid;
  } catch {
    domainCache.set(domain, { valid: false, ts: Date.now() });
    return false;
  }
};

/**
 * Valida formato + existencia del dominio de un email.
 * @param {string} email
 * @returns {Promise<{ valid: boolean, message: string }>}
 */
const validateEmailExists = async (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'El email es requerido' };
  }

  const trimmed = email.trim().toLowerCase();

  // 1. Validar formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: 'El formato del email no es válido' };
  }

  // 2. Extraer dominio
  const domain = trimmed.split('@')[1];

  // 3. Verificar que el dominio tiene registros MX
  const mxExists = await hasMxRecords(domain);
  if (!mxExists) {
    return {
      valid: false,
      message: `El dominio "${domain}" no existe o no puede recibir correos. Verifica que el email esté bien escrito.`,
    };
  }

  return { valid: true, message: 'Email válido' };
};

module.exports = { validateEmailExists };
