import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import { getPurchases, getProviders, getProducts, createPurchase, updatePurchaseStatus, apiFetch } from '../../../lib/api';
import {
  ShoppingCart, Plus, Search, Eye, ChevronLeft, ChevronRight,
  Building2, Package, RefreshCw, Trash2, X, CheckCircle, XCircle, Clock, Ban, Download, FileText
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface ApiPurchase {
  id: number;
  status: 'REGISTERED' | 'COMPLETED' | 'CANCELLED' | 'ANNULED';
  totalPrice: number;
  notes: string | null;
  purchasedAt: string;
  provider: { id: number; name: string };
  employee: { id: number; fullName: string } | null;
  items: ApiPurchaseItem[];
}

interface ApiPurchaseItem {
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
  REGISTERED: { label: 'Registrada',  color: 'bg-blue-100 text-blue-800',   iconName: 'clock' },
  COMPLETED:  { label: 'Completada',  color: 'bg-green-100 text-green-800', iconName: 'check' },
  CANCELLED:  { label: 'Cancelada',   color: 'bg-gray-100 text-gray-800',   iconName: 'x' },
  ANNULED:    { label: 'Anulada',     color: 'bg-red-100 text-red-800',     iconName: 'x' },
};

function PurchaseStatusIcon({ name }: { name: string }) {
  if (name === 'clock') return <Clock className="h-3 w-3" />;
  if (name === 'check') return <CheckCircle className="h-3 w-3" />;
  return <XCircle className="h-3 w-3" />;
}

const ITEMS_PER_PAGE = 8;

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

// ── Panel para agregar items a orden existente ─────────────────────────────────
function AddItemsPanel({ purchaseId, providerId, existingProductIds, onAdd, onRemove, saving }: {
  purchaseId: number;
  providerId: number;
  existingProductIds: number[];
  onAdd: (purchaseId: number, items: CartItem[]) => Promise<void>;
  onRemove: (purchaseId: number, productId: number) => Promise<void>;
  saving: boolean;
}) {
  const [provProducts, setProvProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [addCart, setAddCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<any>(`/providers/${providerId}`);
        if (res.success) setProvProducts(res.data.products || []);
      } catch { }
      finally { setLoading(false); }
    };
    load();
  }, [providerId]);

  const available = provProducts.filter(p =>
    !existingProductIds.includes(p.id) &&
    !addCart.find(c => c.productId === p.id) &&
    (search.length === 0 || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 6);

  const addToAddCart = (p: any) => {
    setAddCart(prev => [...prev, {
      productId: p.id, productName: p.name, sku: p.sku || '',
      quantity: 1, unitPrice: Number(p.cost) || Number(p.price) || 0,
      lineTotal: Number(p.cost) || Number(p.price) || 0,
    }]);
    setSearch('');
  };

  const updateItem = (productId: number, field: 'quantity' | 'unitPrice', value: number) => {
    setAddCart(prev => prev.map(c => {
      if (c.productId !== productId) return c;
      const u = { ...c, [field]: value };
      u.lineTotal = Math.round(u.quantity * u.unitPrice * 100) / 100;
      return u;
    }));
  };

  const handleSubmit = async () => {
    if (addCart.length === 0) return;
    await onAdd(purchaseId, addCart);
    setAddCart([]);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> Agregar más productos
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <RefreshCw className="h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : provProducts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Este proveedor no tiene más productos disponibles</p>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto del proveedor..." style={{ paddingLeft: '2.25rem' }} className="text-sm" />
            </div>
            {available.length > 0 && (
              <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                {available.map(p => (
                  <button key={p.id} type="button" onClick={() => addToAddCart(p)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 text-left text-sm transition-colors">
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">{formatCOP(Number(p.cost) || Number(p.price))}</span>
                  </button>
                ))}
              </div>
            )}
            {addCart.length > 0 && (
              <>
                <div className="space-y-2">
                  {addCart.map(item => (
                    <div key={item.productId} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                      <span className="text-sm flex-1 truncate">{item.productName}</span>
                      <Input type="number" min={1} value={item.quantity}
                        onChange={e => updateItem(item.productId, 'quantity', Number(e.target.value))}
                        className="h-7 w-16 text-xs" />
                      <Input type="number" min={0} step={100} value={item.unitPrice}
                        onChange={e => updateItem(item.productId, 'unitPrice', Number(e.target.value))}
                        className="h-7 w-24 text-xs" />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                        onClick={() => setAddCart(prev => prev.filter(c => c.productId !== item.productId))}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full" onClick={handleSubmit} disabled={saving}>
                  {saving ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : `Agregar ${addCart.length} producto${addCart.length !== 1 ? 's' : ''}`}
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Generar y descargar PDF de orden de compra ─────────────────────────────────
async function generatePurchasePDF(purchase: ApiPurchase): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;

  // ── Encabezado verde ──────────────────────────────────────────────────────
  doc.setFillColor(22, 163, 74); // green-600
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Bionatural', margin, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión · Tienda Naturista', margin, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Orden de Compra #${purchase.id}`, pageW - margin, 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date(purchase.purchasedAt).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text(dateStr, pageW - margin, 20, { align: 'right' });

  const statusLabels: Record<string, string> = {
    REGISTERED: 'Registrada', COMPLETED: 'Completada',
    CANCELLED: 'Cancelada', ANNULED: 'Anulada',
  };
  doc.text(`Estado: ${statusLabels[purchase.status] || purchase.status}`, pageW - margin, 27, { align: 'right' });

  // ── Info proveedor / empleado ─────────────────────────────────────────────
  let y = 42;
  doc.setTextColor(30, 30, 30);

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, (pageW - margin * 2) / 2 - 4, 22, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('PROVEEDOR', margin + 4, y + 7);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(purchase.provider.name, margin + 4, y + 15);

  if (purchase.employee) {
    const ex = margin + (pageW - margin * 2) / 2 + 4;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(ex, y, (pageW - margin * 2) / 2 - 4, 22, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('EMPLEADO RESPONSABLE', ex + 4, y + 7);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(purchase.employee.fullName, ex + 4, y + 15);
  }

  y += 30;

  // ── Tabla de productos ────────────────────────────────────────────────────
  const items = purchase.items || [];
  const rows = items.map(item => [
    item.product?.name || '—',
    item.product?.sku || '—',
    String(item.quantity),
    formatCOP(Number(item.unitPrice)),
    formatCOP(Number(item.lineTotal)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'SKU', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: rows,
    foot: [['', '', '', 'TOTAL', formatCOP(Number(purchase.totalPrice))]],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [240, 253, 244], textColor: [22, 163, 74], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 28, fontStyle: 'normal', textColor: [100, 100, 100] },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    styles: { overflow: 'linebreak', cellPadding: 3 },
  });

  // ── Notas ─────────────────────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  if (purchase.notes) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(margin, finalY + 6, pageW - margin * 2, 18, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text('NOTAS', margin + 4, finalY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 53, 15);
    doc.text(purchase.notes, margin + 4, finalY + 19, { maxWidth: pageW - margin * 2 - 8 });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('Bionatural · Tienda Naturista', margin, pageH - 8);
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}`,
    pageW - margin, pageH - 8, { align: 'right' }
  );

  return doc.output('datauristring');
}

// ── Componente principal ───────────────────────────────────────────────────────
export function PurchaseManagement() {
  const [purchases, setPurchases] = useState<ApiPurchase[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Vista
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedPurchase, setSelectedPurchase] = useState<ApiPurchase | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Formulario nueva compra
  const [providerId, setProviderId] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [creating, setCreating] = useState(false);
  // Productos del proveedor seleccionado
  const [providerProducts, setProviderProducts] = useState<any[]>([]);
  const [loadingProviderProducts, setLoadingProviderProducts] = useState(false);

  // Cargar solo los productos que pertenecen al proveedor seleccionado
  const loadProviderProducts = async (pid: string) => {
    if (!pid) { setProviderProducts([]); return; }
    try {
      setLoadingProviderProducts(true);
      const res = await apiFetch<any>(`/providers/${pid}`);
      if (res.success) {
        setProviderProducts(res.data.products || []);
      }
    } catch { setProviderProducts([]); }
    finally { setLoadingProviderProducts(false); }
  };

  const handleProviderChange = (pid: string) => {
    setProviderId(pid);
    setCart([]);
    setProductSearch('');
    loadProviderProducts(pid);
  };

  // Agregar/quitar items en orden REGISTERED
  const [savingItems, setSavingItems] = useState(false);

  const handleAddItemsToExisting = async (purchaseId: number, items: CartItem[]) => {
    try {
      setSavingItems(true);
      const res = await apiFetch<any>(`/purchases/${purchaseId}/items`, {
        method: 'POST',
        body: JSON.stringify({ items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })) }),
      });
      if (res.success) {
        toast.success('Productos agregados correctamente');
        const fresh = await apiFetch<any>(`/purchases/${purchaseId}`);
        if (fresh.success) setSelectedPurchase(fresh.data);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al agregar productos'); }
    finally { setSavingItems(false); }
  };

  const handleRemoveItemFromExisting = async (purchaseId: number, productId: number) => {
    try {
      const res = await apiFetch<any>(`/purchases/${purchaseId}/items`, {
        method: 'DELETE',
        body: JSON.stringify({ productIds: [productId] }),
      });
      if (res.success) {
        toast.success('Producto eliminado de la orden');
        const fresh = await apiFetch<any>(`/purchases/${purchaseId}`);
        if (fresh.success) setSelectedPurchase(fresh.data);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al eliminar producto'); }
  };

  const load = async () => {
    try {
      setLoading(true);
      const [pRes, provRes, prodRes] = await Promise.all([
        getPurchases(),
        getProviders(true),
        getProducts(true),
      ]);
      if (pRes.success) setPurchases(pRes.data as any);
      if (provRes.success) setProviders(provRes.data.filter((p: any) => p.isActive));
      if (prodRes.success) setProducts(prodRes.data.filter((p: any) => p.isActive));
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Modal PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [pdfPurchase, setPdfPurchase] = useState<ApiPurchase | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const openPdfModal = async (p: ApiPurchase) => {
    setGeneratingPdf(true);
    setPdfModalOpen(true);
    setPdfDataUri('');
    setPdfPurchase(p);
    try {
      // Si no tiene items cargados, los carga primero
      let full = p;
      if (!p.items || p.items.length === 0) {
        const res = await apiFetch<any>(`/purchases/${p.id}`);
        if (res.success) full = res.data;
      }
      const uri = await generatePurchasePDF(full);
      setPdfDataUri(uri);
    } catch { toast.error('Error al generar el PDF'); }
    finally { setGeneratingPdf(false); }
  };

  const downloadPdf = () => {
    if (!pdfDataUri || !pdfPurchase) return;
    const link = document.createElement('a');
    link.href = pdfDataUri;
    link.download = `orden-compra-${pdfPurchase.id}.pdf`;
    link.click();
  };
  const filtered = purchases.filter(p => {
    const matchSearch = p.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.id).includes(searchTerm);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── Carrito ────────────────────────────────────────────────────────────────
  const addToCart = (product: any) => {
    if (cart.find(c => c.productId === product.id)) {
      toast.error('Este producto ya está en la orden');
      return;
    }
    setCart(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      sku: product.sku || '',
      quantity: 1,
      unitPrice: Number(product.cost) || Number(product.price) || 0,
      lineTotal: Number(product.cost) || Number(product.price) || 0,
    }]);
    setProductSearch('');
  };

  const updateCartItem = (productId: number, field: 'quantity' | 'unitPrice', value: number) => {
    setCart(prev => prev.map(c => {
      if (c.productId !== productId) return c;
      const updated = { ...c, [field]: value };
      updated.lineTotal = Math.round(updated.quantity * updated.unitPrice * 100) / 100;
      return updated;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(c => c.productId !== productId));
  };

  const cartTotal = cart.reduce((s, c) => s + c.lineTotal, 0);

  // ── Crear compra ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!providerId) { toast.error('Selecciona un proveedor'); return; }
    if (cart.length === 0) { toast.error('Agrega al menos un producto'); return; }
    if (cart.some(c => c.quantity <= 0)) { toast.error('Las cantidades deben ser mayores a 0'); return; }
    if (cart.some(c => c.unitPrice <= 0)) { toast.error('Los precios deben ser mayores a 0'); return; }

    try {
      setCreating(true);
      const res = await createPurchase({
        providerId: Number(providerId),
        notes: notes.trim() || undefined,
        items: cart.map(c => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })),
      });
      if (res.success) {
        toast.success('Orden de compra creada correctamente');
        await load();
        setView('list');
        setProviderId(''); setNotes(''); setCart([]);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al crear la orden'); }
    finally { setCreating(false); }
  };

  // ── Ver detalle ────────────────────────────────────────────────────────────
  const openDetail = async (p: ApiPurchase) => {
    setSelectedPurchase(p);
    setView('detail');
    if (!p.items || p.items.length === 0) {
      setLoadingDetail(true);
      try {
        const res = await apiFetch<any>(`/purchases/${p.id}`);
        if (res.success) setSelectedPurchase(res.data);
      } catch { }
      finally { setLoadingDetail(false); }
    }
  };

  // ── Cambiar estado ─────────────────────────────────────────────────────────
  const handleChangeStatus = async (id: number, status: string) => {
    try {
      const res = await updatePurchaseStatus(String(id), status);
      if (res.success) {
        toast.success(res.message);
        await load();
        if (selectedPurchase?.id === id) {
          const fresh = await apiFetch<any>(`/purchases/${id}`);
          if (fresh.success) setSelectedPurchase(fresh.data);
        }
      }
    } catch (err: any) { toast.error(err?.message || 'Error al cambiar estado'); }
  };

  // Productos filtrados para búsqueda — solo los del proveedor seleccionado
  const filteredProducts = productSearch.length >= 1
    ? providerProducts.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())
      ).slice(0, 8)
    : providerProducts.slice(0, 8);

  // ── Vista: Crear compra ────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="w-full max-w-lg mb-2">
          <Button variant="ghost" size="sm" onClick={() => { setView('list'); setProviderId(''); setNotes(''); setCart([]); setProviderProducts([]); }}
            className="text-muted-foreground -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Volver al listado
          </Button>
        </div>

        <div className="w-full max-w-lg border rounded-xl shadow-sm bg-card overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 shrink-0">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Nueva Orden de Compra</p>
              <p className="text-xs text-muted-foreground">Los campos con * son obligatorios</p>
            </div>
          </div>

          <div className="px-4 py-4 space-y-4">

            {/* Proveedor */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Proveedor <span className="text-destructive">*</span></Label>
              <Select value={providerId} onValueChange={handleProviderChange}>
                <SelectTrigger className="h-9 text-sm shadow-sm">
                  <SelectValue placeholder="Seleccionar proveedor..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(p => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-sm">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notas */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Observaciones de la orden..." rows={2} className="text-sm resize-none shadow-sm" />
            </div>

            <Separator />

            {/* Productos del proveedor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">
                  Productos <span className="text-destructive">*</span>
                </Label>
                {providerId && !loadingProviderProducts && (
                  <span className="text-xs text-muted-foreground">
                    {providerProducts.length} disponible{providerProducts.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {!providerId ? (
                <div className="rounded-lg border bg-muted/30 px-3 py-4 text-center">
                  <Building2 className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Selecciona un proveedor para ver los productos disponibles</p>
                </div>
              ) : loadingProviderProducts ? (
                <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" /><span className="text-sm">Cargando productos...</span>
                </div>
              ) : providerProducts.length === 0 ? (
                <div className="rounded-lg border bg-muted/30 px-3 py-4 text-center">
                  <Package className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">No hay productos activos disponibles</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                      placeholder="Filtrar por nombre o SKU..." style={{ paddingLeft: '2.25rem' }} className="h-9 text-sm shadow-sm" />
                  </div>
                  <div className="border rounded-lg divide-y max-h-44 overflow-y-auto shadow-sm">
                    {filteredProducts.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Sin resultados</p>
                    ) : filteredProducts.map(p => {
                      const inCart = !!cart.find(c => c.productId === p.id);
                      return (
                        <button key={p.id} type="button" onClick={() => !inCart && addToCart(p)}
                          disabled={inCart}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          {p.image
                            ? <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                            : <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-muted-foreground" /></div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.sku || 'Sin SKU'} · Stock: {p.stock}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground shrink-0">
                            {formatCOP(Number(p.cost) || Number(p.price))}
                          </span>
                          {inCart && <Badge variant="secondary" className="text-xs shrink-0">Agregado</Badge>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Carrito */}
            {cart.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Productos seleccionados ({cart.length})</Label>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.productId} className="rounded-lg border shadow-sm bg-muted/20 px-3 py-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate flex-1">{item.productName}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-2"
                            onClick={() => removeFromCart(item.productId)}>
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
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Subtotal</span>
                          <span className="font-semibold text-foreground">{formatCOP(item.lineTotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center rounded-lg bg-primary/5 border px-3 py-2.5">
                    <span className="text-sm font-semibold">Total de la orden</span>
                    <span className="text-base font-bold text-primary">{formatCOP(cartTotal)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Botones */}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreate} disabled={creating || cart.length === 0 || !providerId} className="flex-1 h-9 text-sm">
                {creating
                  ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Creando...</>
                  : <><Plus className="h-3.5 w-3.5 mr-1.5" />Crear Orden</>}
              </Button>
              <Button variant="outline" onClick={() => { setView('list'); setProviderId(''); setNotes(''); setCart([]); setProviderProducts([]); }}
                className="flex-1 h-9 text-sm">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ── Vista: Detalle de compra ───────────────────────────────────────────────
  if (view === 'detail' && selectedPurchase) {
    const st = STATUS_MAP[selectedPurchase.status] || STATUS_MAP.REGISTERED;
    return (
      <div className="space-y-5">
        {/* Header con acciones */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('list')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Orden #{selectedPurchase.id}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedPurchase.purchasedAt).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </p>
            </div>
          </div>

          {/* Acciones fuera del panel */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${st.color} flex items-center gap-1`}>
              <PurchaseStatusIcon name={st.iconName} /> {st.label}
            </Badge>

            {/* Descargar PDF */}
            <Button size="sm" variant="outline" onClick={() => openPdfModal(selectedPurchase)}>
              <Download className="h-4 w-4 mr-1.5" /> Descargar PDF
            </Button>

            {/* Completar */}
            {selectedPurchase.status === 'REGISTERED' && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700"
                onClick={() => handleChangeStatus(selectedPurchase.id, 'COMPLETED')}>
                <CheckCircle className="h-4 w-4 mr-1.5" /> Completar
              </Button>
            )}

            {/* Cancelar */}
            {selectedPurchase.status === 'REGISTERED' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                    <XCircle className="h-4 w-4 mr-1.5" /> Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar esta orden?</AlertDialogTitle>
                    <AlertDialogDescription>
                      La orden #{selectedPurchase.id} será cancelada. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleChangeStatus(selectedPurchase.id, 'CANCELLED')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Sí, cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Anular — eliminado, una orden completada no se puede anular */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {/* Items */}
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium">Productos</p>
                </div>
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
                        {selectedPurchase.status === 'REGISTERED' && <TableHead className="w-10"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedPurchase.items || []).map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-2">
                              {item.product?.image && (
                                <img src={item.product.image} alt={item.product.name}
                                  className="w-8 h-8 rounded object-cover shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{item.product?.name}</p>
                                {item.product?.sku && <p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right text-sm">{formatCOP(Number(item.unitPrice))}</TableCell>
                          <TableCell className="text-right pr-4 text-sm font-medium">{formatCOP(Number(item.lineTotal))}</TableCell>
                          {selectedPurchase.status === 'REGISTERED' && (
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <X className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Quitar producto?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Se eliminará <strong>{item.product?.name}</strong> de esta orden.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveItemFromExisting(selectedPurchase.id, item.productId)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Quitar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="px-4 py-3 border-t flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-base font-bold text-primary">{formatCOP(Number(selectedPurchase.totalPrice))}</span>
                </div>
              </CardContent>
            </Card>

            {selectedPurchase.notes && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
                  <p className="text-sm">{selectedPurchase.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Agregar productos — solo si REGISTERED */}
            {selectedPurchase.status === 'REGISTERED' && (
              <AddItemsPanel
                purchaseId={selectedPurchase.id}
                providerId={selectedPurchase.provider.id}
                existingProductIds={(selectedPurchase.items || []).map(i => i.productId)}
                onAdd={handleAddItemsToExisting}
                onRemove={handleRemoveItemFromExisting}
                saving={savingItems}
              />
            )}
          </div>

          {/* Info lateral */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Proveedor</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-primary" />
                    {selectedPurchase.provider.name}
                  </p>
                </div>
                {selectedPurchase.employee && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Empleado</p>
                    <p className="font-medium">{selectedPurchase.employee.fullName}</p>
                  </div>
                )}
                <Separator />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: Lista de compras ────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Gestión de Compras
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Órdenes de compra a proveedores</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setView('create')}>
            <Plus className="h-4 w-4 mr-1.5" /> Nueva Orden
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input placeholder="Buscar por proveedor o número de orden..."
            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ paddingLeft: '2.25rem' }} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="REGISTERED">Registrada</SelectItem>
            <SelectItem value="COMPLETED">Completada</SelectItem>
            <SelectItem value="CANCELLED">Cancelada</SelectItem>
            <SelectItem value="ANNULED">Anulada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-medium">Órdenes de Compra</span>
            <span className="text-xs text-muted-foreground">{filtered.length} orden{filtered.length !== 1 ? 'es' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14 gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" /><span className="text-sm">Cargando...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4"># Orden</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right pr-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                      No se encontraron órdenes de compra
                    </TableCell>
                  </TableRow>
                ) : paginated.map(p => {
                  const st = STATUS_MAP[p.status] || STATUS_MAP.REGISTERED;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="pl-4 font-mono text-sm font-medium">#{p.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm">{p.provider.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${st.color} flex items-center gap-1 w-fit text-xs`}>
                          <PurchaseStatusIcon name={st.iconName} /> {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCOP(Number(p.totalPrice))}
                      </TableCell>
                    <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Ver detalle */}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(p)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {/* PDF directo desde la lista */}
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            title="Descargar PDF"
                            onClick={() => openPdfModal(p)}>
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {/* Completar — solo REGISTERED */}
                          {p.status === 'REGISTERED' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              title="Completar orden"
                              onClick={() => handleChangeStatus(p.id, 'COMPLETED')}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {/* Cancelar — solo REGISTERED */}
                          {p.status === 'REGISTERED' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Cancelar orden">
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Cancelar orden #{p.id}?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleChangeStatus(p.id, 'CANCELLED')}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Sí, cancelar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {/* Anular — eliminado, una orden completada no se puede anular */}
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
      {/* Modal PDF */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-3xl w-full flex flex-col p-0 gap-0" style={{ maxHeight: '90vh' }}>
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Orden de Compra #{pdfPurchase?.id}
            </DialogTitle>
            <DialogDescription className="sr-only">Vista previa del PDF</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden min-h-0">
            {generatingPdf ? (
              <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>Generando PDF...</span>
              </div>
            ) : pdfDataUri ? (
              <iframe
                src={pdfDataUri}
                className="w-full h-full border-0"
                style={{ minHeight: '60vh' }}
                title="Vista previa PDF"
              />
            ) : null}
          </div>

          <div className="px-6 py-4 border-t shrink-0 flex justify-between items-center bg-background">
            <p className="text-xs text-muted-foreground">
              {pdfPurchase && `Proveedor: ${pdfPurchase.provider.name}`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPdfModalOpen(false)}>Cerrar</Button>
              <Button size="sm" onClick={downloadPdf} disabled={!pdfDataUri || generatingPdf}>
                <Download className="h-4 w-4 mr-1.5" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
