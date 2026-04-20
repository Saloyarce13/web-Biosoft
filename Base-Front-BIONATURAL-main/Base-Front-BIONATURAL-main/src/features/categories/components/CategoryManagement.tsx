import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import {
  getCategories, createCategory, updateCategory,
  deleteCategory, toggleCategoryStatus
} from '../../../lib/api';
import {
  Plus, Search, Edit, Trash2, Tag, Eye,
  RefreshCw, ChevronLeft, ChevronRight,
  ToggleLeft, ToggleRight, Package
} from 'lucide-react';

interface ApiCategory {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

const ITEMS_PER_PAGE = 8;

// ── Modal crear/editar ─────────────────────────────────────────────────────────
function CategoryFormModal({ open, onClose, title, name, setName, desc, setDesc,
  onSubmit, submitting, submitLabel }: {
  open: boolean; onClose: () => void; title: string;
  name: string; setName: (v: string) => void;
  desc: string; setDesc: (v: string) => void;
  onSubmit: () => void; submitting: boolean; submitLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full flex flex-col p-0 gap-0" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Tag className="h-4 w-4 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: Tés e Infusiones" className="h-9 text-sm" autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Describe brevemente esta categoría..."
              rows={3} className="text-sm resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2 bg-background">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Guardando...' : submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal crear
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Modal editar
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCat, setEditCat] = useState<ApiCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [updating, setUpdating] = useState(false);

  // Modal detalle
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailCat, setDetailCat] = useState<ApiCategory | null>(null);
  const [catProducts, setCatProducts] = useState<any[]>([]);
  const [loadingCatProducts, setLoadingCatProducts] = useState(false);

  const loadCatProducts = async (id: number) => {
    try {
      setLoadingCatProducts(true);
      const { apiFetch } = await import('../../../lib/api');
      const res = await apiFetch<any>(`/categories/${id}`);
      if (res.success) setCatProducts(res.data.products || []);
    } catch { setCatProducts([]); }
    finally { setLoadingCatProducts(false); }
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await getCategories(true);
      if (res.success) setCategories(res.data);
    } catch { toast.error('Error al cargar categorías'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? c.isActive : !c.isActive);
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── Crear ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createName.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!createDesc.trim()) { toast.error('La descripción es obligatoria'); return; }
    try {
      setCreating(true);
      const res = await createCategory({ name: createName.trim(), description: createDesc.trim() });
      if (res.success) {
        await load();
        setIsCreateOpen(false);
        setCreateName(''); setCreateDesc('');
        toast.success(`Categoría "${res.data.name}" creada`);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al crear categoría'); }
    finally { setCreating(false); }
  };

  // ── Editar ─────────────────────────────────────────────────────────────────
  const openEdit = (c: ApiCategory) => {
    setEditCat(c); setEditName(c.name); setEditDesc(c.description || '');
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editCat || !editName.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!editDesc.trim()) { toast.error('La descripción es obligatoria'); return; }
    try {
      setUpdating(true);
      const res = await updateCategory(String(editCat.id), {
        name: editName.trim(), description: editDesc.trim(),
      });
      if (res.success) {
        await load();
        setIsEditOpen(false);
        toast.success(`Categoría "${res.data.name}" actualizada`);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al actualizar categoría'); }
    finally { setUpdating(false); }
  };

  // ── Toggle estado ──────────────────────────────────────────────────────────
  const handleToggle = async (c: ApiCategory) => {
    try {
      const res = await toggleCategoryStatus(String(c.id));
      if (res.success) {
        await load();
        toast.success(res.message);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al cambiar estado'); }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = async (c: ApiCategory) => {
    try {
      const res = await deleteCategory(String(c.id));
      if (res.success) {
        setCurrentPage(1);
        await load();
        toast.success(`Categoría "${c.name}" eliminada`);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al eliminar categoría'); }
  };

  return (
    <div className="space-y-5">

      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" /> Gestión de Categorías
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Administra las categorías de productos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => { setCreateName(''); setCreateDesc(''); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Buscador + filtro estado */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-medium">Categorías</span>
            <span className="text-xs text-muted-foreground">{filtered.length} categoría{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14 gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" /><span className="text-sm">Cargando...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Categoría</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right pr-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                      No se encontraron categorías
                    </TableCell>
                  </TableRow>
                ) : paginated.map(cat => (
                  <TableRow key={cat.id} className={!cat.isActive ? 'opacity-60' : ''}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${cat.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Tag className={`h-4 w-4 ${cat.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{cat.name}</p>
                            <Badge variant={cat.isActive ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                              {cat.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Package className="h-3 w-3" />{cat.productCount} producto{cat.productCount !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${cat.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {cat.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver detalle */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => {
                                setDetailCat(cat);
                                setCatProducts([]);
                                loadCatProducts(cat.id);
                                setIsDetailOpen(true);
                              }}>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalle</TooltipContent>
                        </Tooltip>
                        {/* Editar — bloqueado si inactiva */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => openEdit(cat)} disabled={!cat.isActive}>
                                <Edit className={`h-4 w-4 ${cat.isActive ? 'text-muted-foreground' : 'text-muted-foreground/30'}`} />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{cat.isActive ? 'Editar' : 'Categoría inactiva'}</TooltipContent>
                        </Tooltip>
                        {/* Toggle */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(cat)}>
                              {cat.isActive
                                ? <ToggleRight className="h-4 w-4 text-green-600" />
                                : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{cat.isActive ? 'Desactivar' : 'Activar'}</TooltipContent>
                        </Tooltip>
                        {/* Eliminar — bloqueado si tiene productos o está inactiva */}
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"
                                    disabled={cat.productCount > 0 || !cat.isActive}>
                                    <Trash2 className={`h-4 w-4 ${cat.productCount === 0 && cat.isActive ? 'text-destructive' : 'text-muted-foreground/30'}`} />
                                  </Button>
                                </AlertDialogTrigger>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {cat.productCount > 0 ? 'Tiene productos asignados' : !cat.isActive ? 'Categoría inactiva' : 'Eliminar'}
                            </TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará permanentemente <strong>{cat.name}</strong>. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cat)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

      {/* Modal Crear */}
      <CategoryFormModal
        open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nueva Categoría"
        name={createName} setName={setCreateName} desc={createDesc} setDesc={setCreateDesc}
        onSubmit={handleCreate} submitting={creating} submitLabel="Crear Categoría"
      />

      {/* Modal Editar */}
      <CategoryFormModal
        open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Categoría"
        name={editName} setName={setEditName} desc={editDesc} setDesc={setEditDesc}
        onSubmit={handleUpdate} submitting={updating} submitLabel="Guardar cambios"
      />

      {/* Modal Detalle */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg w-full flex flex-col p-0 gap-0" style={{ maxHeight: '90vh' }}>
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Tag className="h-4 w-4 text-primary" /> {detailCat?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Detalle de categoría</DialogDescription>
          </DialogHeader>
          {detailCat && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
              {detailCat.description && (
                <p className="text-sm text-muted-foreground">{detailCat.description}</p>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estado</p>
                  <Badge variant={detailCat.isActive ? 'default' : 'secondary'}>
                    {detailCat.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Productos activos</p>
                  <div className="flex items-center gap-1 font-medium">
                    <Package className="h-4 w-4 text-primary" />
                    {detailCat.productCount}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Creada</p>
                  <p className="font-medium">{new Date(detailCat.createdAt).toLocaleDateString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Actualizada</p>
                  <p className="font-medium">{new Date(detailCat.updatedAt).toLocaleDateString('es-CO')}</p>
                </div>
              </div>

              <Separator />

              {/* Productos de la categoría */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Productos en esta categoría
                </p>
                {loadingCatProducts ? (
                  <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Cargando...
                  </div>
                ) : catProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Sin productos asignados</p>
                ) : (
                  <div className="space-y-1.5">
                    {catProducts.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {p.image && <img src={p.image} alt={p.name} className="w-7 h-7 rounded object-cover shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            {p.provider && <p className="text-xs text-muted-foreground">{p.provider.name}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant="outline" className="text-xs">{p.stock} uds</Badge>
                          <span className="text-xs font-medium">${Number(p.price).toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="px-6 py-4 border-t shrink-0 flex justify-end bg-background">
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
