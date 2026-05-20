import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { ProviderReports } from '../../providers/components/ProviderReports';
import { getActiveProviders, getDashboardStats, getStockAvailableByProduct, getUniqueClients, getTopClients, getWeeklySales, getCategoryPerformance } from '../../../lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  Building2
} from 'lucide-react';



// Colores del sistema de diseño Bionatural
const CHART_COLORS = {
  primary: '#2E7D32',    // Verde hoja
  secondary: '#1565C0',   // Azul profundo
  accent: '#81C784',      // Verde suave
  tertiary: '#64B5F6',    // Azul suave
  quaternary: '#66BB6A',  // Verde intermedio
  success: '#4CAF50',     // Verde éxito
  warning: '#FF9800',     // Naranja advertencia
  info: '#2196F3'         // Azul información
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary, 
  CHART_COLORS.accent,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary
];

type DashboardStats = {
  purchases: { count: number; totalPrice: number };
  sales: { count: number; totalPrice: number };
  transactionsCount: number;
};

type Provider = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
};

type Client = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
};

type StockProduct = {
  id: number;
  name: string;
  stock: number;
  category?: { id: number; name: string };
};

export function ReportsAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedReport, setSelectedReport] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [activeProviders, setActiveProviders] = useState<Provider[]>([]);
  const [uniqueClients, setUniqueClients] = useState<Client[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [weeklySalesData, setWeeklySalesData] = useState<any[]>([]);
  const [categoryPerfData, setCategoryPerfData] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      setStatsError(null);

      try {
        const [dashboardRes, providersRes, clientsRes, stockRes, topClientsRes, weeklyRes, catRes] = await Promise.all([
          getDashboardStats(),
          getActiveProviders(),
          getUniqueClients(),
          getStockAvailableByProduct(),
          getTopClients(),
          getWeeklySales(),
          getCategoryPerformance()
        ]);

        setDashboardStats(dashboardRes.data);
        setActiveProviders(providersRes.data);
        setUniqueClients(clientsRes.data);
        setStockProducts(stockRes.data);
        setTopClients(topClientsRes.data);
        setWeeklySalesData(weeklyRes.data);
        setCategoryPerfData(catRes.data);
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : 'Error al cargar estadísticas');
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const criticalStockProducts = stockProducts
    .filter((product) => product.stock <= 15)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const averageTicket = dashboardStats?.sales.count ? Math.round(dashboardStats.sales.totalPrice / dashboardStats.sales.count) : 0;

  const renderSalesOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Ventas Totales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">${dashboardStats ? dashboardStats.sales.totalPrice.toLocaleString() : '0'}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            {dashboardStats ? `${dashboardStats.sales.count} ventas completadas` : 'Sin datos'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Total Transacciones</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">{dashboardStats ? dashboardStats.transactionsCount : 0}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Datos actualizados desde el backend
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Ticket Promedio</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">${averageTicket.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Basado en ventas completadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Clientes Únicos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">{uniqueClients.length}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            Clientes con compras completadas
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSalesChart = () => (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Ventas Semanales</CardTitle>
        <CardDescription>
          Evolución de ventas e ingresos en las últimas 8 semanas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklySalesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="week" 
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              axisLine={{ stroke: '#666' }}
            />
            <YAxis 
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              axisLine={{ stroke: '#666' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: `2px solid ${CHART_COLORS.primary}`,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="ventas" 
              stroke={CHART_COLORS.primary} 
              name="Ventas ($)"
              strokeWidth={4}
              dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 5 }}
              activeDot={{ 
                r: 8, 
                fill: CHART_COLORS.primary,
                stroke: 'white',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderCategoryPerformance = () => (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por Categoría</CardTitle>
        <CardDescription>Distribución de ventas por categoría de productos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryPerfData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ categoria, porcentaje }) => `${categoria}: ${porcentaje}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="ventas"
              >
                {categoryPerfData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-3">
            {categoryPerfData.map((category, index) => (
              <div key={category.categoria} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span>{category.categoria}</span>
                </div>
                <div className="text-right">
                  <div>{category.ventas} ventas</div>
                  <div className="text-sm text-muted-foreground">{category.porcentaje}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTopProductsComparison = () => (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa Semanal vs Mensual</CardTitle>
        <CardDescription>Rendimiento de productos top en diferentes períodos</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { producto: 'Té Verde', semanal: 34, mensual: 145 },
              { producto: 'Aceite Lavanda', semanal: 22, mensual: 89 },
              { producto: 'Vitamina C', semanal: 18, mensual: 76 },
              { producto: 'Cúrcuma', semanal: 15, mensual: 132 },
              { producto: 'Hierba S.J.', semanal: 12, mensual: 98 }
            ]}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="producto" 
              tick={{ fontSize: 11, fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              axisLine={{ stroke: '#666' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              axisLine={{ stroke: '#666' }}
            />
            <Tooltip 
              formatter={(value, name) => [
                `${value} ventas`, 
                name === 'semanal' ? 'Esta Semana' : 'Este Mes'
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: `2px solid ${CHART_COLORS.primary}`,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="semanal" 
              fill={CHART_COLORS.accent} 
              name="Esta Semana"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="mensual" 
              fill={CHART_COLORS.primary} 
              name="Este Mes"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderProductTrends = () => (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Productos Top</CardTitle>
        <CardDescription>Evolución de ventas de los 3 productos más populares</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={[
              { semana: 'S1', 'Té Verde': 28, 'Aceite Lavanda': 18, 'Vitamina C': 15 },
              { semana: 'S2', 'Té Verde': 32, 'Aceite Lavanda': 20, 'Vitamina C': 16 },
              { semana: 'S3', 'Té Verde': 29, 'Aceite Lavanda': 22, 'Vitamina C': 14 },
              { semana: 'S4', 'Té Verde': 34, 'Aceite Lavanda': 22, 'Vitamina C': 18 },
              { semana: 'S5', 'Té Verde': 31, 'Aceite Lavanda': 19, 'Vitamina C': 17 },
              { semana: 'S6', 'Té Verde': 36, 'Aceite Lavanda': 25, 'Vitamina C': 19 },
            ]}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="semana" 
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              axisLine={{ stroke: '#666' }}
            />
            <YAxis 
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              axisLine={{ stroke: '#666' }}
            />
            <Tooltip 
              formatter={(value, name) => [`${value} ventas`, name]}
              contentStyle={{
                backgroundColor: 'white',
                border: `2px solid ${CHART_COLORS.primary}`,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Té Verde" 
              stroke={CHART_COLORS.primary} 
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: CHART_COLORS.primary }}
            />
            <Line 
              type="monotone" 
              dataKey="Aceite Lavanda" 
              stroke={CHART_COLORS.secondary} 
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.secondary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: CHART_COLORS.secondary }}
            />
            <Line 
              type="monotone" 
              dataKey="Vitamina C" 
              stroke={CHART_COLORS.accent} 
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.accent, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: CHART_COLORS.accent }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderSupplierReport = () => (
    <Card>
      <CardHeader>
        <CardTitle>Proveedores Activos</CardTitle>
        <CardDescription>Proveedores con acceso activo en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeProviders.length > 0 ? (
              activeProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.email ?? 'N/A'}</TableCell>
                  <TableCell>{provider.phone ?? 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No hay proveedores activos disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderClientReport = () => (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Únicos</CardTitle>
        <CardDescription>Clientes con compras completadas en el periodo</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uniqueClients.length > 0 ? (
              uniqueClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email ?? 'N/A'}</TableCell>
                  <TableCell>{client.phone ?? 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                      <CheckCircle className="h-3 w-3" />
                      Activo
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No hay clientes disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderInventoryReport = () => (
    <Card>
      <CardHeader>
        <CardTitle>Productos con Stock Crítico</CardTitle>
        <CardDescription>Productos que requieren reabastecimiento urgente</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Stock Actual</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acción Requerida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {criticalStockProducts.length > 0 ? (
              criticalStockProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.stock} unidades</TableCell>
                  <TableCell>{product.category?.name ?? 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1 w-fit">
                      <AlertTriangle className="h-3 w-3" />
                      Crítico
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Generar Orden
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No hay productos en estado crítico.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      {/* Métricas principales — sin Transacciones ni Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardStats ? dashboardStats.sales.totalPrice.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Métrica de ventas completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {criticalStockProducts.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground mb-3">Productos con stock bajo</p>
            {criticalStockProducts.length > 0 && (
              <div className="space-y-1.5 border-t pt-3">
                {criticalStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground truncate flex-1">{p.name}</span>
                    <span className={`text-xs font-bold shrink-0 px-1.5 py-0.5 rounded ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {p.stock} uds
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejores Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topClients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes con más compras</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de ventas */}
      {renderSalesChart()}

      {/* Stock crítico — lista de productos */}
      {criticalStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Productos con Stock Crítico
            </CardTitle>
            <CardDescription>Productos que requieren reabastecimiento urgente</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Stock Actual</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalStockProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category?.name ?? '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={product.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
                        {product.stock} uds
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1 w-fit">
                        <AlertTriangle className="h-3 w-3" />
                        {product.stock === 0 ? 'Agotado' : 'Crítico'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mejores clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Mejores Clientes
          </CardTitle>
          <CardDescription>Clientes con mayor número de compras completadas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Compras</TableHead>
                <TableHead className="text-right">Total gastado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topClients.length > 0 ? topClients.map((client, idx) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <span className={`font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      #{idx + 1}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email ?? '—'}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-primary/10 text-primary">{client.totalCompras}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${Number(client.totalGastado).toLocaleString('es-CO')}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    No hay datos de clientes aún.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2>Reportes y Análisis</h2>
          <p className="text-muted-foreground">
            Dashboard integrado con métricas y reportes en tiempo real
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Seleccionar vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Vista Dashboard</SelectItem>
              <SelectItem value="sales">Reportes de Ventas</SelectItem>
              <SelectItem value="products">Análisis de Productos</SelectItem>
              <SelectItem value="clients">Reportes de Clientes</SelectItem>
              <SelectItem value="suppliers">Reportes de Proveedores</SelectItem>
              <SelectItem value="inventory">Reporte de Inventario</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {statsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {statsError}
        </div>
      )}

      {statsLoading && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Cargando datos de reportes...
        </div>
      )}

      {/* Contenido dinámico basado en la selección */}
      {selectedReport === 'dashboard' && (
        <div className="space-y-6">
          {renderDashboardOverview()}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderCategoryPerformance()}
            {renderTopProductsComparison()}
          </div>
        </div>
      )}

      {selectedReport === 'sales' && (
        <div className="space-y-6">
          {renderSalesOverview()}
          {renderSalesChart()}
        </div>
      )}

      {selectedReport === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderCategoryPerformance()}
            {renderProductTrends()}
          </div>
        </div>
      )}

      {selectedReport === 'clients' && (
        <div className="space-y-6">
          {renderClientReport()}
        </div>
      )}

      {selectedReport === 'suppliers' && (
        <div className="space-y-6">
          {renderSupplierReport()}
          <ProviderReports />
        </div>
      )}

      {selectedReport === 'inventory' && (
        <div className="space-y-6">
          {renderInventoryReport()}
        </div>
      )}
    </div>
  );
}