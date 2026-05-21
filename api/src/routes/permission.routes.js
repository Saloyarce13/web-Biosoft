// src/routes/permission.routes.js
const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, permissionController.getAll);
router.get('/:id', authenticateToken, permissionController.getOne);
router.post('/', authenticateToken, permissionController.create);
router.put('/:id', authenticateToken, permissionController.update);
router.delete('/:id', authenticateToken, permissionController.remove);

module.exports = router;
