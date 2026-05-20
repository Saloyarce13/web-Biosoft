const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path}`;

  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers,
    ...options,
  });

  const json = await response.json();

  // Si el servidor responde 401 (token expirado/inválido), limpiar sesión y redirigir al login
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error(json?.message || 'Sesión expirada. Por favor inicia sesión nuevamente.');
  }

  if (!response.ok) {
    const err = new Error(json?.message || response.statusText || 'Error en la API') as any;
    if (json?.blockedSeconds) err.blockedSeconds = json.blockedSeconds;
    if (json?.attemptsLeft !== undefined) err.attemptsLeft = json.attemptsLeft;
    throw err;
  }

  return json as ApiResponse<T>;
}

export const authLogin = async (email: string, password: string) => {
  return apiFetch<{
    token: string;
    user: { id: string; name: string; email: string; role: string; permissions: string[] };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const passwordResetRequest = async (email: string) => {
  return apiFetch<null>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const passwordResetVerifyCode = async (email: string, code: string) => {
  return apiFetch<null>('/auth/password-reset/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
};

export const passwordResetConfirm = async (email: string, code: string, newPassword: string) => {
  return apiFetch<null>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
};

export const authRegister = async (
  name: string,
  email: string,
  password: string,
  roleId = 4,
  phone?: string,
  documentType?: string,
  documentNumber?: string
) => {
  return apiFetch<null>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      roleId,
      phone,
      documentType,
      documentNumber,
    }),
  });
};

// Products API
export const getProducts = async (all = false) => {
  return apiFetch<any[]>(all ? '/products?all=true' : '/products');
};

export const getProduct = async (id: string) => {
  return apiFetch<any>(`/products/${id}`);
};

export const createProduct = async (product: any) => {
  return apiFetch<any>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
};

export const updateProduct = async (id: string, product: any) => {
  return apiFetch<any>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
};

export const updateProductStock = async (id: string, stock: number) => {
  return apiFetch<any>(`/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock }),
  });
};

export const deleteProduct = async (id: string) => {
  return apiFetch<null>(`/products/${id}`, {
    method: 'DELETE',
  });
};

// Categories API
export const getCategories = async (all = false) => {
  return apiFetch<any[]>(all ? '/categories?all=true' : '/categories');
};

export const getCategory = async (id: string) => {
  return apiFetch<any>(`/categories/${id}`);
};

export const createCategory = async (category: any) => {
  return apiFetch<any>('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
};

export const updateCategory = async (id: string, category: any) => {
  return apiFetch<any>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });
};

export const toggleCategoryStatus = async (id: string) => {
  return apiFetch<any>(`/categories/${id}/status`, { method: 'PATCH' });
};

export const deleteCategory = async (id: string) => {
  return apiFetch<null>(`/categories/${id}`, {
    method: 'DELETE',
  });
};

// Providers API
export const getProviders = async (all = false) => {
  return apiFetch<any[]>(all ? '/providers?all=true' : '/providers');
};

export const getProvider = async (id: string) => {
  return apiFetch<any>(`/providers/${id}`);
};

export const createProvider = async (provider: any) => {
  return apiFetch<any>('/providers', {
    method: 'POST',
    body: JSON.stringify(provider),
  });
};

export const updateProvider = async (id: string, provider: any) => {
  return apiFetch<any>(`/providers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(provider),
  });
};

export const deleteProvider = async (id: string) => {
  return apiFetch<null>(`/providers/${id}`, {
    method: 'DELETE',
  });
};

// Clients API
export const getClients = async () => {
  return apiFetch<any[]>('/clients');
};

export const getClient = async (id: string) => {
  return apiFetch<any>(`/clients/${id}`);
};

export const createClient = async (client: any) => {
  return apiFetch<any>('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
};

export const updateClient = async (id: string, client: any) => {
  return apiFetch<any>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(client),
  });
};

export const deleteClient = async (id: string) => {
  return apiFetch<null>(`/clients/${id}`, {
    method: 'DELETE',
  });
};

export const toggleClientStatus = async (id: string | number) => {
  return apiFetch<any>(`/clients/${id}/status`, {
    method: 'PATCH',
  });
};

// Purchases API
export const getPurchases = async () => {
  return apiFetch<any[]>('/purchases');
};

export const getPurchase = async (id: string) => {
  return apiFetch<any>(`/purchases/${id}`);
};

export const createPurchase = async (purchase: any) => {
  return apiFetch<any>('/purchases', {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
};

export const updatePurchaseStatus = async (id: string, status: string) => {
  return apiFetch<any>(`/purchases/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// Sales API
export const getSales = async () => {
  return apiFetch<any[]>('/sales');
};

export const getSale = async (id: string) => {
  return apiFetch<any>(`/sales/${id}`);
};

export const createSale = async (sale: any) => {
  return apiFetch<any>('/sales', {
    method: 'POST',
    body: JSON.stringify(sale),
  });
};

// Pedido del cliente autenticado (recogida en tienda, pago en tienda)
export const createMyOrder = async (order: {
  pickupDate?: string;
  pickupTime?: string;
  notes?: string;
  items: { productId: number; quantity: number }[];
}) => {
  return apiFetch<any>('/sales/my-order', {
    method: 'POST',
    body: JSON.stringify(order),
  });
};

export const updateSaleStatus = async (id: string, status: string) => {
  return apiFetch<any>(`/sales/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const getDashboardStats = async () => {
  return apiFetch<{
    purchases: { count: number; totalPrice: number };
    sales: { count: number; totalPrice: number };
    transactionsCount: number;
  }>('/stats/dashboard');
};

export const getStockAvailableByProduct = async () => {
  return apiFetch<any[]>('/stats/stock-available-by-product');
};

export const getUniqueClients = async () => {
  return apiFetch<any[]>('/stats/unique-clients');
};

export const getActiveProviders = async () => {
  return apiFetch<any[]>('/stats/active-providers');
};

export const getTopClients = async () => {
  return apiFetch<any[]>('/stats/top-clients');
};

export const getActiveProducts = async () => {
  return apiFetch<any[]>('/stats/active-products');
};

export const getWeeklySales = async () => {
  return apiFetch<any[]>('/stats/weekly-sales');
};

export const getCategoryPerformance = async () => {
  return apiFetch<any[]>('/stats/category-performance');
};

// Users API
export const getUsers = async () => {
  return apiFetch<any[]>('/users');
};

export const getConsolidatedUsers = async () => {
  return apiFetch<any[]>('/users/consolidated');
};

export const getUser = async (id: string | number) => {
  return apiFetch<any>(`/users/${id}`);
};

export const updateUser = async (id: string | number, data: any) => {
  return apiFetch<any>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteUser = async (id: string | number) => {
  return apiFetch<null>(`/users/${id}`, {
    method: 'DELETE',
  });
};

export const toggleUserStatus = async (id: string | number) => {
  return apiFetch<any>(`/users/${id}/status`, {
    method: 'PATCH',
  });
};

// Employees API
export const getEmployees = async () => {
  return apiFetch<any[]>('/employees');
};

export const getEmployee = async (id: string | number) => {
  return apiFetch<any>(`/employees/${id}`);
};

export const createEmployee = async (employee: any) => {
  return apiFetch<any>('/employees', {
    method: 'POST',
    body: JSON.stringify(employee),
  });
};

export const updateEmployee = async (id: string | number, employee: any) => {
  return apiFetch<any>(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(employee),
  });
};

export const deleteEmployee = async (id: string | number) => {
  return apiFetch<null>(`/employees/${id}`, {
    method: 'DELETE',
  });
};

// Roles API
export const getRoles = async () => {
  return apiFetch<any[]>('/roles');
};

export const getRole = async (id: string | number) => {
  return apiFetch<any>(`/roles/${id}`);
};

export const createRole = async (role: any) => {
  return apiFetch<any>('/roles', {
    method: 'POST',
    body: JSON.stringify(role),
  });
};

export const updateRole = async (id: string | number, role: any) => {
  return apiFetch<any>(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(role),
  });
};

export const deleteRole = async (id: string | number) => {
  return apiFetch<null>(`/roles/${id}`, {
    method: 'DELETE',
  });
};

export const assignPermissionToRole = async (roleId: string | number, permissionId: number) => {
  return apiFetch<any>(`/roles/${roleId}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ permissionId }),
  });
};

export const removePermissionFromRole = async (roleId: string | number, permissionId: number) => {
  return apiFetch<null>(`/roles/${roleId}/permissions/${permissionId}`, {
    method: 'DELETE',
  });
};

// Permissions API
export const getPermissions = async () => {
  return apiFetch<any[]>('/permissions');
};

export const createPermission = async (permission: any) => {
  return apiFetch<any>('/permissions', {
    method: 'POST',
    body: JSON.stringify(permission),
  });
};

export const updatePermission = async (id: string | number, permission: any) => {
  return apiFetch<any>(`/permissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(permission),
  });
};

export const deletePermission = async (id: string | number) => {
  return apiFetch<null>(`/permissions/${id}`, {
    method: 'DELETE',
  });
};

// Transactions API
export const getTransactions = async (params?: { type?: string; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<any[]>(`/transactions${qs ? `?${qs}` : ''}`);
};

// Upload API (Cloudinary)
export const uploadProductImage = async (file: File): Promise<string> => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/upload/product-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Error al subir imagen');
  return json.data.url as string;
};

// ─── System Config API ────────────────────────────────────────────────────────
// Tipos para la configuración del sistema
export type DocumentType = { value: string; label: string };
export type StatusOption = { value: string; label: string; color: string };
export type SidebarItemConfig = {
  id: string;
  label: string;
  icon: string;
  roles: string[];
  permission: string | null;
};
export type CurrencyConfig = {
  locale: string;
  currency: string;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  symbol: string;
  name: string;
};
export type StoreInfo = {
  name: string;
  address: string;
  mall: string;
  phone: string;
  schedule: { weekdays: string; saturday: string; sunday: string };
};
export type PickupTimeSlot = { value: string; label: string };
export type PickupPolicy = {
  hours_to_pickup: number;
  payment_on_pickup: boolean;
  message: string;
};
export type SystemConfigData = {
  document_types: {
    document_types_user: DocumentType[];
    document_types_employee: DocumentType[];
    document_types_provider: DocumentType[];
    document_types_client: DocumentType[];
  };
  statuses: {
    sale_statuses: StatusOption[];
    purchase_statuses: StatusOption[];
  };
  general: {
    currency: CurrencyConfig;
    min_prices: { product_price: number; product_cost: number };
    pagination: { default_page_size: number; max_page_size: number };
    company_info: { name: string; description: string; version: string; email: string; phone: string; address: string; website: string };
  };
  ui: {
    sidebar_items: SidebarItemConfig[];
  };
  auth: {
    default_client_role: string;
  };
  store: {
    store_info: StoreInfo;
    pickup_time_slots: PickupTimeSlot[];
    pickup_policy: PickupPolicy;
  };
};

/**
 * Obtiene toda la configuración del sistema agrupada.
 * Este endpoint es público — no requiere autenticación.
 */
export const getSystemConfig = async (): Promise<SystemConfigData> => {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/config`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Error al cargar configuración');
  return json.data as SystemConfigData;
};

/**
 * Obtiene el valor de una clave de configuración específica.
 */
export const getConfigByKey = async (key: string) => {
  return apiFetch<{ key: string; value: unknown; group: string; description: string }>(`/config/${key}`);
};

/**
 * Actualiza el valor de una clave de configuración (solo admin).
 */
export const updateConfigByKey = async (key: string, value: unknown) => {
  return apiFetch<unknown>(`/config/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
};
