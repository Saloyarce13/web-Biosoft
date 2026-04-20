// src/routes/auth.routes.js
const router = require('express').Router();
const {
  register,
  verifyEmail,
  login,
  me,
  passwordResetRequest,
  passwordResetVerifyCode,
  passwordResetConfirm,
} = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/me', verifyToken, me);

router.post('/password-reset/request', passwordResetRequest);
router.post('/password-reset/verify-code', passwordResetVerifyCode);
router.post('/password-reset/confirm', passwordResetConfirm);

module.exports = router;