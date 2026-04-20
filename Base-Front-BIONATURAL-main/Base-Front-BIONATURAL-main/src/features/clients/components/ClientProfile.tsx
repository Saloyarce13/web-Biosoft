import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import {
  User, Mail, Phone, MapPin, Edit3, Save, Home,
  Shield, Lock, Eye, EyeOff, CheckCircle, Calendar,
  RefreshCw, CreditCard, FileText
} from 'lucide-react';

interface ClientProfileProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
  onLogout: () => void;
  onNameChange?: (newName: string) => void;
}

interface ClientData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  documentType: string | null;
  documentNumber: string | null;
  isActive: boolean;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  emailVerified: boolean;
}

function getUserInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function memberDuration(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return `${days} día${days !== 1 ? 's' : ''}`;
  if (days < 365) { const m = Math.floor(days / 30); return `${m} mes${m !== 1 ? 'es' : ''}`; }
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return `${y} año${y !== 1 ? 's' : ''}${m > 0 ? ` y ${m} mes${m !== 1 ? 'es' : ''}` : ''}`;
}

export function ClientProfile({ user, onBack, onLogout, onNameChange }: ClientProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  // Cargar datos reales
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Datos del usuario autenticado
        const meRes = await apiFetch<UserData>('/auth/me');
        if (meRes.success) setUserData(meRes.data);

        // Datos del cliente (teléfono, dirección, documento)
        const clientsRes = await apiFetch<ClientData[]>('/clients');
        if (clientsRes.success) {
          const mine = (clientsRes.data as any[]).find(
            (c: any) => c.email?.toLowerCase() === user.email.toLowerCase()
          );
          if (mine) setClientData(mine);
        }

        // Contar pedidos reales
        const salesRes = await apiFetch<any[]>('/sales');
        if (salesRes.success) {
          const mine = (salesRes.data as any[]).filter(
            (s: any) => s.client?.email?.toLowerCase() === user.email.toLowerCase()
          );
          setOrderCount(mine.length);
        }
      } catch {
        toast.error('Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.email]);

  const openEdit = () => {
    setEditForm({
      name: userData?.name || clientData?.name || '',
      phone: clientData?.phone || '',
      address: clientData?.address || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const newName = editForm.name.trim();

      // Actualizar tabla clients
      if (clientData) {
        await apiFetch(`/clients/${clientData.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: newName,
            phone: editForm.phone.trim() || null,
            address: editForm.address.trim() || null,
          }),
        });
        setClientData(prev => prev ? { ...prev, name: newName, phone: editForm.phone || null, address: editForm.address || null } : prev);
      }

      // Actualizar nombre en users via endpoint propio del usuario
      await apiFetch('/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      });
      setUserData(prev => prev ? { ...prev, name: newName } : prev);

      // Notificar al header para que actualice el nombre en tiempo real
      onNameChange?.(newName);

      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current) { toast.error('Ingresa tu contraseña actual'); return; }
    if (pwForm.new.length < 8) { toast.error('La nueva contraseña debe tener al menos 8 caracteres'); return; }
    if (pwForm.new !== pwForm.confirm) { toast.error('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      await apiFetch(`/users/${userData?.id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.new }),
      });
      setPwForm({ current: '', new: '', confirm: '' });
      setIsChangingPassword(false);
      toast.success('Contraseña actualizada');
    } catch (err: any) {
      toast.error(err?.message || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  const displayName = userData?.name || clientData?.name || user.name;
  const displayEmail = userData?.email || user.email;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <Home className="h-4 w-4 mr-1.5" /> Inicio
          </Button>
          <h1 className="text-base font-semibold">Mi Perfil</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={onLogout}>
          <Shield className="h-4 w-4 mr-1.5" /> Cerrar Sesión
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando perfil...</span>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-4 space-y-4">

          {/* Avatar + nombre */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {getUserInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold">{displayName}</h2>
                    <Badge className="bg-teal-100 text-teal-800 text-xs">Cliente</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{displayEmail}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={openEdit}>
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Editar perfil
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                  <Lock className="h-3.5 w-3.5 mr-1.5" /> Cambiar contraseña
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Miembro desde</p>
                  <p className="text-sm font-semibold">
                    {userData?.createdAt ? memberDuration(userData.createdAt) : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos realizados</p>
                  <p className="text-sm font-semibold">{orderCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información personal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{displayEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium">{clientData?.phone || <span className="text-muted-foreground italic">No registrado</span>}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p className="text-sm font-medium">{clientData?.address || <span className="text-muted-foreground italic">No registrada</span>}</p>
                </div>
              </div>
              {(clientData?.documentType || clientData?.documentNumber) && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Documento</p>
                    <p className="text-sm font-medium">{clientData.documentType} {clientData.documentNumber}</p>
                  </div>
                </div>
              )}
              {userData?.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Miembro desde</p>
                    <p className="text-sm font-medium">
                      {new Date(userData.createdAt).toLocaleDateString('es-CO', { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" /> Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Contraseña</p>
                    <p className="text-xs text-muted-foreground">Protege tu cuenta</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>Cambiar</Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">{displayEmail}</p>
                  </div>
                </div>
                <Badge className={userData?.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {userData?.emailVerified ? 'Verificado' : 'Pendiente'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Mis accesos — solo lectura */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Mis Accesos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Lo que puedes hacer como cliente en Bionatural</p>
              <div className="space-y-2">
                {[
                  { icon: '🛍️', label: 'Ver y comprar productos de la tienda' },
                  { icon: '📦', label: 'Ver el historial de tus pedidos' },
                  { icon: '❤️', label: 'Guardar productos en favoritos' },
                  { icon: '👤', label: 'Editar tu perfil y datos de contacto' },
                  { icon: '🔒', label: 'Cambiar tu contraseña' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40">
                    <span className="text-base leading-none">{icon}</span>
                    <span className="text-xs text-foreground">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 italic">
                Estos accesos son fijos para todos los clientes y no pueden modificarse.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog editar perfil */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Actualiza tu información de contacto</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre completo</Label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+57 300 000 0000" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dirección</Label>
              <Input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} placeholder="Tu dirección" className="h-9 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog cambiar contraseña */}
      <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>Mínimo 8 caracteres</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {(['current', 'new', 'confirm'] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">
                  {field === 'current' ? 'Contraseña actual' : field === 'new' ? 'Nueva contraseña' : 'Confirmar contraseña'}
                </Label>
                <div className="relative">
                  <Input
                    type={showPw[field] ? 'text' : 'password'}
                    value={pwForm[field]}
                    onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                    className="h-9 text-sm pr-9"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPw[field] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleChangePassword} disabled={saving}>
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Guardando...' : 'Cambiar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
