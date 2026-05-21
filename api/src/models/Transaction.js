// src/models/Transaction.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: transactions
  Columnas: id, type, amount, userId, purchaseId, saleId, metadata, createdAt, updatedAt
  Relación: una transacción puede pertenecer a un usuario (N:1), puede referirse a una compra (N:1), puede referirse a una venta (N:1)
*/
const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('STOCK_IN', 'STOCK_OUT', 'PURCHASE_STATUS_CHANGED', 'SALE_STATUS_CHANGED', 'PASSWORD_CHANGED'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['STOCK_IN', 'STOCK_OUT', 'PURCHASE_STATUS_CHANGED', 'SALE_STATUS_CHANGED', 'PASSWORD_CHANGED']],
        msg: 'El tipo debe ser uno de: STOCK_IN, STOCK_OUT, PURCHASE_STATUS_CHANGED, SALE_STATUS_CHANGED, PASSWORD_CHANGED'
      }
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      isDecimal: { msg: 'El monto debe ser un número válido' }
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  purchaseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'purchases',
      key: 'id'
    }
  },
  saleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sales',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Datos adicionales almacenados en formato JSON'
  }
}, {
  tableName: 'transactions',
  timestamps: true
});

module.exports = Transaction;
