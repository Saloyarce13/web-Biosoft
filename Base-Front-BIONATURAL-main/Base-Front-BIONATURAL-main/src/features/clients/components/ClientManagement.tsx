import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Switch } from '../../../components/ui/switch';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import { getClients, createClient, updateClient, deleteClient, toggleClientStatus } from '../../../lib/api';
import {
  Users, Plus, Search, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, Mail, Phone,
  MapPin, User, FileText, RefreshCw, AlertTriangle,
  IdCard,
} from 'lucide-react';

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  documentType: string | null;
  documentNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  documentType: string;
  documentNumber: string;
  isActive: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PEP', label: 'PEP' },
  { value: 'NIT', label: 'NIT' },
  { value: 'Pasaporte', label: 'Pasaporte' },
];

const ITEMS_PER_PAGE = 8;

const emptyForm: FormData = {
  name: '', email: '', phone: '', address: '',
  documentType: 'CC', documentNumber: '', isActive: true,
};

function getInitials(name: string) {
  const p = name.trim().split(' ');
  return p.length >= 2 ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('es-CO'); } catch { return d; }
}

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const res = await getClients();
      // Excluir el cliente genérico "Consumidor Final" — solo se usa en ventas en tienda
      if (res.success) setClients(res.data.filter((c: any) => c.name !== 'Consumidor Final'));
    } catch (err: any) {
      setError(err?.message || 'Error al cargar clientes');
      toast.error('Error al cargar clientes');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Validaciones en tiempo real
  const errors = {
    name: touched.name && !formData.name.trim() ? 'El nombre es obligatorio' : '',
    documentType: touched.documentType && !formData.documentType ? 'Selecciona un tipo' : '',
    documentNumber: touched.documentNumber && !formData.documentNumber.trim() ? 'El número es obligatorio' : '',
    email: touched.email && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Email inválido' : '',
  };

  const touch = (f: keyof FormData) => setTouched(p => ({ ...p, [f]: true }));

  const validate = () => {
    setTouched({ name: true, documentType: true, documentNumber: true, email: true });
    return !!(formData.name.trim() && formData.documentType && formData.documentNumber.trim() &&
      !(formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)));
  };

  const buildPayload = () => {
    const p: any = { name: formData.name.trim(), isActive: formData.isActive };
    if (formData.email.trim()) p.email = formData.email.trim();
    if (formData.phone.trim()) p.phone = formData.phone.trim();
    if (formData.address.trim()) p.address = formData.address.trim();
    if (formData.documentType) p.documentType = formData.documentType;
    if (formData.documentNumber.trim()) p.documentNumber = formData.documentNumber.trim();
    return p;
  };

  const filtered = useMemo(() => {
    let list = clients.filter(c => {
      const q = searchTerm.toLowerCase();
      const m = c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(searchTerm) || (c.documentNumber || '').includes(searchTerm);
      const ms = statusFilter === 'all' || (statusFilter === 'active' && c.isActive) || (statusFilter === 'inactive' && !c.isActive);
      return m && ms;
    });
    list.sort((a, b) => {
      const av = sortBy === 'name' ? a.name.toLowerCase() : a.createdAt;
      const bv = sortBy === 'name' ? b.name.toLowerCase() : b.createdAt;
      return sortOrder === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
    });
    return list;
  }, [clients, searchTerm, statusFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openCreate = () => { setFormData(emptyForm); setTouched({}); setCurrentView('create'); };
  const openEdit = (c: Client) => {
    setFormData({ name: c.name, email: c.email || '', phone: c.phone || '',
      address: c.address || '',
      documentType: c.documentType || 'CC',
      documentNumber: c.documentNumber || '', isActive: c.isActive });
    setTouched({}); setSelectedClient(c); setCurrentView('edit');
  };
  const openDetail = (c: Client) => { setSelectedClient(c); setDetailOpen(true); };
  const cancel = () => { setCurrentView('list'); setSelectedClient(null); setFormData(emptyForm); setTouched({}); };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      const res = await createClient(buildPayload());
      if (res.success) { setClients(p => [res.data, ...p]); cancel(); toast.success(`Cliente "${res.data.name}" registrado`); }
    } catch (err: any) { toast.error(err?.message || 'Error al crear cliente'); }
  };

  const handleUpdate = async () => {
    if (!validate() || !selectedClient) return;
    try {
      const res = await updateClient(String(selectedClient.id), buildPayload());
      if (res.success) { setClients(p => p.map(c => c.id === selectedClient.id ? res.data : c)); cancel(); toast.success(`Cliente "${res.data.name}" actualizado`); }
    } catch (err: any) { toast.error(err?.message || 'Error al actualizar cliente'); }
  };

  const handleToggleStatus = async (c: Client) => {
    try {
      const res = await toggleClientStatus(c.id);
      if (res.success) { setClients(p => p.map(x => x.id === c.id ? res.data : x)); toast.success(res.message); }
    } catch (err: any) { toast.error(err?.message || 'Error al cambiar estado'); }
  };

  const handleDelete = async (c: Client) => {
    try {
      const res = await deleteClient(String(c.id));
      if (res.success) { setClients(p => p.filter(x => x.id !== c.id)); toast.success(`Cliente "${c.name}" eliminado`); }
    } catch (err: any) { toast.error(err?.message || 'Error al eliminar cliente'); }
  };

  // ── Formulario ───────────────────────────────────────────────────────────────
  if (currentView === 'create' || currentView === 'edit') {
    const isEdit = currentView === 'edit';
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
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{isEdit ? 'Editar Cliente' : 'Registrar Cliente'}</p>
              <p className="text-xs text-muted-foreground">
                {isEdit ? selectedClient?.name : 'Los campos con * son obligatorios'}
              </p>
            </div>
          </div>

          {/* Campos */}
          <div className="px-4 py-4 space-y-3">

            {/* Tipo + Número documento — PRIMERO */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="docType" className="text-xs font-medium">
                  Tipo doc. <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.documentType}
                  onValueChange={v => { setFormData(p => ({ ...p, documentType: v })); touch('documentType'); }}>
                  <SelectTrigger id="docType" className={`h-9 text-sm shadow-sm ${errors.documentType ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(d => <SelectItem key={d.value} value={d.value} className="text-sm">{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.documentType && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.documentType}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="docNum" className="text-xs font-medium">
                  {formData.documentType === 'NIT' ? 'NIT (sin dígito)' : 'Nº documento'} <span className="text-destructive">*</span>
                </Label>
                <Input id="docNum" value={formData.documentNumber}
                  onChange={e => setFormData(p => ({ ...p, documentNumber: e.target.value }))}
                  onBlur={() => touch('documentNumber')}
                  placeholder={formData.documentType === 'NIT' ? 'Ej: 900123456' : '1234567890'}
                  className={`h-9 text-sm shadow-sm ${errors.documentNumber ? 'border-destructive' : ''}`} />
                {errors.documentNumber && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.documentNumber}</p>}
              </div>
            </div>

            {/* Dígito de verificación — solo para NIT */}
            {formData.documentType === 'NIT' && (
              <div className="space-y-1">
                <Label htmlFor="digitoVerif" className="text-xs font-medium">
                  Dígito de verificación <span className="text-destructive">*</span>
                </Label>
                <Input id="digitoVerif" value={formData.address?.startsWith('DV:') ? formData.address.slice(3) : ''}
                  onChange={e => {
                    const dv = e.target.value.replace(/\D/g, '').slice(0, 1);
                    const parts = (formData.address || '').split('||').filter(p => !p.startsWith('DV:'));
                    const newVal = dv ? `DV:${dv}` : '';
                    setFormData(p => ({ ...p, address: [newVal, ...parts].filter(Boolean).join('||') }));
                  }}
                  placeholder="0-9"
                  maxLength={1}
                  className="h-9 text-sm shadow-sm w-24"
                  inputMode="numeric" />
                <p className="text-xs text-muted-foreground">Número del 0 al 9 que valida el NIT</p>
              </div>
            )}

            {/* Nombre — cambia según tipo de documento */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-medium">
                {formData.documentType === 'NIT' ? 'Razón Social' : 'Nombre completo'} <span className="text-destructive">*</span>
              </Label>
              <Input id="name" value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                onBlur={() => touch('name')}
                placeholder={formData.documentType === 'NIT' ? 'Ej: Empresa S.A.S.' : 'Ej: María González'}
                className={`h-9 text-sm shadow-sm ${errors.name ? 'border-destructive' : ''}`} />
              {errors.name && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.name}</p>}
            </div>

            {/* Persona de contacto — solo para NIT */}
            {formData.documentType === 'NIT' && (
              <div className="space-y-1">
                <Label htmlFor="contactName" className="text-xs font-medium">Nombre del representante</Label>
                <Input id="contactName"
                  value={(() => {
                    const parts = formData.address?.split('||') || [];
                    const c = parts.find(p => p.startsWith('CONTACT:'));
                    return c ? c.slice(8) : '';
                  })()}
                  onChange={e => {
                    const parts = (formData.address || '').split('||').filter(p => !p.startsWith('CONTACT:'));
                    const newVal = e.target.value ? `CONTACT:${e.target.value}` : '';
                    setFormData(p => ({ ...p, address: [...parts, newVal].filter(Boolean).join('||') }));
                  }}
                  placeholder="Nombre del representante legal"
                  className="h-9 text-sm shadow-sm" />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium">
                {formData.documentType === 'NIT' ? 'Email corporativo' : 'Email'}
              </Label>
              <Input id="email" type="email" value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                onBlur={() => touch('email')}
                placeholder={formData.documentType === 'NIT' ? 'empresa@correo.com' : 'cliente@email.com'}
                className={`h-9 text-sm shadow-sm ${errors.email ? 'border-destructive' : ''}`} />
              {errors.email && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.email}</p>}
            </div>

            {/* Teléfono — solo para personas naturales; para NIT ya está en contacto */}
            {formData.documentType !== 'NIT' && (
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium">Teléfono</Label>
                <Input id="phone" value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+57 300 123 4567"
                  className="h-9 text-sm shadow-sm" />
              </div>
            )}

            {/* Teléfono empresa — para NIT */}
            {formData.documentType === 'NIT' && (
              <div className="space-y-1">
                <Label htmlFor="phoneEmp" className="text-xs font-medium">Teléfono empresa</Label>
                <Input id="phoneEmp"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Ej: 601 234 5678"
                  className="h-9 text-sm shadow-sm" />
              </div>
            )}

            {/* Dirección */}
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-medium">
                {formData.documentType === 'NIT' ? 'Dirección sede principal' : 'Dirección'}
              </Label>
              <Input id="address"
                value={formData.documentType === 'NIT'
                  ? (() => { const parts = (formData.address || '').split('||'); const d = parts.find(p => p.startsWith('DIR:')); return d ? d.slice(4) : ''; })()
                  : (formData.address?.startsWith('DV:') ? '' : formData.address)}
                onChange={e => {
                  if (formData.documentType === 'NIT') {
                    const parts = (formData.address || '').split('||').filter(p => !p.startsWith('DIR:'));
                    const newVal = e.target.value ? `DIR:${e.target.value}` : '';
                    setFormData(p => ({ ...p, address: [...parts, newVal].filter(Boolean).join('||') }));
                  } else {
                    setFormData(p => ({ ...p, address: e.target.value }));
                  }
                }}
                placeholder={formData.documentType === 'NIT' ? 'Calle 100 # 15-20, Bogotá' : 'Calle 50 # 38-20, Bogotá'}
                className="h-9 text-sm shadow-sm" />
            </div>

            {/* Estado */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 shadow-sm">
              <div>
                <p className="text-xs font-medium">Estado</p>
                <p className="text-xs text-muted-foreground">{formData.isActive ? 'Activo' : 'Inactivo'}</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={v => setFormData(p => ({ ...p, isActive: v }))} />
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-1">
              <Button onClick={isEdit ? handleUpdate : handleCreate} className="flex-1 h-9 text-sm">
                {isEdit ? <><Edit className="h-3.5 w-3.5 mr-1.5" />Actualizar</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Registrar</>}
              </Button>
              <Button variant="outline" onClick={cancel} className="flex-1 h-9 text-sm">Cancelar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista principal ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />Gestión de Clientes
          </h2>
          <p className="text-muted-foreground">Administra la base de datos de clientes ({filtered.length} registros)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Actualizar
          </Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Registrar Cliente</Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /><span>{error}</span>
            <Button variant="outline" size="sm" onClick={load} className="ml-auto">Reintentar</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, email, teléfono o documento..."
                value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={v => { const [f, o] = v.split('-'); setSortBy(f as any); setSortOrder(o as any); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                <SelectItem value="createdAt-desc">Más reciente</SelectItem>
                <SelectItem value="createdAt-asc">Más antiguo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>Mostrando {paginated.length} de {filtered.length} clientes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" /><span>Cargando clientes...</span>
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No se encontraron clientes</p>
              {searchTerm && <p className="text-sm">Intenta con otro término de búsqueda</p>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(client => (
                  <TableRow key={client.id} className={!client.isActive ? 'opacity-60' : ''}>
                    <TableCell>
                      {client.documentType && client.documentNumber
                        ? <div className="text-sm"><span className="font-medium">{client.documentType}</span><p className="text-muted-foreground text-xs">{client.documentNumber}</p></div>
                        : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs ${client.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm">{client.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{client.email || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">{client.phone || <span className="text-muted-foreground">—</span>}</TableCell>
                    {/* Estado: toggle + texto */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={client.isActive}
                          onCheckedChange={() => handleToggleStatus(client)}
                          className="scale-90"
                        />
                        <span className="text-sm text-muted-foreground">
                          {client.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    {/* Acciones: bloqueadas si inactivo, excepto el toggle */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver detalle */}
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => client.isActive && openDetail(client)}
                          disabled={!client.isActive}
                          title={client.isActive ? 'Ver detalle' : 'Cliente inactivo'}
                          className={!client.isActive ? 'opacity-30 cursor-not-allowed' : ''}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        {/* Editar */}
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => client.isActive && openEdit(client)}
                          disabled={!client.isActive}
                          title={client.isActive ? 'Editar' : 'Cliente inactivo'}
                          className={!client.isActive ? 'opacity-30 cursor-not-allowed' : ''}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        {/* Eliminar — solo si activo */}
                        {client.isActive ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Eliminar">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente a <strong>{client.name}</strong>. No se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(client)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button variant="ghost" size="sm" disabled title="Cliente inactivo" className="opacity-30 cursor-not-allowed">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Siguiente<ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal detalle */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><User className="h-5 w-5" />Detalle del Cliente</DialogTitle>
            <DialogDescription>Información de {selectedClient?.name}</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-base bg-primary/10 text-primary">{getInitials(selectedClient.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedClient.name}</h3>
                  <Badge className={selectedClient.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selectedClient.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-2.5 text-sm">
                <div className="flex items-center gap-2"><IdCard className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Documento</p><p className="font-medium">{selectedClient.documentType && selectedClient.documentNumber ? `${selectedClient.documentType}: ${selectedClient.documentNumber}` : '—'}</p></div></div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selectedClient.email || '—'}</p></div></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Teléfono</p><p className="font-medium">{selectedClient.phone || '—'}</p></div></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Dirección</p><p className="font-medium">{selectedClient.documentType === 'NIT' ? (selectedClient.address?.split('||').find(p => p.startsWith('DIR:'))?.slice(4) || '—') : (selectedClient.address || '—')}</p></div></div>

                {/* Datos adicionales para NIT */}
                {selectedClient.documentType === 'NIT' && (
                  <>
                    <Separator />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos del representante</p>
                    {(() => {
                      const parts = (selectedClient.address || '').split('||');
                      const dv = parts.find(p => p.startsWith('DV:'))?.slice(3);
                      const contact = parts.find(p => p.startsWith('CONTACT:'))?.slice(8);
                      const dir = parts.find(p => p.startsWith('DIR:'))?.slice(4);
                      return (
                        <>
                          {dv && (
                            <div className="flex items-center gap-2">
                              <IdCard className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div><p className="text-xs text-muted-foreground">Dígito de verificación</p><p className="font-medium">{dv}</p></div>
                            </div>
                          )}
                          {contact && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div><p className="text-xs text-muted-foreground">Nombre del representante</p><p className="font-medium">{contact}</p></div>
                            </div>
                          )}
                          {dir && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div><p className="text-xs text-muted-foreground">Dirección sede</p><p className="font-medium">{dir}</p></div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}

                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Registrado</p><p className="font-medium">{fmtDate(selectedClient.createdAt)}</p></div></div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
            <Button
              onClick={() => { setDetailOpen(false); if (selectedClient) openEdit(selectedClient); }}
              disabled={!selectedClient?.isActive}
              title={!selectedClient?.isActive ? 'Cliente inactivo — actívalo primero' : 'Editar'}
            >
              <Edit className="h-4 w-4 mr-2" />Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
