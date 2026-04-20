const router = require('express').Router();
const { dashboard, stockAvailableByProduct, uniqueClients, activeProviders, activeProducts, topClients } = require('../controllers/stats.controller');
const { verifyToken, verifyRoleOrPermission } = require('../middlewares/auth.middleware');

const canViewReports = verifyRoleOrPermission({ roles: ['administrador', 'vendedor', 'bodega', 'contador'], permissions: ['reports.view'] });

router.get('/dashboard',                  verifyToken, canViewReports, dashboard);
router.get('/stock-available-by-product', verifyToken, canViewReports, stockAvailableByProduct);
router.get('/unique-clients',             verifyToken, canViewReports, uniqueClients);
router.get('/active-providers',           verifyToken, canViewReports, activeProviders);
router.get('/active-products',            verifyToken, canViewReports, activeProducts);
router.get('/top-clients',                verifyToken, canViewReports, topClients);

module.exports = router;
