import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Textarea } from '../../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { DataTable, Column } from '../../../shared/components/DataTable';
import { toast } from 'sonner';
import { usePersistedState, STORAGE_KEYS, generateId, getCurrentDate, formatCOP } from '../../../shared/utils/storage';
import { isItemInactive, getInactiveItemClassName, getInactiveItemDisabledMessage, getStatusBadgeVariant, filterActiveItems } from '../../../shared/utils/inactiveStateValidation';
import { getProducts, createProduct, updateProduct, updateProductStock, deleteProduct, getCategories, getProviders, uploadProductImage } from '../../../lib/api';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Upload,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Download,
  Star,
  TrendingUp,
  Image as ImageIcon,
  Building2,
  FileText,
  Printer,
  Calendar,
  Camera,
  ShoppingCart,
  Power
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: number;
  providerId?: number;
  providerName?: string;
  stock: number;
  status: 'Activo' | 'Inactivo' | 'Descontinuado';
  image?: string;
  technicalSheet?: string;
  supplier: string;
  sku: string;
  minStock: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
  totalSales: number;
  lastSaleDate: string | null;
  cost: number;
  margin: number;
  weight?: number;
  barcode?: string;
}

// Datos de referencia
const CATEGORIES = [
  'Tés e Infusiones',
  'Aceites Esenciales',
  'Hierbas Medicinales',
  'Suplementos',
  'Cosméticos Naturales',
  'Alimentos Orgánicos',
  'Aromerapia',
  'Medicina Alternativa'
];

const SUPPLIERS = [
  'Hierbas Naturales S.A.',
  'Essential Oils International',
  'Orgánicos del Valle',
  'Natural Life Corp',
  'Botánica Especializada',
  'Cosméticos Verdes',
  'Herbal Consultores',
  'Extractos Premium'
];

const PRODUCT_STATUS = [
  { value: 'Activo', label: 'Activo', color: 'bg-green-100 text-green-800' },
  { value: 'Inactivo', label: 'Inactivo', color: 'bg-gray-100 text-gray-800' },
  { value: 'Descontinuado', label: 'Descontinuado', color: 'bg-red-100 text-red-800' }
];

const ITEMS_PER_PAGE = 5;

// Mapeo de producto API → frontend
const mapProducts = (data: any[]): Product[] =>
  data.map((p: any) => {
    // Obtener todos los proveedores (de la relación muchos a muchos o del campo simple)
    const allProviders: { id: number; name: string }[] = p.providers?.map((pp: any) => pp.provider).filter(Boolean) || [];
    if (allProviders.length === 0 && p.provider) allProviders.push(p.provider);
    const providerNames = allProviders.map(pr => pr.name).join(', ');

    return {
      id: String(p.id),
      name: p.name,
      description: p.description || '',
      price: Number(p.price),
      category: p.category?.name || '',
      categoryId: p.category?.id || p.categoryId,
      providerId: p.provider?.id || p.providerId || undefined,
      providerName: providerNames || '',
      providerNames: allProviders.map(pr => pr.name),
      stock: p.stock || 0,
      minStock: p.minStock || 0,
      status: (p.isActive ? 'Activo' : 'Inactivo') as Product['status'],
      image: p.image || '',
      technicalSheet: '',
      supplier: providerNames || '',
      sku: p.sku || '',
      isActive: p.isActive,
      createdDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
      updatedDate: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : '',
      totalSales: 0,
      lastSaleDate: null,
      cost: Number(p.cost) || 0,
      margin: 0,
      weight: Number(p.weight) || undefined,
      barcode: p.barcode || '',
    };
  });

interface ProductManagementProps {
  products?: Product[];
  onAddProduct?: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
}

export function ProductManagement({
  products: externalProducts,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: ProductManagementProps = {}) {
  // Estado para productos desde API
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal proveedores
  const [providersModal, setProvidersModal] = useState<{ open: boolean; productName: string; names: string[] }>({ open: false, productName: '', names: [] });

  // Cargar productos, categorías y proveedores desde API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsResponse, categoriesResponse, providersResponse] = await Promise.all([
          getProducts(true),
          getCategories(true),
          getProviders(true),
        ]);

        if (productsResponse.success) {
          setApiProducts(mapProducts(productsResponse.data));
        }
        if (categoriesResponse.success) setCategories(categoriesResponse.data);
        if (providersResponse.success) setProviders(providersResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        toast.error('Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Siempre usar apiProducts como fuente de verdad
  const useExternalProducts = false;
  const products = apiProducts;

  // Cargar categorías del localStorage como respaldo
  const [categoriesFromStorage] = usePersistedState<any[]>(STORAGE_KEYS.CATEGORIES, []);
  const availableCategories = categories.length > 0
    ? categories.filter((cat: any) => cat.isActive).map((cat: any) => cat.name)
    : categoriesFromStorage.length > 0
    ? categoriesFromStorage.filter((cat: any) => cat.isActive).map((cat: any) => cat.name)
    : CATEGORIES;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'sales' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'detail' | 'reports'>('list');

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, supplierFilter]);

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    providerId: '',
    providerIds: [] as string[], // múltiples proveedores
    stock: '',
    minStock: '',
    supplier: '',
    sku: '',
    status: 'Activo' as Product['status'],
    isActive: true,
    cost: '',
    weight: '',
    barcode: ''
  });

  // Estado para imágenes
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [technicalSheetFile, setTechnicalSheetFile] = useState<File | null>(null);
  const [technicalSheetPreview, setTechnicalSheetPreview] = useState<string>('');

  // Filtrar y ordenar productos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesSupplier = supplierFilter === 'all' || product.supplier === supplierFilter;
      
      return matchesCategory && matchesStatus && matchesSupplier;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'sales':
          aValue = a.totalSales;
          bValue = b.totalSales;
          break;
        case 'created':
          aValue = new Date(a.createdDate);
          bValue = new Date(b.createdDate);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, categoryFilter, statusFilter, supplierFilter, sortBy, sortOrder]);



  // Obtener color del estado
  const getStatusColor = (status: string) => {
    const statusData = PRODUCT_STATUS.find(s => s.value === status);
    return statusData?.color || 'bg-gray-100 text-gray-800';
  };

  // Badge de stock
  const getStockBadge = (stock: number, minStock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Agotado
      </Badge>;
    } else if (stock <= minStock) {
      return <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Stock Crítico
      </Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        En Stock
      </Badge>;
    }
  };

  // Manejar imagen principal — sube a Cloudinary
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      e.target.value = '';
      return;
    }
    // Preview local inmediato
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setImageFile(file);

    // Subir a Cloudinary
    try {
      setUploadingImage(true);
      const url = await uploadProductImage(file);
      setImagePreview(url); // reemplaza el base64 con la URL real
      toast.success('Imagen subida correctamente');
    } catch {
      toast.error('Error al subir la imagen a Cloudinary');
      setImagePreview('');
      setImageFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Manejar ficha técnica
  const handleTechnicalSheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTechnicalSheetFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setTechnicalSheetPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      providerId: '',
      providerIds: [],
      stock: '',
      minStock: '',
      supplier: '',
      sku: '',
      status: 'Activo',
      isActive: true,
      cost: '',
      weight: '',
      barcode: ''
    });
    setImageFile(null);
    setImagePreview('');
    setTechnicalSheetFile(null);
    setTechnicalSheetPreview('');
  };

  // Generar SKU automático
  const generateSKU = () => {
    const categoryCode = formData.category.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${categoryCode}-${timestamp}`;
  };

  // Generar código de barras automático
  const generateBarcode = () => {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  };

  // Crear producto
  const handleCreateProduct = async () => {
    // Validaciones simples inline
    if (!formData.name.trim()) { toast.error('El nombre del producto es obligatorio'); return; }
    if (!formData.category) { toast.error('La categoría es obligatoria'); return; }
    if (!formData.price || parseFloat(formData.price) <= 0) { toast.error('El precio de venta debe ser mayor a 0'); return; }
    if (parseFloat(formData.price) < 1000) { toast.error('El precio mínimo es $1.000 COP'); return; }
    if (formData.cost && parseFloat(formData.cost) > 0 && parseFloat(formData.price) <= parseFloat(formData.cost)) {
      toast.error('El precio de venta debe ser mayor al costo de compra'); return;
    }
    if (formData.stock && parseInt(formData.stock) < 0) { toast.error('El stock no puede ser negativo'); return; }
    if (formData.minStock && parseInt(formData.minStock) < 0) { toast.error('El stock mínimo no puede ser negativo'); return; }
    if (formData.stock && formData.minStock && parseInt(formData.minStock) > parseInt(formData.stock)) {
      toast.error('El stock mínimo no puede ser mayor al stock actual'); return;
    }

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        categoryId: Number(formData.category),
        providerId: formData.providerIds.length > 0 ? Number(formData.providerIds[0]) : undefined,
        providerIds: formData.providerIds.map(Number),
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku || generateSKU(),
        minStock: parseInt(formData.minStock) || 10,
        weight: parseFloat(formData.weight) || 0,
        barcode: formData.barcode || generateBarcode(),
        image: imagePreview || '',
        isActive: true,
      };

      const response = await createProduct(productData);

      if (response.success) {
        toast.success('Producto creado exitosamente');
        const fresh = await getProducts(true);
        if (fresh.success) setApiProducts(mapProducts(fresh.data));
        setCurrentView('list');
        clearForm();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear producto');
    }
  };

  // Editar producto
  const handleEditProduct = (product: Product & { categoryId?: any }) => {
    setSelectedProduct(product);
    const catId = product.categoryId
      ? String(product.categoryId)
      : String(categories.find((c: any) => c.name === product.category)?.id || '');
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: catId,
      providerId: product.providerId ? String(product.providerId) : '',
      providerIds: (product as any).providers?.map((pp: any) => String(pp.provider?.id || pp.providerId)) || (product.providerId ? [String(product.providerId)] : []),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      supplier: product.supplier,
      sku: product.sku,
      status: product.status,
      isActive: product.isActive,
      cost: product.cost.toString(),
      weight: product.weight?.toString() || '',
      barcode: product.barcode || ''
    });
    setImagePreview(product.image || '');
    setTechnicalSheetPreview(product.technicalSheet || '');
    setCurrentView('edit');
  };

  // Actualizar producto
  const handleUpdateProduct = async () => {
    if (!selectedProduct) {
      toast.error('No hay un producto seleccionado');
      return;
    }

    // Validaciones simples inline
    if (!formData.name.trim()) { toast.error('El nombre del producto es obligatorio'); return; }
    if (!formData.category) { toast.error('La categoría es obligatoria'); return; }
    if (!formData.price || parseFloat(formData.price) <= 0) { toast.error('El precio de venta debe ser mayor a 0'); return; }
    if (parseFloat(formData.price) < 1000) { toast.error('El precio mínimo es $1.000 COP'); return; }
    if (formData.cost && parseFloat(formData.cost) > 0 && parseFloat(formData.price) <= parseFloat(formData.cost)) {
      toast.error('El precio de venta debe ser mayor al costo de compra'); return;
    }
    if (formData.stock && parseInt(formData.stock) < 0) { toast.error('El stock no puede ser negativo'); return; }
    if (formData.minStock && parseInt(formData.minStock) < 0) { toast.error('El stock mínimo no puede ser negativo'); return; }
    if (formData.stock && formData.minStock && parseInt(formData.minStock) > parseInt(formData.stock)) {
      toast.error('El stock mínimo no puede ser mayor al stock actual'); return;
    }

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        categoryId: Number(formData.category),
        providerId: formData.providerIds.length > 0 ? Number(formData.providerIds[0]) : null,
        providerIds: formData.providerIds.map(Number),
        stock: parseInt(formData.stock) || 0,
        supplier: formData.supplier || '',
        sku: formData.sku,
        minStock: parseInt(formData.minStock) || 10,
        cost: parseFloat(formData.cost) || 0,
        weight: parseFloat(formData.weight) || 0,
        barcode: formData.barcode || '',
        image: imagePreview || '',
        isActive: formData.isActive
      };

      const response = await updateProduct(selectedProduct.id, productData);

      if (response.success) {
        toast.success('Producto actualizado exitosamente');
        const fresh = await getProducts(true);
        if (fresh.success) setApiProducts(mapProducts(fresh.data));
        setCurrentView('list');
        setSelectedProduct(null);
        clearForm();
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar producto');
    }
  };

  // Ver detalle del producto
  const handleViewProduct = (product: Product) => {
    if (isItemInactive(product)) {
      toast.error(getInactiveItemDisabledMessage());
      return;
    }
    setSelectedProduct(product);
    setCurrentView('detail');
  };

  // Cambiar estado del producto
  const handleToggleStatus = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      if (isItemInactive(product) && product.status === 'Descontinuado') {
        toast.error('No se puede cambiar el estado de un producto Descontinuado');
        return;
      }
      const newStatus = product.status === 'Activo' ? 'Inactivo' : 'Activo';
      try {
        await updateProduct(product.id, { isActive: newStatus === 'Activo' });
        setApiProducts(prev => prev.map(p => p.id === productId
          ? { ...p, status: newStatus as Product['status'], isActive: newStatus === 'Activo' }
          : p));
        toast.success(`Estado del producto cambiado a ${newStatus}`);
      } catch {
        toast.error('Error al cambiar estado del producto');
      }
    }
  };

  // Eliminar producto
  const handleDeleteProductLocal = async (productId: string) => {
    const product = products.find(p => p.id === productId);

    if (product && isItemInactive(product)) {
      toast.error(getInactiveItemDisabledMessage());
      return;
    }

    try {
      const response = await deleteProduct(productId);

      if (response.success) {
        // Eliminar directamente del estado local sin esperar a la API
        setApiProducts(prev => prev.filter(p => p.id !== productId));
        setCurrentPage(1); // resetear a página 1
        setProductToDelete(null);
        toast.success(`Producto "${product?.name}" eliminado exitosamente`);
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar producto');
    }
  };

  // Generar reporte
  const handleGenerateReport = () => {
    const reportData = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'Activo').length,
      lowStockProducts: products.filter(p => p.stock <= p.minStock).length,
      outOfStockProducts: products.filter(p => p.stock === 0).length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      categories: CATEGORIES.map(cat => ({
        name: cat,
        count: products.filter(p => p.category === cat).length
      })).filter(c => c.count > 0)
    };

    // Simular descarga de reporte
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-productos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Reporte generado y descargado exitosamente');
  };

  // Renderizar vista de creación/edición de producto
  const renderProductForm = () => {
    const isEdit = currentView === 'edit';
    const cancel = () => { setCurrentView('list'); clearForm(); setSelectedProduct(null); };

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
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</p>
              <p className="text-xs text-muted-foreground">
                {isEdit ? selectedProduct?.name : 'Los campos con * son obligatorios'}
              </p>
            </div>
          </div>

          {/* Campos */}
          <div className="px-4 py-4 space-y-3">

            {/* Nombre */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-medium">Nombre del Producto <span className="text-destructive">*</span></Label>
              <Input id="name" value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Té Verde Orgánico Premium" className="h-9 text-sm shadow-sm" />
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs font-medium">Descripción</Label>
              <Textarea id="description" value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción del producto..." rows={2}
                className="text-sm shadow-sm resize-none" />
            </div>

            {/* Categoría */}
            <div className="space-y-1">
              <Label htmlFor="category" className="text-xs font-medium">Categoría <span className="text-destructive">*</span></Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger id="category" className="h-9 text-sm shadow-sm">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((cat: any) => cat.isActive).map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)} className="text-sm">{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Proveedores — selección múltiple */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Proveedores <span className="text-muted-foreground font-normal text-xs">(opcional)</span></Label>
              <div className="border rounded-lg max-h-32 overflow-y-auto p-2 space-y-1 shadow-sm">
                {providers.filter((p: any) => p.isActive).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Sin proveedores disponibles</p>
                ) : providers.filter((p: any) => p.isActive).map((p: any) => (
                  <label key={p.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.providerIds.includes(String(p.id))}
                      onChange={e => {
                        const id = String(p.id);
                        setFormData(prev => ({
                          ...prev,
                          providerIds: e.target.checked
                            ? [...prev.providerIds, id]
                            : prev.providerIds.filter(pid => pid !== id),
                          providerId: e.target.checked && prev.providerIds.length === 0 ? id : prev.providerId,
                        }));
                      }}
                      className="h-3.5 w-3.5 rounded"
                    />
                    <span className="text-sm">{p.name}</span>
                  </label>
                ))}
              </div>
              {formData.providerIds.length > 0 && (
                <p className="text-xs text-muted-foreground">{formData.providerIds.length} proveedor{formData.providerIds.length !== 1 ? 'es' : ''} seleccionado{formData.providerIds.length !== 1 ? 's' : ''}</p>
              )}
            </div>

            {/* Precio + Costo */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="price" className="text-xs font-medium">Precio de Venta <span className="text-destructive">*</span></Label>
                <Input id="price" type="number" step="0.01" min="0" value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00" className="h-9 text-sm shadow-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cost" className="text-xs font-medium">Precio de Costo</Label>
                <Input id="cost" type="number" step="0.01" min="0" value={formData.cost}
                  onChange={e => setFormData({...formData, cost: e.target.value})}
                  placeholder="0.00" className="h-9 text-sm shadow-sm" />
              </div>
            </div>

            {/* Margen calculado */}
            {formData.price && formData.cost && Number(formData.price) > 0 && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Margen: <span className="font-medium text-foreground">
                  {((Number(formData.price) - Number(formData.cost)) / Number(formData.price) * 100).toFixed(1)}%
                </span>
              </div>
            )}

            {/* Stock + Stock mínimo */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="stock" className="text-xs font-medium">Stock Actual</Label>
                <Input id="stock" type="number" min="0" value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                  placeholder="0" className="h-9 text-sm shadow-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="minStock" className="text-xs font-medium">Stock Mínimo</Label>
                <Input id="minStock" type="number" min="0" value={formData.minStock}
                  onChange={e => setFormData({...formData, minStock: e.target.value})}
                  placeholder="5" className="h-9 text-sm shadow-sm" />
              </div>
            </div>

            {/* Código + Código de barras */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="sku" className="text-xs font-medium">Código</Label>
                <div className="flex gap-1">
                  <Input id="sku" value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                    placeholder="TV-001" className="h-9 text-sm shadow-sm" />
                  <Button type="button" variant="outline" size="sm" className="h-9 px-2 text-xs shrink-0"
                    onClick={() => setFormData({...formData, sku: generateSKU()})}
                    disabled={!formData.category}>Auto</Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="barcode" className="text-xs font-medium">Código de Barras</Label>
                <div className="flex gap-1">
                  <Input id="barcode" value={formData.barcode}
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                    placeholder="1234567890" className="h-9 text-sm shadow-sm" />
                  <Button type="button" variant="outline" size="sm" className="h-9 px-2 text-xs shrink-0"
                    onClick={() => setFormData({...formData, barcode: generateBarcode()})}>Auto</Button>
                </div>
              </div>
            </div>

            {/* Peso */}
            <div className="space-y-1">
              <Label htmlFor="weight" className="text-xs font-medium">Peso (gramos)</Label>
              <Input id="weight" type="number" min="0" step="0.1" value={formData.weight}
                onChange={e => setFormData({...formData, weight: e.target.value})}
                placeholder="100" className="h-9 text-sm shadow-sm" />
            </div>

            {/* Imagen del producto */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Imagen del Producto</Label>
              <div className="flex gap-3 items-start">
                {/* Preview compacto */}
                <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                  {imagePreview ? (
                    <ImageWithFallback src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" disabled={uploadingImage} />
                  <Label htmlFor="image-upload" className={uploadingImage ? 'cursor-wait' : 'cursor-pointer'}>
                    <div className="flex items-center justify-center gap-2 h-8 px-3 rounded-md border border-input bg-background text-xs shadow-sm hover:bg-accent transition-colors">
                      <Upload className="h-3 w-3" />
                      {uploadingImage ? 'Subiendo...' : imagePreview ? 'Cambiar' : 'Subir imagen'}
                    </div>
                  </Label>
                  {imagePreview && (
                    <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs text-destructive hover:text-destructive"
                      onClick={() => { setImagePreview(''); setImageFile(null); }}>
                      <X className="h-3 w-3 mr-1" />Quitar imagen
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">JPG, PNG · máx. 2MB</p>
                </div>
              </div>
            </div>

            {/* Estado activo */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 shadow-sm">
              <div><p className="text-xs font-medium">Estado</p><p className="text-xs text-muted-foreground">{formData.isActive ? 'Activo' : 'Inactivo'}</p></div>
              <Switch checked={formData.isActive} onCheckedChange={v => setFormData({...formData, isActive: v})} />
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-1">
              <Button onClick={isEdit ? handleUpdateProduct : handleCreateProduct} className="flex-1 h-9 text-sm">
                {isEdit ? <><Edit className="h-3.5 w-3.5 mr-1.5" />Actualizar</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Guardar</>}
              </Button>
              <Button variant="outline" onClick={cancel} className="flex-1 h-9 text-sm">Cancelar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar vista de detalle del producto
  const renderProductDetail = () => {
    if (!selectedProduct) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('list')}>
              <ChevronLeft className="h-4 w-4" />
              Volver
            </Button>
            <h2>Detalle del Producto</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedProduct.name}</CardTitle>
                <CardDescription>{selectedProduct.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">SKU</Label>
                    <p className="font-mono">{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Categoría</Label>
                    <p>{selectedProduct.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Proveedor{selectedProduct.providerName?.includes(',') ? 'es' : ''}</Label>
                    {selectedProduct.providerName ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProduct.providerName.split(', ').map((name: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Building2 className="h-3 w-3 mr-1" />{name}
                          </Badge>
                        ))}
                      </div>
                    ) : <p>—</p>}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Precio</Label>
                    <p className="font-semibold">{formatCOP(selectedProduct.price)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Costo</Label>
                    <p>{formatCOP(selectedProduct.cost)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Margen</Label>
                    <p>{selectedProduct.margin.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Inventario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground">Stock actual:</Label>
                    <span className="font-semibold">{selectedProduct.stock}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground">Stock mínimo:</Label>
                    <span>{selectedProduct.minStock}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground">Estado:</Label>
                    {getStockBadge(selectedProduct.stock, selectedProduct.minStock)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground">Total vendido:</Label>
                    <span className="font-semibold">{selectedProduct.totalSales}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground">Última venta:</Label>
                    <span>{selectedProduct.lastSaleDate || 'Sin ventas'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground">Ingresos:</Label>
                    <span className="font-semibold">{formatCOP(selectedProduct.totalSales * selectedProduct.price)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {(selectedProduct.weight || selectedProduct.barcode) && (
              <Card>
                <CardHeader>
                  <CardTitle>Información Adicional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProduct.weight && (
                      <div>
                        <Label className="text-muted-foreground">Peso</Label>
                        <p>{selectedProduct.weight}g</p>
                      </div>
                    )}
                    {selectedProduct.barcode && (
                      <div>
                        <Label className="text-muted-foreground">Código de Barras</Label>
                        <p className="font-mono">{selectedProduct.barcode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Imagen del Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {selectedProduct.image ? (
                    <ImageWithFallback
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedProduct.technicalSheet && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Ficha Técnica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={selectedProduct.technicalSheet}
                      alt="Ficha Técnica"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-3" 
                    onClick={() => window.open(selectedProduct.technicalSheet, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver en Tamaño Completo
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Estado del Producto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Estado:</Label>
                  <Badge className={getStatusColor(selectedProduct.status)}>
                    {selectedProduct.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <Label>Activo:</Label>
                  <Badge variant={selectedProduct.isActive ? "default" : "secondary"}>
                    {selectedProduct.isActive ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Creado: {selectedProduct.createdDate}</p>
                  <p>Actualizado: {selectedProduct.updatedDate}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar vista de reportes
  const renderReportsView = () => {
    const reportStats = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'Activo').length,
      lowStockProducts: products.filter(p => p.stock <= p.minStock).length,
      outOfStockProducts: products.filter(p => p.stock === 0).length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      totalCost: products.reduce((sum, p) => sum + (p.cost * p.stock), 0),
      categories: CATEGORIES.map(cat => ({
        name: cat,
        count: products.filter(p => p.category === cat).length,
        value: products.filter(p => p.category === cat).reduce((sum, p) => sum + (p.price * p.stock), 0)
      })).filter(c => c.count > 0)
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2>Reportes de Productos</h2>
            <p className="text-muted-foreground">
              Análisis y estadísticas del inventario
            </p>
          </div>
          <Button onClick={handleGenerateReport}>
            <Download className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{reportStats.totalProducts}</p>
                  <p className="text-sm text-muted-foreground">Total Productos</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{reportStats.activeProducts}</p>
                  <p className="text-sm text-muted-foreground">Productos Activos</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">{reportStats.lowStockProducts}</p>
                  <p className="text-sm text-muted-foreground">Stock Crítico</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">{reportStats.outOfStockProducts}</p>
                  <p className="text-sm text-muted-foreground">Agotados</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Valor del Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Valor Total (Precio de Venta):</Label>
                  <span className="text-xl font-bold text-green-600">
                    {formatCOP(reportStats.totalValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <Label>Valor Total (Precio de Costo):</Label>
                  <span className="text-lg font-semibold">
                    {formatCOP(reportStats.totalCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <Label>Margen Potencial:</Label>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatCOP(reportStats.totalValue - reportStats.totalCost)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportStats.categories.map(category => (
                  <div key={category.name} className="flex justify-between items-center">
                    <Label className="truncate">{category.name}</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category.count}</Badge>
                      <span className="text-sm font-medium min-w-0">
                        {formatCOP(category.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {reportStats.lowStockProducts > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Productos con Stock Crítico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Stock Mínimo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.filter(p => p.stock <= p.minStock).map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>{product.minStock}</TableCell>
                        <TableCell>{getStockBadge(product.stock, product.minStock)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Determinar qué vista renderizar
  if (currentView === 'create' || currentView === 'edit') {
    return renderProductForm();
  }

  if (currentView === 'detail') {
    return renderProductDetail();
  }

  if (currentView === 'reports') {
    return renderReportsView();
  }

  // Vista principal - listado de productos
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando productos...</p>
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
            <h3 className="text-lg font-semibold mb-2">Error al cargar productos</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tableColumns: Column<Product>[] = [
    {
      header: 'Producto',
      accessor: (product) => {
        const isInactive = isItemInactive(product);
        return (
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg overflow-hidden bg-muted ${isInactive ? 'opacity-50' : ''}`}>
              {product.image ? (
                <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <p className={`font-medium ${isInactive ? 'text-muted-foreground' : ''}`}>{product.name}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Código',
      accessor: (product) => <code className="bg-muted px-2 py-1 rounded text-sm">{product.sku}</code>
    },
    {
      header: 'Categoría',
      accessor: (product) => <Badge variant="outline">{product.category}</Badge>
    },
    {
      header: 'Proveedor',
      accessor: (product) => {
        if (!product.providerName) return <span className="text-xs text-muted-foreground">—</span>;
        const names = product.providerName.split(', ').filter(Boolean);
        return (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              {names[0]}
            </Badge>
            {names.length > 1 && (
              <Badge
                variant="outline"
                className="text-xs px-1.5 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setProvidersModal({ open: true, productName: product.name, names })}
              >
                +{names.length - 1}
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      header: 'Stock',
      accessor: (product) => (
        <div className="space-y-1">
          <p className="font-medium">{product.stock} unidades</p>
          {getStockBadge(product.stock, product.minStock)}
        </div>
      )
    },
    {
      header: 'Estado',
      accessor: (product) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={product.status === 'Activo'}
            onCheckedChange={() => handleToggleStatus(product.id)}
            disabled={isItemInactive(product)}
          />
          <span className="text-sm text-muted-foreground">{product.status}</span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header con filtros y controles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2>Gestión de Productos</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCurrentView('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <DataTable
        title="Productos"
        description={`Mostrando ${filteredAndSortedProducts.length} productos en total`}
        data={filteredAndSortedProducts}
        columns={tableColumns}
        searchableKeys={['name', 'sku', 'category', 'description', 'barcode', 'supplier']}
        searchPlaceholder="Buscar productos..."
        itemsPerPage={ITEMS_PER_PAGE}
        isLoading={loading}
        onEdit={(p) => handleEditProduct(p)}
        onDelete={(p) => setProductToDelete(p)}
        customActions={(product) => (
          <Button variant="ghost" size="icon" disabled={isItemInactive(product)} onClick={() => handleViewProduct(product)} title="Ver detalles" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Eye className="w-4 h-4" />
          </Button>
        )}
        extraFilters={
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Categorías</SelectItem>
                {categories.filter((c: any) => c.isActive).map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Estados</SelectItem>
                {PRODUCT_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Proveedores</SelectItem>
                {providers.filter((p: any) => p.isActive).map((p: any) => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field as any);
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                <SelectItem value="price-asc">Precio menor</SelectItem>
                <SelectItem value="price-desc">Precio mayor</SelectItem>
                <SelectItem value="stock-asc">Stock menor</SelectItem>
                <SelectItem value="stock-desc">Stock mayor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente "{productToDelete?.name}" del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => productToDelete && handleDeleteProductLocal(productToDelete.id)} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal proveedores */}
      <Dialog open={providersModal.open} onOpenChange={open => setProvidersModal(p => ({ ...p, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Proveedores — {providersModal.productName}
            </DialogTitle>
            <DialogDescription className="sr-only">Lista de proveedores del producto</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {providersModal.names.map((name, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


