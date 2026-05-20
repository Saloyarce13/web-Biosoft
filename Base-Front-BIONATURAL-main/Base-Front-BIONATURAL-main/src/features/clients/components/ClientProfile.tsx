import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import {
  User, Mail, Phone, MapPin, Edit3, Save,
  Shield, Lock, Eye, EyeOff, CheckCircle, Calendar,
  RefreshCw, CreditCard, LogOut, Leaf, Package, ArrowLeft
} from 'lucide-react';

interface ClientProfileProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
  onLogout: () => void;
  onNameChange?: (newName: string) => void;
}

interface ClientData {
  id: number; name: string; email: string;
  phone: string | null; address: string | null;
  documentType: string | null; documentNumber: string | null;
  isActive: boolean;
}

interface UserData {
  id: number; name: string; email: string;
  createdAt: string; emailVerified: boolean;
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const meRes = await apiFetch<UserData>('/auth/me');
        if (meRes.success) setUserData(meRes.data);
        const clientsRes = await apiFetch<ClientData[]>('/clients');
        if (clientsRes.success) {
          const mine = (clientsRes.data as any[]).find((c: any) => c.email?.toLowerCase() === user.email.toLowerCase());
          if (mine) setClientData(mine);
        }
        const salesRes = await apiFetch<any[]>('/sales');
        if (salesRes.success) {
          setOrderCount((salesRes.data as any[]).filter((s: any) => s.client?.email?.toLowerCase() === user.email.toLowerCase()).length);
        }
      } catch { toast.error('Error al cargar el perfil'); }
      finally { setLoading(false); }
    };
    load();
  }, [user.email]);

  const openEdit = () => {
    setEditForm({ name: userData?.name || clientData?.name || '', phone: clientData?.phone || '', address: clientData?.address || '' });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const newName = editForm.name.trim();
      if (clientData) {
        await apiFetch(`/clients/${clientData.id}`, { method: 'PUT', body: JSON.stringify({ name: newName, phone: editForm.phone.trim() || null, address: editForm.address.trim() || null }) });
        setClientData(prev => prev ? { ...prev, name: newName, phone: editForm.phone || null, address: editForm.address || null } : prev);
      }
      await apiFetch('/users/me/profile', { method: 'PATCH', body: JSON.stringify({ name: newName }) });
      setUserData(prev => prev ? { ...prev, name: newName } : prev);
      onNameChange?.(newName);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) { toast.error(err?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current) { toast.error('Ingresa tu contraseña actual'); return; }
    if (pwForm.new.length < 8) { toast.error('Mínimo 8 caracteres'); return; }
    if (pwForm.new !== pwForm.confirm) { toast.error('Las contraseñas no coinciden'); return; }
    setSaving(true);
    try {
      await apiFetch(`/users/${userData?.id}/password`, { method: 'PATCH', body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.new }) });
      setPwForm({ current: '', new: '', confirm: '' });
      setIsChangingPassword(false);
      toast.success('Contraseña actualizada');
    } catch (err: any) { toast.error(err?.message || 'Error al cambiar contraseña'); }
    finally { setSaving(false); }
  };

  const displayName = userData?.name || clientData?.name || user.name;
  const displayEmail = userData?.email || user.email;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 1280, margin: '0 auto' }}>

      {/* Banner — igual al de la tienda */}
      <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 180, marginBottom: 28, background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #3A7D44 100%)' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 220, height: 220, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 80, width: 180, height: 180, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(129,199,132,0.2)', border: '1px solid rgba(129,199,132,0.4)', borderRadius: 99, padding: '4px 12px', marginBottom: 10, width: 'fit-content' }}>
            <Leaf style={{ width: 11, height: 11, color: '#81C784' }} />
            <span style={{ fontSize: 10, color: '#81C784', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Mi cuenta</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 6 }}>
            {displayName.split(' ')[0]}, tu perfil 👤
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            {userData?.createdAt ? `Miembro hace ${memberDuration(userData.createdAt)} · ${orderCount} pedido${orderCount !== 1 ? 's' : ''}` : 'Gestiona tu información personal'}
          </p>
        </div>
        {/* Botón volver */}
        <button onClick={onBack} style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: '7px 14px', borderRadius: 10 }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Volver a la tienda
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10, color: '#737370' }}>
          <RefreshCw style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Cargando perfil...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Columna izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tarjeta avatar */}
            <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#3A7D44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{getUserInitials(displayName)}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1A', margin: '0 0 2px', letterSpacing: '-0.01em' }}>{displayName}</h3>
                  <p style={{ fontSize: 13, color: '#737370', margin: '0 0 6px' }}>{displayEmail}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1B4332', backgroundColor: '#D8F3DC', padding: '3px 10px', borderRadius: 99 }}>Cliente BioNatural</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={openEdit} style={{ flex: 1, height: 38, borderRadius: 10, backgroundColor: '#3A7D44', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2D6A4F')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3A7D44')}>
                  <Edit3 style={{ width: 14, height: 14 }} /> Editar perfil
                </button>
                <button onClick={() => setIsChangingPassword(true)} style={{ flex: 1, height: 38, borderRadius: 10, backgroundColor: 'white', color: '#374151', border: '1px solid #E5E5E2', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                  <Lock style={{ width: 14, height: 14 }} /> Contraseña
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: Package, label: 'Pedidos', value: String(orderCount), bg: '#EFF6FF', color: '#3B82F6' },
                { icon: Calendar, label: 'Miembro', value: userData?.createdAt ? memberDuration(userData.createdAt) : '—', bg: '#F5F3FF', color: '#8B5CF6' },
              ].map(({ icon: Icon, label, value, bg, color }) => (
                <div key={label} style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #E5E5E2', padding: '16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 17, height: 17, color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#1C1C1A', margin: 0 }}>{value}</p>
                    <p style={{ fontSize: 11, color: '#737370', margin: '1px 0 0' }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cerrar sesión */}
            <button onClick={onLogout} style={{ width: '100%', height: 42, borderRadius: 12, backgroundColor: 'white', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
              <LogOut style={{ width: 15, height: 15 }} /> Cerrar sesión
            </button>
          </div>

          {/* Columna derecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Información personal */}
            <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#737370', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 14px' }}>Información personal</p>
              {[
                { icon: Mail, label: 'Email', value: displayEmail },
                { icon: Phone, label: 'Teléfono', value: clientData?.phone || null },
                { icon: MapPin, label: 'Dirección', value: clientData?.address || null },
                ...(clientData?.documentType || clientData?.documentNumber ? [{ icon: CreditCard, label: 'Documento', value: `${clientData?.documentType || ''} ${clientData?.documentNumber || ''}`.trim() }] : []),
              ].map(({ icon: Icon, label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid #F4F4F2' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 15, height: 15, color: '#3A7D44' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: '#737370', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 14, color: value ? '#1C1C1A' : '#B0B0AC', margin: '1px 0 0', fontWeight: value ? 500 : 400, fontStyle: value ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {value || 'No registrado'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Seguridad */}
            <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#737370', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 14px' }}>Seguridad</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: Lock, label: 'Contraseña', sub: 'Protege tu cuenta', iconBg: '#FEF3C7', iconColor: '#D97706', action: () => setIsChangingPassword(true), actionLabel: 'Cambiar', right: null },
                  { icon: Mail, label: 'Email', sub: displayEmail, iconBg: '#EFF6FF', iconColor: '#3B82F6', action: null, actionLabel: null, right: <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, backgroundColor: userData?.emailVerified ? '#D8F3DC' : '#FEF3C7', color: userData?.emailVerified ? '#1B4332' : '#92400E' }}>{userData?.emailVerified ? 'Verificado' : 'Pendiente'}</span> },
                ].map(({ icon: Icon, label, sub, iconBg, iconColor, action, actionLabel, right }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, backgroundColor: '#FAFAF8', border: '1px solid #E5E5E2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: 14, height: 14, color: iconColor }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', margin: 0 }}>{label}</p>
                        <p style={{ fontSize: 11, color: '#737370', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{sub}</p>
                      </div>
                    </div>
                    {action ? (
                      <button onClick={action} style={{ fontSize: 12, fontWeight: 600, color: '#3A7D44', background: 'none', border: '1px solid #B7E4C7', cursor: 'pointer', padding: '5px 12px', borderRadius: 8, backgroundColor: '#F0FDF4' }}>{actionLabel}</button>
                    ) : right}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
            {[{ label: 'Nombre completo', key: 'name' as const, placeholder: 'Tu nombre' }, { label: 'Teléfono', key: 'phone' as const, placeholder: '+57 300 000 0000' }, { label: 'Dirección', key: 'address' as const, placeholder: 'Tu dirección' }].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input value={editForm[key]} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="h-9 text-sm" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E5E2', backgroundColor: 'white', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: '#3A7D44', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save style={{ width: 13, height: 13 }} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
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
                <Label className="text-xs">{field === 'current' ? 'Contraseña actual' : field === 'new' ? 'Nueva contraseña' : 'Confirmar contraseña'}</Label>
                <div className="relative">
                  <Input type={showPw[field] ? 'text' : 'password'} value={pwForm[field]} onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))} className="h-9 text-sm pr-9" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPw[field] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setIsChangingPassword(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E5E2', backgroundColor: 'white', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancelar</button>
            <button onClick={handleChangePassword} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: '#3A7D44', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock style={{ width: 13, height: 13 }} /> {saving ? 'Guardando...' : 'Cambiar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
