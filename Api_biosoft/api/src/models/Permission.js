// src/models/Permission.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: permissions
  Columnas: id, name, description, createdAt, updatedAt
  Relación: una permiso puede estar en muchos roles (N:M a través de RolePermission)
*/
const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      name: 'unique_permission_name',
      msg: 'Esta permisión ya existe'
    },
    validate: {
      notEmpty: { msg: 'El nombre de la permisión no puede estar vacío' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' },
      isAlphanumeric: { args: [{ allow: '_' }], msg: 'El nombre debe contener solo caracteres alfanuméricos y guiones bajos' }
    }
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true,
    validate: {
      len: { args: [5, 200], msg: 'La descripción debe tener entre 5 y 200 caracteres' }
    }
  }
}, {
  tableName: 'permissions',
  timestamps: true
});

module.exports = Permission;
