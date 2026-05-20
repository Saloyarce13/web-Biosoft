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
import { useSidebarItems } from './shared/contexts/SystemConfigContext';
import { HomeView } from './features/dashboard/pages/AdminDashboardPage';
import { ClientStorefront } from './features/dashboard/pages/StoreFrontPage';
import { useFavorites } from './shared/hooks/useFavorites';
import { useCart } from './shared/contexts/CartContext';
import { toast } from 'sonner';
import {
  Leaf, Home, ShoppingCart, Users, Package, Truck, BarChart3, User,
  Building2, FileText, ShoppingBag, Calendar, TrendingUp, Star, MapPin,
  Phone, Mail, Search, ArrowLeft, ChevronDown, TrendingDown, AlertTriangle,
  Clock, Repeat, Crown, UserCheck, DollarSign, Briefcase, Heart,
  Shield, Bell,
} from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { usePersistedState, STORAGE_KEYS } from './shared/utils/storage';

// Mapa de nombres de iconos a componentes Lucide — fuera del componente para evitar recreación
const ICON_MAP: Record<string, React.ElementType> = {
  Home, BarChart3, Users, Briefcase, Shield, Building2, Package, ShoppingCart, Truck, FileText, DollarSign,
};

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
  const { cartItems, addToCart, updateCartQuantity, removeFromCart, clearCart, cartItemsCount } = useCart();
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
    if (normalizedRole !== 'Cliente') setCurrentView('dashboard');
    toast.success(`¡Bienvenido ${userData.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setCurrentView('landing');
    setLandingKey(k => k + 1);
    clearCart();
    setIsProfileOpen(false);
    setIsUserSidebarOpen(false);
    setClientView('store');
    toast.success('Sesión cerrada correctamente');
  };

  const handleCheckout = () => { setIsCartOpen(false); setClientView('checkout'); };
  const handleOrderComplete = () => { clearCart(); setClientView('orders'); };

  // Sidebar dinámico desde la BD
  const sidebarItemsFromDB = useSidebarItems();

  // Filtrar sidebar: admin ve todo, los demás solo lo que tienen permiso
  const filteredSidebarItems = user ? sidebarItemsFromDB.filter(item => {
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
    const item = sidebarItemsFromDB.find(item => item.id === viewId);
    if (!item) return false;
    const roleMatch = item.roles.some(r => r.toLowerCase() === role);
    const perms = user.permissions ?? [];
    const permMatch = item.permission ? perms.includes(item.permission) || perms.includes(item.permission.replace('.view', '.manage')) : false;
    return roleMatch || permMatch;
  };

  React.useEffect(() => {
    if (user && !hasAccessToView(currentView)) setCurrentView('dashboard');
  }, [user, currentView]);

  React.useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null); setCurrentView('login'); clearCart();
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
      apiFetch<any>('/auth/me')
        .then(res => {
          if (res.success) {
            const d = res.data;
            const roleName = typeof d.role === 'object' ? d.role?.name ?? '' : d.role ?? '';
            const rolePerms: string[] = typeof d.role === 'object'
              ? (d.role?.permissions ?? []).map((p: any) => p?.permission?.name ?? p?.name ?? p)
              : (d.permissions ?? []);
            const normalizedRole = normalizeRole(roleName);
            setUser({ name: d.name, email: d.email, role: normalizedRole, permissions: rolePerms });
            setCurrentView('dashboard');
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
      case 'favorites':    return <><ClientFavorites user={user} onBack={() => setClientView('store')} />{cartSidebar}</>;
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
                  {/* Notificaciones */}
                  <button
                    onClick={() => setClientView('notifications')}
                    style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: '1px solid #E5E5E2', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                  >
                    <Bell style={{ width: 17, height: 17, color: '#737370' }} />
                  </button>

                  {/* Favoritos */}
                  <button
                    onClick={() => setClientView('favorites')}
                    style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: '1px solid #E5E5E2', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                  >
                    <Heart style={{ width: 17, height: 17, color: '#737370' }} />
                  </button>

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
                <ClientStorefront isFavorite={isFavorite} toggleFavorite={toggleFavorite} userName={user.name} />
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
      case 'home':
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
      default:          return <HomeView />;
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
                        {(() => { const IconComp = ICON_MAP[item.icon] || Package; return <IconComp className="h-4 w-4 shrink-0" />; })()}
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
          <AppHeader user={user} onLogout={handleLogout} onUserSidebarOpen={() => setIsUserSidebarOpen(true)} />
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

function DashboardReportsView() {
  return <div className="space-y-6"><ReportsAnalytics /></div>;
}
