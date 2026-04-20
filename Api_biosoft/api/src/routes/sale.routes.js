const router = require('express').Router();
const { create, createMyOrder, list, getOne, setClient, addItems, removeItems, changeStatus, pdf } = require('../controllers/sale.controller');
const { verifyToken, verifyRole, verifyRoleOrPermission } = require('../middlewares/auth.middleware');

// Middleware que permite acceso a clientes (rol user/cliente) o a staff con permiso
const canViewSales = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'No autorizado' });
  const role = (req.user.role || '').toLowerCase();
  const perms = req.user.permissions || [];
  // Clientes pueden ver sus propias ventas
  if (role === 'user' || role === 'cliente') return next();
  // Staff con rol o permiso
  const staffRoles = ['administrador', 'vendedor', 'contador'];
  if (staffRoles.includes(role) || perms.includes('sales.view') || perms.includes('sales.manage')) return next();
  return res.status(403).json({ success: false, message: 'Acceso denegado' });
};

const canManage = verifyRoleOrPermission({ roles: ['administrador', 'vendedor'], permissions: ['sales.manage'] });

router.get('/',        verifyToken, canViewSales, list);
router.get('/:id/pdf', verifyToken, pdf);
router.get('/:id',     verifyToken, canViewSales, getOne);

// Pedido propio del cliente (sin restriccion de rol)
router.post('/my-order', verifyToken, createMyOrder);

router.post('/',            verifyToken, canManage, create);
router.put('/:id/client',   verifyToken, canManage, setClient);
router.post('/:id/items',   verifyToken, canManage, addItems);
router.delete('/:id/items', verifyToken, canManage, removeItems);
router.patch('/:id/status', verifyToken, canManage, changeStatus);

module.exports = router;
