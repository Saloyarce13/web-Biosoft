import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { DataTable, Column } from '../../../shared/components/DataTable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Calendar } from '../../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { usePersistedState, STORAGE_KEYS, validators, validateFields, generateId, getCurrentDate } from '../../../shared/utils/storage';
import { isItemInactive, getInactiveItemClassName } from '../../../shared/utils/inactiveStateValidation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getProviders, createProvider, updateProvider, deleteProvider } from '../../../lib/api';
import { useDocumentTypesProvider } from '../../../shared/contexts/SystemConfigContext';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Building2,
  Globe,
  MapPin,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart3,
  Download,
  Eye,
  Star,
  Users,
  CreditCard,
  Package,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

// Definición de tipos
interface Provider {
  id: string;
  name: string;
  businessName: string;
  documentType: 'CC' | 'NIT' | 'CE';
  taxId: string;
  email: string;
  phone: string;
  address: string;
  type: 'Nacional' | 'Internacional' | 'Local' | 'Estratégico' | 'Ocasional';
  status: 'Activo' | 'Inactivo';
  categories: string[];
  isActive: boolean;
  rating: number;
  contractDate: string;
  lastOrder: string;
  totalOrders: number;
  totalAmount: number;
  contactPerson: string;
  website?: string;
  notes?: string;
}

// Producto comprado de ejemplo
interface PurchasedProduct {
  id: string;
  name: string;
  quantity: number;
  lastPurchaseDate: string;
}

// Tipos de proveedores
const PROVIDER_TYPES = [
  { value: 'Nacional', label: 'Nacional', color: 'bg-blue-100 text-blue-800' },
  { value: 'Internacional', label: 'Internacional', color: 'bg-purple-100 text-purple-800' },
  { value: 'Local', label: 'Local', color: 'bg-green-100 text-green-800' },
  { value: 'Estratégico', label: 'Estratégico', color: 'bg-red-100 text-red-800' },
  { value: 'Ocasional', label: 'Ocasional', color: 'bg-gray-100 text-gray-800' }
];

// Estados de proveedores
const PROVIDER_STATUS = [
  { value: 'Activo',   label: 'Activo',   color: 'bg-green-100 text-green-800' },
  { value: 'Inactivo', label: 'Inactivo', color: 'bg-gray-100 text-gray-800'  },
];

// Tipos de documento — se cargan desde la BD vía SystemConfigContext
// (ver useDocumentTypesProvider en el componente)

// Categorías de productos
const PRODUCT_CATEGORIES = [
  'Tés e Infusiones',
  'Aceites Esenciales', 
  'Hierbas Medicinales',
  'Suplementos',
  'Cosméticos Naturales',
  'Alimentos Orgánicos',
  'Aromerapia',
  'Medicina Alternativa'
];

// Productos comprados de ejemplo por proveedor
const SAMPLE_PURCHASES: Record<string, PurchasedProduct[]> = {
  '1': [
    { id: 'p1', name: 'Manzanilla Orgánica 50g', quantity: 150, lastPurchaseDate: '2024-01-18' },
    { id: 'p2', name: 'Té Verde Premium 100g', quantity: 200, lastPurchaseDate: '2024-01-15' },
    { id: 'p3', name: 'Hierbabuena Seca 30g', quantity: 80, lastPurchaseDate: '2024-01-10' },
    { id: 'p4', name: 'Lavanda Deshidratada 25g', quantity: 120, lastPurchaseDate: '2024-01-05' }
  ],
  '2': [
    { id: 'p5', name: 'Aceite Esencial de Lavanda 10ml', quantity: 50, lastPurchaseDate: '2024-01-15' },
    { id: 'p6', name: 'Aceite de Eucalipto 15ml', quantity: 75, lastPurchaseDate: '2024-01-12' },
    { id: 'p7', name: 'Aceite de Menta 10ml', quantity: 60, lastPurchaseDate: '2024-01-08' }
  ],
  '3': [
    { id: 'p8', name: 'Quinoa Orgánica 500g', quantity: 300, lastPurchaseDate: '2024-01-19' },
    { id: 'p9', name: 'Avena Integral 1kg', quantity: 250, lastPurchaseDate: '2024-01-16' },
    { id: 'p10', name: 'Almendras Naturales 250g', quantity: 180, lastPurchaseDate: '2024-01-14' },
    { id: 'p11', name: 'Miel de Abeja Orgánica 350g', quantity: 100, lastPurchaseDate: '2024-01-11' }
  ],
  '4': [
    { id: 'p12', name: 'Vitamina C 1000mg x 60 caps', quantity: 200, lastPurchaseDate: '2024-01-20' },
    { id: 'p13', name: 'Omega 3 x 90 softgels', quantity: 150, lastPurchaseDate: '2024-01-18' },
    { id: 'p14', name: 'Crema Facial Natural 50ml', quantity: 80, lastPurchaseDate: '2024-01-17' },
    { id: 'p15', name: 'Colágeno Hidrolizado 300g', quantity: 120, lastPurchaseDate: '2024-01-15' }
  ],
  '5': [
    { id: 'p16', name: 'Árnica Montana Extracto 30ml', quantity: 40, lastPurchaseDate: '2023-12-05' }
  ],
  '6': []
};

// Proveedores de ejemplo
const SAMPLE_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Hierbas Naturales S.A.',
    businessName: 'Hierbas Naturales Sociedad Anónima',
    documentType: 'NIT',
    taxId: 'HN-20123456789',
    email: 'contacto@hierbasnaturales.com',
    phone: '+1 (555) 100-1001',
    address: 'Av. Botanical 456, Ciudad Jardín, País Verde',
    type: 'Nacional',
    status: 'Activo',
    categories: ['Hierbas Medicinales', 'Tés e Infusiones'],
    isActive: true,
    rating: 4.8,
    contractDate: '2023-03-15',
    lastOrder: '2024-01-18',
    totalOrders: 45,
    totalAmount: 125000,
    contactPerson: 'María Fernández',
    website: 'https://hierbasnaturales.com',
    notes: 'Proveedor principal de hierbas medicinales. Excelente calidad y puntualidad.'
  },
  {
    id: '2',
    name: 'Essential Oils International',
    businessName: 'Essential Oils International Ltd.',
    documentType: 'CE',
    taxId: 'EOI-98765432100',
    email: 'sales@essentialoils.int',
    phone: '+44 20 1234 5678',
    address: '123 Lavender Street, London, Reino Unido',
    type: 'Internacional',
    status: 'Activo',
    categories: ['Aceites Esenciales', 'Aromerapia'],
    isActive: true,
    rating: 4.6,
    contractDate: '2023-06-10',
    lastOrder: '2024-01-15',
    totalOrders: 28,
    totalAmount: 89500,
    contactPerson: 'James Wilson',
    website: 'https://essentialoils.int',
    notes: 'Aceites de alta pureza. Importación directa desde Europa.'
  },
  {
    id: '3',
    name: 'Orgánicos del Valle',
    businessName: 'Cooperativa Orgánicos del Valle',
    documentType: 'CE',
    taxId: 'OV-55512345678',
    email: 'ventas@organicosvalle.com',
    phone: '+1 (555) 200-2002',
    address: 'Carretera Rural 25, Valle Verde',
    type: 'Local',
    status: 'Activo',
    categories: ['Alimentos Orgánicos', 'Suplementos'],
    isActive: true,
    rating: 4.9,
    contractDate: '2023-01-20',
    lastOrder: '2024-01-19',
    totalOrders: 67,
    totalAmount: 156000,
    contactPerson: 'Carlos Vega',
    website: 'https://organicosvalle.com',
    notes: 'Cooperativa local con productos certificados orgánicos.'
  },
  {
    id: '4',
    name: 'Natural Life Corp',
    businessName: 'Natural Life Corporation',
    documentType: 'NIT',
    taxId: 'NLC-33344455566',
    email: 'strategic@naturallife.com',
    phone: '+1 (555) 300-3003',
    address: '789 Wellness Blvd, Salud City',
    type: 'Estratégico',
    status: 'Activo',
    categories: ['Suplementos', 'Medicina Alternativa', 'Cosméticos Naturales'],
    isActive: true,
    rating: 4.7,
    contractDate: '2022-11-08',
    lastOrder: '2024-01-20',
    totalOrders: 89,
    totalAmount: 245000,
    contactPerson: 'Ana Ruiz',
    website: 'https://naturallife.com',
    notes: 'Socio estratégico con amplio catálogo y descuentos por volumen.'
  },
  {
    id: '5',
    name: 'Botánica Especializada',
    businessName: 'Botánica Especializada LTDA',
    documentType: 'NIT',
    taxId: 'BE-77788899900',
    email: 'info@botanicaesp.com',
    phone: '+1 (555) 400-4004',
    address: 'Calle de las Plantas 159, Botanical District',
    type: 'Ocasional',
    status: 'Inactivo',
    categories: ['Hierbas Medicinales'],
    isActive: false,
    rating: 4.2,
    contractDate: '2023-08-12',
    lastOrder: '2023-12-05',
    totalOrders: 12,
    totalAmount: 18500,
    contactPerson: 'Roberto Herrera',
    notes: 'Proveedor ocasional para productos especializados.'
  },
  {
    id: '6',
    name: 'Cosméticos Verdes',
    businessName: 'Cosméticos Verdes y Naturales S.L.',
    documentType: 'NIT',
    taxId: 'CVN-11122233344',
    email: 'comercial@cosmeticosverdes.com',
    phone: '+1 (555) 500-5005',
    address: 'Plaza Natural 88, Green Town',
    type: 'Nacional',
    status: 'Inactivo',
    categories: ['Cosméticos Naturales'],
    isActive: false,
    rating: 0,
    contractDate: '2024-01-10',
    lastOrder: 'Nunca',
    totalOrders: 0,
    totalAmount: 0,
    contactPerson: 'Laura Morales',
    website: 'https://cosmeticosverdes.com',
    notes: 'Proveedor en proceso de evaluación para línea de cosméticos.'
  }
];

const ITEMS_PER_PAGE = 5;

export function ProviderManagement() {
  const DOCUMENT_TYPES = useDocumentTypesProvider();
  // Estado para proveedores desde API
  const [apiProviders, setApiProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mapear respuesta de la API al tipo Provider del frontend
  const mapApiProvider = (p: any): Provider => ({
    id: String(p.id),
    name: p.name || '',
    businessName: p.businessName || p.name || '',
    documentType: (p.documentType as Provider['documentType']) || 'NIT',
    taxId: p.documentNumber || p.taxId || '',
    email: p.email || '',
    phone: p.phone || '',
    address: p.address || '',
    type: (p.type as Provider['type']) || 'Local',
    status: p.isActive ? 'Activo' : 'Inactivo',
    categories: Array.isArray(p.categories) ? p.categories : [],
    isActive: p.isActive ?? true,
    rating: p.rating || 0,
    contractDate: p.contractDate || p.createdAt?.split('T')[0] || '',
    lastOrder: p.lastOrder || '',
    totalOrders: p.totalOrders || 0,
    totalAmount: p.totalAmount || 0,
    contactPerson: p.contactPerson || '',
    website: p.website || '',
    notes: p.notes || '',
  });

  // Cargar proveedores desde API
  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await getProviders(true); // traer todos incluyendo inactivos
      if (response.success) {
        setApiProviders(response.data.map(mapApiProvider));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  // Siempre usar apiProviders como fuente de verdad
  const providers = apiProviders;
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'detail' | 'reports'>('list');
  const [activeTab, setActiveTab] = useState('general');

  // Productos del proveedor seleccionado
  const [providerProducts, setProviderProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const loadProviderProducts = async (providerId: string) => {
    try {
      setLoadingProducts(true);
      const { apiFetch } = await import('../../../lib/api');
      const res = await apiFetch<any>(`/providers/${providerId}`);
      if (res.success) setProviderProducts(res.data.products || []);
    } catch { setProviderProducts([]); }
    finally { setLoadingProducts(false); }
  };

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    documentType: 'CC' as Provider['documentType'],
    taxId: '',
    email: '',
    phone: '',
    address: '',
    type: 'Local' as Provider['type'],
    status: 'Evaluación' as Provider['status'],
    categories: [] as string[],
    isActive: true,
    contactPerson: '',
    website: '',
    notes: ''
  });

  // Estados para reportes
  const [reportType, setReportType] = useState('by-category');
  const [reportStartDate, setReportStartDate] = useState<Date | undefined>(new Date());
  const [reportEndDate, setReportEndDate] = useState<Date | undefined>(new Date());

  // Filtrar proveedores
  const filteredProviders = providers.filter(provider => {
    const matchesType = typeFilter === 'all' || provider.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || provider.categories.includes(categoryFilter);
    
    return matchesType && matchesStatus && matchesCategory;
  });

  const dataForTable = filteredProviders;

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      name: '',
      businessName: '',
      documentType: 'NIT',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      type: 'Local',
      status: 'Inactivo',
      categories: [],
      isActive: true,
      contactPerson: '',
      website: '',
      notes: ''
    });
    setSelectedProvider(null);
  };

  // Crear proveedor
  const handleCreateProvider = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre del proveedor es obligatorio'); return;
    }
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio'); return;
    }
    if (!formData.taxId.trim()) {
      toast.error('El número de documento es obligatorio'); return;
    }
    const docMaxLen = formData.documentType === 'NIT' ? 10 : 15;
    if (formData.taxId.length < 10 || formData.taxId.length > docMaxLen) {
      toast.error(`El número de documento debe tener entre 10 y ${docMaxLen} dígitos`); return;
    }
    if (!formData.phone.trim()) {
      toast.error('El número de contacto es obligatorio'); return;
    }
    if (formData.phone.length < 10 || formData.phone.length > 12) {
      toast.error('El número de contacto debe tener entre 10 y 12 dígitos'); return;
    }

    try {
      const response = await createProvider({
        name: formData.name,
        businessName: formData.businessName || undefined,
        documentType: formData.documentType || undefined,
        documentNumber: formData.taxId || undefined,
        contactPerson: formData.contactPerson || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        website: formData.website || undefined,
        notes: formData.notes?.startsWith('DV:') ? formData.notes : (formData.notes || undefined),
      });

      if (response.success) {
        await loadProviders();
        setCurrentView('list');
        clearForm();
        toast.success(`Proveedor "${response.data.name}" creado exitosamente`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear proveedor');
    }
  };

  // Actualizar proveedor
  const handleUpdateProvider = async () => {
    if (!selectedProvider || !formData.name.trim()) {
      toast.error('El nombre del proveedor es obligatorio'); return;
    }
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio'); return;
    }
    if (!formData.taxId.trim()) {
      toast.error('El número de documento es obligatorio'); return;
    }
    const docMaxLen = formData.documentType === 'NIT' ? 10 : 15;
    if (formData.taxId.length < 10 || formData.taxId.length > docMaxLen) {
      toast.error(`El número de documento debe tener entre 10 y ${docMaxLen} dígitos`); return;
    }
    if (!formData.phone.trim()) {
      toast.error('El número de contacto es obligatorio'); return;
    }
    if (formData.phone.length < 10 || formData.phone.length > 12) {
      toast.error('El número de contacto debe tener entre 10 y 12 dígitos'); return;
    }

    try {
      const response = await updateProvider(selectedProvider.id, {
        name: formData.name,
        businessName: formData.businessName || undefined,
        documentType: formData.documentType || undefined,
        documentNumber: formData.taxId || undefined,
        contactPerson: formData.contactPerson || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        website: formData.website || undefined,
        notes: formData.notes || undefined,
        isActive: formData.isActive,
      });

      if (response.success) {
        await loadProviders();
        setCurrentView('list');
        clearForm();
        toast.success(`Proveedor "${response.data.name}" actualizado exitosamente`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar proveedor');
    }
  };

  // Cambiar estado del proveedor
  const handleToggleProviderStatus = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    try {
      const { apiFetch } = await import('../../../lib/api');
      const response = await apiFetch<any>(`/providers/${providerId}/status`, { method: 'PATCH' });
      if (response.success) {
        await loadProviders();
        toast.success(response.message);
      }
    } catch (error) {
      toast.error('Error al cambiar el estado del proveedor');
    }
  };

  // Eliminar proveedor
  const handleDeleteProvider = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);

    try {
      const response = await deleteProvider(providerId);
      if (response.success) {
        await loadProviders();
        toast.success(`Proveedor "${provider?.name}" eliminado exitosamente`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar proveedor');
    }
  };

  // Abrir modal de edición
  const openEditModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name,
      businessName: provider.businessName,
      documentType: provider.documentType,
      taxId: provider.taxId,
      email: provider.email,
      phone: provider.phone,
      address: provider.address,
      type: provider.type,
      status: provider.status,
      categories: provider.categories,
      isActive: provider.isActive,
      contactPerson: provider.contactPerson,
      website: provider.website || '',
      notes: provider.notes || ''
    });
    setCurrentView('edit');
  };

  // Obtener color del tipo
  const getTypeColor = (type: string) => {
    const typeData = PROVIDER_TYPES.find(t => t.value === type);
    return typeData?.color || 'bg-gray-100 text-gray-800';
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    const statusData = PROVIDER_STATUS.find(s => s.value === status);
    return statusData?.color || 'bg-gray-100 text-gray-800';
  };

  // Generar reporte
  const handleGenerateReport = () => {
    toast.success(`Reporte ${reportType} generado exitosamente`);
    // Aquí se implementaría la lógica real de generación de reportes
  };

  // Toggle categoría en formulario
  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // Vista de detalle del proveedor
  if (currentView === 'detail' && selectedProvider) {
    const purchasedProducts = providerProducts;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => {
            setCurrentView('list');
            setSelectedProvider(null);
          }}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al Listado
          </Button>
          <div>
            <h2>Detalle del Proveedor</h2>
            <p className="text-muted-foreground">Información completa del proveedor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información principal */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedProvider.name}
              </CardTitle>
              <CardDescription>{selectedProvider.businessName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo de Documento</Label>
                  <p className="font-medium">{selectedProvider.documentType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {selectedProvider.documentType === 'NIT' ? 'NIT' : 'Número de Documento'}
                  </Label>
                  <p className="font-medium">{selectedProvider.taxId}</p>
                </div>

                {/* Dígito de verificación — solo NIT */}
                {selectedProvider.documentType === 'NIT' && selectedProvider.notes?.startsWith('DV:') && (
                  <div>
                    <Label className="text-muted-foreground">Dígito de verificación</Label>
                    <p className="font-medium">{selectedProvider.notes.slice(3)}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">
                    {selectedProvider.documentType === 'NIT' ? 'Email corporativo' : 'Email'}
                  </Label>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedProvider.email}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {selectedProvider.documentType === 'NIT' ? 'Teléfono empresa' : 'Celular'}
                  </Label>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {selectedProvider.phone}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">
                    {selectedProvider.documentType === 'NIT' ? 'Dirección sede principal' : 'Dirección'}
                  </Label>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedProvider.address}
                  </p>
                </div>
                {selectedProvider.website && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Sitio Web</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <a href={selectedProvider.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedProvider.website}
                      </a>
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <Badge className={getTypeColor(selectedProvider.type)}>
                    {selectedProvider.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge variant={selectedProvider.isActive ? 'default' : 'secondary'}>
                    {selectedProvider.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              {/* Sección representante — solo NIT */}
              {selectedProvider.documentType === 'NIT' && selectedProvider.contactPerson && (
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Datos del representante legal</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre del representante</p>
                      <p className="font-medium">{selectedProvider.contactPerson}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Persona de contacto — para no NIT */}
              {selectedProvider.documentType !== 'NIT' && selectedProvider.contactPerson && (
                <div>
                  <Label className="text-muted-foreground">Persona de Contacto</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedProvider.contactPerson}
                  </p>
                </div>
              )}

              {selectedProvider.categories.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Categorías de Productos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProvider.categories.map((category, index) => (
                      <Badge key={index} variant="outline">{category}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedProvider.notes && (
                <div>
                  <Label className="text-muted-foreground">Notas y Observaciones</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedProvider.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Fecha de Contrato</Label>
                <p className="font-medium">{selectedProvider.contractDate}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Última Orden</Label>
                <p className="font-medium">{selectedProvider.lastOrder}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total de Órdenes</Label>
                <p className="font-medium">{selectedProvider.totalOrders}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Monto Total</Label>
                <p className="font-medium">${selectedProvider.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valoración</Label>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-medium">{selectedProvider.rating}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Productos del proveedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos de este Proveedor
            </CardTitle>
            <CardDescription>
              Productos del catálogo asignados a este proveedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                <span className="text-sm">Cargando productos...</span>
              </div>
            ) : purchasedProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasedProducts.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.image && (
                            <img src={product.image} alt={product.name}
                              className="w-8 h-8 rounded object-cover shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            {product.sku && <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{product.category?.name || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className="text-xs">
                          {product.stock} uds
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        ${Number(product.price).toLocaleString('es-CO')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Este proveedor no tiene productos asignados aún</p>
                <p className="text-xs mt-1">Asigna este proveedor al crear o editar un producto</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de reportes
  if (currentView === 'reports') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setCurrentView('list')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al Listado
          </Button>
          <div>
            <h2>Reportes de Proveedores</h2>
            <p className="text-muted-foreground">Genere reportes detallados sobre proveedores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Generar Reportes</CardTitle>
              <CardDescription>Seleccione el tipo de reporte y filtros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Reporte</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="by-category">Por Categoría de Producto</SelectItem>
                    <SelectItem value="by-status">Por Estado del Proveedor</SelectItem>
                    <SelectItem value="by-type">Por Tipo de Proveedor</SelectItem>
                    <SelectItem value="by-date">Por Rango de Fechas</SelectItem>
                    <SelectItem value="performance">Rendimiento de Proveedores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {reportStartDate ? format(reportStartDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={reportStartDate}
                        onSelect={setReportStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Fecha Fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {reportEndDate ? format(reportEndDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={reportEndDate}
                        onSelect={setReportEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button onClick={handleGenerateReport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Generar y Descargar Reporte
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vista Previa del Reporte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-semibold text-primary">{providers.length}</div>
                    <div className="text-sm text-muted-foreground">Total Proveedores</div>
                  </div>
                  <div className="text-center p-4 bg-green-100 rounded-lg">
                    <div className="text-2xl font-semibold text-green-700">
                      {providers.filter(p => p.status === 'Activo').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Activos</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Distribución por Tipo</h4>
                  <div className="space-y-2">
                    {PROVIDER_TYPES.map(type => {
                      const count = providers.filter(p => p.type === type.value).length;
                      return (
                        <div key={type.value} className="flex justify-between">
                          <Badge className={type.color}>{type.label}</Badge>
                          <span className="text-sm">{count} proveedores</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Vista de creación/edición
  if (currentView === 'create' || currentView === 'edit') {
    const isEdit = currentView === 'edit';
    const docMaxLen = formData.documentType === 'NIT' ? 10 : 15;
    const docLabel = formData.documentType === 'NIT' ? 'NIT (10 dígitos)' : formData.documentType === 'CE' ? 'Nº Cédula Extranjería (10-15 dígitos)' : 'Nº Cédula de Ciudadanía (10-15 dígitos)';
    const docPlaceholder = formData.documentType === 'NIT' ? 'Ej: 9001234567' : 'Ej: 1234567890';
    const cancel = () => setCurrentView('list');

    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="w-full max-w-sm mb-2">
          <Button variant="ghost" size="sm" onClick={cancel} className="text-muted-foreground -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />Volver al listado
          </Button>
        </div>
        <div className="w-full max-w-sm border rounded-xl shadow-sm bg-card overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</p>
              <p className="text-xs text-muted-foreground">
                {isEdit ? selectedProvider?.name : 'Los campos con * son obligatorios'}
              </p>
            </div>
          </div>

          {/* Campos */}
          <div className="px-4 py-4 space-y-3">

            {/* Tipo doc + Nº doc — PRIMERO */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="documentType" className="text-xs font-medium">Tipo doc. <span className="text-destructive">*</span></Label>
                <Select value={formData.documentType} onValueChange={(v: Provider['documentType']) => setFormData(prev => ({ ...prev, documentType: v, taxId: '' }))}>
                  <SelectTrigger id="documentType" className="h-9 text-sm shadow-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{DOCUMENT_TYPES.map(d => <SelectItem key={d.value} value={d.value} className="text-sm"><div className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" />{d.label}</div></SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="taxId" className="text-xs font-medium">
                  {formData.documentType === 'NIT' ? 'NIT (sin dígito)' : docLabel} <span className="text-destructive">*</span>
                </Label>
                <Input id="taxId" value={formData.taxId} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, docMaxLen); setFormData(prev => ({ ...prev, taxId: val })); }} placeholder={docPlaceholder} className="h-9 text-sm shadow-sm" maxLength={docMaxLen} inputMode="numeric" />
              </div>
            </div>

            {/* Dígito de verificación — solo NIT */}
            {formData.documentType === 'NIT' && (
              <div className="space-y-1">
                <Label htmlFor="digitoNIT" className="text-xs font-medium">Dígito de verificación <span className="text-destructive">*</span></Label>
                <Input id="digitoNIT"
                  value={formData.notes?.startsWith('DV:') ? formData.notes.slice(3) : ''}
                  onChange={e => { const dv = e.target.value.replace(/\D/g, '').slice(0, 1); setFormData(prev => ({ ...prev, notes: dv ? `DV:${dv}` : '' })); }}
                  placeholder="0-9" maxLength={1} className="h-9 text-sm shadow-sm w-24" inputMode="numeric" />
                <p className="text-xs text-muted-foreground">Número del 0 al 9 que valida el NIT</p>
              </div>
            )}

            {/* Nombre — cambia según tipo */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-medium">
                {formData.documentType === 'NIT' ? 'Razón Social' : 'Nombre del Proveedor'} <span className="text-destructive">*</span>
              </Label>
              <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={formData.documentType === 'NIT' ? 'Ej: Empresa S.A.S.' : 'Ej: Hierbas Naturales S.A.'} className="h-9 text-sm shadow-sm" />
            </div>

            {/* Nombre comercial */}
            <div className="space-y-1">
              <Label htmlFor="businessName" className="text-xs font-medium">
                {formData.documentType === 'NIT' ? 'Nombre comercial / marca' : 'Nombre Comercial'}
              </Label>
              <Input id="businessName" value={formData.businessName} onChange={e => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder={formData.documentType === 'NIT' ? 'Nombre con el que opera comercialmente' : 'Nombre oficial de la empresa'} className="h-9 text-sm shadow-sm" />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium">
                {formData.documentType === 'NIT' ? 'Email corporativo' : 'Email'} <span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={formData.documentType === 'NIT' ? 'empresa@correo.com' : 'contacto@proveedor.com'} className="h-9 text-sm shadow-sm" />
            </div>

            {/* Teléfono */}
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-medium">
                {formData.documentType === 'NIT' ? 'Teléfono empresa' : 'Número de Contacto'} <span className="text-destructive">*</span>
              </Label>
              <Input id="phone" value={formData.phone} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 12); setFormData(prev => ({ ...prev, phone: val })); }} placeholder="Ej: 3001234567" className="h-9 text-sm shadow-sm" maxLength={12} inputMode="numeric" />
              <p className="text-xs text-muted-foreground">Solo números · mín. 10, máx. 12 dígitos</p>
            </div>

            {/* Dirección */}
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-medium">
                {formData.documentType === 'NIT' ? 'Dirección sede principal' : 'Dirección'}
              </Label>
              <Input id="address" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder={formData.documentType === 'NIT' ? 'Calle 100 # 15-20, Bogotá' : 'Dirección completa del proveedor'} className="h-9 text-sm shadow-sm" />
            </div>

            {/* Sitio web */}
            <div className="space-y-1">
              <Label htmlFor="website" className="text-xs font-medium">Sitio Web</Label>
              <Input id="website" value={formData.website} onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))} placeholder="https://proveedor.com" className="h-9 text-sm shadow-sm" />
            </div>

            {/* Tipo */}
            <div className="space-y-1">
              <Label htmlFor="type" className="text-xs font-medium">Tipo <span className="text-destructive">*</span></Label>
              <Select value={formData.type} onValueChange={(v: Provider['type']) => setFormData(prev => ({ ...prev, type: v }))}>
                <SelectTrigger id="type" className="h-9 text-sm shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{PROVIDER_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Persona de contacto — cambia según tipo */}
            <div className="space-y-1">
              <Label htmlFor="contactPerson" className="text-xs font-medium">
                {formData.documentType === 'NIT' ? 'Nombre del representante legal' : 'Persona de Contacto'}
              </Label>
              <Input id="contactPerson" value={formData.contactPerson}
                onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder={formData.documentType === 'NIT' ? 'Nombre del representante legal' : 'Nombre del contacto principal'}
                className="h-9 text-sm shadow-sm" />
            </div>

            {/* Estado activo */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 shadow-sm">
              <div><p className="text-xs font-medium">Activo</p><p className="text-xs text-muted-foreground">{formData.isActive ? 'Proveedor activo' : 'Proveedor inactivo'}</p></div>
              <Switch checked={formData.isActive} onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))} />
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-1">
              <Button onClick={isEdit ? handleUpdateProvider : handleCreateProvider} className="flex-1 h-9 text-sm">
                {isEdit ? <><Edit className="h-3.5 w-3.5 mr-1.5" />Actualizar</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Guardar</>}
              </Button>
              <Button variant="outline" onClick={cancel} className="flex-1 h-9 text-sm">Cancelar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal - listado de proveedores
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando proveedores...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar proveedores</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => { setError(null); loadProviders(); }}>
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Gestión de Proveedores
          </h2>
          
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={loadProviders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setCurrentView('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
          <Button variant="outline" onClick={() => setCurrentView('reports')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Reportes
          </Button>
        </div>
      </div>

      <DataTable
        title="Lista de Proveedores"
        description={`Mostrando ${filteredProviders.length} proveedores`}
        data={dataForTable}
        columns={[
          {
            header: 'Proveedor',
            accessor: (provider: Provider) => (
              <div>
                <div className="font-medium">{provider.name}</div>
                <div className="text-sm text-muted-foreground">{provider.businessName}</div>
                <div className="text-xs text-muted-foreground">
                  {provider.documentType}: {provider.taxId}
                </div>
              </div>
            )
          },
          {
            header: 'Contacto',
            accessor: (provider: Provider) => (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-3 w-3" />
                  {provider.contactPerson}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {provider.email}
                </div>
                {provider.phone && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {provider.phone}
                  </div>
                )}
              </div>
            )
          },
          {
            header: 'Estado',
            accessor: (provider: Provider) => (
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(provider.status)}>
                  {provider.status}
                </Badge>
                <Switch
                  checked={provider.isActive}
                  onCheckedChange={() => handleToggleProviderStatus(provider.id)}
                />
              </div>
            )
          }
        ]}
        searchableKeys={['name', 'businessName', 'contactPerson']}
        searchPlaceholder="Buscar por nombre, razón social o contacto..."
        itemsPerPage={ITEMS_PER_PAGE}
        isLoading={loading}
        customActions={(provider: Provider) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProvider(provider);
                setProviderProducts([]);
                loadProviderProducts(provider.id);
                setCurrentView('detail');
              }}
              title="Ver detalle"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(provider)}
              disabled={!provider.isActive}
              title={provider.isActive ? 'Editar proveedor' : 'Proveedor inactivo'}
              className={!provider.isActive ? 'opacity-30 cursor-not-allowed' : ''}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!provider.isActive}
                  className={`text-destructive hover:text-destructive ${!provider.isActive ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title={provider.isActive ? 'Eliminar proveedor' : 'Proveedor inactivo'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente
                    el proveedor "{provider.name}" y todos sus datos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        extraFilters={
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {PROVIDER_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {PROVIDER_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {PRODUCT_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}