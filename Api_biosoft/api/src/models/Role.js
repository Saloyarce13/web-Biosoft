// src/models/Role.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: roles
  Columnas: id, name, description, createdAt, updatedAt
  Relación: un rol puede tener muchos usuarios (1:N) y muchas permisos (N:M a través de RolePermission)
*/
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identificador único del rol'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      name: 'unique_role_name',
      msg: 'Este nombre de rol ya existe'
    },
    validate: {
      notEmpty: { msg: 'El nombre del rol no puede estar vacío' },
      len: { args: [2, 50], msg: 'El nombre debe tener entre 2 y 50 caracteres' }
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
  tableName: 'roles',
  timestamps: true
});

module.exports = Role;