import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';
import { authRegister, apiFetch } from '../../../lib/api';
import { useDocumentTypesUser } from '../../../shared/contexts/SystemConfigContext';
import {
  Leaf, Mail, Lock, User, Phone, UserPlus,
  ArrowLeft, Eye, EyeOff, CreditCard, CheckCircle, AlertTriangle
} from 'lucide-react';

interface AuthRegisterProps {
  onLogin: (userData: { name: string; email: string; role: string; permissions?: string[] }) => void;
  onBack: () => void; // volver al login
}

// Tipos de documento — se cargan desde la BD vía SystemConfigContext
// (ver useDocumentTypesUser en el componente AuthRegister)

// ── Input de contraseña con ojito ──────────────────────────────────────────────
function PasswordInput({ id, value, onChange, placeholder, label, required }: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; label: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input id={id} type={show ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '••••••••'}
          className="pl-10 pr-10 h-9 text-sm shadow-sm" />
        <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Indicador de fortaleza de contraseña ──────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 8,          label: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(password),        label: 'Una mayúscula' },
    { ok: /\d/.test(password),           label: 'Un número' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Un carácter especial' },
  ];
  const passed = checks.filter(c => c.ok).length;
  const colors = ['bg-destructive', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte'];

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < passed ? colors[passed - 1] : 'bg-muted'}`} />
        ))}
      </div>
      <p className={`text-xs ${passed >= 3 ? 'text-green-600' : 'text-muted-foreground'}`}>
        {labels[passed - 1] || 'Muy débil'}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map((c, i) => (
          <p key={i} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-green-600' : 'text-muted-foreground'}`}>
            {c.ok ? <CheckCircle className="h-3 w-3 shrink-0" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/40 shrink-0" />}
            {c.label}
          </p>
        ))}
      </div>
    </div>
  );
}

export function AuthRegister({ onLogin, onBack }: AuthRegisterProps) {
  const DOCUMENT_TYPES = useDocumentTypesUser();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    documentType: 'CC', documentNumber: '', password: '', confirmPassword: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));
  const touch = (field: string) => setTouched(p => ({ ...p, [field]: true }));

  // Validaciones en tiempo real
  const errors: Record<string, string> = {};
  if (touched.firstName && !form.firstName.trim()) errors.firstName = 'El nombre es obligatorio';
  if (touched.lastName && !form.lastName.trim()) errors.lastName = 'El apellido es obligatorio';
  if (touched.email) {
    if (!form.email.trim()) errors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email inválido';
  }
  if (touched.phone && form.phone && !/^\d+$/.test(form.phone)) errors.phone = 'Solo números, sin espacios';
  if (touched.documentNumber) {
    if (!form.documentNumber.trim()) errors.documentNumber = 'El número es obligatorio';
    else if (!/^\d{1,15}$/.test(form.documentNumber)) errors.documentNumber = '1-15 dígitos numéricos';
  }
  if (touched.password) {
    if (!form.password) errors.password = 'La contraseña es obligatoria';
    else if (form.password.length < 8) errors.password = 'Mínimo 8 caracteres';
    else if (!/[A-Z]/.test(form.password)) errors.password = 'Debe tener al menos una mayúscula';
    else if (!/\d/.test(form.password)) errors.password = 'Debe tener al menos un número';
    else if (!/[^A-Za-z0-9]/.test(form.password)) errors.password = 'Debe tener al menos un carácter especial';
  }
  if (touched.confirmPassword && form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  const isValid = !Object.keys(errors).length &&
    form.firstName.trim() && form.lastName.trim() && form.email.trim() &&
    form.documentNumber.trim() && form.password && form.confirmPassword &&
    form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Marcar todos como tocados para mostrar errores
    setTouched({ firstName: true, lastName: true, email: true, phone: true, documentNumber: true, password: true, confirmPassword: true });
    if (!isValid) return;

    setLoading(true);
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;

      // Obtener roleId del rol 'user' dinámicamente
      let userRoleId = 4;
      try {
        const rolesRes = await apiFetch<any[]>('/roles');
        if (rolesRes.success) {
          const userRole = rolesRes.data.find((r: any) =>
            r.name.toLowerCase() === 'user' || r.name.toLowerCase() === 'cliente'
          );
          if (userRole) userRoleId = userRole.id;
        }
      } catch { }

      await authRegister(
        fullName, form.email.trim(), form.password,
        userRoleId, form.phone.trim() || undefined,
        form.documentType, form.documentNumber.trim(),
      );

      toast.success('¡Cuenta creada exitosamente! Inicia sesión con tus credenciales.');
      onBack(); // vuelve al login
    } catch (error: any) {
      toast.error(error?.message || 'Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Leaf className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">Naturista Store</h1>
          <p className="text-muted-foreground text-sm mt-1">Crea tu cuenta de cliente</p>
        </div>

        {/* Formulario */}
        <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b px-5 py-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 shrink-0">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Registro de Cliente</p>
              <p className="text-xs text-muted-foreground">Los campos con * son obligatorios</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium">Nombre <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input id="firstName" value={form.firstName}
                    onChange={e => set('firstName', e.target.value)} onBlur={() => touch('firstName')}
                    placeholder="Tu nombre" className={`pl-10 h-9 text-sm shadow-sm ${errors.firstName ? 'border-destructive' : ''}`} />
                </div>
                {errors.firstName && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium">Apellido <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input id="lastName" value={form.lastName}
                    onChange={e => set('lastName', e.target.value)} onBlur={() => touch('lastName')}
                    placeholder="Tu apellido" className={`pl-10 h-9 text-sm shadow-sm ${errors.lastName ? 'border-destructive' : ''}`} />
                </div>
                {errors.lastName && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="email" type="email" value={form.email}
                  onChange={e => set('email', e.target.value)} onBlur={() => touch('email')}
                  placeholder="tu@email.com" className={`pl-10 h-9 text-sm shadow-sm ${errors.email ? 'border-destructive' : ''}`} />
              </div>
              {errors.email && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.email}</p>}
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium">
                Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="phone" value={form.phone}
                  onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} onBlur={() => touch('phone')}
                  placeholder="3001234567" className={`pl-10 h-9 text-sm shadow-sm ${errors.phone ? 'border-destructive' : ''}`} />
              </div>
              {errors.phone && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.phone}</p>}
            </div>

            {/* Documento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo doc. <span className="text-destructive">*</span></Label>
                <Select value={form.documentType} onValueChange={v => set('documentType', v)}>
                  <SelectTrigger className="h-9 text-sm shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(d => <SelectItem key={d.value} value={d.value} className="text-sm">{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="docNum" className="text-xs font-medium">Nº documento <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input id="docNum" value={form.documentNumber}
                    onChange={e => set('documentNumber', e.target.value.replace(/\D/g, '').slice(0, 15))}
                    onBlur={() => touch('documentNumber')}
                    placeholder="1234567890" maxLength={15}
                    className={`pl-10 h-9 text-sm shadow-sm ${errors.documentNumber ? 'border-destructive' : ''}`} />
                </div>
                {errors.documentNumber && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.documentNumber}</p>}
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <PasswordInput id="password" value={form.password}
                onChange={v => { set('password', v); touch('password'); }}
                label="Contraseña" required placeholder="Mínimo 8 caracteres" />
              {errors.password && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" />{errors.password}</p>}
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirmar contraseña */}
            <div>
              <PasswordInput id="confirmPassword" value={form.confirmPassword}
                onChange={v => { set('confirmPassword', v); touch('confirmPassword'); }}
                label="Confirmar contraseña" required placeholder="Repite tu contraseña" />
              {errors.confirmPassword && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" />{errors.confirmPassword}</p>}
              {form.confirmPassword && !errors.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><CheckCircle className="h-3 w-3" />Las contraseñas coinciden</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={loading} className="flex-1 h-9 text-sm">
                {loading ? 'Creando cuenta...' : <><UserPlus className="h-3.5 w-3.5 mr-1.5" />Crear Cuenta</>}
              </Button>
              <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-9 text-sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Volver
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <button type="button" onClick={onBack} className="text-primary hover:underline font-medium">
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}
