const router = require('express').Router();
const { create, list, getOne, addItems, removeItems, changeStatus, pdf } = require('../controllers/purchase.controller');
const { verifyToken, verifyRole, verifyRoleOrPermission } = require('../middlewares/auth.middleware');

const canView   = verifyRoleOrPermission({ roles: ['administrador', 'bodega', 'contador'], permissions: ['purchases.view', 'purchases.manage'] });
const canManage = verifyRoleOrPermission({ roles: ['administrador', 'bodega'],             permissions: ['purchases.manage'] });

router.get('/',        verifyToken, canView, list);
router.get('/:id/pdf', verifyToken, pdf);
router.get('/:id',     verifyToken, canView, getOne);

router.post('/',            verifyToken, canManage, create);
router.post('/:id/items',   verifyToken, canManage, addItems);
router.delete('/:id/items', verifyToken, canManage, removeItems);
router.patch('/:id/status', verifyToken, canManage, changeStatus);

module.exports = router;
