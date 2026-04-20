const router = require('express').Router();

const {
  getAll,
  getOne,
  create,
  update,
  remove,
  toggleStatus,
  assignPermission,
  removePermission,
} = require('../controllers/role.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, verifyRole('administrador'), getOne);
router.post('/', verifyToken, verifyRole('administrador'), create);
router.put('/:id', verifyToken, verifyRole('administrador'), update);
router.patch('/:id/status', verifyToken, verifyRole('administrador'), toggleStatus);
router.delete('/:id', verifyToken, verifyRole('administrador'), remove);

// Asignar/Quitar permisos al rol
router.post('/:roleId/permissions', verifyToken, verifyRole('administrador'), assignPermission);
router.delete(
  '/:roleId/permissions/:permissionId',
  verifyToken,
  verifyRole('administrador'),
  removePermission,
);

module.exports = router;

