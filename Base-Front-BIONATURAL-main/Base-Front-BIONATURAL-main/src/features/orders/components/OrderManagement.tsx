import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Separator } from '../../../components/ui/separator';
import { cn } from '../../../components/ui/utils';
import { DataTable, Column } from '../../../shared/components/DataTable';
import { toast } from 'sonner';
import { getSales, getClients, getProducts, createSale, updateSaleStatus, apiFetch } from '../../../lib/api';
import {
  Row, Col, Card as AntCard, Table as AntTable, Select as AntSelect,
  InputNumber, Button as AntButton, Typography, Divider, Space,
  Badge as AntBadge
} from 'antd';
import {
  ShoppingCart, Plus, Eye, ChevronLeft,
  Users, Package, RefreshCw, X, CheckCircle, XCircle, Clock, Download, FileText, PackageCheck, Search, User, DollarSign, Store
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface ApiSale {
  id: number;
  status: 'REGISTERED' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'ANNULED';
  totalPrice: number;
  notes: string | null;
  saleDate: string;
  readyAt: string | null;
  client: { id: number; name: string; email: string | null; phone: string | null };
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

const STATUS_MAP: Record<string, { label: string; color: string; iconName: string }> = {
  REGISTERED: { label: 'Registrado',       color: 'bg-blue-100 text-blue-800',    iconName: 'clock' },
  READY:      { label: 'Listo en tienda',  color: 'bg-emerald-100 text-emerald-800', iconName: 'check' },
  COMPLETED:  { label: 'Completado',       color: 'bg-green-100 text-green-800',  iconName: 'check' },
  CANCELLED:  { label: 'Cancelado',        color: 'bg-gray-100 text-gray-800',    iconName: 'x' },
  ANNULED:    { label: 'Anulado',          color: 'bg-red-100 text-red-800',      iconName: 'x' },
};

function StatusIcon({ name }: { name: string }) {
  if (name === 'clock') return <Clock className="h-3 w-3" />;
  if (name === 'check') return <CheckCircle className="h-3 w-3" />;
  return <XCircle className="h-3 w-3" />;
}

const ITEMS_PER_PAGE = 8;

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

// ── Generar PDF de pedido ──────────────────────────────────────────────────────
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
  doc.text(`Pedido #${sale.id}`, pageW - margin, 14, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(new Date(sale.saleDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 20, { align: 'right' });
  const statusLabels: Record<string, string> = { REGISTERED: 'Registrado', COMPLETED: 'Completado', CANCELLED: 'Cancelado', ANNULED: 'Anulado' };
  doc.text(`Estado: ${statusLabels[sale.status] || sale.status}`, pageW - margin, 27, { align: 'right' });

  let y = 42;
  doc.setTextColor(30, 30, 30);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, (pageW - margin * 2) / 2 - 4, 22, 3, 3, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
  doc.text('CLIENTE', margin + 4, y + 7);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
  doc.text(sale.client.name, margin + 4, y + 15);
  if (sale.client.email) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
    doc.text(sale.client.email, margin + 4, y + 20);
  }

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
export function OrderManagement({ user }: { user?: { role: string; permissions: string[] } | null }) {
  // Permisos: solo admin y vendedor pueden crear/completar/cancelar
  const canManage = user
    ? ['Administrador', 'administrador', 'Vendedor', 'vendedor'].includes(user.role) ||
      (user.permissions ?? []).includes('sales.manage')
    : false;
  const [sales, setSales] = useState<ApiSale[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedSale, setSelectedSale] = useState<ApiSale | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [markReadyId, setMarkReadyId] = useState<number | null>(null);

  // Formulario nueva venta
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [tempProduct, setTempProduct] = useState<any | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  // PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [pdfSale, setPdfSale] = useState<ApiSale | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [sRes, cRes, pRes] = await Promise.all([getSales(), getClients(), getProducts(true)]);
      // Solo pedidos pendientes (REGISTERED, READY) y cancelados — los COMPLETED van a Ventas
      if (sRes.success) setSales((sRes.data as any[]).filter((s: any) => ['REGISTERED', 'READY', 'CANCELLED'].includes(s.status)));
      if (cRes.success) setClients(cRes.data.filter((c: any) => c.isActive && c.name !== 'Consumidor Final'));
      if (pRes.success) setProducts(pRes.data.filter((p: any) => p.isActive));
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchStatus;
    });
  }, [sales, statusFilter]);

  const filteredProducts = productSearch.length >= 1
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())).slice(0, 8)
    : products.slice(0, 8);

  // ── Carrito ────────────────────────────────────────────────────────────────
  const addToCart = (product: any, qty: number = 1) => {
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
      const newQty = existing.quantity + qty;
      setCart(prev => prev.map(item => item.productId === product.id 
        ? { ...item, quantity: newQty, lineTotal: newQty * item.unitPrice }
        : item
      ));
    } else {
      setCart(prev => [...prev, {
        productId: product.id, productName: product.name, sku: product.sku || '',
        quantity: qty, unitPrice: Number(product.price) || 0,
        lineTotal: (Number(product.price) || 0) * qty,
      }]);
    }
    setProductSearch('');
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartItem = (productId: number, field: 'quantity' | 'unitPrice', value: number) => {
    setCart(prev => prev.map(c => {
      if (c.productId !== productId) return c;
      const u = { ...c, [field]: value };
      u.lineTotal = Math.round(u.quantity * u.unitPrice * 100) / 100;
      return u;
    }));
  };

  const cartTotal = cart.reduce((s, c) => s + c.lineTotal, 0);

  // ── Crear pedido ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!canManage) { toast.error('No tienes permisos para crear pedidos'); return; }
    if (!clientId) { toast.error('Selecciona un cliente'); return; }
    if (cart.length === 0) { toast.error('Agrega al menos un producto'); return; }
    if (cart.some(c => c.quantity <= 0 || !Number.isInteger(c.quantity))) {
      toast.error('Las cantidades deben ser números enteros mayores a 0'); return;
    }
    if (cart.some(c => c.unitPrice <= 0)) {
      toast.error('Los precios deben ser mayores a 0'); return;
    }
    // Validar stock disponible
    for (const item of cart) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.stock < item.quantity) {
        toast.error(`Stock insuficiente para "${item.productName}": disponible ${prod.stock}, solicitado ${item.quantity}`);
        return;
      }
    }
    try {
      setCreating(true);
      const res = await createSale({
        clientId: Number(clientId),
        notes: notes.trim() || undefined,
        items: cart.map(c => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })),
      });
      if (res.success) {
        toast.success('Pedido creado correctamente');
        await load();
        setView('list');
        setClientId(''); setNotes(''); setCart([]);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al crear el pedido'); }
    finally { setCreating(false); }
  };

  // ── Ver detalle ────────────────────────────────────────────────────────────
  const openDetail = async (s: ApiSale) => {
    setSelectedSale(s); setView('detail');
    if (!s.items || s.items.length === 0) {
      setLoadingDetail(true);
      try {
        const res = await apiFetch<any>(`/sales/${s.id}`);
        if (res.success) setSelectedSale(res.data);
      } catch { }
      finally { setLoadingDetail(false); }
    }
  };

  // ── Cambiar estado ─────────────────────────────────────────────────────────
  const handleChangeStatus = async (id: number, status: string) => {
    if (!canManage) { toast.error('No tienes permisos para cambiar el estado de pedidos'); return; }
    const sale = sales.find(s => s.id === id) || selectedSale;
    if (sale && !['REGISTERED', 'READY'].includes(sale.status)) {
      toast.error(`Un pedido ${sale.status} no puede cambiar de estado`); return;
    }
    try {
      const res = await updateSaleStatus(String(id), status);
      if (res.success) {
        toast.success(res.message);
        await load();
        if (status === 'COMPLETED') {
          toast.info('El pedido fue completado y se registró como venta', { duration: 4000 });
          setView('list');
          setSelectedSale(null);
        } else if (selectedSale?.id === id) {
          const fresh = await apiFetch<any>(`/sales/${id}`);
          if (fresh.success) setSelectedSale(fresh.data);
        }
      }
    } catch (err: any) { toast.error(err?.message || 'Error al cambiar estado'); }
  };

  // ── Marcar listo para recoger ──────────────────────────────────────────────
  const handleMarkReady = async (id: number) => {
    if (!canManage) { toast.error('No tienes permisos'); return; }
    const sale = sales.find(s => s.id === id) || selectedSale;
    if (sale && sale.status !== 'REGISTERED') {
      toast.error('Solo se pueden marcar como listos los pedidos registrados'); return;
    }
    try {
      const res = await apiFetch<any>(`/sales/${id}/ready`, { method: 'PATCH' });
      if (res.success) {
        toast.success(`✅ Pedido #${id} marcado como listo. Se notificó al cliente por email.`);
        await load();
        if (selectedSale?.id === id) {
          const fresh = await apiFetch<any>(`/sales/${id}`);
          if (fresh.success) setSelectedSale(fresh.data);
        }
      }
    } catch (err: any) { toast.error(err?.message || 'Error al marcar como listo'); }
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
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
    link.download = `pedido-${pdfSale.id}.pdf`;
    link.click();
  };

  const tableColumns: Column<ApiSale>[] = [
    {
      header: '# Pedido',
      accessor: (s) => <span className="font-mono text-sm font-medium">#{s.id}</span>
    },
    {
      header: 'Cliente',
      accessor: (s) => (
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm">{s.client.name}</span>
        </div>
      )
    },
    {
      header: 'Estado',
      accessor: (s) => {
        const st = STATUS_MAP[s.status] || STATUS_MAP.REGISTERED;
        return <Badge className={`${st.color} flex items-center gap-1 w-fit text-xs`}>
          <StatusIcon name={st.iconName} /> {st.label}
        </Badge>
      }
    },
    {
      header: 'Total',
      accessor: (s) => <span className="font-medium text-sm">{formatCOP(Number(s.totalPrice))}</span>,
      className: 'text-right'
    }
  ];

  // ── Vista: Crear pedido ────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="h-[calc(100vh-100px)] p-4 bg-[#f8fafc]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AntButton 
              icon={<ChevronLeft className="h-4 w-4" />} 
              onClick={() => { setView('list'); setClientId(''); setNotes(''); setCart([]); }}
              className="border-none shadow-none bg-white hover:bg-slate-100"
            />
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>
              NUEVO PEDIDO
            </Typography.Title>
          </div>
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <Typography.Text strong className="text-slate-400 text-[10px] uppercase tracking-widest text-primary">RESERVA DE PRODUCTOS</Typography.Text>
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
                      options={products.map(p => ({
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
                  dataSource={products.slice(0, 10)}
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

          {/* LADO DERECHO: CARRITO Y CLIENTE */}
          <Col span={10} className="h-full">
            <div className="h-full flex flex-col bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                <Typography.Text strong className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingCart className="h-3 w-3 text-primary" /> Carrito de Pedido
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

              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <Typography.Text strong className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 block">
                    Información del Cliente
                  </Typography.Text>
                  
                  <div className="space-y-5">
                    <AntSelect
                      showSearch
                      placeholder="Seleccionar cliente registrado..."
                      className="w-full h-12 rounded-xl overflow-hidden border-none shadow-sm"
                      value={clientId || undefined}
                      onChange={setClientId}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={clients.map(c => ({
                        value: String(c.id),
                        label: `${c.name} - ${c.documentNumber || 'S/D'}`,
                      }))}
                    />
                    
                    <Textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      placeholder="Notas del pedido (opcional)..." 
                      rows={2}
                      className="rounded-xl bg-white border-slate-200 text-xs shadow-sm focus:ring-primary"
                    />
                  </div>
                </div>

                <AntTable 
                  dataSource={cart}
                  rowKey="productId"
                  pagination={false}
                  size="small"
                  className="cart-table"
                  columns={[
                    {
                      title: <span className="text-[9px] font-black uppercase text-slate-400">Item</span>,
                      dataIndex: 'productName',
                      render: (name, record) => (
                        <div className="flex flex-col">
                          <span className="font-black text-slate-700 text-[11px] leading-tight">{name}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{record.sku || 'S/S'}</span>
                        </div>
                      )
                    },
                    {
                      title: <span className="text-[9px] font-black uppercase text-slate-400 text-center">Cant</span>,
                      dataIndex: 'quantity',
                      align: 'center',
                      width: 100,
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

              <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 space-y-4">
                <div 
                  className="flex items-center justify-between p-4 rounded-2xl shadow-lg border"
                  style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Pagar</span>
                    <span className="text-2xl font-black text-white tracking-tighter">
                      {formatCOP(cartTotal)}
                    </span>
                  </div>
                  <Store className="h-8 w-8 text-slate-600 opacity-50" />
                </div>

                <AntButton 
                  type="primary"
                  block
                  className="h-14 text-xs font-black uppercase rounded-2xl bg-emerald-600 border-none shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                  disabled={creating || cart.length === 0 || !clientId}
                  onClick={handleCreate}
                  loading={creating}
                >
                  {!creating && <Plus className="h-4 w-4" />}
                  {creating ? 'Procesando...' : 'CREAR PEDIDO'}
                </AntButton>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  // ── Vista: Detalle ─────────────────────────────────────────────────────────
  if (view === 'detail' && selectedSale) {
    const st = STATUS_MAP[selectedSale.status] || STATUS_MAP.REGISTERED;
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('list')}><ChevronLeft className="h-4 w-4 mr-1" /> Volver</Button>
            <div>
              <h1 className="text-xl font-semibold">Pedido #{selectedSale.id}</h1>
              <p className="text-sm text-muted-foreground">{new Date(selectedSale.saleDate).toLocaleDateString('es-CO', { dateStyle: 'long' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${st.color} flex items-center gap-1`}><StatusIcon name={st.iconName} /> {st.label}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b"><p className="text-sm font-medium">Productos</p></div>
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" /><span className="text-sm">Cargando...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium">Producto</th>
                          <th className="text-center px-4 py-3 font-medium">Cantidad</th>
                          <th className="text-right px-4 py-3 font-medium">Precio Unit.</th>
                          <th className="text-right px-4 py-3 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedSale.items || []).map(item => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {item.product?.image && <img src={item.product.image} alt={item.product.name} className="w-8 h-8 rounded object-cover shrink-0" />}
                                <div>
                                  <p className="font-medium">{item.product?.name}</p>
                                  {item.product?.sku && <p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{formatCOP(Number(item.unitPrice))}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCOP(Number(item.lineTotal))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="px-4 py-3 border-t flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-base font-bold text-primary">{formatCOP(Number(selectedSale.totalPrice))}</span>
                </div>
              </CardContent>
            </Card>
            {selectedSale.notes && (
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
                <p className="text-sm">{selectedSale.notes}</p>
              </CardContent></Card>
            )}
          </div>
          <div>
            <Card>
              <CardContent className="p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cliente</p>
                  <p className="font-medium flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" />{selectedSale.client.name}</p>
                  {selectedSale.client.email && <p className="text-xs text-muted-foreground mt-0.5">{selectedSale.client.email}</p>}
                  {selectedSale.client.phone && <p className="text-xs text-muted-foreground">{selectedSale.client.phone}</p>}
                </div>
                {selectedSale.employee && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Vendedor</p>
                    <p className="font-medium">{selectedSale.employee.fullName}</p>
                  </div>
                )}

                {canManage && (
                  <div className="pt-2 space-y-2 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Acciones</p>

                    {selectedSale.status === 'REGISTERED' && (
                      <Button
                        className="w-full h-9 text-sm bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setMarkReadyId(selectedSale.id)}
                      >
                        <PackageCheck className="h-4 w-4 mr-2" />
                        Marcar listo para recoger
                      </Button>
                    )}

                    {(selectedSale.status === 'REGISTERED' || selectedSale.status === 'READY') && (
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-9 text-sm",
                          selectedSale.status === 'READY' 
                            ? "text-green-700 border-green-300 hover:bg-green-50" 
                            : "text-slate-400 border-slate-200 cursor-not-allowed bg-slate-50 opacity-60 hover:bg-slate-50"
                        )}
                        disabled={selectedSale.status === 'REGISTERED'}
                        onClick={() => handleChangeStatus(selectedSale.id, 'COMPLETED')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar entrega
                      </Button>
                    )}

                    {(selectedSale.status === 'REGISTERED' || selectedSale.status === 'READY') && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full h-9 text-sm text-destructive border-destructive/30 hover:bg-destructive/5">
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar pedido
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Cancelar pedido #${selectedSale.id}?</AlertDialogTitle>
                            <AlertDialogDescription>Se notificará al cliente por email. Esta acción no se puede deshacer.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleChangeStatus(selectedSale.id, 'CANCELLED')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, cancelar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {selectedSale.status === 'READY' && selectedSale.readyAt && (
                      <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        <p className="font-medium text-amber-800">⏰ Listo desde:</p>
                        <p className="text-amber-700">{new Date(selectedSale.readyAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        <p className="text-amber-700 mt-1">Expira: {new Date(new Date(selectedSale.readyAt).getTime() + 24*60*60*1000).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: Lista ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Gestión de Pedidos</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {canManage && (
            <Button size="sm" onClick={() => setView('create')}><Plus className="h-4 w-4 mr-1.5" /> Nuevo Pedido</Button>
          )}
        </div>
      </div>

      <DataTable
        title="Pedidos"
        description={`Mostrando ${filtered.length} pedidos`}
        data={filtered}
        columns={tableColumns}
        searchableKeys={['id', 'client.name']}
        searchPlaceholder="Buscar por cliente o número de pedido..."
        itemsPerPage={ITEMS_PER_PAGE}
        isLoading={loading}
        customActions={(s) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(s)} title="Ver detalle">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPdfModal(s)} title="Descargar PDF">
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>
            {s.status === 'REGISTERED' && canManage && (
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Marcar listo para recoger"
                onClick={() => setMarkReadyId(s.id)}>
                <PackageCheck className="h-4 w-4 text-emerald-600" />
              </Button>
            )}
            {(s.status === 'REGISTERED' || s.status === 'READY') && canManage && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-8 w-8 transition-all",
                      s.status === 'READY' ? "text-green-600" : "text-slate-300 cursor-not-allowed"
                    )} 
                    disabled={s.status === 'REGISTERED'}
                    title={s.status === 'READY' ? "Confirmar entrega (completar pedido)" : "Primero debe marcar como listo para recoger"}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar entrega del pedido #${s.id}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El pedido pasará a <strong>Completado</strong>, se descontará el stock y se registrará como venta. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleChangeStatus(s.id, 'COMPLETED')} className="bg-green-600 hover:bg-green-700 text-white">
                      Sí, confirmar entrega
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {(s.status === 'REGISTERED' || s.status === 'READY') && canManage && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Cancelar">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>¿Cancelar pedido #${s.id}?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleChangeStatus(s.id, 'CANCELLED')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, cancelar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
        extraFilters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="REGISTERED">Registrado</SelectItem>
              <SelectItem value="READY">Listo en tienda</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
              <SelectItem value="ANNULED">Anulado</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Diálogo de confirmación para "Marcar listo" */}
      {markReadyId !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 28, maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1A', marginBottom: 10 }}>
              ¿Marcar pedido #${markReadyId} como listo?
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
              Se notificará al cliente por email que su pedido está listo para recoger en tienda. El cliente tendrá <strong>24 horas</strong> para recogerlo.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMarkReadyId(null)}
                style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #E5E5E2', backgroundColor: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button
                onClick={() => { handleMarkReady(markReadyId!); setMarkReadyId(null); }}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', backgroundColor: '#059669', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Sí, marcar como listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-3xl w-full flex flex-col p-0 gap-0" style={{ maxHeight: '90vh' }}>
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" /> Pedido #${pdfSale?.id}
            </DialogTitle>
            <DialogDescription className="sr-only">Vista previa del PDF</DialogDescription>
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
