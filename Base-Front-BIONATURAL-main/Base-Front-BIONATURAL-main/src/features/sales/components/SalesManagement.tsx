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
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import { getSales, getClients, getProducts, createSale, apiFetch } from '../../../lib/api';
import {
  DollarSign, Search, Eye, ChevronLeft, ChevronRight,
  RefreshCw, Users, Package, Download, FileText, CheckCircle, Plus, X, Store
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

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  ANNULED:   'bg-red-100 text-red-800',
  REGISTERED:'bg-blue-100 text-blue-800',
};
const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completada', CANCELLED: 'Cancelada',
  ANNULED: 'Anulada', REGISTERED: 'Registrada',
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
  doc.text(`Estado: ${STATUS_LABELS[sale.status] || sale.status}`, pageW - margin, 27, { align: 'right' });

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
  const canSell = user
    ? ['Administrador', 'administrador', 'Vendedor', 'vendedor'].includes(user.role) ||
      (user.permissions ?? []).includes('sales.manage')
    : false;

  const [sales, setSales] = useState<ApiSale[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('COMPLETED');
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<'list' | 'create'>('list');

  // Formulario venta en tienda
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [creating, setCreating] = useState(false);

  // Detalle
  const [selectedSale, setSelectedSale] = useState<ApiSale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [pdfSale, setPdfSale] = useState<ApiSale | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      // Solo cargar ventas COMPLETADAS en este módulo
      const [sRes, cRes, pRes] = await Promise.all([
        getSales(),
        getClients(),
        getProducts(true),
      ]);
      if (sRes.success) setSales((sRes.data as any[]).filter((s: any) => s.status === 'COMPLETED'));
      if (cRes.success) setClients(cRes.data.filter((c: any) => c.isActive));
      if (pRes.success) setProducts(pRes.data.filter((p: any) => p.isActive));
    } catch { toast.error('Error al cargar ventas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Solo mostrar ventas completadas (y opcionalmente canceladas/anuladas)
  const filtered = sales.filter(s => {
    const matchStatus = statusFilter === 'all' ? s.status !== 'REGISTERED' : s.status === statusFilter;
    const matchSearch = s.client.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(s.id).includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Estadísticas — solo ventas completadas
  const completed = sales.filter(s => s.status === 'COMPLETED');
  const totalRevenue = completed.reduce((s, v) => s + Number(v.totalPrice), 0);
  const totalItems = completed.reduce((s, v) => s + (v.items?.reduce((a, i) => a + i.quantity, 0) || 0), 0);

  // ── Carrito ────────────────────────────────────────────────────────────────
  const filteredProducts = productSearch.length >= 1
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())).slice(0, 8)
    : products.slice(0, 8);

  const addToCart = (product: any) => {
    if (cart.find(c => c.productId === product.id)) { toast.error('Ya está en la venta'); return; }
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

  const handleCreateSale = async () => {
    if (!clientId) { toast.error('Selecciona un cliente'); return; }
    if (cart.length === 0) { toast.error('Agrega al menos un producto'); return; }
    if (cart.some(c => c.quantity <= 0)) { toast.error('Las cantidades deben ser mayores a 0'); return; }
    if (cart.some(c => c.unitPrice <= 0)) { toast.error('Los precios deben ser mayores a 0'); return; }
    // Validar stock
    for (const item of cart) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.stock < item.quantity) {
        toast.error(`Stock insuficiente para "${item.productName}": disponible ${prod.stock}`); return;
      }
    }
    try {
      setCreating(true);
      // Crear directamente como COMPLETED (venta en tienda = inmediata)
      const res = await createSale({
        clientId: Number(clientId),
        notes: notes.trim() || 'Venta en tienda',
        status: 'COMPLETED',
        items: cart.map(c => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })),
      });
      if (res.success) {
        toast.success('Venta registrada correctamente');
        await load();
        setView('list');
        setClientId(''); setNotes(''); setCart([]);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al registrar la venta'); }
    finally { setCreating(false); }
  };

  // ── Vista: Registrar venta en tienda ───────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="w-full max-w-lg mb-2">
          <Button variant="ghost" size="sm" onClick={() => { setView('list'); setClientId(''); setNotes(''); setCart([]); }} className="text-muted-foreground -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Volver al historial
          </Button>
        </div>
        <div className="w-full max-w-lg border rounded-xl shadow-sm bg-card overflow-hidden">
          <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 shrink-0">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Venta en Tienda</p>
              <p className="text-xs text-muted-foreground">Se registra y completa inmediatamente · Los campos con * son obligatorios</p>
            </div>
          </div>
          <div className="px-4 py-4 space-y-4">
            {/* Cliente */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Cliente <span className="text-destructive">*</span></Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-9 text-sm shadow-sm"><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {/* Opción para cliente no registrado */}
                  {clients.find((c: any) => c.name === 'Consumidor Final') && (
                    <SelectItem
                      value={String(clients.find((c: any) => c.name === 'Consumidor Final')!.id)}
                      className="text-sm font-medium text-muted-foreground border-b mb-1">
                      👤 Cliente no registrado (Consumidor Final)
                    </SelectItem>
                  )}
                  {clients.filter((c: any) => c.name !== 'Consumidor Final').map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-sm">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clientId && clients.find((c: any) => String(c.id) === clientId)?.name === 'Consumidor Final' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  ℹ️ La venta se registrará como "Consumidor Final"
                </p>
              )}
            </div>
            {/* Notas */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones de la venta..." rows={2} className="text-sm resize-none shadow-sm" />
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
                    <button key={p.id} type="button" onClick={() => !inCart && addToCart(p)} disabled={inCart || p.stock === 0}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      {p.image ? <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                        : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku || 'Sin SKU'} · Stock: {p.stock}</p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground shrink-0">{formatCOP(Number(p.price))}</span>
                      {inCart && <Badge variant="secondary" className="text-xs shrink-0">Agregado</Badge>}
                      {p.stock === 0 && <Badge variant="destructive" className="text-xs shrink-0">Agotado</Badge>}
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
                    <span className="text-sm font-semibold">Total de la venta</span>
                    <span className="text-base font-bold text-primary">{formatCOP(cartTotal)}</span>
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreateSale} disabled={creating || cart.length === 0 || !clientId} className="flex-1 h-9 text-sm">
                {creating ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Registrando...</> : <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Registrar Venta</>}
              </Button>
              <Button variant="outline" onClick={() => { setView('list'); setClientId(''); setNotes(''); setCart([]); }} className="flex-1 h-9 text-sm">Cancelar</Button>
            </div>
          </div>
        </div>
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
    <div className="space-y-5">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Ventas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Historial de ventas completadas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {canSell && (
            <Button size="sm" onClick={() => setView('create')}>
              <Store className="h-4 w-4 mr-1.5" /> Venta en Tienda
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Ventas completadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCOP(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Ingresos totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Unidades vendidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input placeholder="Buscar por cliente o número de venta..."
            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ paddingLeft: '2.25rem' }} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="COMPLETED">Completadas</SelectItem>
            <SelectItem value="CANCELLED">Canceladas</SelectItem>
            <SelectItem value="ANNULED">Anuladas</SelectItem>
            <SelectItem value="all">Todas (sin pendientes)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-medium">Historial de Ventas</span>
            <span className="text-xs text-muted-foreground">{filtered.length} venta{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-14 gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" /><span className="text-sm">Cargando...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4"># Venta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right pr-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                      No se encontraron ventas
                    </TableCell>
                  </TableRow>
                ) : paginated.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-4 font-mono text-sm font-medium">#{s.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm">{s.client.name}</p>
                          {s.client.email && <p className="text-xs text-muted-foreground">{s.client.email}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-800'} text-xs`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatCOP(Number(s.totalPrice))}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(s)} title="Ver detalle">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPdfModal(s)} title="Descargar PDF">
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">Página {currentPage} de {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
