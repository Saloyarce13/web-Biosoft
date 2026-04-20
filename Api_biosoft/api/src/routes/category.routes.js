const router = require('express').Router();
const { getAll, getOne, create, update, toggleStatus, remove } = require('../controllers/category.controller');
const { verifyToken, verifyRole, verifyRoleOrPermission } = require('../middlewares/auth.middleware');

const canManage = verifyRoleOrPermission({ roles: ['administrador'], permissions: ['categories.manage'] });

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/',            verifyToken, canManage, create);
router.put('/:id',          verifyToken, canManage, update);
router.patch('/:id/status', verifyToken, canManage, toggleStatus);
router.delete('/:id',       verifyToken, verifyRole('administrador'), remove);

module.exports = router;
