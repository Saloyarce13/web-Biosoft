import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Switch } from '../../../components/ui/switch';
import { Separator } from '../../../components/ui/separator';
import { DataTable, Column } from '../../../shared/components/DataTable';
import { toast } from 'sonner';
import { getClients, createClient, updateClient, deleteClient, toggleClientStatus } from '../../../lib/api';
import { useDocumentTypesClient } from '../../../shared/contexts/SystemConfigContext';
import {
  Users, Plus, Edit, Trash2, Eye,
  ChevronLeft, Mail, Phone,
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
  const DOCUMENT_TYPES = useDocumentTypesClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const res = await getClients();
      if (res.success) setClients(res.data.filter((c: any) => c.name !== 'Consumidor Final'));
    } catch (err: any) {
      setError(err?.message || 'Error al cargar clientes');
      toast.error('Error al cargar clientes');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const errors = {
    name: touched.name && !formData.name.trim() ? 'El nombre es obligatorio' : '',
    documentType: touched.documentType && !formData.documentType ? 'Selecciona un tipo' : '',
    documentNumber: touched.documentNumber
      ? !formData.documentNumber.trim()
        ? 'El número es obligatorio'
        : !/^\d{8,15}$/.test(formData.documentNumber.trim())
          ? '8-15 dígitos numéricos'
          : ''
      : '',
    email: touched.email && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Email inválido' : '',
    phone: touched.phone && formData.phone && !/^\+?\d{10,20}$/.test(formData.phone) ? '10-20 dígitos (puede incluir +)' : '',
  };

  const touch = (f: keyof FormData) => setTouched(p => ({ ...p, [f]: true }));

  const validate = () => {
    setTouched({ name: true, documentType: true, documentNumber: true, email: true, phone: true });
    const docOk = formData.documentNumber.trim() && /^\d{8,15}$/.test(formData.documentNumber.trim());
    const phoneOk = !formData.phone || /^\+?\d{10,20}$/.test(formData.phone);
    return !!(formData.name.trim() && formData.documentType && docOk && phoneOk &&
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
    return clients.filter(c => {
      const ms = statusFilter === 'all' || (statusFilter === 'active' && c.isActive) || (statusFilter === 'inactive' && !c.isActive);
      return ms;
    });
  }, [clients, statusFilter]);

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

  const tableColumns: Column<Client>[] = [
    {
      header: 'Documento',
      accessor: (client) => (
        client.documentType && client.documentNumber
          ? <div className="text-sm"><span className="font-medium">{client.documentType}</span><p className="text-muted-foreground text-xs">{client.documentNumber}</p></div>
          : <span className="text-muted-foreground text-sm">—</span>
      )
    },
    {
      header: 'Nombre',
      accessor: (client) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className={`text-xs ${client.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <p className="font-medium text-sm">{client.name}</p>
        </div>
      )
    },
    {
      header: 'Email',
      accessor: (client) => <span className="text-sm">{client.email || <span className="text-muted-foreground">—</span>}</span>
    },
    {
      header: 'Teléfono',
      accessor: (client) => <span className="text-sm">{client.phone || <span className="text-muted-foreground">—</span>}</span>
    },
    {
      header: 'Estado',
      accessor: (client) => (
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
      )
    }
  ];

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
          <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</p>
              <p className="text-xs text-muted-foreground">
                {isEdit ? selectedClient?.name : 'Los campos con * son obligatorios'}
              </p>
            </div>
          </div>

          <div className="px-4 py-4 space-y-3">
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
              </div>
            )}

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

            {formData.documentType !== 'NIT' && (
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium">Teléfono</Label>
                <Input id="phone" value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+57 300 123 4567"
                  className="h-9 text-sm shadow-sm" />
              </div>
            )}

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

            <div className="flex items-center justify-between rounded-lg border px-3 py-2 shadow-sm">
              <div>
                <p className="text-xs font-medium">Estado</p>
                <p className="text-xs text-muted-foreground">{formData.isActive ? 'Activo' : 'Inactivo'}</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={v => setFormData(p => ({ ...p, isActive: v }))} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={isEdit ? handleUpdate : handleCreate} className="flex-1 h-9 text-sm">
                {isEdit ? <><Edit className="h-3.5 w-3.5 mr-1.5" />Actualizar</> : <><Plus className="h-3.5 w-3.5 mr-1.5" />Guardar</>}
              </Button>
              <Button variant="outline" onClick={cancel} className="flex-1 h-9 text-sm">Cancelar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />Gestión de Clientes
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Actualizar
          </Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nuevo Cliente</Button>
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

      <DataTable
        title="Clientes"
        description={`Mostrando ${filtered.length} clientes`}
        data={filtered}
        columns={tableColumns}
        searchableKeys={['name', 'email', 'phone', 'documentNumber']}
        searchPlaceholder="Buscar por nombre, email, teléfono o documento..."
        itemsPerPage={ITEMS_PER_PAGE}
        onEdit={(c) => c.isActive ? openEdit(c) : toast.error('Cliente inactivo')}
        onDelete={(c) => c.isActive ? handleDelete(c) : toast.error('Cliente inactivo')}
        isLoading={loading}
        customActions={(client) => (
          <Button
            variant="ghost" size="sm"
            onClick={() => client.isActive && openDetail(client)}
            disabled={!client.isActive}
            title={client.isActive ? 'Ver detalle' : 'Cliente inactivo'}
            className={!client.isActive ? 'opacity-30 h-8 w-8' : 'h-8 w-8'}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        extraFilters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        }
      />

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
