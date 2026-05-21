// src/routes/config.routes.js
const express = require('express');
const router = express.Router();
const { getAll, getByKey, updateByKey, getAppConfig } = require('../controllers/config.controller');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// GET /api/config/app — público, devuelve apiUrl y appName desde variables de entorno
router.get('/app', getAppConfig);

// GET /api/config — público, sin auth (el frontend lo necesita antes del login)
router.get('/', getAll);

// GET /api/config/:key — público
router.get('/:key', getByKey);

// PUT /api/config/:key — solo admin (requiere permiso users.edit como proxy de admin)
router.put('/:key', authenticateToken, requirePermission('users', 'edit'), updateByKey);

module.exports = router;
