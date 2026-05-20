import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Calendar, DollarSign, AlertTriangle, Package, TrendingUp, ShoppingBag, Users } from 'lucide-react';

export interface UnifiedProduct {
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

export function HomeView() {
  const [stats, setStats] = React.useState({ products: 0, sales: 0, purchases: 0, clients: 0, lowStock: 0, revenue: 0 });
  const [recentProducts, setRecentProducts] = React.useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const { getProducts, getSales, getPurchases, getClients } = await import('../../../lib/api');
        const [prodRes, salesRes, purchRes, clientRes] = await Promise.allSettled([getProducts(true), getSales(), getPurchases(), getClients()]);
        const prods = prodRes.status === 'fulfilled' && prodRes.value.success ? prodRes.value.data : [];
        const sales = salesRes.status === 'fulfilled' && salesRes.value.success ? salesRes.value.data : [];
        const purchases = purchRes.status === 'fulfilled' && purchRes.value.success ? purchRes.value.data : [];
        const clients = clientRes.status === 'fulfilled' && clientRes.value.success ? clientRes.value.data : [];
        const activeProd = prods.filter((p: any) => p.isActive);
        const lowStock = activeProd.filter((p: any) => p.stock <= (p.minStock || 5) && p.stock > 0).length;
        const revenue = (sales as any[]).filter((s: any) => s.status === 'COMPLETED').reduce((sum: number, s: any) => sum + Number(s.totalPrice || 0), 0);
        setStats({ products: activeProd.length, sales: (sales as any[]).length, purchases: (purchases as any[]).length, clients: (clients as any[]).filter((c: any) => c.isActive).length, lowStock, revenue });
        setRecentProducts(activeProd.slice(0, 6).map((p: any) => ({ id: String(p.id), name: p.name, description: p.description || '', price: Number(p.price), image: p.image || '', category: p.category?.name || '', stock: p.stock || 0, status: 'Activo' as const, isActive: true, minStock: p.minStock || 5, sku: p.sku || '', supplier: p.provider?.name || '', createdDate: '', updatedDate: '', totalSales: 0, lastSaleDate: null, cost: Number(p.cost) || 0, margin: 0 })));
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

    </div>
  );
}
