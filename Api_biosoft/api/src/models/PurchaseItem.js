// src/models/PurchaseItem.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: purchase_items
  Columnas: id, purchaseId, productId, quantity, unitPrice, lineTotal, createdAt
  Relación: muchos items pertenecen a una compra (N:1), muchos items pueden referirse a un producto (N:1)
*/
const PurchaseItem = sequelize.define('PurchaseItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  purchaseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'purchases',
      key: 'id'
    },
    validate: {
      isInt: { msg: 'El ID de la compra debe ser un número entero' }
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    validate: {
      isInt: { msg: 'El ID del producto debe ser un número entero' }
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'La cantidad debe ser un número entero' },
      min: { args: [1], msg: 'La cantidad debe ser mayor a 0' }
    }
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El precio unitario debe ser un número válido' },
      min: { args: [0], msg: 'El precio unitario no puede ser negativo' }
    }
  },
  lineTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El total de línea debe ser un número válido' },
      min: { args: [0], msg: 'El total de línea no puede ser negativo' }
    }
  }
}, {
  tableName: 'purchase_items',
  timestamps: false,
  createdAt: 'createdAt',
  updatedAt: false
});

module.exports = PurchaseItem;
