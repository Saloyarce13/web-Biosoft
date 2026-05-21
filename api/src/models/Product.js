// src/models/Product.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: products
  Columnas: id, name, description, price, stock, image, isActive, categoryId, createdAt, updatedAt
  Relación: un producto pertenece a una categoría (N:1)
*/
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre del producto no puede estar vacío' },
      len: { args: [2, 150], msg: 'El nombre debe tener entre 2 y 150 caracteres' },
      isNonemptyString(value) {
        if (!value || typeof value !== 'string' || !value.trim()) {
          throw new Error('El nombre no puede ser solo espacios en blanco');
        }
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: { args: [10, 2000], msg: 'La descripción debe tener entre 10 y 2000 caracteres' }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El precio debe ser un número válido' },
      min: { args: [0.01], msg: 'El precio debe ser mayor a 0' },
      customValidator(value) {
        if (value && (String(value).split('.')[1] || '').length > 2) {
          throw new Error('El precio no puede tener más de 2 decimales');
        }
      }
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: { msg: 'El stock debe ser un número entero' },
      min: { args: [0], msg: 'El stock no puede ser negativo' }
    }
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: { msg: 'La URL de la imagen no es válida', require_protocol: true }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Sirve para desactivar productos sin eliminarlos'
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    },
    validate: {
      isInt: { msg: 'El ID de la categoría debe ser un número entero' }
    }
  }
}, {
  tableName: 'products',
  timestamps: true
});

module.exports = Product;