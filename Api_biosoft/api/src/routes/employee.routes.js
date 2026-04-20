const router = require('express').Router();
const { getAll, getOne, create, update, toggleStatus, remove } = require('../controllers/employee.controller');
const { verifyToken, verifyRole, verifyRoleOrPermission } = require('../middlewares/auth.middleware');

router.get('/',    verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['employees.view', 'employees.manage'] }), getAll);
router.get('/:id', verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['employees.view', 'employees.manage'] }), getOne);
router.post('/',            verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['employees.manage'] }), create);
router.put('/:id',          verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['employees.manage'] }), update);
router.patch('/:id/status', verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['employees.manage'] }), toggleStatus);
router.delete('/:id',       verifyToken, verifyRole('administrador'), remove);

module.exports = router;
