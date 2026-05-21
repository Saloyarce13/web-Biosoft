// src/routes/stats.routes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, statsController.dashboard);
router.get('/stock-available-by-product', authenticateToken, statsController.stockAvailableByProduct);
router.get('/unique-clients', authenticateToken, statsController.uniqueClients);
router.get('/active-providers', authenticateToken, statsController.activeProviders);
router.get('/active-products', authenticateToken, statsController.activeProducts);
router.get('/top-clients', authenticateToken, statsController.topClients);
router.get('/weekly-sales', authenticateToken, statsController.weeklySales);
router.get('/category-performance', authenticateToken, statsController.categoryPerformance);

module.exports = router;
