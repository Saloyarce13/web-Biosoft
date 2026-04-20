import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from './components/ui/sidebar';
import { ProductManagement } from './features/products/pages/ProductManagementPage';
import { UserManagement } from './features/users/pages/UserManagementPage';
import { EmployeeManagement } from './features/users/pages/EmployeeManagementPage';
import { ReportsAnalytics } from './features/reports/pages/ReportsAnalyticsPage';
import { RoleManagement } from './features/users/pages/RoleManagementPage';
import { ProviderManagement } from './features/providers/pages/ProviderManagementPage';
import { CategoryManagement } from './features/categories/pages/CategoryManagementPage';
import { PurchaseManagement } from './features/purchases/pages/PurchaseManagementPage';
import { ClientManagement } from './features/clients/pages/ClientManagementPage';
import { OrderManagement } from './features/orders/pages/OrderManagementPage';
import { SalesManagement } from './features/sales/pages/SalesManagementPage';
import { AuthLogin } from './features/auth/pages/LoginPage';
import { AuthRegister } from './features/auth/pages/RegisterPage';
import { LandingPage } from './features/landing/pages/LandingPage';
import { AppHeader } from './features/dashboard/pages/DashboardPage';
import { ShoppingCartSidebar, CartItem } from './features/system/pages/ShoppingCartSidebarPage';
import { UserProfilePanel } from './features/system/pages/UserProfilePanelPage';
import { UserSidebar } from './features/system/pages/UserSidebarPage';
import { ClientProfile } from './features/clients/pages/ClientProfilePage';
import { ClientNotifications } from './features/clients/pages/ClientNotificationsPage';
import { ClientPaymentMethods } from './features/clients/pages/ClientPaymentMethodsPage';
import { ClientOrders } from './features/clients/pages/ClientOrdersPage';
import { ClientFavorites } from './features/clients/components/ClientFavorites';
import { ProductDetailModal } from './features/products/pages/ProductDetailPage';
import { CheckoutFlow } from './features/checkout/pages/CheckoutPage';
import { Footer } from './features/system/pages/FooterPage';
import { SIDEBAR_ITEMS } from './routes';
import { useFavorites } from './shared/hooks/useFavorites';
import { toast } from 'sonner';
import {
  Leaf, Home, ShoppingCart, Users, Package, Truck, BarChart3, User,
  Building2, FileText, ShoppingBag, Calendar, TrendingUp, Star, MapPin,
  Phone, Mail, Search, ArrowLeft, ChevronDown, TrendingDown, AlertTriangle,
  Clock, Repeat, Crown, UserCheck, DollarSign, Briefcase, Heart,
} from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { usePersistedState, STORAGE_KEYS } from './shared/utils/storage';

interface UnifiedProduct {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  status?: 'Activo' | 'Inactivo' | 'Descontinuado';
  sku?: string;
  supplier?: string;
  technicalSheet?: string;
  cost?: number;
  margin?: number;
  weight?: number;
  barcode?: string;
  minStock?: number;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
  totalSales?: number;
  lastSaleDate?: string | null;
}

type ClientView = 'store' | 'profile' | 'notifications' | 'payments' | 'checkout' | 'orders' | 'favorites';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [landingKey, setLandingKey] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string; role: string; permissions: string[] } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUserSidebarOpen, setIsUserSidebarOpen] = useState(false);
  const [clientView, setClientView] = useState<ClientView>('store');
  const { favorites, isFavorite, toggleFavorite } = useFavorites(user?.email || 'guest');

  const normalizeRole = (role: string) => {
    const roleMap: Record<string, string> = {
      administrador: 'Administrador',
      vendedor: 'Vendedor', bodega: 'Bodega', contador: 'Contador',
      cliente: 'Cliente', user: 'Cliente'
    };
    return roleMap[role.toLowerCase()] || role;
  };

  const handleLogin = (userData: { name: string; email: string; role: string; permissions?: string[] }) => {
    const normalizedRole = normalizeRole(userData.role);
    const normalized = { ...userData, role: normalizedRole, permissions: userData.permissions || [] };
    setUser(normalized);
    if (normalizedRole !== 'Cliente') setCurrentView('home');
    toast.success(`¡Bienvenido ${userData.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setCurrentView('landing');
    setLandingKey(k => k + 1);
    setCartItems([]);
    setIsProfileOpen(false);
    setIsUserSidebarOpen(false);
    setClientView('store');
    toast.success('Sesión cerrada correctamente');
  };

  const addToCart = (product: UnifiedProduct, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const maxQty = product.stock ?? 999;
        const newQty = Math.min(existing.quantity + quantity, maxQty);
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQty } : item);
      }
      return [...prev, { id: product.id as number, name: product.name, price: product.price, image: product.image || '', quantity, category: product.category, stock: product.stock }];
    });
    toast.success(quantity === 1 ? `${product.name} agregado al carrito` : `${product.name} (${quantity}x) agregado al carrito`);
  };

  const updateCartQuantity = (id: number, quantity: number) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const removeFromCart = (id: number) => {
    const item = cartItems.find(item => item.id === id);
    setCartItems(prev => prev.filter(item => item.id !== id));
    if (item) toast.success(`${item.name} eliminado del carrito`);
  };

  const clearCart = () => { setCartItems([]); toast.success('Carrito vaciado'); };
  const handleCheckout = () => { setIsCartOpen(false); setClientView('checkout'); };
  const handleOrderComplete = () => { setCartItems([]); setClientView('orders'); };
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Filtrar sidebar: admin ve todo, los demás solo lo que tienen permiso
  const filteredSidebarItems = user ? SIDEBAR_ITEMS.filter(item => {
    const role = user.role.toLowerCase();
    // Solo el rol exacto "administrador" ve todo
    if (role === 'administrador') return true;
    // Verificar si el rol base del item coincide exactamente
    const roleMatch = item.roles.some(r => r.toLowerCase() === role);
    // Verificar si tiene el permiso requerido en el token
    const perms = user.permissions ?? [];
    const permMatch = item.permission ? perms.includes(item.permission) || perms.includes(item.permission.replace('.view', '.manage')) : false;
    return roleMatch || permMatch;
  }) : [];

  const hasAccessToView = (viewId: string) => {
    if (!user) return false;
    const role = user.role.toLowerCase();
    // Solo el rol exacto "administrador" tiene acceso total
    if (role === 'administrador') return true;
    const item = SIDEBAR_ITEMS.find(item => item.id === viewId);
    if (!item) return false;
    const roleMatch = item.roles.some(r => r.toLowerCase() === role);
    const perms = user.permissions ?? [];
    const permMatch = item.permission ? perms.includes(item.permission) || perms.includes(item.permission.replace('.view', '.manage')) : false;
    return roleMatch || permMatch;
  };

  React.useEffect(() => {
    if (user && !hasAccessToView(currentView)) setCurrentView('home');
  }, [user, currentView]);

  React.useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null); setCurrentView('login'); setCartItems([]);
      setIsProfileOpen(false); setIsUserSidebarOpen(false); setClientView('store');
      toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || user) return;
    import('./lib/api').then(({ apiFetch }) => {
      apiFetch<{ id: number; name: string; email: string; role: string; permissions: string[] }>('/auth/me')
        .then(res => {
          if (res.success) {
            const normalizedRole = normalizeRole(res.data.role);
            setUser({ name: res.data.name, email: res.data.email, role: normalizedRole, permissions: res.data.permissions || [] });
            setCurrentView('home');
          }
        }).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (currentView === 'landing') {
    return <div><LandingPage key={landingKey} onLoginOpen={() => setCurrentView('login')} /></div>;
  }

  if (currentView === 'register') {
    return <AuthRegister onLogin={handleLogin} onBack={() => setCurrentView('login')} />;
  }

  if (currentView === 'login' || !user) {
    return <AuthLogin onLogin={handleLogin} onBack={() => { setCurrentView('landing'); setLandingKey(k => k + 1); }} onRegister={() => setCurrentView('register')} />;
  }

  if (user?.role === 'Cliente') {
    const cartSidebar = (
      <ShoppingCartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}
        cartItems={cartItems} onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart} onClearCart={clearCart} onCheckout={handleCheckout} />
    );
    switch (clientView) {
      case 'profile':      return <><ClientProfile user={user} onBack={() => setClientView('store')} onLogout={handleLogout} onNameChange={name => setUser(prev => prev ? { ...prev, name } : prev)} />{cartSidebar}</>;
      case 'notifications':return <><ClientNotifications user={user} onBack={() => setClientView('store')} />{cartSidebar}</>;
      case 'payments':     return <><ClientPaymentMethods user={user} onBack={() => setClientView('store')} />{cartSidebar}</>;
      case 'checkout':     return <><CheckoutFlow cartItems={cartItems} onClose={() => setClientView('store')} onOrderComplete={handleOrderComplete} user={user} onLogin={handleLogin} />{cartSidebar}</>;
      case 'orders':       return <><ClientOrders user={user} onBack={() => setClientView('store')} />{cartSidebar}</>;
      case 'favorites':    return <><ClientFavorites user={user} onBack={() => setClientView('store')} onAddToCart={addToCart} />{cartSidebar}</>;
      case 'store':
      default:
        return (
          <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* Header cliente — más amplio y con mejor diseño */}
            <header style={{ position: 'sticky', top: 0, zIndex: 30, borderBottom: '1px solid #E5E5E2', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
              <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Leaf style={{ width: 17, height: 17, color: '#3A7D44' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1A', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.2 }}>Bionatural</span>
                    <span style={{ fontSize: 11, color: '#737370', display: 'block', lineHeight: 1 }}>Tienda Naturista</span>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Carrito */}
                  <button
                    onClick={() => setIsCartOpen(true)}
                    style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: '1px solid #E5E5E2', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                  >
                    <ShoppingCart style={{ width: 17, height: 17, color: '#737370' }} />
                    {cartItemsCount > 0 && (
                      <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#3A7D44', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                      </span>
                    )}
                  </button>

                  {/* Separador */}
                  <div style={{ width: 1, height: 24, backgroundColor: '#E5E5E2' }} />

                  {/* Usuario */}
                  <button
                    onClick={() => setIsUserSidebarOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10, border: '1px solid #E5E5E2', backgroundColor: 'white', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#3A7D44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{getUserInitials(user.name)}</span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', display: 'block', lineHeight: 1.2 }}>{user.name}</span>
                      <span style={{ fontSize: 10, color: '#737370', display: 'block', lineHeight: 1 }}>Cliente</span>
                    </div>
                    <ChevronDown style={{ width: 14, height: 14, color: '#737370' }} />
                  </button>
                </div>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-5 flex-1">
                <ClientStorefront onAddToCart={addToCart} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
              </div>
              <Footer />
            </div>
            <UserSidebar isOpen={isUserSidebarOpen} onClose={() => setIsUserSidebarOpen(false)} user={user} onLogout={handleLogout}
              onProfileOpen={() => { setIsUserSidebarOpen(false); setClientView('profile'); }}
              onNotificationsOpen={() => { setIsUserSidebarOpen(false); setClientView('notifications'); }}
              onPaymentMethodsOpen={() => { setIsUserSidebarOpen(false); setClientView('payments'); }}
              onOrdersOpen={() => { setIsUserSidebarOpen(false); setClientView('orders'); }}
              onFavoritesOpen={() => { setIsUserSidebarOpen(false); setClientView('favorites'); }} />
            {cartSidebar}
            <Toaster />
          </div>
        );
    }
  }

  if (isProfileOpen) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-sm px-4 py-2.5">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Leaf className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-sm tracking-tight">Perfil de Usuario</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsProfileOpen(false)}>Volver al Sistema</Button>
          </div>
        </header>
        <UserProfilePanel user={user} onLogout={handleLogout} />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'landing':   return <LandingPage key={landingKey} onLoginOpen={() => setCurrentView('login')} />;
      case 'home':      return <HomeView onAddToCart={addToCart} />;
      case 'dashboard':
      case 'reports':   return <DashboardReportsView />;
      case 'users':     return <UserManagement />;
      case 'employees': return <EmployeeManagement />;
      case 'roles':     return <RoleManagement />;
      case 'providers': return <ProviderManagement />;
      case 'products':  return <ProductManagement />;
      case 'categories':return <CategoryManagement />;
      case 'purchases': return <PurchaseManagement />;
      case 'clients':   return <ClientManagement />;
      case 'orders':    return <OrderManagement user={user} />;
      case 'sales':     return <SalesManagement user={user} />;
      default:          return <HomeView onAddToCart={addToCart} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 px-3 py-4 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Leaf className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight text-foreground">Bionatural</span>
                  <span className="text-[10px] text-muted-foreground leading-none">Tienda Naturista</span>
                </div>
              </SidebarGroupLabel>
              <div className="mx-3 mb-3 h-px bg-border" />
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredSidebarItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton onClick={() => setCurrentView(item.id)} isActive={currentView === item.id} className="w-full rounded-lg mx-1 px-3 py-2 text-sm font-medium transition-colors">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto flex flex-col bg-background">
          <AppHeader user={user} onLogout={handleLogout} cartItemsCount={cartItemsCount} onCartOpen={() => setIsCartOpen(true)} onUserSidebarOpen={() => setIsUserSidebarOpen(true)} />
          <div className="p-5 flex-1">{renderContent()}</div>
          <Footer />
        </main>

        <ShoppingCartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} onUpdateQuantity={updateCartQuantity} onRemoveItem={removeFromCart} onClearCart={clearCart} onCheckout={handleCheckout} />
        <UserSidebar isOpen={isUserSidebarOpen} onClose={() => setIsUserSidebarOpen(false)} user={user} onLogout={handleLogout} onProfileOpen={() => { setIsUserSidebarOpen(false); setIsProfileOpen(true); }} />
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

// ── HomeView (Dashboard admin) ────────────────────────────────────────────────
function HomeView({ onAddToCart }: { onAddToCart: (product: UnifiedProduct) => void }) {
  const [stats, setStats] = React.useState({ products: 0, sales: 0, purchases: 0, clients: 0, lowStock: 0, revenue: 0 });
  const [recentProducts, setRecentProducts] = React.useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const { getProducts, getSales, getPurchases, getClients } = await import('./lib/api');
        const [prodRes, salesRes, purchRes, clientRes] = await Promise.allSettled([getProducts(true), getSales(), getPurchases(), getClients()]);
        const prods = prodRes.status === 'fulfilled' && prodRes.value.success ? prodRes.value.data : [];
        const sales = salesRes.status === 'fulfilled' && salesRes.value.success ? salesRes.value.data : [];
        const purchases = purchRes.status === 'fulfilled' && purchRes.value.success ? purchRes.value.data : [];
        const clients = clientRes.status === 'fulfilled' && clientRes.value.success ? clientRes.value.data : [];
        const activeProd = prods.filter((p: any) => p.isActive);
        const lowStock = activeProd.filter((p: any) => p.stock <= (p.minStock || 5) && p.stock > 0).length;
        const revenue = (sales as any[]).filter((s: any) => s.status === 'COMPLETED').reduce((sum: number, s: any) => sum + Number(s.totalPrice || 0), 0);
        setStats({ products: activeProd.length, sales: (sales as any[]).length, purchases: (purchases as any[]).length, clients: (clients as any[]).filter((c: any) => c.isActive).length, lowStock, revenue });
        setRecentProducts(activeProd.slice(0, 6).map((p: any) => ({ id: String(p.id), name: p.name, description: p.description || '', price: Number(p.price), image: '', category: p.category?.name || '', stock: p.stock || 0, status: 'Activo' as const, isActive: true, minStock: p.minStock || 5, sku: p.sku || '', supplier: p.provider?.name || '', createdDate: '', updatedDate: '', totalSales: 0, lastSaleDate: null, cost: Number(p.cost) || 0, margin: 0 })));
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
  const STAT_CARDS = [
    { label: 'Productos activos',   value: stats.products,  icon: Package,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Ventas registradas',  value: stats.sales,     icon: TrendingUp, color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Compras realizadas',  value: stats.purchases, icon: ShoppingBag,color: 'text-violet-600',  bg: 'bg-violet-50' },
    { label: 'Clientes activos',    value: stats.clients,   icon: Users,      color: 'text-amber-600',   bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Panel de Control</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen general del sistema Bionatural</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          <Calendar className="h-3.5 w-3.5" />
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0">
                {loading ? <div className="h-6 w-12 bg-muted animate-pulse rounded mb-1" /> : <p className="text-2xl font-bold leading-none">{value}</p>}
                <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-muted-foreground">Ingresos totales (ventas completadas)</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            {loading ? <div className="h-8 w-40 bg-muted animate-pulse rounded" /> : <p className="text-3xl font-bold text-primary tracking-tight">{fmt(stats.revenue)}</p>}
            <p className="text-xs text-muted-foreground mt-1">Acumulado de todas las ventas completadas</p>
          </CardContent>
        </Card>
        <Card className={`border ${stats.lowStock > 0 ? 'border-orange-200 bg-orange-50/50' : 'bg-card'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-muted-foreground">Stock crítico</p>
              <AlertTriangle className={`h-4 w-4 ${stats.lowStock > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            </div>
            {loading ? <div className="h-8 w-12 bg-muted animate-pulse rounded" /> : <p className={`text-3xl font-bold tracking-tight ${stats.lowStock > 0 ? 'text-orange-600' : 'text-foreground'}`}>{stats.lowStock}</p>}
            <p className="text-xs text-muted-foreground mt-1">{stats.lowStock > 0 ? 'Productos por debajo del mínimo' : 'Todos los productos con stock OK'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border bg-card">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Productos del catálogo</CardTitle>
              <CardDescription className="text-xs mt-0.5">Últimos productos activos en el sistema</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">{stats.products} activos</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted animate-pulse rounded w-1/2" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                  </div>
                  <div className="h-3.5 bg-muted animate-pulse rounded w-16" />
                </div>
              ))}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No hay productos registrados aún
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-primary">{fmt(p.price)}</p>
                    <p className={`text-xs ${p.stock <= (p.minStock || 5) ? 'text-orange-500' : 'text-muted-foreground'}`}>{p.stock} uds</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Accesos rápidos</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Productos',   icon: Package,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Ventas',      icon: TrendingUp, color: 'text-blue-600',    bg: 'bg-blue-50' },
            { label: 'Compras',     icon: ShoppingBag,color: 'text-violet-600',  bg: 'bg-violet-50' },
            { label: 'Clientes',    icon: Users,      color: 'text-amber-600',   bg: 'bg-amber-50' },
            { label: 'Proveedores', icon: Truck,      color: 'text-rose-600',    bg: 'bg-rose-50' },
            { label: 'Reportes',    icon: BarChart3,  color: 'text-teal-600',    bg: 'bg-teal-50' },
          ].map(({ label, icon: Icon, color, bg }) => (
            <Card key={label} className="border bg-card cursor-pointer hover:shadow-md transition-shadow group">
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-xs font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardReportsView() {
  return <div className="space-y-6"><ReportsAnalytics /></div>;
}

// ── ClientStorefront ──────────────────────────────────────────────────────────
function ClientStorefront({ onAddToCart, isFavorite, toggleFavorite }: {
  onAddToCart: (product: UnifiedProduct) => void;
  isFavorite: (id: string | number) => boolean;
  toggleFavorite: (product: any) => void;
}) {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<UnifiedProduct | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const fetchProducts = React.useCallback(async () => {
    try {
      const { getProducts } = await import('./lib/api');
      const res = await getProducts();
      if (res.success) {
        setProducts(res.data.filter((p: any) => p.isActive && p.stock > 0).map((p: any) => ({
          id: String(p.id), name: p.name, description: p.description || '',
          price: Number(p.price), image: '', category: p.category?.name || '',
          stock: p.stock || 0, status: 'Activo' as const, isActive: true,
          minStock: p.minStock || 5, sku: p.sku || '', supplier: p.provider?.name || '',
          createdDate: '', updatedDate: '', totalSales: 0, lastSaleDate: null,
          cost: Number(p.cost) || 0, margin: 0,
        })));
      }
    } catch { } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchProducts(); }, [fetchProducts]);
  React.useEffect(() => {
    const t = setInterval(fetchProducts, 30_000);
    return () => clearInterval(t);
  }, [fetchProducts]);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = products.filter(p =>
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === 'all' || p.category === categoryFilter)
  );
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

  const getCategoryStyle = (cat: string) => {
    const map: Record<string, { bg: string; color: string; light: string }> = {
      'Tés e Infusiones':     { bg: '#FEF3C7', color: '#D97706', light: '#FFFBEB' },
      'Aceites Esenciales':   { bg: '#E0F2FE', color: '#0284C7', light: '#F0F9FF' },
      'Hierbas Medicinales':  { bg: '#DCFCE7', color: '#16A34A', light: '#F0FDF4' },
      'Suplementos':          { bg: '#F3E8FF', color: '#9333EA', light: '#FAF5FF' },
      'Cosméticos Naturales': { bg: '#FCE7F3', color: '#DB2777', light: '#FDF2F8' },
      'Alimentos Orgánicos':  { bg: '#FEF9C3', color: '#CA8A04', light: '#FEFCE8' },
      'Alimentos Dieteticos': { bg: '#FEF9C3', color: '#CA8A04', light: '#FEFCE8' },
      'Aromerapia':           { bg: '#E0F2FE', color: '#0369A1', light: '#F0F9FF' },
      'Medicina Alternativa': { bg: '#F0FDF4', color: '#15803D', light: '#F0FDF4' },
    };
    return map[cat] || { bg: '#F0F4EF', color: '#3A7D44', light: '#F7FAF7' };
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Banner */}
      <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 180, marginBottom: 28, background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #3A7D44 100%)' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 220, height: 220, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 80, width: 180, height: 180, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(129,199,132,0.2)', border: '1px solid rgba(129,199,132,0.4)', borderRadius: 99, padding: '4px 12px', marginBottom: 10, width: 'fit-content' }}>
            <Leaf style={{ width: 11, height: 11, color: '#81C784' }} />
            <span style={{ fontSize: 10, color: '#81C784', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>100% Natural</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 6 }}>Bienvenido a tu tienda</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            {loading ? 'Cargando...' : `${products.length} productos naturales disponibles`}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF', pointerEvents: 'none' as const }} />
          <input placeholder="Buscar productos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 38, paddingRight: 14, height: 42, borderRadius: 12, border: '1.5px solid #E5E5E2', backgroundColor: 'white', fontSize: 13, color: '#1C1C1A', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ height: 42, borderRadius: 12, border: '1.5px solid #E5E5E2', backgroundColor: 'white', fontSize: 13, color: '#1C1C1A', padding: '0 14px', outline: 'none', cursor: 'pointer', minWidth: 180 }}>
          <option value="all">Todas las categorías</option>
          {categories.filter(c => c !== 'all').map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button onClick={fetchProducts} disabled={loading}
          style={{ height: 42, padding: '0 16px', borderRadius: 12, border: '1.5px solid #E5E5E2', backgroundColor: 'white', fontSize: 12, color: '#737370', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Repeat style={{ width: 13, height: 13 }} /> Actualizar
        </button>
      </div>

      {/* Contador */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#737370', fontWeight: 500 }}>
          {loading ? 'Cargando...' : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
        </p>
        {(searchTerm || categoryFilter !== 'all') && (
          <button onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}
            style={{ fontSize: 12, color: '#3A7D44', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, maxWidth: 720, margin: '0 auto' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 16, border: '1px solid #E5E5E2', backgroundColor: 'white', overflow: 'hidden' }}>
              <div style={{ height: 160, backgroundColor: '#F4F4F2' }} />
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                <div style={{ height: 14, backgroundColor: '#F4F4F2', borderRadius: 6, width: '70%' }} />
                <div style={{ height: 36, backgroundColor: '#F4F4F2', borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '80px 24px', color: '#9CA3AF' }}>
          <Package style={{ width: 48, height: 48, opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Sin resultados</p>
          <p style={{ fontSize: 13 }}>Intenta con otros filtros</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, maxWidth: 720, margin: '0 auto' }}>
          {filtered.map(product => {
            const fav = isFavorite(product.id);
            const cs = getCategoryStyle(product.category);
            return (
              <div key={product.id}
                onClick={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}
                style={{ borderRadius: 16, border: '1px solid #E5E5E2', backgroundColor: 'white', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-5px)'; el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
              >
                {/* Placeholder categoría */}
                <div style={{ position: 'relative', height: 160, backgroundColor: cs.bg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <Leaf style={{ width: 26, height: 26, color: cs.color }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: cs.color, opacity: 0.85 }}>{product.category}</span>
                  {/* Precio */}
                  <div style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '4px 10px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1A' }}>{fmt(product.price)}</span>
                  </div>
                  {/* Stock bajo */}
                  {product.stock < 10 && (
                    <div style={{ position: 'absolute', top: 10, left: 10 }}>
                      <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>¡{product.stock} restantes!</span>
                    </div>
                  )}
                  {/* Favorito */}
                  <button onClick={e => { e.stopPropagation(); toggleFavorite({ id: String(product.id), name: product.name, price: product.price, image: '', category: product.category, stock: product.stock, description: product.description }); toast.success(fav ? 'Eliminado de favoritos' : 'Guardado en favoritos'); }}
                    style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                    <Heart style={{ width: 14, height: 14, fill: fav ? '#EF4444' : 'none', color: fav ? '#EF4444' : '#9CA3AF' }} />
                  </button>
                </div>
                {/* Info */}
                <div style={{ padding: '14px 14px 16px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', lineHeight: 1.4, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    {product.name}
                  </p>
                  <button onClick={e => { e.stopPropagation(); onAddToCart(product); }} disabled={product.stock === 0}
                    style={{ width: '100%', height: 38, borderRadius: 10, backgroundColor: product.stock === 0 ? '#E5E5E2' : '#3A7D44', color: product.stock === 0 ? '#9CA3AF' : 'white', fontSize: 12, fontWeight: 700, border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                    onMouseEnter={e => { if (product.stock > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E6B38'; }}
                    onMouseLeave={e => { if (product.stock > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3A7D44'; }}>
                    {product.stock === 0 ? <><Package style={{ width: 13, height: 13 }} /> Agotado</> : <><ShoppingCart style={{ width: 13, height: 13 }} /> Agregar al carrito</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProductDetailModal product={selectedProduct} isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); setSelectedProduct(null); }}
        onAddToCart={onAddToCart} isFavorite={isFavorite}
        onToggleFavorite={p => toggleFavorite({ id: String(p.id), name: p.name, price: p.price, image: '', category: p.category, stock: p.stock, description: p.description })} />
    </div>
  );
}
