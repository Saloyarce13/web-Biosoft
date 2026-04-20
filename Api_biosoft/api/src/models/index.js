// src/models/index.js

const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const Client = require('./Client');
const Employee = require('./Employee');
const Provider = require('./Provider');
const Purchase = require('./Purchase');
const PurchaseItem = require('./PurchaseItem');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Transaction = require('./Transaction');

// Relaciones
// === USER ===
Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role);

// === ROLE & PERMISSION ===
Role.hasMany(RolePermission, { foreignKey: 'roleId' });
RolePermission.belongsTo(Role);
Permission.hasMany(RolePermission, { foreignKey: 'permissionId' });
RolePermission.belongsTo(Permission);

// === CATEGORY & PRODUCT ===
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category);

// === PURCHASE ===
Provider.hasMany(Purchase, { foreignKey: 'providerId' });
Purchase.belongsTo(Provider);

Employee.hasMany(Purchase, { foreignKey: 'employeeId' });
Purchase.belongsTo(Employee);

User.hasMany(Purchase, { foreignKey: 'createdByUserId', as: 'createdByPurchases' });
Purchase.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });

Purchase.hasMany(PurchaseItem, { foreignKey: 'purchaseId', onDelete: 'CASCADE' });
PurchaseItem.belongsTo(Purchase);

Product.hasMany(PurchaseItem, { foreignKey: 'productId' });
PurchaseItem.belongsTo(Product);

Purchase.hasMany(Transaction, { foreignKey: 'purchaseId' });
Transaction.belongsTo(Purchase);

// === SALE ===
Client.hasMany(Sale, { foreignKey: 'clientId' });
Sale.belongsTo(Client);

Employee.hasMany(Sale, { foreignKey: 'employeeId' });
Sale.belongsTo(Employee);

User.hasMany(Sale, { foreignKey: 'createdByUserId', as: 'createdBySales' });
Sale.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByUser' });

Sale.hasMany(SaleItem, { foreignKey: 'saleId', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale);

Product.hasMany(SaleItem, { foreignKey: 'productId' });
SaleItem.belongsTo(Product);

Sale.hasMany(Transaction, { foreignKey: 'saleId' });
Transaction.belongsTo(Sale);

// === TRANSACTION ===
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User);

module.exports = {
  User,
  Category,
  Product,
  Role,
  Permission,
  RolePermission,
  Client,
  Employee,
  Provider,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  Transaction
};