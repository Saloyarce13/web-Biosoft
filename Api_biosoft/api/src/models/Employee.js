// src/models/Employee.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/*
  Tabla: employees
  Columnas: id, fullName, email, phone, isActive, createdAt, updatedAt
  Relación: un empleado puede estar en muchas compras (1:N) y muchas ventas (1:N)
*/
const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre completo del empleado no puede estar vacío' },
      len: { args: [2, 120], msg: 'El nombre debe tener entre 2 y 120 caracteres' }
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    unique: {
      name: 'unique_employee_email',
      msg: 'Este email ya está registrado como empleado'
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Sirve para desactivar empleados sin eliminarlos'
  }
}, {
  tableName: 'employees',
  timestamps: true
});

module.exports = Employee;
