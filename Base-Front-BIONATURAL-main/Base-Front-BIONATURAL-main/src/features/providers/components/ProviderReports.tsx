import React, { useState, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Calendar } from '../../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Checkbox } from '../../../components/ui/checkbox';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Building2,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Package,
  Globe,
  MapPin,
  Star
} from 'lucide-react';

// Tipos de datos para los reportes
interface Provider {
  id: string;
  name: string;
  businessName: string;
  type: 'Nacional' | 'Internacional' | 'Local' | 'Estratégico' | 'Ocasional';
  status: 'Activo' | 'Inactivo' | 'Suspendido' | 'Evaluación';
  categories: string[];
  contractDate: string;
  lastOrder: string;
  totalOrders: number;
  totalAmount: number;
  rating: number;
  contactPerson: string;
  isActive: boolean;
}

// Categorías de productos con clasificación
const PRODUCT_CATEGORIES = {
  'Materia Prima': [
    'Hierbas Medicinales',
    'Plantas Medicinales',
    'Raíces y Cortezas',
    'Flores y Hojas'
  ],
  'Insumos': [
    'Aceites Esenciales',
    'Extractos Naturales',
    'Tinturas Madres',
    'Aceites Portadores'
  ],
  'Servicios': [
    'Consultoría Herbal',
    'Certificaciones Orgánicas',
    'Análisis de Calidad',
    'Logística Especializada'
  ],
  'Productos Finales': [
    'Tés e Infusiones',
    'Suplementos',
    'Cosméticos Naturales',
    'Alimentos Orgánicos'
  ]
};

// Estados de proveedores
const PROVIDER_STATUS = [
  { value: 'Activo', label: 'Activo', color: 'bg-green-100 text-green-800' },
  { value: 'Inactivo', label: 'Inactivo', color: 'bg-gray-100 text-gray-800' },
  { value: 'Suspendido', label: 'Suspendido', color: 'bg-red-100 text-red-800' },
  { value: 'Evaluación', label: 'En Evaluación', color: 'bg-yellow-100 text-yellow-800' }
];

// Tipos de proveedores
const PROVIDER_TYPES = [
  { value: 'Nacional', label: 'Nacional', color: 'bg-blue-100 text-blue-800', icon: MapPin },
  { value: 'Internacional', label: 'Internacional', color: 'bg-purple-100 text-purple-800', icon: Globe },
  { value: 'Local', label: 'Local', color: 'bg-green-100 text-green-800', icon: MapPin },
  { value: 'Estratégico', label: 'Estratégico', color: 'bg-red-100 text-red-800', icon: Star },
  { value: 'Ocasional', label: 'Ocasional', color: 'bg-gray-100 text-gray-800', icon: Package }
];

// Datos de ejemplo para proveedores
const SAMPLE_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Hierbas Naturales S.A.',
    businessName: 'Hierbas Naturales Sociedad Anónima',
    type: 'Nacional',
    status: 'Activo',
    categories: ['Hierbas Medicinales', 'Tés e Infusiones'],
    contractDate: '2023-03-15',
    lastOrder: '2024-01-18',
    totalOrders: 45,
    totalAmount: 125000,
    rating: 4.8,
    contactPerson: 'María Fernández',
    isActive: true
  },
  {
    id: '2',
    name: 'Essential Oils International',
    businessName: 'Essential Oils International Ltd.',
    type: 'Internacional',
    status: 'Activo',
    categories: ['Aceites Esenciales', 'Aceites Portadores'],
    contractDate: '2023-06-10',
    lastOrder: '2024-01-15',
    totalOrders: 28,
    totalAmount: 89500,
    rating: 4.6,
    contactPerson: 'James Wilson',
    isActive: true
  },
  {
    id: '3',
    name: 'Orgánicos del Valle',
    businessName: 'Cooperativa Orgánicos del Valle',
    type: 'Local',
    status: 'Activo',
    categories: ['Alimentos Orgánicos', 'Certificaciones Orgánicas'],
    contractDate: '2023-01-20',
    lastOrder: '2024-01-19',
    totalOrders: 67,
    totalAmount: 156000,
    rating: 4.9,
    contactPerson: 'Carlos Vega',
    isActive: true
  },
  {
    id: '4',
    name: 'Natural Life Corp',
    businessName: 'Natural Life Corporation',
    type: 'Estratégico',
    status: 'Activo',
    categories: ['Suplementos', 'Análisis de Calidad', 'Cosméticos Naturales'],
    contractDate: '2022-11-08',
    lastOrder: '2024-01-20',
    totalOrders: 89,
    totalAmount: 245000,
    rating: 4.7,
    contactPerson: 'Ana Ruiz',
    isActive: true
  },
  {
    id: '5',
    name: 'Botánica Especializada',
    businessName: 'Botánica Especializada LTDA',
    type: 'Ocasional',
    status: 'Inactivo',
    categories: ['Plantas Medicinales'],
    contractDate: '2023-08-12',
    lastOrder: '2023-12-05',
    totalOrders: 12,
    totalAmount: 18500,
    rating: 4.2,
    contactPerson: 'Roberto Herrera',
    isActive: false
  },
  {
    id: '6',
    name: 'Cosméticos Verdes',
    businessName: 'Cosméticos Verdes y Naturales S.L.',
    type: 'Nacional',
    status: 'Evaluación',
    categories: ['Cosméticos Naturales'],
    contractDate: '2024-01-10',
    lastOrder: 'Nunca',
    totalOrders: 0,
    totalAmount: 0,
    rating: 0,
    contactPerson: 'Laura Morales',
    isActive: false
  },
  {
    id: '7',
    name: 'Herbal Consultores',
    businessName: 'Herbal Consultores Asociados',
    type: 'Local',
    status: 'Activo',
    categories: ['Consultoría Herbal', 'Análisis de Calidad'],
    contractDate: '2023-04-22',
    lastOrder: '2024-01-12',
    totalOrders: 24,
    totalAmount: 48000,
    rating: 4.5,
    contactPerson: 'Dr. Miguel Santos',
    isActive: true
  },
  {
    id: '8',
    name: 'Extractos Premium',
    businessName: 'Extractos Premium International',
    type: 'Internacional',
    status: 'Suspendido',
    categories: ['Extractos Naturales', 'Tinturas Madres'],
    contractDate: '2023-05-08',
    lastOrder: '2023-11-30',
    totalOrders: 18,
    totalAmount: 65000,
    rating: 3.8,
    contactPerson: 'Elena Rossi',
    isActive: false
  }
];

export function ProviderReports() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date('2023-01-01'));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Activo']);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [reportType, setReportType] = useState<'category' | 'status' | 'combined' | 'performance'>('category');

  // Obtener todas las categorías únicas
  const allCategories = useMemo(() => {
    return Array.from(new Set(
      Object.values(PRODUCT_CATEGORIES).flat()
    ));
  }, []);

  // Clasificar categoría por tipo
  const getCategoryType = (category: string) => {
    for (const [type, categories] of Object.entries(PRODUCT_CATEGORIES)) {
      if (categories.includes(category)) {
        return type;
      }
    }
    return 'Otros';
  };

  // Filtrar proveedores según criterios seleccionados
  const filteredProviders = useMemo(() => {
    return SAMPLE_PROVIDERS.filter(provider => {
      // Filtro por fecha de contrato
      if (startDate && endDate) {
        const contractDate = parseISO(provider.contractDate);
        const withinDateRange = isWithinInterval(contractDate, { start: startDate, end: endDate });
        if (!withinDateRange) return false;
      }

      // Filtro por categorías (si se seleccionaron)
      if (selectedCategories.length > 0) {
        const hasMatchingCategory = provider.categories.some(cat => 
          selectedCategories.includes(cat)
        );
        if (!hasMatchingCategory) return false;
      }

      // Filtro por estados
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(provider.status)) {
        return false;
      }

      // Filtro por tipos
      if (selectedTypes.length > 0 && !selectedTypes.includes(provider.type)) {
        return false;
      }

      return true;
    });
  }, [startDate, endDate, selectedCategories, selectedStatuses, selectedTypes]);

  // Generar datos para el reporte por categoría
  const categoryReport = useMemo(() => {
    const categoryData: { [key: string]: { providers: Provider[], totalAmount: number, totalOrders: number } } = {};
    
    filteredProviders.forEach(provider => {
      provider.categories.forEach(category => {
        if (!categoryData[category]) {
          categoryData[category] = { providers: [], totalAmount: 0, totalOrders: 0 };
        }
        categoryData[category].providers.push(provider);
        categoryData[category].totalAmount += provider.totalAmount;
        categoryData[category].totalOrders += provider.totalOrders;
      });
    });

    return Object.entries(categoryData).map(([category, data]) => ({
      category,
      categoryType: getCategoryType(category),
      providerCount: data.providers.length,
      totalAmount: data.totalAmount,
      totalOrders: data.totalOrders,
      avgAmount: data.totalAmount / data.providers.length || 0,
      providers: data.providers
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredProviders]);

  // Generar datos para el reporte por estado
  const statusReport = useMemo(() => {
    const statusData: { [key: string]: Provider[] } = {};
    
    filteredProviders.forEach(provider => {
      if (!statusData[provider.status]) {
        statusData[provider.status] = [];
      }
      statusData[provider.status].push(provider);
    });

    return Object.entries(statusData).map(([status, providers]) => ({
      status,
      count: providers.length,
      totalAmount: providers.reduce((sum, p) => sum + p.totalAmount, 0),
      totalOrders: providers.reduce((sum, p) => sum + p.totalOrders, 0),
      avgRating: providers.reduce((sum, p) => sum + p.rating, 0) / providers.length || 0,
      providers
    })).sort((a, b) => b.count - a.count);
  }, [filteredProviders]);

  // Generar datos para el reporte por tipo
  const typeReport = useMemo(() => {
    const typeData: { [key: string]: Provider[] } = {};
    
    filteredProviders.forEach(provider => {
      if (!typeData[provider.type]) {
        typeData[provider.type] = [];
      }
      typeData[provider.type].push(provider);
    });

    return Object.entries(typeData).map(([type, providers]) => ({
      type,
      count: providers.length,
      totalAmount: providers.reduce((sum, p) => sum + p.totalAmount, 0),
      totalOrders: providers.reduce((sum, p) => sum + p.totalOrders, 0),
      avgRating: providers.reduce((sum, p) => sum + p.rating, 0) / providers.length || 0,
      providers
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredProviders]);

  // Reporte de rendimiento
  const performanceReport = useMemo(() => {
    return filteredProviders.map(provider => ({
      ...provider,
      avgOrderAmount: provider.totalAmount / (provider.totalOrders || 1),
      categoryCount: provider.categories.length,
      daysSinceContract: Math.floor((new Date().getTime() - parseISO(provider.contractDate).getTime()) / (1000 * 60 * 60 * 24)),
      daysSinceLastOrder: provider.lastOrder !== 'Nunca' 
        ? Math.floor((new Date().getTime() - parseISO(provider.lastOrder).getTime()) / (1000 * 60 * 60 * 24))
        : null
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredProviders]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const exportReport = () => {
    toast.success(`Reporte de proveedores exportado exitosamente`);
    // Aquí se implementaría la lógica real de exportación
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedStatuses(['Activo']);
    setSelectedTypes([]);
    setStartDate(new Date('2023-01-01'));
    setEndDate(new Date());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Reportes de Proveedores
          </h2>
          <p className="text-muted-foreground">
            Análisis detallado de proveedores por categoría, estado y rendimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Limpiar Filtros
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Controles de filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Reporte
          </CardTitle>
          <CardDescription>
            Personaliza los criterios para generar reportes específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros de fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Fecha de Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          {/* Filtros por categoría */}
          <div>
            <Label className="mb-3 block">Categorías de Productos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(PRODUCT_CATEGORIES).map(([type, categories]) => (
                <div key={type} className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">{type}</h4>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <Label htmlFor={`category-${category}`} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Filtros por estado y tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-3 block">Estados de Proveedores</Label>
              <div className="space-y-2">
                {PROVIDER_STATUS.map(status => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                    />
                    <Label htmlFor={`status-${status.value}`} className="text-sm">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Tipos de Proveedores</Label>
              <div className="space-y-2">
                {PROVIDER_TYPES.map(type => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.value}`}
                      checked={selectedTypes.includes(type.value)}
                      onCheckedChange={() => handleTypeToggle(type.value)}
                    />
                    <Label htmlFor={`type-${type.value}`} className="text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de filtros aplicados */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Filtros aplicados:</span>
            <Badge variant="outline">
              {filteredProviders.length} proveedores
            </Badge>
            {selectedCategories.length > 0 && (
              <Badge variant="secondary">
                {selectedCategories.length} categorías
              </Badge>
            )}
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary">
                Estados: {selectedStatuses.join(', ')}
              </Badge>
            )}
            {selectedTypes.length > 0 && (
              <Badge variant="secondary">
                Tipos: {selectedTypes.join(', ')}
              </Badge>
            )}
            {startDate && endDate && (
              <Badge variant="outline">
                {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs de reportes */}
      <Tabs value={reportType} onValueChange={(value: any) => setReportType(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="category">Por Categoría</TabsTrigger>
          <TabsTrigger value="status">Por Estado</TabsTrigger>
          <TabsTrigger value="combined">Por Tipo</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        {/* Reporte por Categoría */}
        <TabsContent value="category" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-primary">
                  {categoryReport.length}
                </div>
                <div className="text-sm text-muted-foreground">Categorías Activas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-green-600">
                  ${categoryReport.reduce((sum, cat) => sum + cat.totalAmount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Facturado</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-blue-600">
                  {categoryReport.reduce((sum, cat) => sum + cat.totalOrders, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Órdenes Totales</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reporte por Categoría de Producto</CardTitle>
              <CardDescription>
                Análisis detallado de proveedores agrupados por categorías de productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Proveedores</TableHead>
                    <TableHead>Total Facturado</TableHead>
                    <TableHead>Órdenes</TableHead>
                    <TableHead>Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryReport.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.categoryType}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.providerCount}</TableCell>
                      <TableCell>${item.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{item.totalOrders}</TableCell>
                      <TableCell>${item.avgAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte por Estado */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statusReport.map((item) => {
              const statusConfig = PROVIDER_STATUS.find(s => s.value === item.status);
              return (
                <Card key={item.status}>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-semibold">{item.count}</div>
                    <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
                      {item.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-2">
                      ${item.totalAmount.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reporte por Estado del Proveedor</CardTitle>
              <CardDescription>
                Distribución y análisis de proveedores según su estado operativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Total Facturado</TableHead>
                    <TableHead>Órdenes</TableHead>
                    <TableHead>Calificación Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusReport.map((item) => {
                    const statusConfig = PROVIDER_STATUS.find(s => s.value === item.status);
                    return (
                      <TableRow key={item.status}>
                        <TableCell>
                          <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.count}</TableCell>
                        <TableCell>${item.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>{item.totalOrders}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            {item.avgRating.toFixed(1)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte por Tipo */}
        <TabsContent value="combined" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {typeReport.map((item) => {
              const typeConfig = PROVIDER_TYPES.find(t => t.value === item.type);
              const IconComponent = typeConfig?.icon || Building2;
              return (
                <Card key={item.type}>
                  <CardContent className="p-4 text-center">
                    <IconComponent className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-semibold">{item.count}</div>
                    <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'}>
                      {item.type}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-2">
                      ${item.totalAmount.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reporte por Tipo de Proveedor</CardTitle>
              <CardDescription>
                Análisis de proveedores según su clasificación geográfica y estratégica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Total Facturado</TableHead>
                    <TableHead>Órdenes</TableHead>
                    <TableHead>Calificación Promedio</TableHead>
                    <TableHead>Participación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeReport.map((item) => {
                    const typeConfig = PROVIDER_TYPES.find(t => t.value === item.type);
                    const totalAmount = typeReport.reduce((sum, t) => sum + t.totalAmount, 0);
                    const participation = totalAmount > 0 ? (item.totalAmount / totalAmount * 100) : 0;
                    
                    return (
                      <TableRow key={item.type}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeConfig && <typeConfig.icon className="h-4 w-4" />}
                            <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'}>
                              {item.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.count}</TableCell>
                        <TableCell>${item.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>{item.totalOrders}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            {item.avgRating.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>{participation.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte de Rendimiento */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-primary">
                  {performanceReport.filter(p => p.rating >= 4.5).length}
                </div>
                <div className="text-sm text-muted-foreground">Alta Calificación</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-green-600">
                  {performanceReport.filter(p => p.totalOrders > 30).length}
                </div>
                <div className="text-sm text-muted-foreground">Alto Volumen</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-blue-600">
                  {performanceReport.filter(p => p.totalAmount > 100000).length}
                </div>
                <div className="text-sm text-muted-foreground">Alto Valor</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-orange-600">
                  {performanceReport.filter(p => p.daysSinceLastOrder && p.daysSinceLastOrder > 60).length}
                </div>
                <div className="text-sm text-muted-foreground">Inactivos 60+ días</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reporte de Rendimiento</CardTitle>
              <CardDescription>
                Análisis detallado del desempeño individual de cada proveedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Órdenes</TableHead>
                    <TableHead>Valor Promedio</TableHead>
                    <TableHead>Última Orden</TableHead>
                    <TableHead>Categorías</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceReport.slice(0, 10).map((provider) => {
                    const typeConfig = PROVIDER_TYPES.find(t => t.value === provider.type);
                    return (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>
                          <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'}>
                            {provider.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            {provider.rating.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>{provider.totalOrders}</TableCell>
                        <TableCell>${provider.avgOrderAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          {provider.daysSinceLastOrder !== null ? (
                            <span className={provider.daysSinceLastOrder > 60 ? 'text-red-600' : 'text-green-600'}>
                              {provider.daysSinceLastOrder} días
                            </span>
                          ) : (
                            <span className="text-gray-500">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{provider.categoryCount} categorías</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}