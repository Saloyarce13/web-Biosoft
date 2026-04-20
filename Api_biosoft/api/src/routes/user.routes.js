const router = require('express').Router();
const { getAll, getOne, getConsolidated, create, update, updateMyProfile, toggleStatus, changePassword, resetPassword, remove } = require('../controllers/user.controller');
const { verifyToken, verifyRole, verifyRoleOrPermission } = require('../middlewares/auth.middleware');

router.get('/consolidated', verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['users.view', 'users.manage'] }), getConsolidated);
router.get('/',             verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['users.view', 'users.manage'] }), getAll);
router.get('/:id',          verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['users.view', 'users.manage'] }), getOne);
router.post('/',            verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['users.manage'] }), create);
router.put('/:id',          verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['users.manage'] }), update);
router.patch('/me/profile', verifyToken, updateMyProfile);
router.patch('/:id/status', verifyToken, verifyRoleOrPermission({ roles: ['administrador'], permissions: ['users.manage'] }), toggleStatus);
router.patch('/:id/password',       verifyToken, changePassword);
router.patch('/:id/reset-password', verifyToken, verifyRole('administrador'), resetPassword);
router.delete('/:id',       verifyToken, verifyRole('administrador'), remove);

module.exports = router;
