// src/routes/sale.routes.js
const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, saleController.list);
router.get('/:id', authenticateToken, saleController.getOne);
router.get('/:id/pdf', authenticateToken, saleController.pdf);
router.post('/', authenticateToken, saleController.create);
router.post('/my-order', authenticateToken, saleController.createMyOrder);
router.patch('/:id/status', authenticateToken, saleController.changeStatus);
router.patch('/:id/ready', authenticateToken, saleController.markReady);
router.patch('/:id/client', authenticateToken, saleController.setClient);
router.post('/:id/items', authenticateToken, saleController.addItems);
router.delete('/:id/items', authenticateToken, saleController.removeItems);

module.exports = router;
