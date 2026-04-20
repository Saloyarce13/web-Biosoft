// src/models/User.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: users
  Columnas: id, name, email, password, isActive, roleId, createdAt, updatedAt
  Relación: un usuario pertenece a un rol (N:1)
*/
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre no puede estar vacío' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' }
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Este email ya está registrado'
    },
    validate: {
      isEmail: { msg: 'Debe ser un email válido' },
      notEmpty: { msg: 'El email no puede estar vacío' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: { args: [60, 255], msg: 'La contraseña debe estar hasheada' }
    }
    // Nunca guardes la contraseña en texto plano, se hashea en el controller
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si el email ha sido verificado'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Sirve para desactivar usuarios sin eliminarlos'
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',  // nombre de la tabla a la que hace referencia
      key: 'id'
    },
    validate: {
      isInt: { msg: 'El ID del rol debe ser un número entero' }
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  // Esto evita que el password se devuelva en las consultas por defecto
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    // Scope especial para cuando SÍ necesitamos el password (login)
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

module.exports = User;