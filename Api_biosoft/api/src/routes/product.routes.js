// src/routes/product.routes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Rutas públicas (con autenticación opcional)
router.get('/', optionalAuth, productController.getAll);
router.get('/search', optionalAuth, productController.searchProducts);
router.get('/featured', optionalAuth, productController.getFeatured);
router.get('/low-stock', authenticateToken, productController.getLowStock);
router.get('/:id', optionalAuth, productController.getOne);

// Rutas protegidas (requieren autenticación)
router.post('/', authenticateToken, productController.create);
router.put('/:id', authenticateToken, productController.update);
router.patch('/:id/stock', authenticateToken, productController.updateStock);
router.delete('/:id', authenticateToken, productController.remove);

module.exports = router;