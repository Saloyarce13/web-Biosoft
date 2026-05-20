import React, { useState, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Package,
  Clock,
  User,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  MapPin
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  orderDate: string;
  pickupDate?: string;
  status: 'Pendiente' | 'Confirmado' | 'Listo para Recoger' | 'Entregado' | 'Cancelado' | 'Anulado';
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  paymentStatus: 'Pendiente' | 'Pagado' | 'Parcial' | 'Reembolsado';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: OrderItem[];
  pickupLocation: 'Tienda Principal';
  notes?: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
  cancelReason?: string;
  refundAmount?: number;
}

// Datos de ejemplo
const SAMPLE_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    clientId: '1',
    clientName: 'María González',
    clientEmail: 'maria.gonzalez@email.com',
    clientPhone: '+1-555-0101',
    orderDate: '2024-01-15',
    pickupDate: '2024-01-20',
    status: 'Entregado',
    paymentMethod: 'Tarjeta',
    paymentStatus: 'Pagado',
    subtotal: 150.00,
    tax: 15.00,
    discount: 10.00,
    total: 155.00,
    items: [
      {
        id: '1',
        productId: '1',
        productName: 'Té Verde Orgánico',
        category: 'Tés e Infusiones',
        price: 25.00,
        quantity: 3,
        subtotal: 75.00
      },
      {
        id: '2',
        productId: '2',
        productName: 'Aceites Esenciales Lavanda',
        category: 'Aceites Esenciales',
        price: 35.00,
        quantity: 2,
        subtotal: 70.00
      }
    ],
    pickupLocation: 'Tienda Principal',
    notes: 'Recoger en la mañana',
    createdBy: 'Ana López',
    createdDate: '2024-01-15',
    updatedDate: '2024-01-20'
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    clientId: '2',
    clientName: 'Carlos Mendoza',
    clientEmail: 'carlos.mendoza@email.com',
    clientPhone: '+1-555-0102',
    orderDate: '2024-01-18',
    status: 'Listo para Recoger',
    paymentMethod: 'Transferencia',
    paymentStatus: 'Pagado',
    subtotal: 98.50,
    tax: 9.85,
    discount: 0,
    total: 108.35,
    items: [
      {
        id: '3',
        productId: '3',
        productName: 'Hierba de San Juan',
        category: 'Hierbas Medicinales',
        price: 18.50,
        quantity: 2,
        subtotal: 37.00
      },
      {
        id: '4',
        productId: '4',
        productName: 'Suplementos Naturales Mix',
        category: 'Suplementos',
        price: 42.00,
        quantity: 1,
        subtotal: 42.00
      }
    ],
    pickupLocation: 'Tienda Principal',
    createdBy: 'Pedro Ruiz',
    createdDate: '2024-01-18',
    updatedDate: '2024-01-18'
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    clientId: '3',
    clientName: 'Ana López',
    clientEmail: 'ana.lopez@email.com',
    clientPhone: '+1-555-0103',
    orderDate: '2024-01-20',
    status: 'Pendiente',
    paymentMethod: 'Efectivo',
    paymentStatus: 'Pendiente',
    subtotal: 75.00,
    tax: 7.50,
    discount: 5.00,
    total: 77.50,
    items: [
      {
        id: '5',
        productId: '1',
        productName: 'Té Verde Orgánico',
        category: 'Tés e Infusiones',
        price: 25.00,
        quantity: 3,
        subtotal: 75.00
      }
    ],
    pickupLocation: 'Tienda Principal',
    notes: 'Pago al recoger',
    createdBy: 'María Santos',
    createdDate: '2024-01-20',
    updatedDate: '2024-01-20'
  },
  {
    id: '4',
    orderNumber: 'ORD-004',
    clientId: '4',
    clientName: 'Roberto Silva',
    clientEmail: 'roberto.silva@email.com',
    clientPhone: '+1-555-0104',
    orderDate: '2024-01-22',
    status: 'Confirmado',
    paymentMethod: 'Tarjeta',
    paymentStatus: 'Pagado',
    subtotal: 210.00,
    tax: 21.00,
    discount: 15.00,
    total: 216.00,
    items: [
      {
        id: '6',
        productId: '2',
        productName: 'Aceites Esenciales Lavanda',
        category: 'Aceites Esenciales',
        price: 35.00,
        quantity: 3,
        subtotal: 105.00
      },
      {
        id: '7',
        productId: '4',
        productName: 'Suplementos Naturales Mix',
        category: 'Suplementos',
        price: 42.00,
        quantity: 2,
        subtotal: 84.00
      }
    ],
    pickupLocation: 'Tienda Principal',
    notes: 'Pedido corporativo - Facturar a empresa',
    createdBy: 'Luis García',
    createdDate: '2024-01-22',
    updatedDate: '2024-01-22'
  }
];

const ORDER_STATUS = [
  { value: 'Pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'Confirmado', label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  { value: 'Listo para Recoger', label: 'Listo para Recoger', color: 'bg-purple-100 text-purple-800', icon: Package },
  { value: 'Entregado', label: 'Entregado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'Cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'Anulado', label: 'Anulado', color: 'bg-gray-100 text-gray-800', icon: XCircle }
];

const PAYMENT_METHODS = [
  { value: 'Efectivo', label: 'Efectivo', icon: DollarSign },
  { value: 'Tarjeta', label: 'Tarjeta', icon: CreditCard },
  { value: 'Transferencia', label: 'Transferencia', icon: ArrowRight }
];

const ITEMS_PER_PAGE = 5;

export function OrderSalesManagement() {
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'orderDate' | 'orderNumber' | 'clientName' | 'total' | 'status'>('orderDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'create'>('list');

  // Estados del formulario de creación
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    paymentMethod: 'Efectivo' as Order['paymentMethod'],
    notes: '',
    items: [] as OrderItem[]
  });

  // Datos de clientes y productos de ejemplo para el formulario
  const SAMPLE_CLIENTS = [
    { id: '1', name: 'María González', email: 'maria.gonzalez@email.com', phone: '+1-555-0101' },
    { id: '2', name: 'Carlos Mendoza', email: 'carlos.mendoza@email.com', phone: '+1-555-0102' },
    { id: '3', name: 'Ana López', email: 'ana.lopez@email.com', phone: '+1-555-0103' },
    { id: '4', name: 'Roberto Silva', email: 'roberto.silva@email.com', phone: '+1-555-0104' }
  ];

  const SAMPLE_PRODUCTS = [
    { id: '1', name: 'Té Verde Orgánico', price: 25.00, category: 'Tés e Infusiones', stock: 45 },
    { id: '2', name: 'Aceites Esenciales Lavanda', price: 35.00, category: 'Aceites Esenciales', stock: 32 },
    { id: '3', name: 'Hierba de San Juan', price: 18.50, category: 'Hierbas Medicinales', stock: 28 },
    { id: '4', name: 'Suplementos Naturales Mix', price: 42.00, category: 'Suplementos', stock: 15 }
  ];

  // Filtrar y ordenar pedidos
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPaymentMethod = paymentMethodFilter === 'all' || order.paymentMethod === paymentMethodFilter;
      
      return matchesSearch && matchesStatus && matchesPaymentMethod;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'orderDate':
          aValue = new Date(a.orderDate);
          bValue = new Date(b.orderDate);
          break;
        case 'orderNumber':
          aValue = a.orderNumber.toLowerCase();
          bValue = b.orderNumber.toLowerCase();
          break;
        case 'clientName':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
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
  }, [orders, searchTerm, statusFilter, paymentMethodFilter, sortBy, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Cambiar estado del pedido
  const handleChangeOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          status: newStatus,
          updatedDate: new Date().toISOString().split('T')[0]
        };

        // Lógica automática de estados
        if (newStatus === 'Entregado' && !order.pickupDate) {
          updatedOrder.pickupDate = new Date().toISOString().split('T')[0];
        }

        return updatedOrder;
      }
      return order;
    }));

    const order = orders.find(o => o.id === orderId);
    toast.success(`Pedido ${order?.orderNumber} cambiado a: ${newStatus}`);
  };

  // Anular venta
  const handleCancelOrder = (orderId: string, reason: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'Anulado',
          cancelReason: reason,
          refundAmount: order.total,
          paymentStatus: 'Reembolsado',
          updatedDate: new Date().toISOString().split('T')[0]
        };
      }
      return order;
    }));

    const order = orders.find(o => o.id === orderId);
    toast.success(`Venta ${order?.orderNumber} anulada exitosamente`);
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    const statusData = ORDER_STATUS.find(s => s.value === status);
    return statusData?.color || 'bg-gray-100 text-gray-800';
  };

  // Ver detalles del pedido
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('detail');
  };

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      clientId: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      paymentMethod: 'Efectivo',
      notes: '',
      items: []
    });
  };

  // Seleccionar cliente
  const handleClientSelect = (clientId: string) => {
    const client = SAMPLE_CLIENTS.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone
      }));
    }
  };

  // Agregar producto al pedido
  const addProductToOrder = (productId: string, quantity: number = 1) => {
    const product = SAMPLE_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    setFormData(prev => {
      const existingItem = prev.items.find(item => item.productId === productId);
      if (existingItem) {
        return {
          ...prev,
          items: prev.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.price }
              : item
          )
        };
      } else {
        const newItem: OrderItem = {
          id: Date.now().toString(),
          productId: product.id,
          productName: product.name,
          category: product.category,
          price: product.price,
          quantity: quantity,
          subtotal: product.price * quantity
        };
        return {
          ...prev,
          items: [...prev.items, newItem]
        };
      }
    });
  };

  // Actualizar cantidad de producto
  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromOrder(productId);
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    }));
  };

  // Remover producto del pedido
  const removeProductFromOrder = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  // Validar formulario
  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.clientId) errors.push('Debe seleccionar un cliente');
    if (formData.items.length === 0) errors.push('Debe agregar al menos un producto');

    return errors;
  };

  // Crear pedido
  const handleCreateOrder = () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    const { subtotal, tax, total } = calculateTotals();
    const orderNumber = `ORD-${String(orders.length + 1).padStart(3, '0')}`;

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber,
      clientId: formData.clientId,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'Pendiente',
      paymentMethod: formData.paymentMethod,
      paymentStatus: 'Pendiente',
      subtotal,
      tax,
      discount: 0,
      total,
      items: formData.items,
      pickupLocation: 'Tienda Principal',
      notes: formData.notes,
      createdBy: 'Usuario Actual',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    };

    setOrders(prev => [...prev, newOrder]);
    setCurrentView('list');
    clearForm();
    
    toast.success(
      `✅ Pedido "${orderNumber}" creado exitosamente para recoger en tienda`,
      {
        description: `Cliente: ${newOrder.clientName} | Total: $${total.toFixed(2)}`,
        duration: 5000
      }
    );
  };

  // Vista de creación de pedido
  if (currentView === 'create') {
    const { total } = calculateTotals();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setCurrentView('list')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al Listado
          </Button>
          <div>
            <h2>Crear Nuevo Pedido</h2>
            <p className="text-muted-foreground">Complete la información del pedido para retiro en tienda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client">Seleccionar Cliente *</Label>
                <Select value={formData.clientId} onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegir cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_CLIENTS.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.clientId && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">{formData.clientName}</div>
                    <div className="text-muted-foreground">{formData.clientEmail}</div>
                    <div className="text-muted-foreground">{formData.clientPhone}</div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value: Order['paymentMethod']) => 
                    setFormData(prev => ({ ...prev, paymentMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex items-center gap-2">
                          <method.icon className="h-4 w-4" />
                          {method.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notas del Pedido</Label>
                <Textarea
                  id="notes"
                  placeholder="Instrucciones especiales para el retiro..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Información de retiro */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <MapPin className="h-4 w-4" />
                  Retiro en Tienda Principal
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Horario: Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 8:00 AM - 2:00 PM
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Agregar Productos</Label>
                <div className="space-y-2">
                  {SAMPLE_PRODUCTS.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCOP(product.price)} - Stock: {product.stock}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => addProductToOrder(product.id)}
                        disabled={product.stock === 0}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Productos añadidos */}
              {formData.items.length > 0 && (
                <div>
                  <Label>Productos en el Pedido</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {formData.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCOP(item.price)} x {item.quantity} = {formatCOP(item.subtotal)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateProductQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateProductQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => removeProductFromOrder(item.productId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Mostrar total en la sección de productos */}
                  {formData.items.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="text-sm font-medium text-primary">
                        Total del Pedido: ${total.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formData.items.length} {formData.items.length === 1 ? 'producto' : 'productos'} agregados
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acciones */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCurrentView('list')}>
                Cancelar
              </Button>
              <Button onClick={handleCreateOrder} disabled={formData.items.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de detalles del pedido
  if (currentView === 'detail' && selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setCurrentView('list')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al Listado
          </Button>
          <div>
            <h2>Detalle del Pedido {selectedOrder.orderNumber}</h2>
            <p className="text-muted-foreground">Información completa del pedido</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium">{selectedOrder.clientName}</div>
                <div className="text-sm text-muted-foreground">{selectedOrder.clientEmail}</div>
                <div className="text-sm text-muted-foreground">{selectedOrder.clientPhone}</div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fecha:</span>
                <span className="text-sm">{format(parseISO(selectedOrder.orderDate), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
              {selectedOrder.pickupDate && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Recogido:</span>
                  <span className="text-sm">{format(parseISO(selectedOrder.pickupDate), 'dd/MM/yyyy', { locale: es })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm font-medium">Método de Pago:</span>
                <div className="flex items-center gap-1">
                  {selectedOrder.paymentMethod === 'Efectivo' && <DollarSign className="h-3 w-3" />}
                  {selectedOrder.paymentMethod === 'Tarjeta' && <CreditCard className="h-3 w-3" />}
                  {selectedOrder.paymentMethod === 'Transferencia' && <ArrowRight className="h-3 w-3" />}
                  <span className="text-sm">{selectedOrder.paymentMethod}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Retiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium text-sm">{selectedOrder.pickupLocation}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Horario: Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 8:00 AM - 2:00 PM
                </div>
              </div>
              {selectedOrder.notes && (
                <div>
                  <div className="font-medium text-sm">Notas:</div>
                  <div className="text-sm text-muted-foreground">{selectedOrder.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos ({selectedOrder.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedOrder.items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">${item.price} × {item.quantity}</div>
                    <div className="text-sm text-muted-foreground">{formatCOP(item.subtotal)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Impuestos:</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento:</span>
                  <span>-${selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 justify-end">
              <Select 
                value={selectedOrder.status} 
                onValueChange={(newStatus: Order['status']) => handleChangeOrderStatus(selectedOrder.id, newStatus)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedOrder.status !== 'Anulado' && selectedOrder.status !== 'Entregado' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Anular Venta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Anular venta {selectedOrder.orderNumber}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se marcará la venta como anulada y se procesará el reembolso correspondiente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelOrder(selectedOrder.id, 'Anulada desde panel administrativo')}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Confirmar Anulación
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista principal - lista de pedidos
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Lista de Pedidos
          </h2>
          <p className="text-muted-foreground">
            Mostrando {paginatedOrders.length} de {filteredAndSortedOrders.length} pedidos
          </p>
        </div>
        
        <Button onClick={() => setCurrentView('create')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Controles de búsqueda y filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de pedido, cliente o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {ORDER_STATUS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>
            Gestiona y supervisa todos los pedidos de la tienda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(order.orderDate), 'dd/MM/yyyy', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.clientName}</div>
                      <div className="text-sm text-muted-foreground">{order.clientEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(parseISO(order.orderDate), 'dd/MM/yyyy', { locale: es })}
                    </div>
                    {order.pickupDate && (
                      <div className="text-xs text-muted-foreground">
                        Recogido: {format(parseISO(order.pickupDate), 'dd/MM/yyyy', { locale: es })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${order.total.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.items.length} productos
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewOrderDetails(order)}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Select 
                        value={order.status} 
                        onValueChange={(newStatus: Order['status']) => handleChangeOrderStatus(order.id, newStatus)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUS.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <status.icon className="h-3 w-3" />
                                <span className="text-xs">{status.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
