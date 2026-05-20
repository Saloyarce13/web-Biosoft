/**
 * SystemConfigContext
 *
 * Carga la configuración del sistema desde la API (/api/config) una sola vez
 * al iniciar la aplicación y la expone a todos los componentes.
 *
 * Uso:
 *   const { config, loading } = useSystemConfig();
 *   const docTypes = config?.document_types?.document_types_user ?? [];
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSystemConfig, type SystemConfigData } from '../../lib/api';

// ── Valores por defecto (fallback si la API falla) ────────────────────────────
const DEFAULT_CONFIG: SystemConfigData = {
  document_types: {
    document_types_user: [
      { value: 'CC', label: 'Cédula de Ciudadanía' },
      { value: 'CE', label: 'Cédula de Extranjería' },
      { value: 'PA', label: 'Pasaporte' },
      { value: 'TI', label: 'Tarjeta de Identidad' },
    ],
    document_types_employee: [
      { value: 'CC', label: 'Cédula de Ciudadanía' },
      { value: 'CE', label: 'Cédula de Extranjería' },
      { value: 'PA', label: 'Pasaporte' },
    ],
    document_types_provider: [
      { value: 'NIT', label: 'NIT' },
      { value: 'CC',  label: 'Cédula de Ciudadanía' },
      { value: 'CE',  label: 'Cédula de Extranjería' },
    ],
    document_types_client: [
      { value: 'CC', label: 'Cédula de Ciudadanía' },
      { value: 'TI', label: 'Tarjeta de Identidad' },
      { value: 'CE', label: 'Cédula de Extranjería' },
      { value: 'PA', label: 'Pasaporte' },
    ],
  },
  statuses: {
    sale_statuses: [
      { value: 'REGISTERED', label: 'Registrada',         color: 'bg-blue-100 text-blue-800' },
      { value: 'READY',      label: 'Lista para recoger', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'COMPLETED',  label: 'Completada',         color: 'bg-green-100 text-green-800' },
      { value: 'CANCELLED',  label: 'Cancelada',          color: 'bg-gray-100 text-gray-800' },
      { value: 'ANNULED',    label: 'Anulada',            color: 'bg-red-100 text-red-800' },
    ],
    purchase_statuses: [
      { value: 'REGISTERED', label: 'Registrada', color: 'bg-blue-100 text-blue-800' },
      { value: 'COMPLETED',  label: 'Completada', color: 'bg-green-100 text-green-800' },
      { value: 'CANCELLED',  label: 'Cancelada',  color: 'bg-gray-100 text-gray-800' },
      { value: 'ANNULED',    label: 'Anulada',    color: 'bg-red-100 text-red-800' },
    ],
  },
  general: {
    currency: {
      locale: 'es-CO',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      symbol: '$',
      name: 'Peso Colombiano',
    },
    min_prices: { product_price: 1000, product_cost: 1000 },
    pagination: { default_page_size: 10, max_page_size: 100 },
    company_info: {
      name: 'BioNatural',
      description: 'Productos naturales y orgánicos',
      version: '2.0.0',
      email: 'info@bionatural.com',
      phone: '',
      address: '',
      website: '',
    },
  },
  ui: {
    sidebar_items: [
      { id: 'dashboard',  label: 'Dashboard y Reportes', icon: 'BarChart3',    roles: ['Administrador', 'Vendedor', 'Bodega', 'Contador'], permission: 'stats.view' },
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
  auth: {
    default_client_role: 'Cliente',
  },
  store: {
    store_info: {
      name:    'Bionatural — Tienda Principal',
      address: 'Calle 47 #45-87',
      mall:    'C.C. San Antonio, Local 101',
      phone:   '+57 315 5397493',
      schedule: {
        weekdays: 'Lun–Vie 8:00 AM – 6:00 PM',
        saturday: 'Sáb 8:00 AM – 2:00 PM',
        sunday:   'Cerrado',
      },
    },
    pickup_time_slots: [
      { value: '7:00-9:00',   label: '7:00 – 9:00 AM' },
      { value: '9:00-11:00',  label: '9:00 – 11:00 AM' },
      { value: '11:00-13:00', label: '11:00 AM – 1:00 PM' },
      { value: '13:00-15:00', label: '1:00 – 3:00 PM' },
      { value: '15:00-17:00', label: '3:00 – 5:00 PM' },
      { value: '17:00-19:00', label: '5:00 – 7:00 PM' },
      { value: '19:00-20:00', label: '7:00 – 8:00 PM' },
    ],
    pickup_policy: {
      hours_to_pickup: 24,
      payment_on_pickup: true,
      message: 'Tienes 24 horas desde que confirmes el pedido para recogerlo. El pago se realiza al momento de la recogida.',
    },
  },
};

// ── Contexto ──────────────────────────────────────────────────────────────────
interface SystemConfigContextValue {
  config: SystemConfigData;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const SystemConfigContext = createContext<SystemConfigContextValue>({
  config: DEFAULT_CONFIG,
  loading: false,
  error: null,
  reload: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function SystemConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SystemConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemConfig();
      // Merge con defaults para garantizar que ningún campo falte
      setConfig({
        document_types: { ...DEFAULT_CONFIG.document_types, ...(data.document_types ?? {}) },
        statuses:        { ...DEFAULT_CONFIG.statuses,        ...(data.statuses        ?? {}) },
        general:         { ...DEFAULT_CONFIG.general,         ...(data.general         ?? {}) },
        ui:              { ...DEFAULT_CONFIG.ui,              ...(data.ui              ?? {}) },
        auth:            { ...DEFAULT_CONFIG.auth,            ...(data.auth            ?? {}) },
        store:           { ...DEFAULT_CONFIG.store,           ...(data.store           ?? {}) },
      });
    } catch (err: any) {
      console.warn('[SystemConfig] No se pudo cargar la configuración del servidor, usando defaults:', err?.message);
      setError(err?.message || 'Error al cargar configuración');
      // Mantener los defaults — la app sigue funcionando
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SystemConfigContext.Provider value={{ config, loading, error, reload: load }}>
      {children}
    </SystemConfigContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSystemConfig() {
  return useContext(SystemConfigContext);
}

// ── Helpers de acceso rápido ──────────────────────────────────────────────────

/** Tipos de documento para usuarios */
export function useDocumentTypesUser() {
  const { config } = useSystemConfig();
  return config.document_types.document_types_user;
}

/** Tipos de documento para empleados */
export function useDocumentTypesEmployee() {
  const { config } = useSystemConfig();
  return config.document_types.document_types_employee;
}

/** Tipos de documento para proveedores */
export function useDocumentTypesProvider() {
  const { config } = useSystemConfig();
  return config.document_types.document_types_provider;
}

/** Tipos de documento para clientes */
export function useDocumentTypesClient() {
  const { config } = useSystemConfig();
  return config.document_types.document_types_client;
}

/** Estados de ventas */
export function useSaleStatuses() {
  const { config } = useSystemConfig();
  return config.statuses.sale_statuses;
}

/** Estados de compras */
export function usePurchaseStatuses() {
  const { config } = useSystemConfig();
  return config.statuses.purchase_statuses;
}

/** Configuración de moneda */
export function useCurrencyConfig() {
  const { config } = useSystemConfig();
  return config.general.currency;
}

/** Items del sidebar desde la BD */
export function useSidebarItems() {
  const { config } = useSystemConfig();
  return config.ui.sidebar_items;
}

/** Información de la empresa */
export function useCompanyInfo() {
  const { config } = useSystemConfig();
  return config.general.company_info;
}

/** Información de la tienda física */
export function useStoreInfo() {
  const { config } = useSystemConfig();
  return config.store.store_info;
}

/** Franjas horarias de retiro */
export function usePickupTimeSlots() {
  const { config } = useSystemConfig();
  return config.store.pickup_time_slots;
}

/** Política de retiro */
export function usePickupPolicy() {
  const { config } = useSystemConfig();
  return config.store.pickup_policy;
}
