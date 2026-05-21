// src/validators/index.js

// Auth validators
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema
} = require('./auth.validators');

// Client validators
const {
  createClientSchema,
  updateClientSchema
} = require('./client.validators');

// Employee validators
const {
  createEmployeeSchema,
  updateEmployeeSchema
} = require('./employee.validators');

// Provider validators
const {
  createProviderSchema,
  updateProviderSchema
} = require('./provider.validators');

// Permission validators
const {
  createPermissionSchema,
  updatePermissionSchema
} = require('./permission.validators');

// Role validators
const {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema
} = require('./role.validators');

// Purchase validators
const {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdSchema
} = require('./purchase.validators');

// Sale validators
const {
  createSaleSchema,
  updateSaleSchema,
  saleIdSchema
} = require('./sale.validators');

// Transaction validators
const {
  createTransactionSchema
} = require('./transaction.validators');

module.exports = {
  // Auth
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,

  // Client
  createClientSchema,
  updateClientSchema,

  // Employee
  createEmployeeSchema,
  updateEmployeeSchema,

  // Provider
  createProviderSchema,
  updateProviderSchema,

  // Permission
  createPermissionSchema,
  updatePermissionSchema,

  // Role
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema,

  // Purchase
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdSchema,

  // Sale
  createSaleSchema,
  updateSaleSchema,
  saleIdSchema,

  // Transaction
  createTransactionSchema
};
