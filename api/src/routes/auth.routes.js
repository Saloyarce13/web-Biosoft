// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/demo-login', authController.demoLogin);

// Recuperación de contraseña
router.post('/password-reset/request', authController.passwordResetRequest);
router.post('/password-reset/verify-code', authController.passwordResetVerifyCode);
router.post('/password-reset/confirm', authController.passwordResetConfirm);

// Rutas protegidas (requieren autenticación)
router.get('/me', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;