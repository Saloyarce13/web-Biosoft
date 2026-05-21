// src/models/Sale.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: sales
  Columnas: id, clientId, employeeId, status, notes, saleDate, pdfUrl, totalPrice, createdByUserId, createdAt, updatedAt
  Relación: una venta pertenece a un cliente (N:1), puede tener un empleado (N:1), pertenece a usuario (N:1)
*/
const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    validate: {
      isInt: { msg: 'El ID del cliente debe ser un número entero' }
    }
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('REGISTERED', 'COMPLETED', 'CANCELLED', 'ANNULED'),
    defaultValue: 'REGISTERED',
    validate: {
      isIn: {
        args: [['REGISTERED', 'COMPLETED', 'CANCELLED', 'ANNULED']],
        msg: 'El estado debe ser uno de: REGISTERED, COMPLETED, CANCELLED, ANNULED'
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: { args: [5, 500], msg: 'Las notas deben tener entre 5 y 500 caracteres' }
    }
  },
  saleDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: { msg: 'La fecha de venta debe ser una fecha válida' }
    }
  },
  pdfUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: { msg: 'La URL del PDF no es válida' }
    }
  },
  totalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El precio total debe ser un número válido' },
      min: { args: [0], msg: 'El precio total no puede ser negativo' }
    }
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      isInt: { msg: 'El ID del usuario debe ser un número entero' }
    }
  }
}, {
  tableName: 'sales',
  timestamps: true
});

module.exports = Sale;
