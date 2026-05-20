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
import { useStoreInfo, usePickupTimeSlots, usePickupPolicy } from '../../../shared/contexts/SystemConfigContext';
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
  const storeInfo    = useStoreInfo();
  const timeSlots    = usePickupTimeSlots();
  const pickupPolicy = usePickupPolicy();

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
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Banner — igual al de la tienda */}
      <div style={{ position: 'relative', overflow: 'hidden', height: 140, background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #3A7D44 100%)', marginBottom: 0 }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(129,199,132,0.2)', border: '1px solid rgba(129,199,132,0.4)', borderRadius: 99, padding: '3px 10px', marginBottom: 8, width: 'fit-content' }}>
              <Package style={{ width: 10, height: 10, color: '#81C784' }} />
              <span style={{ fontSize: 10, color: '#81C784', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Finalizar pedido</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
              {step === 'confirmation' ? '¡Pedido confirmado! 🎉' : 'Confirmar tu pedido'}
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '4px 0 0' }}>
              {cartItems.length} producto{cartItems.length !== 1 ? 's' : ''} · {formatCOP(subtotal)}
            </p>
          </div>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: '7px 14px', borderRadius: 10 }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}>
            <ArrowLeft style={{ width: 13, height: 13 }} /> Volver
          </button>
        </div>
      </div>

      {/* Indicador de pasos */}
      {step !== 'confirmation' && (
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E5E2', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {[{ key: 'login', label: 'Cuenta', num: 1 }, { key: 'pickup', label: 'Retiro', num: 2 }].map((s, i) => {
            const done = step === 'pickup' && s.key === 'login';
            const active = step === s.key;
            return (
              <React.Fragment key={s.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: done ? '#3A7D44' : active ? '#3A7D44' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {done ? <CheckCircle style={{ width: 14, height: 14, color: 'white' }} /> : <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'white' : '#9CA3AF' }}>{s.num}</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active || done ? 600 : 400, color: active || done ? '#1C1C1A' : '#9CA3AF' }}>{s.label}</span>
                </div>
                {i === 0 && <div style={{ flex: 1, height: 1, backgroundColor: done ? '#3A7D44' : '#E5E7EB' }} />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px 40px' }}>

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

            {/* Columna izquierda — formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Info tienda — más visual */}
              <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                {/* Header verde */}
                <div style={{ background: 'linear-gradient(135deg, #1B4332, #3A7D44)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin style={{ width: 16, height: 16, color: 'white' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>{storeInfo.name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Punto de retiro</p>
                  </div>
                </div>
                {/* Detalles */}
                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: MapPin, text: `${storeInfo.address} · ${storeInfo.mall}`, color: '#3B82F6', bg: '#EFF6FF' },
                    { icon: Clock, text: `${storeInfo.schedule.weekdays} · ${storeInfo.schedule.saturday}`, color: '#8B5CF6', bg: '#F5F3FF' },
                    { icon: Phone, text: storeInfo.phone, color: '#3A7D44', bg: '#F0FDF4' },
                  ].map(({ icon: Icon, text, color, bg }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 13, height: 13, color }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#374151' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aviso pago */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12 }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#D97706', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', margin: 0 }}>Pago en tienda al recoger</p>
                  <p style={{ fontSize: 11, color: '#B45309', margin: '2px 0 0' }}>{pickupPolicy.message}</p>
                </div>
              </div>

              {/* Formulario */}
              <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#737370', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 16px' }}>Datos de retiro</p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Hora de retiro <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger style={{ height: 44, borderRadius: 10, border: '1.5px solid #E5E5E2', fontSize: 13 }}>
                      <SelectValue placeholder="Seleccionar hora de retiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Notas <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Ej: Recogerá otra persona, necesito factura..."
                    rows={3} style={{ borderRadius: 10, border: '1.5px solid #E5E5E2', fontSize: 13, resize: 'none' as const }} />
                </div>
              </div>
            </div>

            {/* Columna derecha — resumen sticky */}
            <div style={{ position: 'sticky', top: 20 }}>
              <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F0EE' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#737370', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: 0 }}>Resumen del pedido</p>
                </div>

                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cartItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#F0F4EF' }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package style={{ width: 18, height: 18, color: '#3A7D44' }} /></div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>×{item.quantity} · {item.category}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', flexShrink: 0 }}>{formatCOP(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '14px 18px', borderTop: '1px solid #F0F0EE', backgroundColor: '#FAFAF8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#737370' }}>Total a pagar en tienda</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#3A7D44', letterSpacing: '-0.02em' }}>{formatCOP(subtotal)}</span>
                  </div>

                  <button onClick={handleConfirm} disabled={isProcessing}
                    style={{ width: '100%', height: 50, borderRadius: 12, border: 'none', background: isProcessing ? '#D1FAE5' : 'linear-gradient(135deg, #2D6A4F, #52B788)', color: isProcessing ? '#3A7D44' : 'white', fontSize: 15, fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: isProcessing ? 'none' : '0 4px 12px rgba(58,125,68,0.25)' }}>
                    {isProcessing
                      ? <><span style={{ width: 16, height: 16, border: '2px solid #3A7D44', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Registrando...</>
                      : <><CheckCircle style={{ width: 18, height: 18 }} /> Confirmar pedido</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirmación ── */}
        {step === 'confirmation' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

            {/* Columna izquierda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Éxito */}
              <div style={{ backgroundColor: 'white', borderRadius: 20, border: '1px solid #B7E4C7', padding: '36px 28px', textAlign: 'center', boxShadow: '0 4px 20px rgba(58,125,68,0.1)', position: 'relative', overflow: 'hidden' }}>
                {/* Fondo decorativo */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', backgroundColor: '#F0FDF4', zIndex: 0 }} />
                <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', backgroundColor: '#F0FDF4', zIndex: 0 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Ícono animado */}
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #D8F3DC, #B7E4C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(58,125,68,0.2)' }}>
                    <CheckCircle style={{ width: 40, height: 40, color: '#3A7D44' }} />
                  </div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1C1C1A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>¡Pedido confirmado! 🎉</h2>
                  <p style={{ fontSize: 14, color: '#737370', margin: '0 0 20px', lineHeight: 1.6 }}>Tu pedido ha sido registrado exitosamente.<br />Te notificaremos cuando esté listo para recoger.</p>
                  {/* Número de pedido simulado */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', border: '1px solid #B7E4C7', borderRadius: 10, padding: '8px 16px' }}>
                    <Package style={{ width: 14, height: 14, color: '#3A7D44' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1B4332' }}>Pedido registrado · Pago en tienda</span>
                  </div>
                </div>
              </div>

              {/* Recordatorio */}
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '18px 20px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Clock style={{ width: 15, height: 15 }} /> Importante — recuerda
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    `Tienes ${pickupPolicy.hours_to_pickup} horas para recoger tu pedido en tienda`,
                    pickupPolicy.payment_on_pickup ? 'El pago se realiza al momento de la recogida' : 'El pago ya fue procesado',
                    'Presenta tu nombre o email al llegar',
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#D97706' }}>{i + 1}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#B45309', margin: 0, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: text.replace(/(\d+ horas)/, '<strong>$1</strong>') }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dónde encontrarnos */}
              <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#737370', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin style={{ width: 12, height: 12 }} /> Dónde encontrarnos
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: MapPin, label: storeInfo.name, sub: `${storeInfo.address} · ${storeInfo.mall}`, color: '#3B82F6', bg: '#EFF6FF' },
                    { icon: Clock, label: 'Horarios', sub: `${storeInfo.schedule.weekdays} · ${storeInfo.schedule.saturday}`, color: '#8B5CF6', bg: '#F5F3FF' },
                    { icon: Phone, label: 'Contacto', sub: storeInfo.phone, color: '#3A7D44', bg: '#F0FDF4' },
                  ].map(({ icon: Icon, label, sub, color, bg }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 16, height: 16, color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', margin: 0 }}>{label}</p>
                        <p style={{ fontSize: 12, color: '#737370', margin: '1px 0 0' }}>{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna derecha — resumen + botones */}
            <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#737370', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 14px' }}>Tu pedido</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {cartItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.image && (
                        <img src={item.image} alt={item.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, backgroundColor: '#F0F4EF' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>×{item.quantity}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', flexShrink: 0 }}>{formatCOP(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ height: 1, backgroundColor: '#F0F0EE', margin: '0 0 14px' }} />

                {/* Total destacado */}
                <div style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #B7E4C7' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1B4332' }}>Total a pagar en tienda</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#3A7D44', letterSpacing: '-0.02em' }}>{formatCOP(subtotal)}</span>
                </div>

                {pickupTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#737370', marginBottom: 4 }}>
                    <Clock style={{ width: 13, height: 13, color: '#3A7D44' }} />
                    Hora de retiro: <strong style={{ color: '#1C1C1A' }}>{pickupTime}</strong>
                  </div>
                )}
              </div>

              <button onClick={onOrderComplete} style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #2D6A4F, #52B788)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(58,125,68,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.92')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                <Package style={{ width: 18, height: 18 }} /> Ver mis pedidos
              </button>
              <button onClick={onClose} style={{ width: '100%', height: 42, borderRadius: 12, border: '1px solid #E5E5E2', backgroundColor: 'white', color: '#737370', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                Volver a la tienda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}