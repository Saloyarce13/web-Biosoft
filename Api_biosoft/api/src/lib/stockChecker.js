// src/lib/stockChecker.js
const prisma = require('./prisma');
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

const checkAndCancelLowStockOrders = async () => {
  try {
    // Buscar productos con stock bajo
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: {
          lte: 5 // productos con 5 o menos unidades
        }
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true
      }
    });

    if (lowStockProducts.length > 0) {
      logger.warn(`Found ${lowStockProducts.length} products with low stock:`, 
        lowStockProducts.map(p => `${p.name}: ${p.stock} units`)
      );
    }

    // Aquí podrías agregar lógica adicional como:
    // - Enviar notificaciones por email
    // - Cancelar órdenes pendientes
    // - Crear alertas en el sistema
    
  } catch (error) {
    logger.error('Error checking stock:', error);
  }
};

module.exports = { checkAndCancelLowStockOrders };