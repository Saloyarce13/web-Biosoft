// src/index.js
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

const prisma = require('./lib/prisma');
const { ensureInitialData } = require('./lib/initialData');
const { checkAndCancelLowStockOrders } = require('./lib/stockChecker');

const app = express();

// ─── Logger Configuration ──────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bionatural-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// ─── Security Middlewares ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 300 : 2000, // 300 en prod, 2000 en dev
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 10 : 200, // 10 en prod, 200 en dev
  message: {
    success: false,
    message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── CORS Configuration ────────────────────────────────────────────────────────
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 horas
};

// ─── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors(corsOptions));
// Manejar preflight OPTIONS explícitamente
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/users',      require('./routes/user.routes'));
app.use('/api/roles',      require('./routes/role.routes'));
app.use('/api/permissions', require('./routes/permission.routes'));
app.use('/api/employees',   require('./routes/employee.routes'));
app.use('/api/providers',    require('./routes/provider.routes'));
app.use('/api/clients',      require('./routes/client.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products',   require('./routes/product.routes'));

app.use('/api/purchases',  require('./routes/purchase.routes'));
app.use('/api/sales',       require('./routes/sale.routes'));
app.use('/api/stats',       require('./routes/stats.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/upload',       require('./routes/upload.routes'));
app.use('/api/config',       require('./routes/config.routes'));

// ─── Ruta de salud del servidor ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando correctamente', 
    timestamp: new Date(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── Error handling middleware ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { 
    stack: err.stack, 
    url: req.originalUrl, 
    method: req.method,
    ip: req.ip 
  });
  
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
});

// ─── Manejo de rutas no encontradas ───────────────────────────────────────────
app.use((req, res) => {
  logger.warn(`Ruta no encontrada: ${req.originalUrl} - ${req.ip}`);
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada` });
});

// ─── Arrancar el servidor ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// Obtiene el PID que ocupa un puerto en Windows usando netstat
const getPidOnPort = (port) => {
  try {
    const { execSync } = require('child_process');
    const output = execSync(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parseInt(parts[parts.length - 1], 10);
      if (pid && pid > 0) return pid;
    }
  } catch { /* no hay proceso en ese puerto */ }
  return null;
};

// Mata el proceso que ocupa el puerto (sin ventanas de confirmación)
const freePort = (port) => new Promise((resolve) => {
  try {
    const { execSync } = require('child_process');
    const pid = getPidOnPort(port);
    if (pid) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' });
      logger.info(`   Puerto ${port} liberado (PID ${pid} terminado)`);
    }
  } catch { /* ignorar si ya no existe */ }
  setTimeout(resolve, 800);
});

const startServer = async () => {
  try {
    // 1. Verificar conexión a la BD
    await prisma.$connect();
    logger.info('✅ Prisma conectado a PostgreSQL');

    // 2. Crear datos iniciales si no existen
    await ensureInitialData();
    logger.info('✅ Datos iniciales verificados');

    // 3. Iniciar el checker de stock cada 30 minutos
    setInterval(checkAndCancelLowStockOrders, 30 * 60 * 1000);
    logger.info('✅ Stock checker iniciado');

    // 4. Arrancar servidor — si el puerto está ocupado, liberarlo y reintentar
    const tryListen = (attempt = 1) => {
      const server = app.listen(PORT, () => {
        logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        logger.info('   POST /api/auth/login');
        logger.info('   GET  /api/products');
        logger.info('   GET  /api/config');
      });

      server.on('error', async (err) => {
        if (err.code === 'EADDRINUSE' && attempt <= 2) {
          logger.warn(`⚠️  Puerto ${PORT} ocupado. Liberando y reintentando (intento ${attempt})...`);
          await freePort(PORT);
          tryListen(attempt + 1);
        } else {
          logger.error('❌ No se pudo iniciar el servidor:', err.message);
          process.exit(1);
        }
      });
    };

    tryListen();
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// ─── Manejo de señales del sistema ─────────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();