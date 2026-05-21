// src/routes/provider.routes.js
const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, providerController.getAll);
router.get('/:id', authenticateToken, providerController.getOne);
router.post('/', authenticateToken, providerController.create);
router.put('/:id', authenticateToken, providerController.update);
router.patch('/:id/status', authenticateToken, providerController.toggleStatus);
router.delete('/:id', authenticateToken, providerController.remove);

module.exports = router;
