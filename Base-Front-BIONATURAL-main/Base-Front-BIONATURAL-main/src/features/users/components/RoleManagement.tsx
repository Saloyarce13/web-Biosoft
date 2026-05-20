import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';
import { Separator } from '../../../components/ui/separator';
import { toast } from 'sonner';
import { DataTable, Column } from '../../../shared/components/DataTable';
import {
  getRoles, createRole, updateRole, deleteRole,
  getPermissions, assignPermissionToRole, removePermissionFromRole, apiFetch
} from '../../../lib/api';
import {
  Plus, Edit, Trash2, Shield, Users, Eye,
  RefreshCw, UserCheck, Lock, Key, ToggleLeft, ToggleRight
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface ApiRole {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  activeUsers: number;
  _count: { users: number; permissions: number };
}
interface ApiPermission {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}
interface RoleDetail {
  id: number;
  name: string;
  description: string | null;
  users: { id: number; name: string; email: string }[];
  rolePermissions: { permission: { id: number; name: string } }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const MODULE_LABELS: Record<string, string> = {
  roles: 'Roles', users: 'Usuarios', employees: 'Empleados',
  products: 'Productos', categories: 'Categorías', providers: 'Proveedores',
  clients: 'Clientes', purchases: 'Compras', sales: 'Ventas', reports: 'Reportes',
};
const ACTION_LABELS: Record<string, string> = {
  view: 'Ver', manage: 'Gestionar', create: 'Crear', edit: 'Editar', delete: 'Eliminar',
};
function permLabel(name: string) {
  const [mod, act] = name.split('.');
  return act ? `${ACTION_LABELS[act] || act} ${MODULE_LABELS[mod] || mod}` : (MODULE_LABELS[mod] || mod);
}
function groupPermissions(perms: ApiPermission[]) {
  const g: Record<string, ApiPermission[]> = {};
  for (const p of perms) {
    const mod = p.name.split('.')[0];
    if (!g[mod]) g[mod] = [];
    g[mod].push(p);
  }
  return g;
}

const ITEMS_PER_PAGE = 8;

// ── PermissionSelector ───────────────────────
function PermissionSelector({ permissions, sel, onToggle, onToggleAll, onToggleBatch }: {
  permissions: ApiPermission[];
  sel: number[];
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onToggleBatch: (ids: number[], add: boolean) => void;
}) {
  const groups = groupPermissions(permissions);
  const allSel = permissions.length > 0 && sel.length === permissions.length;

  const toggleModule = (perms: ApiPermission[], allModSel: boolean) => {
    const ids = perms.map(p => p.id);
    onToggleBatch(ids, !allModSel);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <Key className="h-3.5 w-3.5 text-primary" /> Permisos
        </Label>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-mono">{sel.length}/{permissions.length}</Badge>
          <button type="button" onClick={onToggleAll} className="text-xs text-primary hover:underline">
            {allSel ? 'Quitar todos' : 'Seleccionar todos'}
          </button>
        </div>
      </div>
      {permissions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 border rounded-lg">Sin permisos disponibles</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="h-56">
            <div className="p-3 space-y-3">
              {Object.entries(groups).map(([mod, perms]) => {
                const allModSel = perms.every(p => sel.includes(p.id));
                return (
                  <div key={mod}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{MODULE_LABELS[mod] || mod}</span>
                      <button type="button"
                        onClick={() => toggleModule(perms, allModSel)}
                        className="text-xs text-muted-foreground hover:text-primary">
                        {allModSel ? 'Quitar' : 'Todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-0.5">
                      {perms.map(p => (
                        <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                          <Checkbox checked={sel.includes(p.id)} onCheckedChange={() => onToggle(p.id)} className="shrink-0" />
                          <span className="text-xs">{permLabel(p.name)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// ── RoleFormModal ────────────────────────────
function RoleFormModal({ open, onClose, title, name, onNameChange, desc, onDescChange,
  permissions, sel, onToggle, onToggleAll, onToggleBatch, onSubmit, submitting, submitLabel, info }: {
  open: boolean; onClose: () => void; title: string;
  name: string; onNameChange: (v: string) => void;
  desc: string; onDescChange: (v: string) => void;
  permissions: ApiPermission[];
  sel: number[]; onToggle: (id: number) => void; onToggleAll: () => void; onToggleBatch: (ids: number[], add: boolean) => void;
  onSubmit: () => void; submitting: boolean; submitLabel: string;
  info?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full flex flex-col p-0 gap-0" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="role-name" className="text-xs font-medium">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role-name"
                value={name}
                onChange={e => onNameChange(e.target.value)}
                placeholder="Ej: Supervisor"
                className="h-9 text-sm"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc" className="text-xs font-medium">Descripción</Label>
              <Input
                id="role-desc"
                value={desc}
                onChange={e => onDescChange(e.target.value)}
                placeholder="Descripción breve..."
                className="h-9 text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          {info}

          <Separator />

          <PermissionSelector
            permissions={permissions}
            sel={sel}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
            onToggleBatch={onToggleBatch}
          />
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

// ── Componente principal ───────────────────────────────────────────────────────
export function RoleManagement() {
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createSelectedPerms, setCreateSelectedPerms] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRole, setEditRole] = useState<ApiRole | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSelectedPerms, setEditSelectedPerms] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailRole, setDetailRole] = useState<RoleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([getRoles(), getPermissions()]);
      if (rolesRes.success) setRoles(rolesRes.data);
      if (permsRes.success) setPermissions(permsRes.data);
    } catch { toast.error('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return roles.filter(r => {
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? r.isActive : !r.isActive);
      return matchStatus;
    });
  }, [roles, statusFilter]);

  const togglePerm = (id: number, sel: number[], setSel: (v: number[]) => void) =>
    setSel(sel.includes(id) ? sel.filter(p => p !== id) : [...sel, id]);
  const toggleAll = (sel: number[], setSel: (v: number[]) => void) =>
    setSel(sel.length === permissions.length ? [] : permissions.map(p => p.id));
  const toggleBatch = (ids: number[], add: boolean, sel: number[], setSel: (v: number[]) => void) => {
    if (add) {
      setSel([...new Set([...sel, ...ids])]);
    } else {
      setSel(sel.filter(id => !ids.includes(id)));
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) { toast.error('El nombre es obligatorio'); return; }
    const nameNorm = createName.trim().toLowerCase();
    if (roles.some(r => r.name.toLowerCase() === nameNorm)) {
      toast.error(`El rol "${createName.trim()}" ya existe`); return;
    }
    try {
      setCreating(true);
      const res = await createRole({ name: createName.trim(), description: createDesc.trim() || undefined });
      if (res.success) {
        for (const id of createSelectedPerms) await assignPermissionToRole(res.data.id, id);
        await load();
        setIsCreateOpen(false);
        setCreateName(''); setCreateDesc(''); setCreateSelectedPerms([]);
        toast.success(`Rol "${res.data.name}" creado`);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al crear rol'); }
    finally { setCreating(false); }
  };

  const openEdit = async (r: ApiRole) => {
    setEditRole(r); setEditName(r.name); setEditDesc(r.description || '');
    setEditSelectedPerms([]); setIsEditOpen(true);
    try {
      const res = await apiFetch<RoleDetail>(`/roles/${r.id}`);
      if (res.success) setEditSelectedPerms(res.data.rolePermissions.map(rp => rp.permission.id));
    } catch { }
  };

  const handleUpdate = async () => {
    if (!editRole || !editName.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      setUpdating(true);
      await updateRole(editRole.id, { name: editName.trim(), description: editDesc.trim() || undefined });
      const detailRes = await apiFetch<RoleDetail>(`/roles/${editRole.id}`);
      const current = detailRes.success ? detailRes.data.rolePermissions.map(rp => rp.permission.id) : [];
      for (const id of editSelectedPerms) { if (!current.includes(id)) await assignPermissionToRole(editRole.id, id); }
      for (const id of current) { if (!editSelectedPerms.includes(id)) await removePermissionFromRole(editRole.id, id); }
      await load(); setIsEditOpen(false);
      toast.success(`Rol "${editName.trim()}" actualizado`);
    } catch (err: any) { toast.error(err?.message || 'Error al actualizar rol'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async (r: ApiRole) => {
    try {
      const res = await deleteRole(r.id);
      if (res.success) { setRoles(p => p.filter(x => x.id !== r.id)); toast.success(`Rol "${r.name}" eliminado`); }
    } catch (err: any) { toast.error(err?.message || 'Error al eliminar rol'); }
  };

  const handleToggleStatus = async (r: ApiRole) => {
    try {
      const res = await apiFetch<{ id: number; name: string; isActive: boolean }>(`/roles/${r.id}/status`, { method: 'PATCH' });
      if (res.success) {
        setRoles(p => p.map(x => x.id === r.id ? { ...x, isActive: res.data.isActive } : x));
        toast.success(res.data.isActive ? `Rol "${r.name}" activado` : `Rol "${r.name}" desactivado`);
      }
    } catch (err: any) { toast.error(err?.message || 'Error al cambiar estado'); }
  };

  const openDetail = async (r: ApiRole) => {
    setDetailRole(null); setIsDetailOpen(true); setLoadingDetail(true);
    try {
      const res = await apiFetch<RoleDetail>(`/roles/${r.id}`);
      if (res.success) setDetailRole(res.data);
    } catch { toast.error('Error al cargar detalle'); }
    finally { setLoadingDetail(false); }
  };

  const tableColumns: Column<ApiRole>[] = [
    {
      header: 'Rol',
      accessor: (r) => (
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${r.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
            <Shield className={`h-4 w-4 ${r.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="font-medium text-sm capitalize">{r.name}</p>
            {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
          </div>
        </div>
      )
    },
    {
      header: 'Usuarios',
      accessor: (r) => (
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{r._count.users}</span>
          <span className="text-xs text-muted-foreground">({r.activeUsers} activo{r.activeUsers !== 1 ? 's' : ''})</span>
        </div>
      )
    },
    {
      header: 'Permisos',
      accessor: (r) => (
        <Badge variant={r._count.permissions > 0 ? 'default' : 'outline'} className="gap-1 text-xs">
          <Key className="h-3 w-3" />{r._count.permissions}
        </Badge>
      )
    },
    {
      header: 'Estado',
      accessor: (r) => (
        <Badge variant={r.isActive ? 'default' : 'secondary'} className="text-xs">
          {r.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Gestión de Roles
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => { setCreateName(''); setCreateDesc(''); setCreateSelectedPerms([]); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Crear Rol
          </Button>
        </div>
      </div>

      <DataTable
        title="Roles"
        description={`Mostrando ${filtered.length} roles`}
        data={filtered}
        columns={tableColumns}
        searchableKeys={['name', 'description']}
        searchPlaceholder="Buscar por nombre o descripción..."
        itemsPerPage={ITEMS_PER_PAGE}
        isLoading={loading}
        customActions={(role) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(role)} title="Ver detalle">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
            {role.name.toLowerCase() !== 'administrador' && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => openEdit(role)} disabled={!role.isActive}
                  title={role.isActive ? 'Editar' : 'Rol inactivo'}>
                  <Edit className={`h-4 w-4 ${role.isActive ? 'text-muted-foreground' : 'text-muted-foreground/30'}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => handleToggleStatus(role)}
                  disabled={role.isActive && role._count.users > 0}
                  title={role.isActive && role._count.users > 0 ? `Tiene ${role._count.users} usuario(s) — no se puede desactivar` : role.isActive ? 'Desactivar' : 'Activar'}>
                  {role.isActive
                    ? <ToggleRight className={`h-4 w-4 ${role._count.users > 0 ? 'text-muted-foreground/30' : 'text-green-600'}`} />
                    : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      disabled={role._count.users > 0 || !role.isActive}
                      title={role._count.users > 0 ? 'Tiene usuarios asignados' : !role.isActive ? 'Rol inactivo' : 'Eliminar'}>
                      <Trash2 className={`h-4 w-4 ${role._count.users === 0 && role.isActive ? 'text-destructive' : 'text-muted-foreground/30'}`} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará permanentemente el rol <strong>{role.name}</strong>. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(role)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
        extraFilters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <RoleFormModal
        open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Rol"
        name={createName} onNameChange={setCreateName}
        desc={createDesc} onDescChange={setCreateDesc}
        permissions={permissions}
        sel={createSelectedPerms}
        onToggle={id => togglePerm(id, createSelectedPerms, setCreateSelectedPerms)}
        onToggleAll={() => toggleAll(createSelectedPerms, setCreateSelectedPerms)}
        onToggleBatch={(ids, add) => toggleBatch(ids, add, createSelectedPerms, setCreateSelectedPerms)}
        onSubmit={handleCreate} submitting={creating} submitLabel="Crear Rol"
      />

      <RoleFormModal
        open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Rol"
        name={editName} onNameChange={setEditName}
        desc={editDesc} onDescChange={setEditDesc}
        permissions={permissions}
        sel={editSelectedPerms}
        onToggle={id => togglePerm(id, editSelectedPerms, setEditSelectedPerms)}
        onToggleAll={() => toggleAll(editSelectedPerms, setEditSelectedPerms)}
        onToggleBatch={(ids, add) => toggleBatch(ids, add, editSelectedPerms, setEditSelectedPerms)}
        onSubmit={handleUpdate} submitting={updating} submitLabel="Guardar cambios"
        info={editRole && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <Users className="h-3.5 w-3.5" />
            {editRole._count.users} usuario{editRole._count.users !== 1 ? 's' : ''} — {editRole.activeUsers} activo{editRole.activeUsers !== 1 ? 's' : ''}
          </div>
        )}
      />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg w-full flex flex-col p-0 gap-0" style={{ maxHeight: '90vh' }}>
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold capitalize">
              <Shield className="h-4 w-4 text-primary" />
              {detailRole?.name || 'Cargando...'}
            </DialogTitle>
            <DialogDescription className="sr-only">Detalle del rol</DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" /><span className="text-sm">Cargando...</span>
            </div>
          ) : detailRole && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
              {detailRole.description && <p className="text-sm text-muted-foreground">{detailRole.description}</p>}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Users className="h-3.5 w-3.5" /> Usuarios ({detailRole.users.length})
                </p>
                {detailRole.users.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin usuarios asignados</p>
                ) : (
                  <div className="space-y-1">
                    {detailRole.users.map(u => (
                      <div key={u.id} className="flex items-center gap-2 bg-muted/30 rounded-md px-3 py-2">
                        <UserCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span className="text-sm font-medium">{u.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Key className="h-3.5 w-3.5" /> Permisos ({detailRole.rolePermissions.length})
                </p>
                {detailRole.rolePermissions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin permisos asignados</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {detailRole.rolePermissions.map(rp => (
                      <div key={rp.permission.id} className="flex items-center gap-1.5 bg-muted/30 rounded-md px-2.5 py-1.5 text-xs">
                        <Lock className="h-3 w-3 text-primary shrink-0" />
                        {permLabel(rp.permission.name)}
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
