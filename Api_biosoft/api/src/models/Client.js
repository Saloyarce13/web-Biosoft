// src/models/Client.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: clients
  Columnas: id, name, email, phone, address, isActive, createdAt, updatedAt
  Relación: un cliente puede tener muchas ventas (1:N)
*/
const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre del cliente no puede estar vacío' },
      len: { args: [2, 150], msg: 'El nombre debe tener entre 2 y 150 caracteres' }
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    unique: {
      name: 'unique_client_email',
      msg: 'Este email ya está registrado como cliente'
    },
    validate: {
      isEmail: { msg: 'Debe ser un email válido' }
    }
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
    validate: {
      len: { args: [7, 30], msg: 'El teléfono debe tener entre 7 y 30 caracteres' }
    }
  },
  address: {
    type: DataTypes.STRING(250),
    allowNull: true,
    validate: {
      len: { args: [5, 250], msg: 'La dirección debe tener entre 5 y 250 caracteres' }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Sirve para desactivar clientes sin eliminarlos'
  }
}, {
  tableName: 'clients',
  timestamps: true
});

module.exports = Client;
