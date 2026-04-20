import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import { getSales, getClients, getProducts, createSale, updateSaleStatus, apiFetch } from '../../../lib/api';
import {
  ShoppingCart, Plus, Search, Eye, ChevronLeft, ChevronRight,
  Users, Package, RefreshCw, X, CheckCircle, XCircle, Clock, Download, FileText
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface ApiSale {
  id: number;
  status: 'REGISTERED' | 'COMPLETED' | 'CANCELLED' | 'ANNULED';
  totalPrice: number;
  notes: string | null;
  saleDate: string;
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
  REGISTERED: { label: 'Registrado',  color: 'bg-blue-100 text-blue-800',   iconName: 'clock' },
  COMPLETED:  { label: 'Completado',  color: 'bg-green-100 text-green-800', iconName: 'check' },
  CANCELLED:  { label: 'Cancelado',   color: 'bg-gray-100 text-gray-800',   iconName: 'x' },
  ANNULED:    { label: 'Anulado',     color: 'bg-red-100 text-red-800',     iconName: 'x' },
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedSale, setSelectedSale] = useState<ApiSale | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Formulario nueva venta
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [creating, setCreating] = useState(false);

  // PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [pdfSale, setPdfSale] = useState<ApiSale | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [sRes, cRes, pRes] = await Promise.all([getSales(), getClients(), getProducts(true)]);
      // Solo pedidos pendientes (REGISTERED) y cancelados — los COMPLETED van a Ventas
      if (sRes.success) setSales((sRes.data as any[]).filter((s: any) => s.status === 'REGISTERED' || s.status === 'CANCELLED'));
      if (cRes.success) setClients(cRes.data.filter((c: any) => c.isActive && c.name !== 'Consumidor Final'));
      if (pRes.success) setProducts(pRes.data.filter((p: any) => p.isActive));
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = sales.filter(s => {
    const matchSearch = s.client.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(s.id).includes(searchTerm);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filteredProducts = productSearch.length >= 1
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())).slice(0, 8)
    : products.slice(0, 8);

  // ── Carrito ────────────────────────────────────────────────────────────────
  const addToCart = (product: any) => {
    if (cart.find(c => c.productId === product.id)) { toast.error('Ya está en el pedido'); return; }
    setCart(prev => [...prev, {
      productId: product.id, productName: product.name, sku: product.sku || '',
      quantity: 1, unitPrice: Number(product.price) || 0,
      lineTotal: Number(product.price) || 0,
    }]);
    setProductSearch('');
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
    // Solo REGISTERED puede cambiar
    const sale = sales.find(s => s.id === id) || selectedSale;
    if (sale && sale.status !== 'REGISTERED') {
      toast.error(`Un pedido ${sale.status} no puede cambiar de estado`); return;
    }
    try {
      const res = await updateSaleStatus(String(id), status);
      if (res.success) {
        toast.success(res.message);
        await load();
        // Si se completó, mover a ventas automáticamente
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

  // ── Vista: Crear pedido ────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="w-full max-w-lg mb-2">
          <Button variant="ghost" size="sm" onClick={() => { setView('list'); setClientId(''); setNotes(''); setCart([]); }} className="text-muted-foreground -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Volver al listado
          </Button>
        </div>
        <div className="w-full max-w-lg border rounded-xl shadow-sm bg-card overflow-hidden">
          <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 shrink-0">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Nuevo Pedido</p>
              <p className="text-xs text-muted-foreground">Los campos con * son obligatorios</p>
            </div>
          </div>
          <div className="px-4 py-4 space-y-4">
            {/* Cliente */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Cliente <span className="text-destructive">*</span></Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-9 text-sm shadow-sm"><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-sm">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Notas */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones del pedido..." rows={2} className="text-sm resize-none shadow-sm" />
            </div>
            <Separator />
            {/* Productos */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Productos <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  placeholder="Buscar por nombre o SKU..." style={{ paddingLeft: '2.25rem' }} className="h-9 text-sm shadow-sm" />
              </div>
              <div className="border rounded-lg divide-y max-h-44 overflow-y-auto shadow-sm">
                {filteredProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Sin resultados</p>
                ) : filteredProducts.map(p => {
                  const inCart = !!cart.find(c => c.productId === p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => !inCart && addToCart(p)} disabled={inCart}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      {p.image ? <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                        : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku || 'Sin SKU'} · Stock: {p.stock}</p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground shrink-0">{formatCOP(Number(p.price))}</span>
                      {inCart && <Badge variant="secondary" className="text-xs shrink-0">Agregado</Badge>}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Carrito */}
            {cart.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Productos seleccionados ({cart.length})</Label>
                  {cart.map(item => (
                    <div key={item.productId} className="rounded-lg border shadow-sm bg-muted/20 px-3 py-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate flex-1">{item.productName}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-2" onClick={() => setCart(p => p.filter(c => c.productId !== item.productId))}>
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Cantidad <span className="text-destructive">*</span></Label>
                          <Input type="number" min={1} value={item.quantity}
                            onChange={e => updateCartItem(item.productId, 'quantity', Math.max(1, Number(e.target.value)))}
                            className="h-8 text-sm shadow-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Precio unitario <span className="text-destructive">*</span></Label>
                          <Input type="number" min={0} step={100} value={item.unitPrice}
                            onChange={e => updateCartItem(item.productId, 'unitPrice', Number(e.target.value))}
                            className="h-8 text-sm shadow-sm" />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-semibold text-foreground">{formatCOP(item.lineTotal)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center rounded-lg bg-primary/5 border px-3 py-2.5">
                    <span className="text-sm font-semibold">Total del pedido</span>
                    <span className="text-base font-bold text-primary">{formatCOP(cartTotal)}</span>
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreate} disabled={creating || cart.length === 0 || !clientId} className="flex-1 h-9 text-sm">
                {creating ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Creando...</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Crear Pedido</>}
              </Button>
              <Button variant="outline" onClick={() => { setView('list'); setClientId(''); setNotes(''); setCart([]); }} className="flex-1 h-9 text-sm">Cancelar</Button>
            </div>
          </div>
        </div>
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
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-4">Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right pr-4">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedSale.items || []).map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-2">
                              {item.product?.image && <img src={item.product.image} alt={item.product.name} className="w-8 h-8 rounded object-cover shrink-0" />}
                              <div>
                                <p className="text-sm font-medium">{item.product?.name}</p>
                                {item.product?.sku && <p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right text-sm">{formatCOP(Number(item.unitPrice))}</TableCell>
                          <TableCell className="text-right pr-4 text-sm font-medium">{formatCOP(Number(item.lineTotal))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
          <p className="text-sm text-muted-foreground mt-0.5">Pedidos y ventas a clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          {canManage && (
            <Button size="sm" onClick={() => setView('create')}><Plus className="h-4 w-4 mr-1.5" /> Nuevo Pedido</Button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input placeholder="Buscar por cliente o número de pedido..." value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ paddingLeft: '2.25rem' }} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="REGISTERED">Registrado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
            <SelectItem value="ANNULED">Anulado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-medium">Pedidos</span>
            <span className="text-xs text-muted-foreground">{filtered.length} pedido{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-14 gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" /><span className="text-sm">Cargando...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4"># Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right pr-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No se encontraron pedidos</TableCell></TableRow>
                ) : paginated.map(s => {
                  const st = STATUS_MAP[s.status] || STATUS_MAP.REGISTERED;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="pl-4 font-mono text-sm font-medium">#{s.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm">{s.client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={`${st.color} flex items-center gap-1 w-fit text-xs`}><StatusIcon name={st.iconName} /> {st.label}</Badge></TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatCOP(Number(s.totalPrice))}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(s)} title="Ver detalle">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPdfModal(s)} title="Descargar PDF">
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {s.status === 'REGISTERED' && canManage && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Completar" onClick={() => handleChangeStatus(s.id, 'COMPLETED')}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {s.status === 'REGISTERED' && canManage && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Cancelar">
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>¿Cancelar pedido #{s.id}?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleChangeStatus(s.id, 'CANCELLED')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, cancelar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">Página {currentPage} de {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal PDF */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-3xl w-full flex flex-col p-0 gap-0" style={{ maxHeight: '90vh' }}>
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" /> Pedido #{pdfSale?.id}
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
