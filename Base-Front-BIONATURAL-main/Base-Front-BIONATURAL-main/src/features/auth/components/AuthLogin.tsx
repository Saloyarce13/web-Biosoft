import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';
import { authLogin, authRegister, passwordResetRequest, passwordResetVerifyCode, passwordResetConfirm, apiFetch } from '../../../lib/api';
import {
  Leaf, Mail, Lock, User, Phone, UserPlus,
  ArrowLeft, KeyRound, CheckCircle, CreditCard, Eye, EyeOff, AlertTriangle
} from 'lucide-react';

interface AuthLoginProps {
  onLogin: (userData: { name: string; email: string; role: string; permissions?: string[] }) => void;
  onBack?: () => void;
  onRegister?: () => void;
}

type AuthView = 'login' | 'recover-password' | 'recovery-sent' | 'reset-code' | 'register-success';

// ── Componente reutilizable para input de contraseña con ojito ─────────────────
function PasswordInput({ id, value, onChange, placeholder, className }: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '••••••••'}
        className={`pr-10 ${className || ''}`}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AuthLogin({ onLogin, onBack, onRegister }: AuthLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginAttemptsLeft, setLoginAttemptsLeft] = useState<number | null>(null);
  const [loginBlockedUntil, setLoginBlockedUntil] = useState<number | null>(null);
  const [recoveryCooldown, setRecoveryCooldown] = useState(0); // segundos restantes

  const [registerForm, setRegisterForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    documentType: 'CC', documentNumber: '', password: '', confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Verificar bloqueo local
    if (loginBlockedUntil && loginBlockedUntil > Date.now()) {
      const secs = Math.ceil((loginBlockedUntil - Date.now()) / 1000);
      setLoginError(`Demasiados intentos. Espera ${Math.ceil(secs / 60)} minuto${Math.ceil(secs / 60) !== 1 ? 's' : ''}.`);
      return;
    }
    setIsLoading(true);
    setLoginError('');
    try {
      const response = await authLogin(email, password);
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      setLoginAttemptsLeft(null);
      setLoginBlockedUntil(null);
      // user.role puede ser objeto {id, name, permissions} o string
      const roleName = typeof user.role === 'object' ? (user.role as any)?.name ?? '' : user.role ?? '';
      const rolePerms: string[] = typeof user.role === 'object'
        ? ((user.role as any)?.permissions ?? []).map((p: any) => p?.permission?.name ?? p?.name ?? p)
        : (user.permissions ?? []);
      onLogin({ name: user.name, email: user.email, role: roleName, permissions: rolePerms });
      toast.success('Inicio de sesión exitoso');
    } catch (error: any) {
      const msg: string = error?.message || '';
      const blockedSecs: number = error?.blockedSeconds;
      const attemptsLeft: number = error?.attemptsLeft;
      if (blockedSecs) {
        setLoginBlockedUntil(Date.now() + blockedSecs * 1000);
        setLoginError(msg);
      } else if (attemptsLeft !== undefined) {
        setLoginAttemptsLeft(attemptsLeft);
        setLoginError(msg);
      } else {
        setLoginError('Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientRegister = async () => {
    if (!registerForm.firstName.trim() || !registerForm.lastName.trim() ||
        !registerForm.email.trim() || !registerForm.password.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    if (!registerForm.documentType || !registerForm.documentNumber.trim()) {
      toast.error('Por favor completa el tipo y número de documento');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (registerForm.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const fullName = `${registerForm.firstName.trim()} ${registerForm.lastName.trim()}`;

      // Obtener el roleId del rol 'user' dinámicamente
      let userRoleId = 4;
      try {
        const rolesRes = await apiFetch<any[]>('/roles');
        if (rolesRes.success) {
          const userRole = rolesRes.data.find((r: any) =>
            r.name.toLowerCase() === 'user' || r.name.toLowerCase() === 'cliente'
          );
          if (userRole) userRoleId = userRole.id;
        }
      } catch { /* usar 4 por defecto */ }

      await authRegister(
        fullName, registerForm.email.trim(), registerForm.password,
        userRoleId, registerForm.phone.trim() || undefined,
        registerForm.documentType, registerForm.documentNumber.trim() || undefined,
      );

      // Registro exitoso — mostrar pantalla de confirmación
      setIsRegisterModalOpen(false);
      clearRegisterForm();
      setCurrentView('register-success');

      // Auto-login después de 2.5 segundos
      setTimeout(async () => {
        try {
          const loginRes = await authLogin(registerForm.email.trim(), registerForm.password);
          const { token, user } = loginRes.data;
          localStorage.setItem('authToken', token);
          const roleName = typeof user.role === 'object' ? (user.role as any)?.name ?? '' : user.role ?? '';
          const rolePerms: string[] = typeof user.role === 'object'
            ? ((user.role as any)?.permissions ?? []).map((p: any) => p?.permission?.name ?? p?.name ?? p)
            : (user.permissions ?? []);
          onLogin({ name: user.name, email: user.email, role: roleName, permissions: rolePerms });
        } catch {
          setCurrentView('login');
        }
      }, 2500);
    } catch (error: any) {
      toast.error(error?.message || 'Error al registrar la cuenta. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearRegisterForm = () => {
    setRegisterForm({
      firstName: '', lastName: '', email: '', phone: '',
      documentType: 'CC', documentNumber: '', password: '', confirmPassword: ''
    });
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryCooldown > 0) { setEmailError(`Espera ${recoveryCooldown}s antes de reenviar.`); return; }
    if (!recoveryEmail.trim()) { setEmailError('Por favor ingresa tu email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) { setEmailError('Por favor ingresa un email válido'); return; }
    setIsRecoveryLoading(true);
    setEmailError('');
    try {
      await passwordResetRequest(recoveryEmail.trim());
      // Iniciar cooldown de 60 segundos
      setRecoveryCooldown(60);
      const interval = setInterval(() => {
        setRecoveryCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
      setCurrentView('reset-code');
    } catch (error: any) {
      setEmailError(error?.message || 'Error al enviar el email.');
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || resetCode.length < 6) { setCodeError('Ingresa el código de 6 dígitos'); return; }
    setIsResetLoading(true);
    setCodeError('');
    try {
      await passwordResetVerifyCode(recoveryEmail.trim(), resetCode.trim());
      setCodeVerified(true);
      setCodeError('');
    } catch (error: any) {
      const msg: string = error?.message || '';
      if (msg.toLowerCase().includes('expirado') || msg.toLowerCase().includes('inválido')) {
        setCodeError('El código ha expirado. Solicita uno nuevo.');
      } else {
        setCodeError('Código incorrecto. Verifica e intenta de nuevo.');
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return; }
    if (!/[A-Z]/.test(newPassword)) { toast.error('La contraseña debe tener al menos una mayúscula'); return; }
    if (!/\d/.test(newPassword)) { toast.error('La contraseña debe tener al menos un número'); return; }
    if (!/[^A-Za-z0-9]/.test(newPassword)) { toast.error('La contraseña debe tener al menos un carácter especial'); return; }
    if (newPassword !== confirmNewPassword) { toast.error('Las contraseñas no coinciden'); return; }
    setIsResetLoading(true);
    try {
      await passwordResetConfirm(recoveryEmail.trim(), resetCode.trim(), newPassword);
      toast.success('¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.');
      setRecoveryEmail(''); setResetCode(''); setNewPassword(''); setConfirmNewPassword('');
      setCodeVerified(false); setCodeError('');
      setCurrentView('login');
    } catch (error: any) {
      toast.error(error?.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsResetLoading(false);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'recover-password':
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <KeyRound className="h-5 w-5" /> Recuperar Contraseña
              </CardTitle>
              <CardDescription>Ingresa tu email y te enviaremos un código de 6 dígitos</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordRecovery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">Email registrado</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input id="recovery-email" type="email" placeholder="tu@email.com"
                      value={recoveryEmail}
                      onChange={e => { setRecoveryEmail(e.target.value); setEmailError(''); }}
                      className={`pl-10 ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      required />
                  </div>
                  {emailError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" /> {emailError}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isRecoveryLoading}>
                  {isRecoveryLoading ? 'Enviando código...' : 'Enviar código de recuperación'}
                </Button>
              </form>
              <div className="text-center mt-6">
                <Button variant="link" className="text-sm text-muted-foreground p-0 h-auto"
                  onClick={() => { setRecoveryEmail(''); setEmailError(''); setCurrentView('login'); }}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Volver al inicio de sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'reset-code':
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <KeyRound className="h-7 w-7 text-primary" />
                </div>
              </div>
              <CardTitle>{codeVerified ? 'Nueva contraseña' : 'Ingresa el código'}</CardTitle>
              <CardDescription>
                {codeVerified
                  ? 'Código verificado. Ahora crea tu nueva contraseña.'
                  : <>Enviamos un código de 6 dígitos a <strong>{recoveryEmail}</strong></>
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* PASO 1: Verificar código */}
              {!codeVerified && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-code">Código de verificación</Label>
                    <Input id="reset-code" type="text" inputMode="numeric" maxLength={6}
                      placeholder="000000"
                      value={resetCode}
                      onChange={e => { setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeError(''); }}
                      className={`text-center text-2xl font-mono tracking-widest h-12 shadow-sm ${codeError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      required />
                    {codeError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" /> {codeError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                      Revisa tu bandeja de entrada y spam · Expira en 15 minutos
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isResetLoading || resetCode.length < 6}>
                    {isResetLoading ? 'Verificando...' : 'Verificar código'}
                  </Button>
                  <div className="flex items-center justify-between">
                    <Button variant="link" type="button" className="text-xs text-muted-foreground p-0 h-auto"
                      onClick={() => { setResetCode(''); setCodeError(''); setCurrentView('recover-password'); }}
                      disabled={recoveryCooldown > 0}>
                      {recoveryCooldown > 0 ? `Reenviar en ${recoveryCooldown}s` : '¿No recibiste el código? Reenviar'}
                    </Button>
                    <Button variant="link" type="button" className="text-xs text-muted-foreground p-0 h-auto"
                      onClick={() => { setRecoveryEmail(''); setResetCode(''); setCodeVerified(false); setCodeError(''); setCurrentView('login'); }}>
                      <ArrowLeft className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {/* PASO 2: Nueva contraseña (solo si el código fue verificado) */}
              {codeVerified && (
                <form onSubmit={handleResetConfirm} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nueva contraseña</Label>
                    <PasswordInput id="new-password" value={newPassword} onChange={setNewPassword}
                      placeholder="Mínimo 8 caracteres" />
                    <p className="text-xs text-muted-foreground">
                      Debe tener mayúscula, número y carácter especial
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirmar contraseña</Label>
                    <PasswordInput id="confirm-new-password" value={confirmNewPassword}
                      onChange={setConfirmNewPassword} placeholder="Repite la contraseña" />
                    {confirmNewPassword && newPassword === confirmNewPassword && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Las contraseñas coinciden
                      </p>
                    )}
                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Las contraseñas no coinciden
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isResetLoading}>
                    {isResetLoading ? 'Actualizando...' : 'Restablecer contraseña'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        );

      case 'recovery-sent':
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle>¡Contraseña actualizada!</CardTitle>
              <CardDescription>Ya puedes iniciar sesión con tu nueva contraseña</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full" onClick={() => setCurrentView('login')}>
                Ir al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        );

      case 'register-success':
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">¡Cuenta creada exitosamente!</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Tu cuenta ha sido registrada. En un momento serás redirigido automáticamente a la tienda.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Iniciando sesión...
              </div>
              <Button variant="link" className="text-xs text-muted-foreground p-0 h-auto"
                onClick={() => setCurrentView('login')}>
                Ir al inicio de sesión manualmente
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input id="email" type="email" placeholder="tu@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <PasswordInput id="login-password" value={password} onChange={p => { setPassword(p); setLoginError(''); }} />
                </div>
                {loginError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> {loginError}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading || (!!loginBlockedUntil && loginBlockedUntil > Date.now())}>
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
              <div className="text-center mt-4">
                <Button variant="link" className="text-sm text-muted-foreground p-0 h-auto"
                  onClick={() => setCurrentView('recover-password')}>
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
              <div className="text-center mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-3">¿No tienes cuenta?</p>
                <Button variant="outline" className="w-full" onClick={onRegister}>
                  <UserPlus className="h-4 w-4 mr-2" /> Regístrate como Cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Botón volver a la tienda */}
          {onBack && (
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Volver a la tienda
            </Button>
          )}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Leaf className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Naturista Store</h1>
            <p className="text-muted-foreground mt-2">Sistema de Gestión Integral</p>
          </div>
          {renderCurrentView()}
        </div>
      </div>

      {/* Modal Registro */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Registro de Cliente
            </DialogTitle>
            <DialogDescription>Crea tu cuenta para acceder a la tienda</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo Documento *</Label>
                <Select value={registerForm.documentType}
                  onValueChange={v => setRegisterForm(p => ({ ...p, documentType: v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                    <SelectItem value="PAS">Pasaporte</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-docNum" className="text-xs font-medium">Número *</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input id="reg-docNum" value={registerForm.documentNumber}
                    onChange={e => setRegisterForm(p => ({ ...p, documentNumber: e.target.value.replace(/\D/g, '').slice(0, 15) }))}
                    placeholder="Número" className="pl-10 h-9 text-sm" maxLength={15} inputMode="numeric" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-firstName" className="text-xs font-medium">Nombre *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input id="reg-firstName" value={registerForm.firstName}
                    onChange={e => setRegisterForm(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="Tu nombre" className="pl-10 h-9 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-lastName" className="text-xs font-medium">Apellido *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input id="reg-lastName" value={registerForm.lastName}
                    onChange={e => setRegisterForm(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Tu apellido" className="pl-10 h-9 text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-xs font-medium">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="reg-email" type="email" value={registerForm.email}
                  onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="tu@email.com" className="pl-10 h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-phone" className="text-xs font-medium">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input id="reg-phone" value={registerForm.phone}
                  onChange={e => setRegisterForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+57 300 000 0000" className="pl-10 h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Contraseña * <span className="text-muted-foreground font-normal">(mín. 8 caracteres)</span></Label>
              <PasswordInput id="reg-password" value={registerForm.password}
                onChange={v => setRegisterForm(p => ({ ...p, password: v }))}
                placeholder="Mínimo 8 caracteres" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Confirmar Contraseña *</Label>
              <PasswordInput id="reg-confirm" value={registerForm.confirmPassword}
                onChange={v => setRegisterForm(p => ({ ...p, confirmPassword: v }))}
                placeholder="Repite tu contraseña" />
            </div>
          </div>

          <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2 bg-background">
            <Button variant="outline" size="sm" onClick={() => setIsRegisterModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleClientRegister} disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : <><UserPlus className="h-4 w-4 mr-1.5" /> Crear Cuenta</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
