// src/routes/purchase.routes.js
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, purchaseController.list);
router.get('/:id', authenticateToken, purchaseController.getOne);
router.get('/:id/pdf', authenticateToken, purchaseController.pdf);
router.post('/', authenticateToken, purchaseController.create);
router.patch('/:id/status', authenticateToken, purchaseController.changeStatus);
router.post('/:id/items', authenticateToken, purchaseController.addItems);
router.delete('/:id/items', authenticateToken, purchaseController.removeItems);

module.exports = router;
