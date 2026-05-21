// src/routes/category.routes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, categoryController.getAll);
router.get('/:id', optionalAuth, categoryController.getOne);
router.post('/', authenticateToken, categoryController.create);
router.put('/:id', authenticateToken, categoryController.update);
router.patch('/:id/status', authenticateToken, categoryController.toggleStatus);
router.delete('/:id', authenticateToken, categoryController.remove);

module.exports = router;
