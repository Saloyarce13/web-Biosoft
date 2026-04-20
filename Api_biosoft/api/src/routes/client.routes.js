const router = require('express').Router();
const { getAll, getOne, create, update, toggleStatus, remove } = require('../controllers/client.controller');
const { verifyToken, verifyRole, verifyRoleOrPermission } = require('../middlewares/auth.middleware');

const canView   = verifyRoleOrPermission({ roles: ['administrador', 'vendedor'], permissions: ['clients.view', 'clients.manage'] });
const canManage = verifyRoleOrPermission({ roles: ['administrador', 'vendedor'], permissions: ['clients.manage'] });

router.get('/',    verifyToken, canView, getAll);
router.get('/:id', verifyToken, canView, getOne);
router.post('/',            verifyToken, canManage, create);
router.put('/:id',          verifyToken, canManage, update);
router.patch('/:id/status', verifyToken, canManage, toggleStatus);
router.delete('/:id',       verifyToken, verifyRole('administrador'), remove);

module.exports = router;
