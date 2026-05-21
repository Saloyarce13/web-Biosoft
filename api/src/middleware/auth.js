// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const JWT_SECRET = process.env.JWT_SECRET || 'bionatural-secret-key-2024';

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  console.log(`DEBUG AUTH: ${req.method} ${req.originalUrl}`);
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                    resource: true,
                    action: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no válido o inactivo' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Error de autenticación' 
    });
  }
};

// Middleware para verificar permisos específicos
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    const userPermissions = req.user.role?.permissions || [];
    const hasPermission = userPermissions.some(p => 
      p.permission.resource === resource && 
      p.permission.action === action
    );

    if (!hasPermission) {
      logger.warn(`Permission denied for user ${req.user.email}: ${resource}:${action}`);
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};

// Middleware para verificar roles
const requireRole = (roleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    if (req.user.role?.name !== roleName) {
      logger.warn(`Role access denied for user ${req.user.email}: required ${roleName}, has ${req.user.role?.name}`);
      return res.status(403).json({ 
        success: false, 
        message: `Acceso denegado. Se requiere rol: ${roleName}` 
      });
    }

    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          role: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error.message);
  }
  
  next();
};

// Generar token JWT
const generateToken = (userId, expiresIn = '24h') => {
  return jwt.sign(
    { userId, timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn }
  );
};

// Verificar token sin middleware
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  optionalAuth,
  generateToken,
  verifyToken
};