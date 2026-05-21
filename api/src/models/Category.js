// src/models/Category.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: categories
  Columnas: id, name, description, isActive, createdAt, updatedAt
  Relación: una categoría puede tener muchos productos (1:N)
*/
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      name: 'unique_category_name',
      msg: 'Esta categoría ya existe'
    },
    validate: {
      notEmpty: { msg: 'El nombre de la categoría no puede estar vacío' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' },
      isNonemptyString(value) {
        if (!value || typeof value !== 'string' || !value.trim()) {
          throw new Error('El nombre no puede ser solo espacios en blanco');
        }
      }
    }
  },
  description: {
    type: DataTypes.STRING(300),
    allowNull: true,
    validate: {
      len: { args: [5, 300], msg: 'La descripción debe tener entre 5 y 300 caracteres' }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Sirve para desactivar categorías sin eliminarlas'
  }
}, {
  tableName: 'categories',
  timestamps: true
});

module.exports = Category;