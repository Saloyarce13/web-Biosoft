const router = require('express').Router();
const { list } = require('../controllers/transaction.controller');
const { verifyToken, verifyRoleOrPermission } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, verifyRoleOrPermission({ roles: ['administrador', 'contador'], permissions: ['reports.view'] }), list);

module.exports = router;
