const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

const DEFAULT_ADMIN_EMAIL = 'admin@biosoft.local';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';

const INITIAL_PERMISSIONS = [
  { name: 'roles.view',        description: 'Ver roles del sistema' },
  { name: 'roles.manage',      description: 'Crear, editar y eliminar roles' },
  { name: 'users.view',        description: 'Ver usuarios' },
  { name: 'users.manage',      description: 'Crear, editar y eliminar usuarios' },
  { name: 'employees.view',    description: 'Ver empleados' },
  { name: 'employees.manage',  description: 'Crear, editar y eliminar empleados' },
  { name: 'products.view',     description: 'Ver productos' },
  { name: 'products.manage',   description: 'Crear, editar y eliminar productos' },
  { name: 'categories.view',   description: 'Ver categorías' },
  { name: 'categories.manage', description: 'Crear, editar y eliminar categorías' },
  { name: 'providers.view',    description: 'Ver proveedores' },
  { name: 'providers.manage',  description: 'Crear, editar y eliminar proveedores' },
  { name: 'clients.view',      description: 'Ver clientes' },
  { name: 'clients.manage',    description: 'Crear, editar y eliminar clientes' },
  { name: 'purchases.view',    description: 'Ver compras' },
  { name: 'purchases.manage',  description: 'Crear y gestionar compras' },
  { name: 'sales.view',        description: 'Ver ventas' },
  { name: 'sales.manage',      description: 'Crear y gestionar ventas' },
  { name: 'reports.view',      description: 'Ver reportes y estadísticas' },
];

const ensureRole = async (name, description) => {
  return prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
};

const ensureAdminUser = async (adminRoleId) => {
  const email = DEFAULT_ADMIN_EMAIL;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return existingUser;

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  return prisma.user.create({
    data: {
      name: 'Administrador',
      email,
      passwordHash,
      roleId: adminRoleId,
      isActive: true,
      emailVerified: true,
    },
  });
};

const ensurePermissions = async () => {
  const permissions = [];
  for (const perm of INITIAL_PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
    permissions.push(p);
  }
  return permissions;
};

const ensureAdminHasAllPermissions = async (adminRoleId, permissions) => {
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRoleId, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRoleId, permissionId: perm.id },
    });
  }
};

const ensureInitialData = async () => {
  const adminRole = await ensureRole('administrador', 'Rol administrador completo');
  await ensureRole('user', 'Rol de usuario estándar');
  // Roles de empleados — el admin asigna permisos desde el módulo de Roles
  await ensureRole('vendedor', 'Vendedor de tienda');
  await ensureRole('bodega', 'Encargado de bodega e inventario');
  await ensureRole('contador', 'Contador y reportes financieros');
  await ensureAdminUser(adminRole.id);
  const permissions = await ensurePermissions();
  await ensureAdminHasAllPermissions(adminRole.id, permissions);
  // Cliente genérico para ventas en tienda sin cliente registrado
  await prisma.client.upsert({
    where: { email: 'consumidor.final@bionatural.local' },
    update: {},
    create: {
      name: 'Consumidor Final',
      email: 'consumidor.final@bionatural.local',
      address: 'Venta en tienda',
      isActive: true,
    },
  });
};

module.exports = { ensureInitialData };
