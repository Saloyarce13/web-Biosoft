// src/routes/role.routes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, roleController.getAll);
router.get('/:id', authenticateToken, roleController.getOne);
router.post('/', authenticateToken, roleController.create);
router.put('/:id', authenticateToken, roleController.update);
router.delete('/:id', authenticateToken, roleController.remove);
router.patch('/:id/status', authenticateToken, roleController.toggleStatus);
router.post('/:id/permissions', authenticateToken, (req, res, next) => {
  req.params.roleId = req.params.id;
  next();
}, roleController.assignPermission);
router.delete('/:id/permissions/:permissionId', authenticateToken, (req, res, next) => {
  req.params.roleId = req.params.id;
  next();
}, roleController.removePermission);

module.exports = router;
