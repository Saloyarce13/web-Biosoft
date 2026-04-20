import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { toast } from 'sonner';
import { formatCOP } from '../../../shared/utils/storage';
import { authLogin, authRegister, createMyOrder } from '../../../lib/api';
import {
  ArrowLeft, MapPin, User, Mail, Phone, Lock,
  Eye, EyeOff, CheckCircle, Package, ShoppingBag,
  Clock, AlertCircle, Store
} from 'lucide-react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
}

interface CheckoutFlowProps {
  cartItems: CartItem[];
  onClose: () => void;
  onOrderComplete: () => void;
  user: { name: string; email: string; role: string } | null;
  onLogin: (userData: { name: string; email: string; role: string; permissions?: string[] }) => void;
}

type Step = 'login' | 'pickup' | 'confirmation';

export function CheckoutFlow({ cartItems, onClose, onOrderComplete, user, onLogin }: CheckoutFlowProps) {
  const [step, setStep] = useState<Step>(user ? 'pickup' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '', name: '', phone: '', isNew: false });
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // ── Paso 1: Login / Registro ───────────────────────────────────────────────
  const handleAuth = async () => {
    if (!loginData.email || !loginData.password) { toast.error('Completa email y contraseña'); return; }
    if (loginData.isNew && !loginData.name) { toast.error('Ingresa tu nombre'); return; }
    setIsProcessing(true);
    try {
      if (loginData.isNew) {
        await authRegister(loginData.name, loginData.email, loginData.password, 4, loginData.phone || undefined);
      }
      const res = await authLogin(loginData.email, loginData.password);
      localStorage.setItem('authToken', res.data.token);
      onLogin({ name: res.data.user.name, email: res.data.user.email, role: res.data.user.role, permissions: res.data.user.permissions });
      setStep('pickup');
      toast.success(loginData.isNew ? '¡Cuenta creada! Continúa con tu pedido' : '¡Bienvenido de vuelta!');
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar sesión');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Paso 2: Retiro → Confirmar pedido ─────────────────────────────────────
  const handleConfirm = async () => {
    if (!pickupTime) { toast.error('Selecciona una hora de retiro'); return; }
    setIsProcessing(true);
    try {
      await createMyOrder({
        pickupTime,
        notes: notes.trim() || undefined,
        items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity })),
      });
      setStep('confirmation');
      toast.success('¡Pedido registrado!');
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar el pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="p-8">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Carrito vacío</h2>
            <p className="text-sm text-muted-foreground mb-6">No tienes productos en tu carrito</p>
            <Button onClick={onClose} className="w-full">Explorar productos</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div>
          <h1 className="text-base font-semibold">Finalizar pedido</h1>
          <p className="text-xs text-muted-foreground">{cartItems.length} producto{cartItems.length !== 1 ? 's' : ''} · {formatCOP(subtotal)}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Indicador de pasos */}
        {step !== 'confirmation' && (
          <div className="flex items-center gap-2 text-sm">
            {[
              { key: 'login', label: 'Cuenta' },
              { key: 'pickup', label: 'Retiro' },
            ].map((s, i) => {
              const done = (step === 'pickup' && s.key === 'login');
              const active = step === s.key;
              return (
                <React.Fragment key={s.key}>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${active ? 'bg-primary text-primary-foreground' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                    {done ? '✓ ' : ''}{s.label}
                  </span>
                  {i === 0 && <div className="flex-1 h-px bg-border" />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ── Paso 1: Login / Registro ── */}
        {step === 'login' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Identificación</CardTitle>
              <CardDescription className="text-xs">Necesitas una cuenta para continuar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={loginData.isNew ? 'register' : 'login'} onValueChange={v => setLoginData(p => ({ ...p, isNew: v === 'register' }))}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                  <TabsTrigger value="register">Registrarse</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input type="email" value={loginData.email} onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))} className="pl-9 h-9 text-sm" placeholder="tu@email.com" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input type={showPassword ? 'text' : 'password'} value={loginData.password} onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))} className="pl-9 pr-9 h-9 text-sm" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input value={loginData.name} onChange={e => setLoginData(p => ({ ...p, name: e.target.value }))} className="pl-9 h-9 text-sm" placeholder="Tu nombre" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input type="email" value={loginData.email} onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))} className="pl-9 h-9 text-sm" placeholder="tu@email.com" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Teléfono <span className="text-muted-foreground">(opcional)</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input value={loginData.phone} onChange={e => setLoginData(p => ({ ...p, phone: e.target.value }))} className="pl-9 h-9 text-sm" placeholder="+57 300 000 0000" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input type={showPassword ? 'text' : 'password'} value={loginData.password} onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))} className="pl-9 pr-9 h-9 text-sm" placeholder="Mínimo 8 caracteres" />
                      <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button onClick={handleAuth} className="w-full" disabled={isProcessing}>
                {isProcessing ? 'Procesando...' : loginData.isNew ? 'Crear cuenta y continuar' : 'Iniciar sesión'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Paso 2: Retiro en tienda ── */}
        {step === 'pickup' && (
          <>
            {/* Aviso importante */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-0.5">
                <p className="font-semibold">Recogida en tienda · Pago en tienda</p>
                <p>Tienes <strong>24 horas</strong> desde que confirmes el pedido para recogerlo. El pago se realiza al momento de la recogida.</p>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" /> Datos de retiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ubicación fija */}
                <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-primary">Bionatural — Tienda Principal</p>
                    <p className="text-muted-foreground mt-0.5">Calle 47 #45-87 · C.C. San Antonio, Local 101</p>
                    <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> Lun–Vie 8:00 AM – 6:00 PM · Sáb 8:00 AM – 2:00 PM
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" /> +57 315 5397493
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Hora de retiro <span className="text-destructive">*</span></Label>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Seleccionar hora" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7:00-9:00">7:00 – 9:00 AM</SelectItem>
                      <SelectItem value="9:00-11:00">9:00 – 11:00 AM</SelectItem>
                      <SelectItem value="11:00-13:00">11:00 AM – 1:00 PM</SelectItem>
                      <SelectItem value="13:00-15:00">1:00 – 3:00 PM</SelectItem>
                      <SelectItem value="15:00-17:00">3:00 – 5:00 PM</SelectItem>
                      <SelectItem value="17:00-19:00">5:00 – 7:00 PM</SelectItem>
                      <SelectItem value="19:00-20:00">7:00 – 8:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Notas <span className="text-muted-foreground">(opcional)</span></Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Recogerá otra persona, necesito factura..." rows={2} className="text-sm resize-none" />
                </div>

                <Separator />

                {/* Resumen */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resumen del pedido</p>
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.name} <span className="text-xs">×{item.quantity}</span></span>
                      <span className="font-medium">{formatCOP(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                    <span>Total a pagar en tienda</span>
                    <span className="text-primary">{formatCOP(subtotal)}</span>
                  </div>
                </div>

                <Button onClick={handleConfirm} className="w-full" disabled={isProcessing}>
                  {isProcessing ? 'Registrando pedido...' : 'Confirmar pedido'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Confirmación ── */}
        {step === 'confirmation' && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">¡Pedido confirmado!</h2>
                <p className="text-sm text-muted-foreground mt-1">Tu pedido ha sido registrado correctamente.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Recuerda
                </p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                  <li>Tienes <strong>24 horas</strong> para recoger tu pedido en tienda</li>
                  <li>El pago se realiza al momento de la recogida</li>
                  <li>Presenta tu nombre o email al llegar</li>
                </ul>
              </div>

              <div className="bg-muted/40 rounded-xl p-4 text-left space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tu pedido</p>
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                    <span>{formatCOP(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t mt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCOP(subtotal)}</span>
                </div>
              </div>

              {/* Dónde recogemos */}
              <div className="rounded-xl border border-[#E5E5E2] bg-white p-4 text-left space-y-3">
                <p className="text-xs font-semibold text-[#3A7D44] uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Dónde encontrarnos
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F5E9]">
                      <MapPin className="h-3.5 w-3.5 text-[#3A7D44]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1C1C1A]">Bionatural — Tienda Principal</p>
                      <p className="text-xs text-[#737370]">Calle 47 #45-87</p>
                      <p className="text-xs text-[#737370]">Centro Comercial San Antonio · Local 101</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F5E9]">
                      <Clock className="h-3.5 w-3.5 text-[#3A7D44]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1C1C1A]">Horarios de atención</p>
                      <p className="text-xs text-[#737370]">Lunes a viernes: 8:00 a.m. – 6:00 p.m.</p>
                      <p className="text-xs text-[#737370]">Sábados: 8:00 a.m. – 2:00 p.m.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E8F5E9]">
                      <Phone className="h-3.5 w-3.5 text-[#3A7D44]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1C1C1A]">Contacto</p>
                      <p className="text-xs text-[#737370]">+57 315 5397493</p>
                    </div>
                  </div>
                </div>
              </div>

                {pickupTime && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
                    <Clock className="h-3 w-3 shrink-0" />
                    Hora de retiro estimada: <strong>{pickupTime}</strong>
                  </div>
                )}

              <Button onClick={() => { onOrderComplete(); }} className="w-full">
                Ver mis pedidos
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
                Volver a la tienda
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
