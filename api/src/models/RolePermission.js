// src/models/RolePermission.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: role_permissions (tabla pivote)
  Columnas: roleId, permissionId, createdAt
  Relación: N:M entre roles y permissions
*/
const RolePermission = sequelize.define('RolePermission', {
  roleId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id'
    }
  }
}, {
  tableName: 'role_permissions',
  timestamps: false,
  createdAt: 'createdAt',
  updatedAt: false
});

module.exports = RolePermission;
