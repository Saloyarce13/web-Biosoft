// src/controllers/config.controller.js
// Expone la configuración del sistema almacenada en la tabla system_config.
// El endpoint GET /api/config es público (sin auth) para que el frontend
// pueda cargar tipos de documento, estados, etc. antes del login.

const prisma = require('../lib/prisma');

/**
 * GET /api/config
 * Devuelve toda la configuración activa, agrupada por `group`.
 * Respuesta: { success: true, data: { document_types_user: [...], sale_statuses: [...], ... } }
 */
const getAll = async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { isActive: true },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
      select: { key: true, value: true, group: true, description: true },
    });

    // Agrupar por `group` para facilitar el consumo en el frontend
    const grouped = {};
    for (const cfg of configs) {
      const g = cfg.group || 'general';
      if (!grouped[g]) grouped[g] = {};
      
      let val = cfg.value;
      // Filtramos dinámicamente el botón "Inicio" (id: 'home') para que no aparezca en el admin
      if (cfg.key === 'sidebar_items' && Array.isArray(val)) {
        val = val.filter(item => item.id !== 'home');
      }
      
      grouped[g][cfg.key] = val;
    }

    return res.status(200).json({ success: true, data: grouped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/config/:key
 * Devuelve el valor de una clave específica.
 */
const getByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const config = await prisma.systemConfig.findUnique({
      where: { key },
      select: { key: true, value: true, group: true, description: true },
    });

    if (!config) {
      return res.status(404).json({ success: false, message: `Configuración '${key}' no encontrada` });
    }

    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/config/:key  (requiere auth + permiso admin)
 * Actualiza el valor de una clave de configuración.
 */
const updateByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'El campo value es requerido' });
    }

    const existing = await prisma.systemConfig.findUnique({ where: { key } });
    if (!existing) {
      return res.status(404).json({ success: false, message: `Configuración '${key}' no encontrada` });
    }

    const updated = await prisma.systemConfig.update({
      where: { key },
      data: {
        value,
        ...(description !== undefined ? { description } : {}),
      },
    });

    return res.status(200).json({ success: true, message: 'Configuración actualizada', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/config/app
 * Devuelve la configuración pública de la aplicación (sin auth, sin BD).
 * Útil para que el frontend conozca la URL base de la API y el nombre de la app.
 */
const getAppConfig = (req, res) => {
  res.json({
    success: true,
    apiUrl: process.env.RENDER_EXTERNAL_URL || '',
    appName: 'Bionatural',
  });
};

module.exports = { getAll, getByKey, updateByKey, getAppConfig };
