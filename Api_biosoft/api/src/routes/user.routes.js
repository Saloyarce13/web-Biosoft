// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, userController.getAll);
router.get('/consolidated', authenticateToken, userController.getConsolidated);
router.get('/:id', authenticateToken, userController.getOne);
router.post('/', authenticateToken, userController.create);
router.put('/:id', authenticateToken, userController.update);
router.patch('/me/profile', authenticateToken, userController.updateMyProfile);
router.patch('/:id/status', authenticateToken, userController.toggleStatus);
router.patch('/:id/password', authenticateToken, userController.changePassword);
router.patch('/:id/reset-password', authenticateToken, userController.resetPassword);
router.delete('/:id', authenticateToken, userController.remove);

module.exports = router;
