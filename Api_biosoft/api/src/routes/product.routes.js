const router = require('express').Router();
const { getAll, getOne, create, update, updateStock, remove } = require('../controllers/product.controller');
const { verifyToken, verifyRole, verifyRoleOrPermission } = require('../middlewares/auth.middleware');

const canView   = verifyRoleOrPermission({ roles: ['administrador', 'vendedor', 'bodega'], permissions: ['products.view', 'products.manage'] });
const canManage = verifyRoleOrPermission({ roles: ['administrador', 'vendedor', 'bodega'], permissions: ['products.manage'] });

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/',           verifyToken, canManage, create);
router.put('/:id',         verifyToken, canManage, update);
router.patch('/:id/stock', verifyToken, canManage, updateStock);
router.delete('/:id',      verifyToken, verifyRole('administrador'), remove);

module.exports = router;
