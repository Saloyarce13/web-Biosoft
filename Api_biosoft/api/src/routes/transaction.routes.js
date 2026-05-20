// src/routes/transaction.routes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, transactionController.list);

module.exports = router;
