import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { CreditCard, Plus, Edit3, Trash2, Shield, CheckCircle, Wallet, Star, X, Leaf, ArrowLeft } from 'lucide-react';

interface ClientPaymentMethodsProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit' | 'paypal' | 'bank_transfer';
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  provider: string;
  isDefault: boolean;
  lastUsed?: Date;
}

const SAMPLE_PAYMENT_METHODS: PaymentMethod[] = [
  { id: '1', type: 'credit', cardNumber: '**** **** **** 4532', cardHolder: 'Juan Pérez García', expiryDate: '12/25', provider: 'Visa', isDefault: true, lastUsed: new Date(Date.now() - 2 * 86400000) },
  { id: '2', type: 'debit', cardNumber: '**** **** **** 8901', cardHolder: 'Juan Pérez García', expiryDate: '08/27', provider: 'Mastercard', isDefault: false, lastUsed: new Date(Date.now() - 7 * 86400000) },
];

const getCardTypeLabel = (type: string) => {
  switch (type) {
    case 'credit': return 'Tarjeta de Crédito';
    case 'debit': return 'Tarjeta de Débito';
    case 'paypal': return 'PayPal';
    default: return 'Método de Pago';
  }
};

const maskCardNumber = (cardNumber: string): string => {
  const clean = cardNumber.replace(/\s/g, '');
  if (clean.length < 4) return cardNumber;
  return `**** **** **** ${clean.slice(-4)}`;
};

const formatCardNumber = (value: string): string => {
  const clean = value.replace(/\s/g, '');
  const groups = clean.match(/.{1,4}/g) || [];
  return groups.join(' ').substr(0, 19);
};

export function ClientPaymentMethods({ user, onBack }: ClientPaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(SAMPLE_PAYMENT_METHODS);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [newMethod, setNewMethod] = useState<{ type: 'credit' | 'debit' | 'paypal' | 'bank_transfer'; cardNumber: string; cardHolder: string; expiryDate: string; provider: string; isDefault: boolean; }>({ type: 'credit', cardNumber: '', cardHolder: '', expiryDate: '', provider: 'Visa', isDefault: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (m: typeof newMethod) => {
    const errs: Record<string, string> = {};
    if (!m.cardHolder.trim()) errs.cardHolder = 'El nombre del titular es requerido';
    if (m.type !== 'paypal') {
      if (!m.cardNumber.trim()) errs.cardNumber = 'El número de tarjeta es requerido';
      if (!m.expiryDate.trim()) errs.expiryDate = 'La fecha de vencimiento es requerida';
    } else {
      if (!m.cardNumber.includes('@')) errs.cardNumber = 'Email inválido para PayPal';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = () => {
    if (!validate(newMethod)) return;
    const created: PaymentMethod = {
      id: Date.now().toString(), ...newMethod,
      cardNumber: newMethod.type === 'paypal' ? newMethod.cardNumber : maskCardNumber(newMethod.cardNumber),
    };
    if (paymentMethods.length === 0 || newMethod.isDefault) {
      setPaymentMethods(prev => [...prev.map(m => ({ ...m, isDefault: false })), { ...created, isDefault: true }]);
    } else {
      setPaymentMethods(prev => [...prev, created]);
    }
    setNewMethod({ type: 'credit', cardNumber: '', cardHolder: '', expiryDate: '', provider: 'Visa', isDefault: false });
    setIsAddingNew(false);
    toast.success('Método de pago agregado');
  };

  const handleEdit = () => {
    if (!editingMethod) return;
    setPaymentMethods(prev => prev.map(m => m.id === editingMethod.id ? editingMethod : m));
    setEditingMethod(null);
    toast.success('Método de pago actualizado');
  };

  const handleDelete = (id: string) => {
    const toDelete = paymentMethods.find(m => m.id === id);
    const remaining = paymentMethods.filter(m => m.id !== id);
    if (toDelete?.isDefault && remaining.length > 0) remaining[0].isDefault = true;
    setPaymentMethods(remaining);
    toast.success('Método de pago eliminado');
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    toast.success('Método predeterminado actualizado');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F7FA', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header — igual al de la tienda */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, borderBottom: '1px solid #E5E5E2', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf style={{ width: 17, height: 17, color: '#3A7D44' }} />
            </div>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1A', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.2 }}>Bionatural</span>
              <span style={{ fontSize: 11, color: '#737370', display: 'block', lineHeight: 1 }}>Tienda Naturista</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard style={{ width: 15, height: 15, color: '#1C1C1A' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1A' }}>Métodos de Pago</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setIsAddingNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'white', backgroundColor: '#3A7D44', border: 'none', cursor: 'pointer', padding: '7px 14px', borderRadius: 8 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2D6A4F')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3A7D44')}>
              <Plus style={{ width: 13, height: 13 }} /> Agregar
            </button>
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#737370', background: 'none', border: '1px solid #E5E5E2', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, backgroundColor: 'white' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Volver
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: Wallet, label: 'Total', value: String(paymentMethods.length), color: '#3B82F6', bg: '#EFF6FF' },
            { icon: Star, label: 'Predeterminado', value: paymentMethods.find(m => m.isDefault)?.provider || 'N/A', color: '#F59E0B', bg: '#FFFBEB' },
            { icon: Shield, label: 'Seguridad', value: '100%', color: '#10B981', bg: '#ECFDF5' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} style={{ backgroundColor: 'white', borderRadius: 16, padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0EE', textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <Icon style={{ width: 16, height: 16, color }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1A', margin: 0 }}>{value}</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Lista de métodos */}
        <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0EE' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Métodos guardados</p>

          {paymentMethods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#F0F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CreditCard style={{ width: 24, height: 24, color: '#3A7D44' }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1A', marginBottom: 6 }}>Sin métodos de pago</p>
              <p style={{ fontSize: 13, color: '#737370', marginBottom: 20 }}>Agrega tu primer método para comprar fácilmente</p>
              <button onClick={() => setIsAddingNew(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, backgroundColor: '#3A7D44', color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                <Plus style={{ width: 14, height: 14 }} /> Agregar método
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paymentMethods.map(method => (
                <div key={method.id} style={{ padding: '14px 16px', borderRadius: 14, backgroundColor: method.isDefault ? '#F0FDF4' : '#F9FAFB', border: `1.5px solid ${method.isDefault ? '#BBF7D0' : '#F0F0EE'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: method.isDefault ? '#D1FAE5' : '#F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CreditCard style={{ width: 20, height: 20, color: method.isDefault ? '#3A7D44' : '#6B7280' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1A' }}>{getCardTypeLabel(method.type)}</span>
                        {method.isDefault && <span style={{ fontSize: 10, fontWeight: 700, color: '#065F46', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: 99 }}>Predeterminado</span>}
                      </div>
                      <p style={{ fontSize: 13, color: '#737370', margin: 0 }}>{method.cardNumber} · {method.provider}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: '1px 0 0' }}>{method.cardHolder}{method.expiryDate ? ` · Vence ${method.expiryDate}` : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {!method.isDefault && (
                        <button onClick={() => handleSetDefault(method.id)} style={{ fontSize: 11, fontWeight: 600, color: '#3A7D44', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>
                          <Star style={{ width: 12, height: 12, display: 'inline', marginRight: 3 }} />Predeterminar
                        </button>
                      )}
                      <button onClick={() => setEditingMethod(method)} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit3 style={{ width: 13, height: 13, color: '#3B82F6' }} />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 style={{ width: 13, height: 13, color: '#EF4444' }} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar método de pago?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(method.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seguridad */}
        <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0EE', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield style={{ width: 18, height: 18, color: '#10B981' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1A', margin: '0 0 4px' }}>Tus datos están protegidos</p>
            <p style={{ fontSize: 13, color: '#737370', margin: 0, lineHeight: 1.6 }}>Usamos encriptación de nivel bancario. Nunca almacenamos números completos de tarjeta ni códigos de seguridad.</p>
          </div>
        </div>
      </div>

      {/* Dialog agregar */}
      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Método de Pago</DialogTitle>
            <DialogDescription>Agrega un nuevo método de forma segura</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={newMethod.type} onValueChange={(v: any) => setNewMethod(p => ({ ...p, type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="debit">Tarjeta de Débito</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Titular</Label>
              <Input value={newMethod.cardHolder} onChange={e => setNewMethod(p => ({ ...p, cardHolder: e.target.value }))} placeholder="Nombre del titular" className={`h-9 text-sm ${errors.cardHolder ? 'border-destructive' : ''}`} />
              {errors.cardHolder && <p className="text-xs text-destructive">{errors.cardHolder}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{newMethod.type === 'paypal' ? 'Email de PayPal' : 'Número de Tarjeta'}</Label>
              <Input value={newMethod.cardNumber}
                onChange={e => setNewMethod(p => ({ ...p, cardNumber: newMethod.type === 'paypal' ? e.target.value : formatCardNumber(e.target.value) }))}
                placeholder={newMethod.type === 'paypal' ? 'email@ejemplo.com' : '1234 5678 9012 3456'}
                className={`h-9 text-sm ${errors.cardNumber ? 'border-destructive' : ''}`} />
              {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber}</p>}
            </div>
            {newMethod.type !== 'paypal' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Vencimiento</Label>
                  <Input value={newMethod.expiryDate}
                    onChange={e => { let v = e.target.value.replace(/\D/g, ''); if (v.length >= 2) v = v.substr(0, 2) + '/' + v.substr(2, 2); setNewMethod(p => ({ ...p, expiryDate: v })); }}
                    placeholder="MM/YY" maxLength={5} className={`h-9 text-sm ${errors.expiryDate ? 'border-destructive' : ''}`} />
                  {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Proveedor</Label>
                  <Select value={newMethod.provider} onValueChange={v => setNewMethod(p => ({ ...p, provider: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Visa">Visa</SelectItem>
                      <SelectItem value="Mastercard">Mastercard</SelectItem>
                      <SelectItem value="American Express">American Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setIsAddingNew(false)} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', backgroundColor: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>Cancelar</button>
            <button onClick={handleAdd} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', backgroundColor: '#3A7D44', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus style={{ width: 13, height: 13 }} /> Agregar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog editar */}
      <Dialog open={!!editingMethod} onOpenChange={() => setEditingMethod(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Método de Pago</DialogTitle>
            <DialogDescription>Actualiza la información</DialogDescription>
          </DialogHeader>
          {editingMethod && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Titular</Label>
                <Input value={editingMethod.cardHolder} onChange={e => setEditingMethod(p => p ? { ...p, cardHolder: e.target.value } : null)} className="h-9 text-sm" />
              </div>
              {editingMethod.type !== 'paypal' && (
                <div className="space-y-1">
                  <Label className="text-xs">Vencimiento</Label>
                  <Input value={editingMethod.expiryDate}
                    onChange={e => { let v = e.target.value.replace(/\D/g, ''); if (v.length >= 2) v = v.substr(0, 2) + '/' + v.substr(2, 2); setEditingMethod(p => p ? { ...p, expiryDate: v } : null); }}
                    placeholder="MM/YY" maxLength={5} className="h-9 text-sm" />
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setEditingMethod(null)} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', backgroundColor: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>Cancelar</button>
            <button onClick={handleEdit} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', backgroundColor: '#3A7D44', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle style={{ width: 13, height: 13 }} /> Guardar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
