import { BarChart3, Briefcase, Building2, DollarSign, FileText, Home, Package, Shield, ShoppingCart, Truck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  icon: LucideIcon;
  label: string;
  id: string;
  // Roles que siempre tienen acceso (sin importar permisos)
  roles: string[];
  // Permiso requerido para acceder (si no tiene el rol base)
  permission?: string;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [

  // Dashboard — solo con permiso reports.view o admin
  { icon: BarChart3,    label: 'Dashboard y Reportes',id: 'dashboard',  roles: ['Administrador', 'administrador'], permission: 'reports.view' },
  // Usuarios — solo con permiso users.view/manage o admin
  { icon: Users,        label: 'Usuarios',            id: 'users',      roles: ['Administrador', 'administrador'], permission: 'users.view' },
  // Empleados — solo con permiso employees.view/manage o admin
  { icon: Briefcase,    label: 'Empleados',           id: 'employees',  roles: ['Administrador', 'administrador'], permission: 'employees.view' },
  // Roles — solo admin
  { icon: Shield,       label: 'Roles',               id: 'roles',      roles: ['Administrador', 'administrador'], permission: 'roles.view' },
  // Proveedores — solo con permiso providers.view/manage o admin
  { icon: Building2,    label: 'Proveedores',         id: 'providers',  roles: ['Administrador', 'administrador'], permission: 'providers.view' },
  // Productos — solo con permiso products.view/manage o admin
  { icon: Package,      label: 'Productos',           id: 'products',   roles: ['Administrador', 'administrador'], permission: 'products.view' },
  // Categorías — solo con permiso categories.view/manage o admin
  { icon: ShoppingCart, label: 'Categorías',          id: 'categories', roles: ['Administrador', 'administrador'], permission: 'categories.view' },
  // Compras — solo con permiso purchases.view/manage o admin
  { icon: Truck,        label: 'Compras',             id: 'purchases',  roles: ['Administrador', 'administrador'], permission: 'purchases.view' },
  // Pedidos — solo admin o vendedor (pedidos de clientes)
  { icon: FileText,     label: 'Pedidos',             id: 'orders',     roles: ['Administrador', 'administrador', 'Vendedor', 'vendedor'], permission: 'sales.view' },
  // Ventas — solo con permiso sales.view/manage o admin
  { icon: DollarSign,   label: 'Ventas',              id: 'sales',      roles: ['Administrador', 'administrador'], permission: 'sales.view' },
  // Clientes — solo con permiso clients.view/manage o admin
  { icon: Users,        label: 'Clientes',            id: 'clients',    roles: ['Administrador', 'administrador'], permission: 'clients.view' },
];
