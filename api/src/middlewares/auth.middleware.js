// src/middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

/*
  verifyToken — verifica que el request tenga un JWT válido.
  Se usa en todas las rutas protegidas.
  
  El cliente debe enviar el token en el header así:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
*/
const verifyToken = (req, res, next) => {
  // Obtenemos el header de autorización
  const authHeader = req.headers['authorization'];

  // Verificamos que el header exista y tenga formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Token no proporcionado'
    });
  }

  // Extraemos solo el token (quitamos "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // Verificamos y decodificamos el token con nuestra clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adjuntamos el payload decodificado al request para usarlo en los controllers
    // req.user tendrá: { id, name, email, role }
    req.user = decoded;

    next(); // todo ok, continuamos al controller
  } catch (error) {
    // Siempre 401 para token inválido o expirado (el cliente debe re-autenticarse)
    return res.status(401).json({ success: false, message: 'Sesión expirada o token inválido' });
  }
};

/*
  verifyRole — verifica que el usuario autenticado tenga el rol requerido.
  SIEMPRE debe usarse DESPUÉS de verifyToken.
  
  Ejemplo de uso en rutas:
  router.delete('/:id', verifyToken, verifyRole('admin'), ctrl.remove);
  router.post('/',      verifyToken, verifyRole('admin', 'editor'), ctrl.create);
*/
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'Acceso denegado.' });
    }
    // Comparación case-insensitive para evitar problemas con 'admin' vs 'administrador'
    const userRole = (typeof req.user.role === 'object' ? req.user.role?.name : req.user.role || '').toLowerCase();
    const allowed = allowedRoles.some(r => r.toLowerCase() === userRole);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

/*
  verifyPermission — verifica que el usuario autenticado tenga el/los permisos requeridos.
  El token debe incluir `permissions: string[]`.
*/
const verifyPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    const permissions = req.user?.permissions || [];
    const ok = requiredPermissions.some((p) => permissions.includes(p));
    if (!ok) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere permiso: ${requiredPermissions.join(', ')}`,
      });
    }
    next();
  };
};

/*
  verifyRoleOrPermission — permite acceso si el usuario tiene el rol requerido
  O tiene alguno de los permisos especificados.
  Uso: verifyRoleOrPermission({ roles: ['administrador'], permissions: ['products.manage'] })
*/
const verifyRoleOrPermission = ({ roles = [], permissions = [] }) => {
  return (req, res, next) => {
    if (!req.user) return res.status(403).json({ success: false, message: 'Acceso denegado.' });
    const userRole = (typeof req.user.role === 'object' ? req.user.role?.name : req.user.role || '').toLowerCase();
    const userPerms = req.user.permissions || [];
    const hasRole = roles.some(r => r.toLowerCase() === userRole);
    const hasPerm = permissions.some(p => userPerms.includes(p));
    if (hasRole || hasPerm) return next();
    return res.status(403).json({
      success: false,
      message: `Acceso denegado. Se requiere rol (${roles.join(', ')}) o permiso (${permissions.join(', ')})`,
    });
  };
};

module.exports = { verifyToken, verifyRole, verifyPermission, verifyRoleOrPermission };