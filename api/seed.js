// seed.js — Datos iniciales completos del sistema BioNatural
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Todos los permisos del sistema ───────────────────────────────────────────
const PERMISSIONS = [
  // Usuarios
  { name: 'users.view',    resource: 'users',    action: 'view',    description: 'Ver usuarios del sistema' },
  { name: 'users.create',  resource: 'users',    action: 'create',  description: 'Crear usuarios' },
  { name: 'users.edit',    resource: 'users',    action: 'edit',    description: 'Editar usuarios' },
  { name: 'users.delete',  resource: 'users',    action: 'delete',  description: 'Eliminar usuarios' },
  { name: 'users.status',  resource: 'users',    action: 'status',  description: 'Activar/desactivar usuarios' },

  // Roles
  { name: 'roles.view',    resource: 'roles',    action: 'view',    description: 'Ver roles' },
  { name: 'roles.create',  resource: 'roles',    action: 'create',  description: 'Crear roles' },
  { name: 'roles.edit',    resource: 'roles',    action: 'edit',    description: 'Editar roles' },
  { name: 'roles.delete',  resource: 'roles',    action: 'delete',  description: 'Eliminar roles' },
  { name: 'roles.permissions', resource: 'roles', action: 'permissions', description: 'Asignar/quitar permisos a roles' },

  // Permisos
  { name: 'permissions.view',   resource: 'permissions', action: 'view',   description: 'Ver permisos' },
  { name: 'permissions.create', resource: 'permissions', action: 'create', description: 'Crear permisos' },
  { name: 'permissions.edit',   resource: 'permissions', action: 'edit',   description: 'Editar permisos' },
  { name: 'permissions.delete', resource: 'permissions', action: 'delete', description: 'Eliminar permisos' },

  // Empleados
  { name: 'employees.view',   resource: 'employees', action: 'view',   description: 'Ver empleados' },
  { name: 'employees.create', resource: 'employees', action: 'create', description: 'Registrar empleados' },
  { name: 'employees.edit',   resource: 'employees', action: 'edit',   description: 'Editar empleados' },
  { name: 'employees.delete', resource: 'employees', action: 'delete', description: 'Eliminar empleados' },
  { name: 'employees.status', resource: 'employees', action: 'status', description: 'Activar/desactivar empleados' },

  // Proveedores
  { name: 'providers.view',   resource: 'providers', action: 'view',   description: 'Ver proveedores' },
  { name: 'providers.create', resource: 'providers', action: 'create', description: 'Registrar proveedores' },
  { name: 'providers.edit',   resource: 'providers', action: 'edit',   description: 'Editar proveedores' },
  { name: 'providers.delete', resource: 'providers', action: 'delete', description: 'Eliminar proveedores' },

  // Clientes
  { name: 'clients.view',   resource: 'clients', action: 'view',   description: 'Ver clientes' },
  { name: 'clients.create', resource: 'clients', action: 'create', description: 'Registrar clientes' },
  { name: 'clients.edit',   resource: 'clients', action: 'edit',   description: 'Editar clientes' },
  { name: 'clients.delete', resource: 'clients', action: 'delete', description: 'Eliminar clientes' },
  { name: 'clients.status', resource: 'clients', action: 'status', description: 'Activar/desactivar clientes' },

  // Categorías
  { name: 'categories.view',   resource: 'categories', action: 'view',   description: 'Ver categorías' },
  { name: 'categories.create', resource: 'categories', action: 'create', description: 'Crear categorías' },
  { name: 'categories.edit',   resource: 'categories', action: 'edit',   description: 'Editar categorías' },
  { name: 'categories.delete', resource: 'categories', action: 'delete', description: 'Eliminar categorías' },

  // Productos
  { name: 'products.view',   resource: 'products', action: 'view',   description: 'Ver productos' },
  { name: 'products.create', resource: 'products', action: 'create', description: 'Crear productos' },
  { name: 'products.edit',   resource: 'products', action: 'edit',   description: 'Editar productos' },
  { name: 'products.delete', resource: 'products', action: 'delete', description: 'Eliminar productos' },
  { name: 'products.stock',  resource: 'products', action: 'stock',  description: 'Ajustar stock de productos' },

  // Compras
  { name: 'purchases.view',   resource: 'purchases', action: 'view',   description: 'Ver compras' },
  { name: 'purchases.create', resource: 'purchases', action: 'create', description: 'Registrar compras' },
  { name: 'purchases.edit',   resource: 'purchases', action: 'edit',   description: 'Editar compras' },
  { name: 'purchases.status', resource: 'purchases', action: 'status', description: 'Cambiar estado de compras' },

  // Ventas
  { name: 'sales.view',   resource: 'sales', action: 'view',   description: 'Ver ventas/pedidos' },
  { name: 'sales.create', resource: 'sales', action: 'create', description: 'Registrar ventas/pedidos' },
  { name: 'sales.edit',   resource: 'sales', action: 'edit',   description: 'Editar ventas/pedidos' },
  { name: 'sales.status', resource: 'sales', action: 'status', description: 'Cambiar estado de ventas' },

  // Estadísticas
  { name: 'stats.view', resource: 'stats', action: 'view', description: 'Ver estadísticas y reportes' },

  // Transacciones
  { name: 'transactions.view', resource: 'transactions', action: 'view', description: 'Ver historial de transacciones' },

  // Subida de archivos
  { name: 'upload.images', resource: 'upload', action: 'images', description: 'Subir imágenes al sistema' },
];

// ─── Roles y sus permisos ──────────────────────────────────────────────────────
const ROLES = [
  {
    name: 'Administrador',
    description: 'Acceso completo a todo el sistema',
    isActive: true,
    // El admin tiene TODOS los permisos
    permissions: PERMISSIONS.map(p => p.name),
  },
  {
    name: 'Vendedor',
    description: 'Gestión de ventas, clientes y consulta de productos',
    isActive: true,
    permissions: [
      'clients.view', 'clients.create', 'clients.edit', 'clients.status',
      'products.view',
      'categories.view',
      'sales.view', 'sales.create', 'sales.edit', 'sales.status',
      'stats.view',
    ],
  },
  {
    name: 'Bodega',
    description: 'Gestión de inventario, compras y productos',
    isActive: true,
    permissions: [
      'products.view', 'products.create', 'products.edit', 'products.stock',
      'categories.view', 'categories.create', 'categories.edit',
      'providers.view', 'providers.create', 'providers.edit',
      'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.status',
      'stats.view',
    ],
  },
  {
    name: 'Contador',
    description: 'Acceso a reportes, estadísticas y transacciones',
    isActive: true,
    permissions: [
      'stats.view',
      'transactions.view',
      'sales.view',
      'purchases.view',
      'products.view',
      'clients.view',
      'providers.view',
    ],
  },
  {
    name: 'Cliente',
    description: 'Acceso al catálogo y gestión de sus propios pedidos',
    isActive: true,
    permissions: [
      'products.view',
      'categories.view',
      'sales.view',
      'sales.create',
    ],
  },
];

// ─── Categorías ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Suplementos',       description: 'Suplementos naturales y vitaminas' },
  { name: 'Cuidado Personal',  description: 'Productos de cuidado personal orgánicos' },
  { name: 'Alimentación',      description: 'Alimentos orgánicos y naturales' },
  { name: 'Bebidas',           description: 'Bebidas naturales y tés' },
  { name: 'Aceites Esenciales',description: 'Aceites esenciales puros' },
  { name: 'Herbolaria',        description: 'Plantas medicinales y hierbas' },
  { name: 'Cosméticos Naturales', description: 'Cosméticos elaborados con ingredientes naturales' },
];

// ─── Productos de ejemplo ──────────────────────────────────────────────────────
const PRODUCTS = [
  { name: 'Vitamina C Natural 1000mg',    sku: 'VIT-C-1000',      price: 45000, cost: 22000, stock: 50, minStock: 10, category: 'Suplementos',        description: 'Vitamina C extraída de acerola orgánica, 60 cápsulas' },
  { name: 'Vitamina D3 2000 UI',          sku: 'VIT-D3-2000',     price: 38000, cost: 18000, stock: 40, minStock: 8,  category: 'Suplementos',        description: 'Vitamina D3 de origen natural, 60 cápsulas' },
  { name: 'Omega 3 Aceite de Pescado',    sku: 'OMEGA3-1000',     price: 52000, cost: 25000, stock: 35, minStock: 8,  category: 'Suplementos',        description: 'Omega 3 EPA/DHA 1000mg, 60 cápsulas blandas' },
  { name: 'Proteína Vegetal Vainilla 1kg',sku: 'PROT-VEG-1KG',    price: 85000, cost: 42000, stock: 20, minStock: 5,  category: 'Suplementos',        description: 'Proteína de guisante y arroz, sabor vainilla' },
  { name: 'Magnesio Quelado 400mg',       sku: 'MAG-QUEL-400',    price: 42000, cost: 20000, stock: 30, minStock: 8,  category: 'Suplementos',        description: 'Magnesio bisglicinato de alta absorción, 60 cápsulas' },
  { name: 'Aceite de Coco Orgánico 500ml',sku: 'ACE-COCO-500',    price: 32000, cost: 15000, stock: 45, minStock: 10, category: 'Cuidado Personal',   description: 'Aceite de coco virgen extra, prensado en frío' },
  { name: 'Champú Natural Argán 300ml',   sku: 'CHAMP-NAT-300',   price: 42000, cost: 20000, stock: 35, minStock: 8,  category: 'Cuidado Personal',   description: 'Champú sin sulfatos con aceite de argán' },
  { name: 'Crema Hidratante Aloe Vera',   sku: 'CREMA-ALOE-200',  price: 35000, cost: 16000, stock: 28, minStock: 6,  category: 'Cuidado Personal',   description: 'Crema hidratante con aloe vera orgánico, 200ml' },
  { name: 'Jabón Artesanal Lavanda',      sku: 'JAB-LAV-100',     price: 18000, cost: 7000,  stock: 60, minStock: 15, category: 'Cuidado Personal',   description: 'Jabón artesanal con aceite esencial de lavanda, 100g' },
  { name: 'Quinoa Orgánica 500g',         sku: 'QUINOA-500',      price: 28000, cost: 13000, stock: 40, minStock: 10, category: 'Alimentación',       description: 'Quinoa orgánica boliviana, grano entero' },
  { name: 'Miel de Manuka UMF 15+',       sku: 'MIEL-MANUKA-250', price: 95000, cost: 48000, stock: 15, minStock: 4,  category: 'Alimentación',       description: 'Miel de Manuka certificada UMF 15+, 250g' },
  { name: 'Granola Artesanal Sin Azúcar', sku: 'GRAN-SA-400',     price: 24000, cost: 11000, stock: 50, minStock: 12, category: 'Alimentación',       description: 'Granola artesanal con frutos secos, 400g' },
  { name: 'Chía Orgánica 500g',           sku: 'CHIA-ORG-500',    price: 22000, cost: 10000, stock: 55, minStock: 12, category: 'Alimentación',       description: 'Semillas de chía orgánica certificada' },
  { name: 'Té Verde Matcha Premium 100g', sku: 'TE-MATCHA-100',   price: 55000, cost: 27000, stock: 25, minStock: 6,  category: 'Bebidas',            description: 'Té verde matcha ceremonial japonés' },
  { name: 'Té de Manzanilla 25 sobres',   sku: 'TE-MANZ-25',      price: 12000, cost: 5000,  stock: 80, minStock: 20, category: 'Bebidas',            description: 'Manzanilla orgánica en sobres biodegradables' },
  { name: 'Kombucha Jengibre-Limón 350ml',sku: 'KOMBU-JL-350',    price: 15000, cost: 6500,  stock: 48, minStock: 12, category: 'Bebidas',            description: 'Kombucha fermentada artesanal, sabor jengibre y limón' },
  { name: 'Aceite Esencial Lavanda 15ml', sku: 'AE-LAV-15',       price: 38000, cost: 18000, stock: 22, minStock: 5,  category: 'Aceites Esenciales', description: 'Aceite esencial de lavanda 100% puro' },
  { name: 'Aceite Esencial Eucalipto 15ml',sku:'AE-EUC-15',       price: 32000, cost: 15000, stock: 20, minStock: 5,  category: 'Aceites Esenciales', description: 'Aceite esencial de eucalipto puro' },
  { name: 'Aceite Esencial Árbol de Té',  sku: 'AE-TT-15',        price: 35000, cost: 16000, stock: 18, minStock: 4,  category: 'Aceites Esenciales', description: 'Aceite esencial de árbol de té, 15ml' },
  { name: 'Valeriana Extracto 60 cáps',   sku: 'VALE-EXT-60',     price: 36000, cost: 17000, stock: 30, minStock: 8,  category: 'Herbolaria',         description: 'Extracto estandarizado de valeriana para el sueño' },
  { name: 'Cúrcuma con Pimienta Negra',   sku: 'CURC-PIP-60',     price: 40000, cost: 19000, stock: 35, minStock: 8,  category: 'Herbolaria',         description: 'Cúrcuma 500mg con piperina para mejor absorción, 60 cáps' },
  { name: 'Ashwagandha KSM-66 60 cáps',  sku: 'ASHWA-KSM-60',    price: 65000, cost: 32000, stock: 20, minStock: 5,  category: 'Herbolaria',         description: 'Ashwagandha extracto KSM-66 certificado, 60 cápsulas' },
  { name: 'Sérum Vitamina C Natural',     sku: 'SER-VITC-30',     price: 58000, cost: 28000, stock: 18, minStock: 4,  category: 'Cosméticos Naturales', description: 'Sérum facial con vitamina C estabilizada, 30ml' },
  { name: 'Protector Solar Natural FPS50',sku: 'PROT-SOL-50',     price: 48000, cost: 23000, stock: 25, minStock: 6,  category: 'Cosméticos Naturales', description: 'Protector solar mineral con zinc, FPS 50, 60ml' },
];

// ─── Proveedores ───────────────────────────────────────────────────────────────
const PROVIDERS = [
  { name: 'NaturVida S.A.S',          businessName: 'NaturVida S.A.S',          documentType: 'NIT', documentNumber: '900123456', contactPerson: 'Carlos Ruiz',    email: 'ventas@naturvida.com.co',    phone: '3001234567', address: 'Cra 15 #45-20, Bogotá' },
  { name: 'Orgánicos del Campo',       businessName: 'Orgánicos del Campo Ltda', documentType: 'NIT', documentNumber: '800987654', contactPerson: 'Ana Gómez',      email: 'pedidos@organicosdel.co',    phone: '3109876543', address: 'Cll 80 #12-35, Medellín' },
  { name: 'BioImport Colombia',        businessName: 'BioImport Colombia S.A.S', documentType: 'NIT', documentNumber: '901234567', contactPerson: 'Luis Martínez',  email: 'comercial@bioimport.co',     phone: '3205551234', address: 'Av. El Dorado #68-50, Bogotá' },
  { name: 'Herbal Andina Ltda',        businessName: 'Herbal Andina Ltda',       documentType: 'NIT', documentNumber: '800456789', contactPerson: 'María Torres',   email: 'info@herbalandina.com',      phone: '3154449876', address: 'Cra 7 #22-10, Cali' },
  { name: 'EcoSalud Distribuciones',   businessName: 'EcoSalud Distribuciones',  documentType: 'NIT', documentNumber: '900654321', contactPerson: 'Pedro Vargas',   email: 'ecos@ecosalud.com.co',       phone: '3012223344', address: 'Cll 50 #30-15, Barranquilla' },
];

// ─── Función principal ─────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Iniciando seed del sistema BioNatural...\n');

  // 1. Permisos
  console.log('📋 Creando permisos del sistema...');
  const permMap = {};
  for (const perm of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { resource: perm.resource, action: perm.action, description: perm.description },
      create: perm,
    });
    permMap[perm.name] = created.id;
  }
  console.log(`   ✅ ${PERMISSIONS.length} permisos creados/actualizados`);

  // 2. Roles con permisos
  console.log('\n👥 Creando roles y asignando permisos...');
  const roleMap = {};
  for (const roleData of ROLES) {
    const { permissions: rolePerms, ...roleFields } = roleData;

    const role = await prisma.role.upsert({
      where: { name: roleFields.name },
      update: { description: roleFields.description, isActive: roleFields.isActive },
      create: roleFields,
    });
    roleMap[roleFields.name] = role.id;

    // Limpiar permisos existentes y reasignar
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    for (const permName of rolePerms) {
      const permId = permMap[permName];
      if (permId) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: permId },
        });
      }
    }
    console.log(`    Rol "${roleFields.name}" — ${rolePerms.length} permisos asignados`);
  }

  // 3. Usuario Administrador principal
  console.log('\n  Creando usuario Administrador...');
  const adminPassword = await bcrypt.hash('Admin2024*', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bionatural.com' },
    update: { name: 'Administrador BioNatural', password: adminPassword, isActive: true, emailVerified: true, roleId: roleMap['Administrador'] },
    create: {
      name: 'Administrador BioNatural',
      email: 'admin@bionatural.com',
      password: adminPassword,
      roleId: roleMap['Administrador'],
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`   Admin creado: ${admin.email} / contraseña: Admin2024*`);

  // 4. Categorías
  console.log('\n Creando categorías...');
  const catMap = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: { ...cat, isActive: true },
    });
    catMap[cat.name] = created.id;
  }
  console.log(`   ✅ ${CATEGORIES.length} categorías creadas`);

  // 5. Proveedores
  console.log('\n🏭 Creando proveedores...');
  for (const prov of PROVIDERS) {
    await prisma.provider.upsert({
      where: { id: (await prisma.provider.findFirst({ where: { email: prov.email } }))?.id ?? 0 },
      update: prov,
      create: { ...prov, isActive: true },
    });
  }
  console.log(`   ✅ ${PROVIDERS.length} proveedores creados`);

  // 6. Productos
  console.log('\n📦 Creando productos...');
  let prodCount = 0;
  for (const prod of PRODUCTS) {
    const { category, ...prodFields } = prod;
    const categoryId = catMap[category];
    if (!categoryId) { console.warn(`   ⚠️  Categoría "${category}" no encontrada para ${prod.name}`); continue; }

    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: { ...prodFields, categoryId },
      create: { ...prodFields, categoryId, isActive: true },
    });
    prodCount++;
  }
  console.log(`   ✅ ${prodCount} productos creados`);

  // 7. Configuración del sistema (system_config)
  console.log('\n⚙️  Creando configuración del sistema...');

  const SYSTEM_CONFIG = [
    // ── Tipos de documento para USUARIOS ──────────────────────────────────────
    {
      key: 'document_types_user',
      group: 'document_types',
      description: 'Tipos de documento válidos para usuarios del sistema',
      value: [
        { value: 'CC',  label: 'Cédula de Ciudadanía' },
        { value: 'CE',  label: 'Cédula de Extranjería' },
        { value: 'PA',  label: 'Pasaporte' },
        { value: 'TI',  label: 'Tarjeta de Identidad' },
      ],
    },
    // ── Tipos de documento para EMPLEADOS ─────────────────────────────────────
    {
      key: 'document_types_employee',
      group: 'document_types',
      description: 'Tipos de documento válidos para empleados',
      value: [
        { value: 'CC',  label: 'Cédula de Ciudadanía' },
        { value: 'CE',  label: 'Cédula de Extranjería' },
        { value: 'PA',  label: 'Pasaporte' },
      ],
    },
    // ── Tipos de documento para PROVEEDORES ───────────────────────────────────
    {
      key: 'document_types_provider',
      group: 'document_types',
      description: 'Tipos de documento válidos para proveedores',
      value: [
        { value: 'NIT', label: 'NIT' },
        { value: 'CC',  label: 'Cédula de Ciudadanía' },
        { value: 'CE',  label: 'Cédula de Extranjería' },
      ],
    },
    // ── Tipos de documento para CLIENTES ──────────────────────────────────────
    {
      key: 'document_types_client',
      group: 'document_types',
      description: 'Tipos de documento válidos para clientes',
      value: [
        { value: 'CC',  label: 'Cédula de Ciudadanía' },
        { value: 'TI',  label: 'Tarjeta de Identidad' },
        { value: 'CE',  label: 'Cédula de Extranjería' },
        { value: 'PA',  label: 'Pasaporte' },
      ],
    },
    // ── Estados de VENTAS ─────────────────────────────────────────────────────
    {
      key: 'sale_statuses',
      group: 'statuses',
      description: 'Estados posibles de una venta/pedido',
      value: [
        { value: 'REGISTERED', label: 'Registrada',          color: 'bg-blue-100 text-blue-800' },
        { value: 'READY',      label: 'Lista para recoger',  color: 'bg-yellow-100 text-yellow-800' },
        { value: 'COMPLETED',  label: 'Completada',          color: 'bg-green-100 text-green-800' },
        { value: 'CANCELLED',  label: 'Cancelada',           color: 'bg-gray-100 text-gray-800' },
        { value: 'ANNULED',    label: 'Anulada',             color: 'bg-red-100 text-red-800' },
      ],
    },
    // ── Estados de COMPRAS ────────────────────────────────────────────────────
    {
      key: 'purchase_statuses',
      group: 'statuses',
      description: 'Estados posibles de una compra',
      value: [
        { value: 'REGISTERED', label: 'Registrada', color: 'bg-blue-100 text-blue-800' },
        { value: 'COMPLETED',  label: 'Completada', color: 'bg-green-100 text-green-800' },
        { value: 'CANCELLED',  label: 'Cancelada',  color: 'bg-gray-100 text-gray-800' },
        { value: 'ANNULED',    label: 'Anulada',    color: 'bg-red-100 text-red-800' },
      ],
    },
    // ── Configuración de moneda ───────────────────────────────────────────────
    {
      key: 'currency',
      group: 'general',
      description: 'Configuración de moneda del sistema',
      value: {
        locale: 'es-CO',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        symbol: '$',
        name: 'Peso Colombiano',
      },
    },
    // ── Precios mínimos ───────────────────────────────────────────────────────
    {
      key: 'min_prices',
      group: 'general',
      description: 'Precios y costos mínimos permitidos en el sistema',
      value: {
        product_price: 1000,
        product_cost: 1000,
      },
    },
    // ── Configuración de paginación ───────────────────────────────────────────
    {
      key: 'pagination',
      group: 'general',
      description: 'Configuración de paginación por defecto',
      value: {
        default_page_size: 10,
        max_page_size: 100,
      },
    },
    // ── Items del sidebar (menú de navegación) ────────────────────────────────
    {
      key: 'sidebar_items',
      group: 'ui',
      description: 'Items del menú lateral de navegación con sus roles y permisos requeridos',
      value: [
        { id: 'home',       label: 'Inicio',               icon: 'Home',         roles: ['Administrador', 'Vendedor', 'Bodega', 'Contador'], permission: null },
        { id: 'dashboard',  label: 'Dashboard y Reportes', icon: 'BarChart3',    roles: ['Administrador'], permission: 'stats.view' },
        { id: 'users',      label: 'Usuarios',             icon: 'Users',        roles: ['Administrador'], permission: 'users.view' },
        { id: 'employees',  label: 'Empleados',            icon: 'Briefcase',    roles: ['Administrador'], permission: 'employees.view' },
        { id: 'roles',      label: 'Roles',                icon: 'Shield',       roles: ['Administrador'], permission: 'roles.view' },
        { id: 'providers',  label: 'Proveedores',          icon: 'Building2',    roles: ['Administrador'], permission: 'providers.view' },
        { id: 'products',   label: 'Productos',            icon: 'Package',      roles: ['Administrador'], permission: 'products.view' },
        { id: 'categories', label: 'Categorías',           icon: 'ShoppingCart', roles: ['Administrador'], permission: 'categories.view' },
        { id: 'purchases',  label: 'Compras',              icon: 'Truck',        roles: ['Administrador'], permission: 'purchases.view' },
        { id: 'orders',     label: 'Pedidos',              icon: 'FileText',     roles: ['Administrador', 'Vendedor'], permission: 'sales.view' },
        { id: 'sales',      label: 'Ventas',               icon: 'DollarSign',   roles: ['Administrador'], permission: 'sales.view' },
        { id: 'clients',    label: 'Clientes',             icon: 'Users',        roles: ['Administrador'], permission: 'clients.view' },
      ],
    },
    // ── Rol por defecto para registro de clientes ─────────────────────────────
    {
      key: 'default_client_role',
      group: 'auth',
      description: 'Nombre del rol asignado por defecto al registrar un nuevo cliente',
      value: 'Cliente',
    },
    // ── Información de la empresa ─────────────────────────────────────────────
    {
      key: 'company_info',
      group: 'general',
      description: 'Información general de la empresa',
      value: {
        name: 'BioNatural',
        description: 'Productos naturales y orgánicos',
        version: '2.0.0',
        email: 'info@bionatural.com',
        phone: '',
        address: '',
        website: '',
      },
    },
  ];

  for (const cfg of SYSTEM_CONFIG) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value, description: cfg.description, group: cfg.group },
      create: { key: cfg.key, value: cfg.value, description: cfg.description, group: cfg.group, isActive: true },
    });
    console.log(`   ✅ Config "${cfg.key}" guardada`);
  }

  // ─── Resumen ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55));
  console.log('🎉 Seed completado exitosamente!\n');
  console.log('📌 CREDENCIALES DE ACCESO:');
  console.log('   Email:      admin@bionatural.com');
  console.log('   Contraseña: Admin2024*');
  console.log('   Rol:        Administrador (acceso total)\n');
  console.log('📊 RESUMEN:');
  console.log(`   • ${PERMISSIONS.length} permisos del sistema`);
  console.log(`   • ${ROLES.length} roles configurados`);
  console.log(`   • ${CATEGORIES.length} categorías`);
  console.log(`   • ${PROVIDERS.length} proveedores`);
  console.log(`   • ${prodCount} productos`);
  console.log(`   • ${SYSTEM_CONFIG.length} entradas de configuración del sistema`);
  console.log('═'.repeat(55));
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
