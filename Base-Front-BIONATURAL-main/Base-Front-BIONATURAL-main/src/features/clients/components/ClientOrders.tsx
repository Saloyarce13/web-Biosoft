import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';
import { apiFetch, updateSaleStatus } from '../../../lib/api';
import { formatCOP } from '../../../shared/utils/storage';
import {
  Package, Clock, CheckCircle, XCircle,
  ShoppingBag, MapPin, RefreshCw, Home, ChevronDown, ChevronUp, Leaf, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';

interface SaleItem {
  id: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: { id: number; name: string; sku: string | null; image: string | null };
}

interface Sale {
  id: number;
  status: 'REGISTERED' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'ANNULED';
  totalPrice: number;
  notes: string | null;
  saleDate: string;
  readyAt: string | null;
  client: { id: number; name: string; email: string | null };
  items: SaleItem[];
}

interface ClientOrdersProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
}

const STATUS: Record<string, { label: string; bg: string; text: string; border: string; stripe: string; icon: React.ElementType }> = {
  REGISTERED: { label: 'Pendiente de retiro', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', stripe: '#3B82F6', icon: Clock },
  READY:      { label: 'Listo en tienda 🎉',  bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', stripe: '#10B981', icon: CheckCircle },
  COMPLETED:  { label: 'Completado',           bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', stripe: '#22C55E', icon: CheckCircle },
  CANCELLED:  { label: 'Cancelado',            bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB', stripe: '#9CA3AF', icon: XCircle },
  ANNULED:    { label: 'Anulado',              bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', stripe: '#EF4444', icon: XCircle },
};

function parsePickupFromNotes(notes: string | null) {
  if (!notes) return null;
  const dateMatch = notes.match(/Fecha retiro:\s*([^\s|]+)/);
  const timeMatch = notes.match(/Hora retiro:\s*([^\s|]+)/);
  return { date: dateMatch?.[1] || null, time: timeMatch?.[1] || null };
}

function canCancel(order: Sale): { allowed: boolean; minutesLeft: number } {
  if (order.status !== 'REGISTERED') return { allowed: false, minutesLeft: 0 };
  const created = new Date(order.saleDate).getTime();
  const limit = created + 2 * 60 * 60 * 1000;
  const now = Date.now();
  const msLeft = limit - now;
  const minutesLeft = Math.max(0, Math.floor(msLeft / 60_000));
  return { allowed: msLeft > 0, minutesLeft };
}

export function ClientOrders({ user, onBack }: ClientOrdersProps) {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const handleCancel = async (orderId: number) => {
    try {
      setCancelling(orderId);
      const res = await updateSaleStatus(String(orderId), 'CANCELLED');
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
        toast.success('Pedido cancelado correctamente');
      }
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo cancelar el pedido');
    } finally {
      setCancelling(null);
    }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Sale[]>('/sales');
      if (res.success) {
        const mine = (res.data as any[]).filter(
          (s: any) => s.client?.email?.toLowerCase() === user.email.toLowerCase()
        );
        setOrders(mine);
      }
    } catch {
      toast.error('No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [user.email]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#737370' }}>
          <RefreshCw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Cargando pedidos...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 1280, margin: '0 auto' }}>

      {/* Banner con Header Integrado */}
      <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', height: 200, marginBottom: 28, background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #3A7D44 100%)', boxShadow: '0 10px 30px rgba(27,67,50,0.2)' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 220, height: 220, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 80, width: 180, height: 180, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
        
        {/* Header dentro del banner */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          {/* Logo Blanco */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
              <Leaf style={{ width: 17, height: 17, color: '#81C784' }} />
            </div>
            <div style={{ display: 'none', md: { display: 'block' } } as any}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', display: 'block', lineHeight: 1.2 }}>Bionatural</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'block', lineHeight: 1 }}>Tienda Naturista</span>
            </div>
          </div>

          {/* Perfil Blanco */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#81C784', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#1B4332' }}>{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'white', display: 'block', lineHeight: 1.1 }}>{user.name}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', display: 'block', lineHeight: 1 }}>Cliente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido del Banner */}
        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(129,199,132,0.2)', border: '1px solid rgba(129,199,132,0.4)', borderRadius: 99, padding: '4px 12px', marginBottom: 10 }}>
              <ShoppingBag style={{ width: 11, height: 11, color: '#81C784' }} />
              <span style={{ fontSize: 10, color: '#81C784', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mis pedidos</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
              Historial de pedidos 📦
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4, margin: 0 }}>
              {orders.length > 0 ? `${orders.length} pedido${orders.length !== 1 ? 's' : ''} registrado${orders.length !== 1 ? 's' : ''}` : 'Aún no tienes pedidos'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} disabled={loading} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <RefreshCw style={{ width: 16, height: 16, color: 'white', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'white', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: '0 20px', borderRadius: 12, height: 40 }}>
              <ArrowLeft style={{ width: 15, height: 15 }} /> Volver
            </button>
          </div>
        </div>
      </div>

      {/* Contenido — centrado igual que favoritos */}
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {orders.length === 0 ? (
          <div style={{
            backgroundColor: 'white', borderRadius: 20, border: '1px solid #E5E5E2',
            padding: '56px 24px', textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <ShoppingBag style={{ width: 32, height: 32, color: '#059669' }} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: '#1C1C1A', marginBottom: 8 }}>Sin pedidos aún</p>
            <p style={{ fontSize: 13, color: '#737370', marginBottom: 24 }}>Cuando hagas un pedido aparecerá aquí</p>
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '11px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #3A7D44, #059669)',
                color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(58,125,68,0.3)',
              }}
            >
              <Home style={{ width: 14, height: 14 }} /> Ir a la tienda
            </button>
          </div>
        ) : (
          orders.map(order => {
            const st = STATUS[order.status] ?? STATUS.REGISTERED;
            const Icon = st.icon;
            const pickup = parsePickupFromNotes(order.notes);
            const isOpen = expanded === order.id;
            const itemCount = (order.items || []).length;

            return (
              <div key={order.id} style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                {/* Franja de color según estado */}
                <div style={{ height: 4, backgroundColor: st.stripe }} />

                <div style={{ padding: '18px 20px' }}>
                  {/* Fila principal */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1A' }}>Pedido #{order.id}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, backgroundColor: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                          <Icon style={{ width: 11, height: 11 }} />
                          {st.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                        {new Date(order.saleDate).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                        {pickup?.date && ` · Retiro: ${pickup.date}${pickup.time ? ` ${pickup.time}` : ''}`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 18, fontWeight: 900, color: '#3A7D44', margin: 0, letterSpacing: '-0.02em' }}>{formatCOP(Number(order.totalPrice))}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{itemCount} producto{itemCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Aviso READY */}
                  {order.status === 'READY' && order.readyAt && (() => {
                    const expiresAt = new Date(new Date(order.readyAt).getTime() + 24 * 60 * 60 * 1000);
                    const msLeft = expiresAt.getTime() - Date.now();
                    const hoursLeft = Math.max(0, Math.floor(msLeft / 3_600_000));
                    const minsLeft = Math.max(0, Math.floor((msLeft % 3_600_000) / 60_000));
                    const expired = msLeft <= 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, backgroundColor: expired ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${expired ? '#FECACA' : '#6EE7B7'}`, borderRadius: 10, padding: '10px 14px', color: expired ? '#991B1B' : '#065F46', marginBottom: 10 }}>
                        <CheckCircle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <p style={{ fontWeight: 700, margin: '0 0 2px' }}>{expired ? '⚠️ Pedido expirado' : '🎉 ¡Listo para recoger!'}</p>
                          <p style={{ margin: 0 }}>{!expired ? `Tienes ${hoursLeft}h ${minsLeft}min · Pago en tienda` : 'El tiempo expiró. Contacta la tienda.'}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Aviso 24h */}
                  {order.status === 'REGISTERED' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '9px 14px', color: '#92400E', marginBottom: 10 }}>
                      <Clock style={{ width: 13, height: 13, flexShrink: 0 }} />
                      Tienes 24 horas para recoger · Pago en tienda
                    </div>
                  )}

                  {/* Cancelar */}
                  {(() => {
                    const { allowed, minutesLeft } = canCancel(order);
                    if (!allowed && order.status !== 'REGISTERED') return null;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                        {allowed ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#B45309', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '4px 10px' }}>
                              <AlertTriangle style={{ width: 11, height: 11 }} />
                              Puedes cancelar por {minutesLeft >= 60 ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}min` : `${minutesLeft} min`} más
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button disabled={cancelling === order.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
                                  <XCircle style={{ width: 13, height: 13 }} />
                                  {cancelling === order.id ? 'Cancelando...' : 'Cancelar pedido'}
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Cancelar el pedido #{order.id}?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer. Solo puedes cancelar dentro de las primeras 2 horas.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, mantener</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancel(order.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, cancelar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : order.status === 'REGISTERED' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9CA3AF', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '4px 10px', width: 'fit-content' }}>
                            <Clock style={{ width: 11, height: 11 }} /> Tiempo de cancelación expirado
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Toggle ver productos */}
                  <button onClick={() => setExpanded(isOpen ? null : order.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#3A7D44', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Package style={{ width: 13, height: 13 }} />
                    {isOpen ? 'Ocultar productos' : 'Ver productos'}
                    {isOpen ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                  </button>

                  {/* Detalle expandible */}
                  {isOpen && (
                    <div style={{ marginTop: 14, borderTop: '1px solid #F4F4F2', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(order.items || []).map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F0F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {item.product?.image
                              ? <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <Leaf style={{ width: 18, height: 18, color: '#3A7D44' }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.product?.name}</p>
                            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>×{item.quantity} · {formatCOP(Number(item.unitPrice))} c/u</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', flexShrink: 0 }}>{formatCOP(Number(item.lineTotal))}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F4F4F2', paddingTop: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#737370' }}>Total del pedido</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#3A7D44' }}>{formatCOP(Number(order.totalPrice))}</span>
                      </div>
                      {order.notes && (() => {
                        const cleanNote = order.notes.replace(/Fecha retiro:[^|]+\|?\s*/g, '').replace(/Hora retiro:[^|]+\|?\s*/g, '').trim();
                        return cleanNote ? <p style={{ fontSize: 12, color: '#737370', backgroundColor: '#F9FAFB', borderRadius: 8, padding: '8px 12px', margin: 0 }}>{cleanNote}</p> : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
