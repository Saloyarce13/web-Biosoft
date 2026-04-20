const router = require('express').Router();

const { getAll, getOne, create, update, remove } = require('../controllers/permission.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, verifyRole('administrador'), getOne);
router.post('/', verifyToken, verifyRole('administrador'), create);
router.put('/:id', verifyToken, verifyRole('administrador'), update);
router.delete('/:id', verifyToken, verifyRole('administrador'), remove);

module.exports = router;

