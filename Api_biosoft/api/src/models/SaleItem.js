// src/models/SaleItem.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: sale_items
  Columnas: id, saleId, productId, quantity, unitPrice, lineTotal, createdAt
  Relación: muchos items pertenecen a una venta (N:1), muchos items pueden referirse a un producto (N:1)
*/
const SaleItem = sequelize.define('SaleItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  saleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sales',
      key: 'id'
    },
    validate: {
      isInt: { msg: 'El ID de la venta debe ser un número entero' }
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
  tableName: 'sale_items',
  timestamps: true,
  updatedAt: false
});

module.exports = SaleItem;
