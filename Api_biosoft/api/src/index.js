// src/index.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const prisma = require('./lib/prisma');
const { ensureInitialData } = require('./lib/initialData');

const app = express();

// ─── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors());            // permite peticiones desde otros dominios (frontend)
app.use(express.json());    // parsea el body de las peticiones como JSON

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

// ─── Ruta de salud del servidor ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API funcionando correctamente', timestamp: new Date() });
});

// ─── Manejo de rutas no encontradas ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada` });
});

// ─── Arrancar el servidor ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // 1. Verificar conexión a la BD
  await prisma.$connect();
  console.log('✅ Prisma conectado a PostgreSQL');

  // 2. Asegurar datos iniciales mínimos (roles + usuario admin)
  await ensureInitialData();

  // 3. Levantar el servidor
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Endpoints disponibles:`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/verify-email`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/password-reset/request`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/password-reset/confirm`);
    console.log(`   GET    http://localhost:${PORT}/api/auth/me`);
    console.log(`   GET    http://localhost:${PORT}/api/products`);
    console.log(`   GET    http://localhost:${PORT}/api/categories`);
  });
};

startServer();