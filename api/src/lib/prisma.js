// src/lib/prisma.js
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Crear el pool de conexiones de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Crear el adaptador
const adapter = new PrismaPg(pool);

// Solo loguear queries en desarrollo si se activa explícitamente con DEBUG_QUERIES=true
const isDev = process.env.NODE_ENV !== 'production';
const debugQueries = process.env.DEBUG_QUERIES === 'true';

const prisma = new PrismaClient({
  adapter,
  log: debugQueries
    ? ['query', 'info', 'warn', 'error']
    : isDev
      ? ['warn', 'error']
      : ['error'],
});

module.exports = prisma;