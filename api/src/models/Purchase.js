// src/models/Purchase.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: purchases
  Columnas: id, providerId, employeeId, status, notes, purchasedAt, pdfUrl, totalPrice, createdByUserId, createdAt, updatedAt
  Relación: una compra pertenece a un proveedor (N:1), puede tener un empleado (N:1), pertenece a usuario (N:1)
*/
const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  providerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'providers',
      key: 'id'
    },
    validate: {
      isInt: { msg: 'El ID del proveedor debe ser un número entero' }
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
  purchasedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: { msg: 'La fecha de compra debe ser una fecha válida' }
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
  tableName: 'purchases',
  timestamps: true
});

module.exports = Purchase;
