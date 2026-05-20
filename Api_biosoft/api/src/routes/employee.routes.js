// src/routes/employee.routes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, employeeController.getAll);
router.get('/:id', authenticateToken, employeeController.getOne);
router.post('/', authenticateToken, employeeController.create);
router.put('/:id', authenticateToken, employeeController.update);
router.patch('/:id/status', authenticateToken, employeeController.toggleStatus);
router.delete('/:id', authenticateToken, employeeController.remove);

module.exports = router;
