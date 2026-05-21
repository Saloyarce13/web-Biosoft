// src/routes/client.routes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, clientController.getAll);
router.get('/:id', authenticateToken, clientController.getOne);
router.post('/', authenticateToken, clientController.create);
router.put('/:id', authenticateToken, clientController.update);
router.patch('/:id/status', authenticateToken, clientController.toggleStatus);
router.delete('/:id', authenticateToken, clientController.remove);

module.exports = router;
