import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../components/ui/command';
import { cn } from '../../../components/ui/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Separator } from '../../../components/ui/separator';
import { Switch } from '../../../components/ui/switch';
import { DataTable, Column } from '../../../shared/components/DataTable';
import { toast } from 'sonner';
import { getSales, getClients, getProducts, createSale, apiFetch } from '../../../lib/api';
import { useSaleStatuses } from '../../../shared/contexts/SystemConfigContext';
import {
  Row, Col, Card as AntCard, Table as AntTable, Select as AntSelect,
  InputNumber, Button as AntButton, Typography, Divider, Space,
  Badge as AntBadge, Switch as AntSwitch
} from 'antd';
import {
  DollarSign, Search, Eye, ChevronLeft, ChevronRight,
  RefreshCw, Users, User, Package, Download, FileText, CheckCircle, Plus, X, Store,
  Check, ChevronsUpDown, LayoutGrid, AlertCircle, AlertTriangle, ShoppingCart, ShoppingBag, Zap
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface ApiSale {
  id: number;
  status: 'REGISTERED' | 'COMPLETED' | 'CANCELLED' | 'ANNULED';
  totalPrice: number;
  notes: string | null;
  saleDate: string;
  client: { id: number; name: string; email: string | null; phone: string | null; documentNumber: string | null };
  employee: { id: number; fullName: string } | null;
  items: ApiSaleItem[];
}

interface ApiSaleItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: { id: number; name: string; sku: string | null; image: string | null };
}

interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

const STATUS_COLORS_FALLBACK: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  ANNULED: 'bg-red-100 text-red-800',
  REGISTERED: 'bg-blue-100 text-blue-800',
  READY: 'bg-yellow-100 text-yellow-800',
};
const STATUS_LABELS_FALLBACK: Record<string, string> = {
  COMPLETED: 'Completada', CANCELLED: 'Cancelada',
  ANNULED: 'Anulada', REGISTERED: 'Registrada', READY: 'Lista para recoger',
};

const ITEMS_PER_PAGE = 10;

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

// ── Generar PDF de venta ───────────────────────────────────────────────────────
async function generateSalePDF(sale: ApiSale): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;

  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('Bionatural', margin, 14);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión · Tienda Naturista', margin, 20);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(`Venta #${sale.id}`, pageW - margin, 14, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(new Date(sale.saleDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 20, { align: 'right' });
  doc.text(`Estado: ${STATUS_LABELS_FALLBACK[sale.status] || sale.status}`, pageW - margin, 27, { align: 'right' });

  let y = 42;
  doc.setTextColor(30, 30, 30);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, (pageW - margin * 2) / 2 - 4, 22, 3, 3, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
  doc.text('CLIENTE', margin + 4, y + 7);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
  doc.text(sale.client.name, margin + 4, y + 15);
  if (sale.client.email) { doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100); doc.text(sale.client.email, margin + 4, y + 20); }

  if (sale.employee) {
    const ex = margin + (pageW - margin * 2) / 2 + 4;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(ex, y, (pageW - margin * 2) / 2 - 4, 22, 3, 3, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
    doc.text('VENDEDOR', ex + 4, y + 7);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
    doc.text(sale.employee.fullName, ex + 4, y + 15);
  }

  y += 30;
  const items = sale.items || [];
  autoTable(doc, {
    startY: y,
    head: [['Producto', 'SKU', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: items.map(i => [i.product?.name || '—', i.product?.sku || '—', String(i.quantity), formatCOP(Number(i.unitPrice)), formatCOP(Number(i.lineTotal))]),
    foot: [['', '', '', 'TOTAL', formatCOP(Number(sale.totalPrice))]],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [240, 253, 244], textColor: [22, 163, 74], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 28, textColor: [100, 100, 100] }, 2: { cellWidth: 16, halign: 'center' }, 3: { cellWidth: 32, halign: 'right' }, 4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' } },
    styles: { overflow: 'linebreak', cellPadding: 3 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  if (sale.notes) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(margin, finalY + 6, pageW - margin * 2, 18, 3, 3, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(146, 64, 14);
    doc.text('NOTAS', margin + 4, finalY + 13);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 53, 15);
    doc.text(sale.notes, margin + 4, finalY + 19, { maxWidth: pageW - margin * 2 - 8 });
  }

  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
  doc.text('Bionatural · Tienda Naturista', margin, pageH - 8);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}`, pageW - margin, pageH - 8, { align: 'right' });

  return doc.output('datauristring');
}

// ── Componente principal ───────────────────────────────────────────────────────
export function SalesManagement({ user }: { user?: { role: string; permissions: string[] } | null }) {
  const saleStatuses = useSaleStatuses();
  // Construir mapas desde la BD
  const STATUS_COLORS: Record<string, string> = Object.fromEntries(saleStatuses.map(s => [s.value, s.color]));
  const STATUS_LABELS: Record<string, string> = Object.fromEntries(saleStatuses.map(s => [s.value, s.label]));

  const canSell = user
    ? ['Administrador', 'administrador', 'Vendedor', 'vendedor'].includes(user.role) ||
    (user.permissions ?? []).includes('sales.manage')
    : false;

  const [sales, setSales] = useState<ApiSale[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('COMPLETED');
  const [view, setView] = useState<'list' | 'create'>('list');

  // Formulario venta en tienda
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDirectSale, setIsDirectSale] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tempProduct, setTempProduct] = useState<any>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(1);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);

  // Detalle
  const [selectedSale, setSelectedSale] = useState<ApiSale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [pdfSale, setPdfSale] = useState<ApiSale | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Solo cargar ventas COMPLETADAS en este módulo
      const [sRes, cRes, pRes] = await Promise.all([
        getSales(),
        getClients(),
        getProducts(true),
      ]);
      if (sRes.success) setSales(sRes.data as any[]);
      if (cRes.success) {
        const activeClients = cRes.data.filter((c: any) => c.isActive);
        setClients(activeClients);

        // Autoseleccionar Consumidor Final para Transacción Directa
        const cf = activeClients.find((c: any) => c.name?.toLowerCase().includes('consumidor final') || c.id === 1 || String(c.id) === '1');
        if (cf) setClientId(String(cf.id));
        else setClientId('1'); // Fallback standard
      }
      if (pRes.success) setProducts(pRes.data.filter((p: any) => p.isActive));
    } catch { toast.error('Error al cargar ventas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Solo mostrar ventas completadas (y opcionalmente canceladas/anuladas)
  const filtered = sales.filter(s => {
    const matchStatus = statusFilter === 'all' ? s.status !== 'REGISTERED' : s.status === statusFilter;
    return matchStatus;
  });

  // Expandir client.name para searchableKeys
  const dataForTable = filtered.map(s => ({
    ...s,
    clientName: s.client?.name || '',
    clientEmail: s.client?.email || ''
  }));

  // Estadísticas — solo ventas completadas
  const completed = sales.filter(s => s.status === 'COMPLETED');
  const totalRevenue = completed.reduce((s, v) => s + Number(v.totalPrice), 0);
  const totalItems = completed.reduce((s, v) => s + (v.items?.reduce((a, i) => a + i.quantity, 0) || 0), 0);

  // ── Carrito ────────────────────────────────────────────────────────────────
  const filteredProducts = productSearch.length >= 1
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const addToCart = (product: any, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        return prev.map(item => item.productId === product.id
          ? { ...item, quantity: newQty, lineTotal: newQty * item.unitPrice }
          : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        sku: product.sku || '',
        quantity: qty,
        unitPrice: Number(product.price) || 0,
        lineTotal: (Number(product.price) || 0) * qty
      }];
    });
  };

  const updateCartItem = (productId: number, field: 'quantity' | 'unitPrice', value: number) => {
    setCart(prev => prev.map(c => {
      if (c.productId !== productId) return c;
      if (field === 'quantity') {
        const prod = products.find(p => p.id === productId);
        const maxStock = prod?.stock ?? 9999;
        if (value > maxStock) {
          toast.error(`Stock disponible: ${maxStock} unidades`);
          value = maxStock;
        }
        if (value < 1) value = 1;
      }
      const u = { ...c, [field]: value };
      u.lineTotal = Math.round(u.quantity * u.unitPrice * 100) / 100;
      return u;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
    toast.info('Producto eliminado del carrito');
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) { toast.error('Agrega al menos un producto'); return; }

    // Si es venta directa y no hay clientId, intentar buscar Consumidor Final o usar '1'
    let finalClientId = clientId;
    if (isDirectSale && !finalClientId) {
      const cf = clients.find(c => c.name?.toLowerCase().includes('consumidor final') || c.id === 1 || String(c.id) === '1');
      finalClientId = cf ? String(cf.id) : '1';
    }

    if (!finalClientId) { toast.error('Selecciona un cliente'); return; }

    const total = cart.reduce((s, c) => s + c.lineTotal, 0);
    if (receivedAmount < total) {
      toast.error(`Pago insuficiente: faltan ${formatCOP(total - receivedAmount)}`); return;
    }

    try {
      setCreating(true);
      const res = await createSale({
        clientId: Number(finalClientId),
        notes: notes.trim() || 'Venta en tienda (POS)',
        status: 'COMPLETED',
        items: cart.map(c => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })),
      });
      if (res.success) {
        toast.success('Venta registrada y completada correctamente');
        await load();
        setView('list');
        setClientId(''); setNotes(''); setCart([]); setReceivedAmount(0);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al registrar la venta'); }
    finally { setCreating(false); }
  };

  // ── Vista: Registrar venta en tienda (POS Compacto) ────────────────────────
  if (view === 'create') {
    const total = cart.reduce((sum, item) => sum + item.lineTotal, 0);

    return (
      <div className="h-[calc(100vh-100px)] p-4 bg-[#f8fafc]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AntButton
              icon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => setView('list')}
              className="border-none shadow-none bg-white hover:bg-slate-100"
            />
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>
              NUEVA VENTA POS
            </Typography.Title>
          </div>
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <Typography.Text strong className="text-slate-400 text-[10px] uppercase tracking-widest">Estado Caja</Typography.Text>
            <AntBadge status="processing" text={<span className="font-black text-primary text-[10px] uppercase">Abierta</span>} />
          </div>
        </div>

        <Row gutter={[16, 16]} className="h-[calc(100%-60px)]">
          {/* LADO IZQUIERDO: BÚSQUEDA Y SELECCIÓN RÁPIDA */}
          <Col span={14} className="h-full flex flex-col gap-4 overflow-hidden">
            <AntCard className="rounded-[1.5rem] shadow-sm border-none overflow-hidden shrink-0">
              <div className="p-4 space-y-4">
                <Typography.Text strong className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Search className="h-3 w-3 text-primary" /> Búsqueda de Productos
                </Typography.Text>

                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Typography.Text className="text-[10px] font-bold text-slate-500 mb-1.5 block">Producto (Nombre o SKU)</Typography.Text>
                    <AntSelect
                      showSearch
                      placeholder="Escribe para buscar productos..."
                      className="w-full h-12"
                      optionFilterProp="children"
                      value={tempProduct?.id}
                      onChange={(id) => {
                        const product = products.find(p => p.id === id);
                        if (product) setTempProduct(product);
                      }}
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={products.filter(p => p.isActive).map(p => ({
                        value: p.id,
                        label: `${p.name} - ${p.sku || 'S/S'} (${formatCOP(Number(p.price))})`,
                      }))}
                      suffixIcon={<Search className="h-4 w-4 text-slate-300" />}
                    />
                  </div>
                  <div className="w-24">
                    <Typography.Text className="text-[10px] font-bold text-slate-500 mb-1.5 block">Cant.</Typography.Text>
                    <InputNumber
                      min={1}
                      value={tempQuantity}
                      onChange={val => setTempQuantity(Number(val))}
                      className="w-full h-12 flex items-center rounded-xl bg-slate-50 border-none font-black"
                    />
                  </div>
                  <AntButton
                    type="primary"
                    className="h-12 px-6 rounded-xl font-black bg-primary border-none shadow-lg shadow-primary/20"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => {
                      if (tempProduct) {
                        addToCart(tempProduct, tempQuantity);
                        setTempProduct(null);
                        setTempQuantity(1);
                        toast.success('Producto añadido');
                      } else {
                        toast.error('Selecciona un producto primero');
                      }
                    }}
                  >
                    AGREGAR
                  </AntButton>
                </div>
              </div>
            </AntCard>

            <AntCard className="rounded-[1.5rem] shadow-sm border-none flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-50 shrink-0">
                <Typography.Text strong className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Package className="h-3 w-3 text-primary" /> Sugerencias / Frecuentes
                </Typography.Text>
              </div>
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                <AntTable
                  dataSource={products.filter(p => p.isActive).slice(0, 10)}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  className="rounded-lg overflow-hidden"
                  columns={[
                    {
                      title: <span className="text-[10px] font-black uppercase text-slate-400">Producto</span>,
                      dataIndex: 'name',
                      render: (name, p) => (
                        <div className="flex flex-col">
                          <span className="font-black text-slate-700 text-xs">{name}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{p.sku || 'S/S'}</span>
                        </div>
                      )
                    },
                    {
                      title: <span className="text-[10px] font-black uppercase text-slate-400">Stock</span>,
                      dataIndex: 'stock',
                      width: 80,
                      render: (stock) => <AntBadge count={stock} overflowCount={999} style={{ backgroundColor: stock > 5 ? '#10b981' : '#ef4444', fontSize: '9px' }} />
                    },
                    {
                      title: <span className="text-[10px] font-black uppercase text-slate-400">Precio</span>,
                      dataIndex: 'price',
                      render: (price) => <span className="font-black text-primary text-xs">{formatCOP(Number(price))}</span>
                    },
                    {
                      title: '',
                      width: 50,
                      render: (_, p) => (
                        <AntButton
                          type="text"
                          icon={<Plus className="h-4 w-4 text-primary" />}
                          className="hover:bg-primary/5"
                          onClick={() => addToCart(p)}
                        />
                      )
                    }
                  ]}
                />
              </div>
            </AntCard>
          </Col>

          {/* LADO DERECHO: VENTA ACTUAL / CARRITO */}
          <Col span={10} className="h-full overflow-hidden">
            <AntCard className="rounded-[1.5rem] shadow-xl border-none h-full flex flex-col overflow-hidden bg-white">
              <div className="p-4 border-b border-slate-50 shrink-0 bg-slate-50/30">
                <div className="flex items-center justify-between mb-4">
                  <Typography.Text strong className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3 text-primary" /> Carrito de Venta
                  </Typography.Text>
                  <AntButton
                    danger
                    type="text"
                    size="small"
                    icon={<X className="h-3 w-3" />}
                    onClick={() => setCart([])}
                    className="text-[9px] font-black uppercase"
                  >
                    Vaciar
                  </AntButton>
                </div>

                <div className="space-y-3">
                  <Typography.Text strong className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="h-3 w-3 text-primary" /> Cliente
                  </Typography.Text>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[9px] font-bold uppercase", isDirectSale ? "text-primary" : "text-slate-400")}>Venta Directa</span>
                    <AntSwitch size="small" checked={isDirectSale} onChange={(val) => {
                      setIsDirectSale(val);
                      if (val) {
                        const cf = clients.find(c => c.name?.toLowerCase().includes('consumidor final') || c.id === 1 || String(c.id) === '1');
                        setClientId(cf ? String(cf.id) : '1');
                      } else {
                        setClientId(''); // Limpiar selección al desactivar venta directa
                      }
                    }} />
                  </div>
                  {!isDirectSale && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <AntButton
                          className="w-full justify-between h-12 bg-slate-50 border-none rounded-xl text-xs font-black text-slate-700 px-4"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <User className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">
                              {clientId
                                ? clients.find(c => String(c.id) === String(clientId))?.name || "Seleccionar Cliente"
                                : "Seleccionar Cliente"}
                            </span>
                          </div>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </AntButton>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden" align="start">
                        <Command className="rounded-2xl border-none">
                          <CommandInput placeholder="Buscar por nombre o documento..." className="h-11 border-none focus:ring-0 text-xs font-medium" />
                          <CommandList className="max-h-[300px] scrollbar-thin">
                            <CommandEmpty className="py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin resultados</CommandEmpty>
                            <CommandGroup>
                              {clients.filter(c => c.isActive).map((c) => (
                                <CommandItem
                                  key={c.id}
                                  value={`${c.name} ${c.documentNumber || ''}`}
                                  onSelect={() => setClientId(String(c.id))}
                                  className="p-3 cursor-pointer rounded-xl hover:bg-slate-50 transition-all border-b border-slate-50/50 last:border-none"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-black text-slate-700 text-sm">{c.name}</span>
                                    <span className="text-[10px] text-primary font-black uppercase">{c.documentNumber || 'S/D'}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                <AntTable
                  dataSource={cart}
                  rowKey="productId"
                  pagination={false}
                  size="small"
                  className="compact-table"
                  columns={[
                    {
                      title: <span className="text-[9px] font-black uppercase text-slate-400">Ítem</span>,
                      dataIndex: 'productName',
                      render: (name) => <span className="font-bold text-slate-700 text-[11px] truncate">{name}</span>
                    },
                    {
                      title: <span className="text-[9px] font-black uppercase text-slate-400 text-center">Cant.</span>,
                      dataIndex: 'quantity',
                      align: 'center',
                      render: (q, record) => (
                        <div className="flex items-center justify-center gap-1">
                          <AntButton size="small" type="text" onClick={() => updateCartItem(record.productId, 'quantity', q - 1)}>-</AntButton>
                          <span className="font-black text-slate-700 text-xs">{q}</span>
                          <AntButton size="small" type="text" onClick={() => updateCartItem(record.productId, 'quantity', q + 1)}>+</AntButton>
                        </div>
                      )
                    },
                    {
                      title: <span className="text-[9px] font-black uppercase text-slate-400 text-right">Subtotal</span>,
                      dataIndex: 'lineTotal',
                      align: 'right',
                      render: (t) => <span className="font-black text-slate-800 text-[11px]">{formatCOP(t)}</span>
                    },
                    {
                      title: '',
                      width: 40,
                      render: (_, record) => (
                        <AntButton type="text" danger icon={<X className="h-3 w-3" />} onClick={() => removeFromCart(record.productId)} />
                      )
                    }
                  ]}
                />
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-100 shrink-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <Typography.Text strong className="text-[8px] font-black text-slate-400 uppercase mb-1 block tracking-widest">Pago Recibido</Typography.Text>
                    <div className="flex items-center">
                      <span className="text-sm font-black text-primary mr-1">$</span>
                      <InputNumber
                        value={receivedAmount}
                        onChange={val => setReceivedAmount(Number(val))}
                        className="w-full font-black text-lg border-none shadow-none bg-transparent h-auto p-0"
                        controls={false}
                        variant="borderless"
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => (value?.replace(/\$\s?|(,*)/g, '') || '') as any}
                      />
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-3 flex flex-col justify-between shadow-sm border transition-colors"
                    style={{
                      backgroundColor: receivedAmount >= total && total > 0 ? '#10b981' : '#f1f5f9',
                      borderColor: receivedAmount >= total && total > 0 ? '#059669' : '#e2e8f0'
                    }}
                  >
                    <Typography.Text
                      strong
                      className="text-[8px] font-black uppercase mb-1 block text-right"
                      style={{ color: receivedAmount >= total && total > 0 ? '#ecfdf5' : '#94a3b8' }}
                    >
                      Cambio
                    </Typography.Text>
                    <div
                      className="text-right text-base font-black tracking-tighter"
                      style={{ color: receivedAmount >= total && total > 0 ? 'white' : '#475569' }}
                    >
                      {formatCOP(Math.max(0, receivedAmount - total))}
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between p-4 rounded-2xl shadow-lg border"
                  style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Total a Pagar</span>
                  <span className="text-2xl font-black" style={{ color: '#4ade80' }}>
                    {formatCOP(Number(total) || 0)}
                  </span>
                </div>

                <AntButton
                  type="primary"
                  block
                  className="h-14 text-xs font-black uppercase rounded-2xl bg-primary border-none shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  disabled={creating || cart.length === 0 || (isDirectSale ? false : !clientId) || receivedAmount < total}
                  onClick={handleCreateSale}
                >
                  {creating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                  FINALIZAR VENTA
                </AntButton>
              </div>
            </AntCard>
          </Col>
        </Row>
      </div>
    );
  }

  const openDetail = async (s: ApiSale) => {
    setSelectedSale(s); setIsDetailOpen(true);
    if (!s.items || s.items.length === 0) {
      setLoadingDetail(true);
      try {
        const res = await apiFetch<any>(`/sales/${s.id}`);
        if (res.success) setSelectedSale(res.data);
      } catch { }
      finally { setLoadingDetail(false); }
    }
  };

  const openPdfModal = async (s: ApiSale) => {
    setGeneratingPdf(true); setPdfModalOpen(true); setPdfDataUri(''); setPdfSale(s);
    try {
      let full = s;
      if (!s.items || s.items.length === 0) {
        const res = await apiFetch<any>(`/sales/${s.id}`);
        if (res.success) full = res.data;
      }
      const uri = await generateSalePDF(full);
      setPdfDataUri(uri);
    } catch { toast.error('Error al generar el PDF'); }
    finally { setGeneratingPdf(false); }
  };

  const downloadPdf = () => {
    if (!pdfDataUri || !pdfSale) return;
    const link = document.createElement('a');
    link.href = pdfDataUri;
    link.download = `venta-${pdfSale.id}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" /> Ventas
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {canSell && (
            <Button size="sm" onClick={() => { setView('create'); setClientId(''); }}>
              <Store className="h-4 w-4 mr-1.5" /> Venta en Tienda
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas — 4 tarjetas en fila */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{completed.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completadas</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold truncate">{formatCOP(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ingresos</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 shrink-0">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalItems}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Unidades vendidas</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 shrink-0">
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{sales.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total ventas</p>
          </div>
        </div>
      </div>

      <DataTable
        title="Historial de Ventas"
        description={`Mostrando ${filtered.length} venta${filtered.length !== 1 ? 's' : ''}`}
        data={dataForTable}
        columns={[
          {
            header: '# Venta',
            accessor: (s: any) => <span className="font-mono text-sm font-medium">#{s.id}</span>
          },
          {
            header: 'Cliente',
            accessor: (s: any) => (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm">{s.client.name}</p>
                  {s.client.email && <p className="text-xs text-muted-foreground">{s.client.email}</p>}
                </div>
              </div>
            )
          },
          {
            header: 'Estado',
            accessor: (s: any) => (
              <Badge className={`${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-800'} text-xs`}>
                {STATUS_LABELS[s.status] || s.status}
              </Badge>
            )
          },
          {
            header: 'Total',
            accessor: (s: any) => (
              <span className="font-medium text-sm">{formatCOP(Number(s.totalPrice))}</span>
            )
          }
        ]}
        searchableKeys={['clientName', 'clientEmail', 'id']}
        searchPlaceholder="Buscar por cliente o número..."
        itemsPerPage={ITEMS_PER_PAGE}
        isLoading={loading}
        customActions={(sale: any) => (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(sale)} title="Ver detalle">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPdfModal(sale)} title="Descargar PDF">
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>
          </>
        )}
        extraFilters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETED">Completadas</SelectItem>
              <SelectItem value="CANCELLED">Canceladas</SelectItem>
              <SelectItem value="ANNULED">Anuladas</SelectItem>
              <SelectItem value="all">Todas (sin pendientes)</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Modal Detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl w-full flex flex-col p-0 gap-0" style={{ maxHeight: '90vh' }}>
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Venta #{selectedSale?.id}
            </DialogTitle>
            <DialogDescription className="sr-only">Detalle de venta</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
              {/* Info cliente */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cliente</p>
                  <p className="font-medium">{selectedSale.client.name}</p>
                  {selectedSale.client.email && <p className="text-xs text-muted-foreground">{selectedSale.client.email}</p>}
                  {selectedSale.client.phone && <p className="text-xs text-muted-foreground">{selectedSale.client.phone}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha</p>
                  <p className="font-medium">{new Date(selectedSale.saleDate).toLocaleDateString('es-CO', { dateStyle: 'long' })}</p>
                  <Badge className={`${STATUS_COLORS[selectedSale.status]} text-xs mt-1`}>
                    {STATUS_LABELS[selectedSale.status]}
                  </Badge>
                </div>
              </div>
              <Separator />
              {/* Items */}
              {loadingDetail ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <RefreshCw className="h-4 w-4 animate-spin" /><span className="text-sm">Cargando...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-0">Producto</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedSale.items || []).map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="pl-0">
                          <div className="flex items-center gap-2">
                            {item.product?.image && <img src={item.product.image} alt={item.product.name} className="w-7 h-7 rounded object-cover shrink-0" />}
                            <div>
                              <p className="text-sm font-medium">{item.product?.name}</p>
                              {item.product?.sku && <p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm">{formatCOP(Number(item.unitPrice))}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCOP(Number(item.lineTotal))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="flex justify-between items-center rounded-lg bg-primary/5 border px-4 py-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-base font-bold text-primary">{formatCOP(Number(selectedSale.totalPrice))}</span>
              </div>
              {selectedSale.notes && (
                <div className="bg-muted/30 rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
                  <p className="text-sm">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          )}
          <div className="px-6 py-4 border-t shrink-0 flex justify-between items-center bg-background">
            <p className="text-xs text-muted-foreground">{selectedSale && `Cliente: ${selectedSale.client.name}`}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
              <Button size="sm" onClick={() => { setIsDetailOpen(false); if (selectedSale) openPdfModal(selectedSale); }}>
                <Download className="h-4 w-4 mr-1.5" /> PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal PDF */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-3xl w-full flex flex-col p-0 gap-0" style={{ maxHeight: '90vh' }}>
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" /> Venta #{pdfSale?.id}
            </DialogTitle>
            <DialogDescription className="sr-only">Vista previa PDF</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden min-h-0">
            {generatingPdf ? (
              <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin" /><span>Generando PDF...</span>
              </div>
            ) : pdfDataUri ? (
              <iframe src={pdfDataUri} className="w-full h-full border-0" style={{ minHeight: '60vh' }} title="Vista previa PDF" />
            ) : null}
          </div>
          <div className="px-6 py-4 border-t shrink-0 flex justify-between items-center bg-background">
            <p className="text-xs text-muted-foreground">{pdfSale && `Cliente: ${pdfSale.client.name}`}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPdfModalOpen(false)}>Cerrar</Button>
              <Button size="sm" onClick={downloadPdf} disabled={!pdfDataUri || generatingPdf}>
                <Download className="h-4 w-4 mr-1.5" /> Descargar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
