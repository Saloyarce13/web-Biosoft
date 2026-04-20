import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';
import { formatCOP } from '../../../shared/utils/storage';
import {
  Package, Clock, CheckCircle, XCircle,
  ShoppingBag, MapPin, RefreshCw, Home, ChevronDown, ChevronUp, Leaf
} from 'lucide-react';

interface SaleItem {
  id: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: { id: number; name: string; sku: string | null; image: string | null };
}

interface Sale {
  id: number;
  status: 'REGISTERED' | 'COMPLETED' | 'CANCELLED' | 'ANNULED';
  totalPrice: number;
  notes: string | null;
  saleDate: string;
  client: { id: number; name: string; email: string | null };
  items: SaleItem[];
}

interface ClientOrdersProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
}

const STATUS: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
  REGISTERED: { label: 'Pendiente de retiro', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: Clock },
  COMPLETED:  { label: 'Completado',           bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', icon: CheckCircle },
  CANCELLED:  { label: 'Cancelado',            bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB', icon: XCircle },
  ANNULED:    { label: 'Anulado',              bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: XCircle },
};

function parsePickupFromNotes(notes: string | null) {
  if (!notes) return null;
  const dateMatch = notes.match(/Fecha retiro:\s*([^\s|]+)/);
  const timeMatch = notes.match(/Hora retiro:\s*([^\s|]+)/);
  return { date: dateMatch?.[1] || null, time: timeMatch?.[1] || null };
}

export function ClientOrders({ user, onBack }: ClientOrdersProps) {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

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
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E2', backgroundColor: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#737370', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F4F4F2')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <Home style={{ width: 14, height: 14 }} /> Inicio
          </button>
          <div style={{ width: 1, height: 20, backgroundColor: '#E5E5E2' }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1A', margin: 0, letterSpacing: '-0.01em' }}>Mis Pedidos</p>
            <p style={{ fontSize: 11, color: '#737370', margin: 0 }}>{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E5E2', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <RefreshCw style={{ width: 14, height: 14, color: '#737370' }} />
        </button>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {orders.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#F0F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShoppingBag style={{ width: 26, height: 26, color: '#3A7D44' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1A', marginBottom: 6 }}>Sin pedidos aún</p>
            <p style={{ fontSize: 13, color: '#737370', marginBottom: 20 }}>Cuando hagas un pedido aparecerá aquí</p>
            <button onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, backgroundColor: '#3A7D44', color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
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
              <div key={order.id} style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                {/* Franja de estado */}
                <div style={{ height: 3, backgroundColor: st.text, opacity: 0.6 }} />

                <div style={{ padding: '16px 18px' }}>
                  {/* Fila principal */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1A' }}>Pedido #{order.id}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, backgroundColor: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                          <Icon style={{ width: 11, height: 11 }} />
                          {st.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#737370', margin: 0 }}>
                        {new Date(order.saleDate).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                      </p>
                      {pickup?.date && (
                        <p style={{ fontSize: 11, color: '#737370', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin style={{ width: 11, height: 11 }} />
                          Retiro: {pickup.date}{pickup.time ? ` · ${pickup.time}` : ''}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#3A7D44', margin: 0, letterSpacing: '-0.01em' }}>{formatCOP(Number(order.totalPrice))}</p>
                      <p style={{ fontSize: 11, color: '#737370', margin: '2px 0 0' }}>{itemCount} producto{itemCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Aviso 24h */}
                  {order.status === 'REGISTERED' && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '8px 12px', color: '#92400E' }}>
                      <Clock style={{ width: 13, height: 13, flexShrink: 0 }} />
                      Tienes 24 horas para recoger · Pago en tienda
                    </div>
                  )}

                  {/* Toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#3A7D44', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Package style={{ width: 13, height: 13 }} />
                    {isOpen ? 'Ocultar productos' : 'Ver productos'}
                    {isOpen ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                  </button>

                  {/* Detalle expandible */}
                  {isOpen && (
                    <div style={{ marginTop: 12, borderTop: '1px solid #F4F4F2', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(order.items || []).map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {item.product?.image
                              ? <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                              : <Leaf style={{ width: 18, height: 18, color: '#3A7D44' }} />
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product?.name}</p>
                            <p style={{ fontSize: 11, color: '#737370', margin: '2px 0 0' }}>×{item.quantity} · {formatCOP(Number(item.unitPrice))} c/u</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', flexShrink: 0 }}>{formatCOP(Number(item.lineTotal))}</span>
                        </div>
                      ))}

                      {/* Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F4F4F2', paddingTop: 10, marginTop: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#737370' }}>Total del pedido</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#3A7D44' }}>{formatCOP(Number(order.totalPrice))}</span>
                      </div>

                      {/* Notas limpias */}
                      {order.notes && (() => {
                        const cleanNote = order.notes.replace(/Fecha retiro:[^|]+\|?\s*/g, '').replace(/Hora retiro:[^|]+\|?\s*/g, '').trim();
                        return cleanNote ? (
                          <p style={{ fontSize: 12, color: '#737370', backgroundColor: '#F4F4F2', borderRadius: 8, padding: '8px 12px', margin: 0 }}>{cleanNote}</p>
                        ) : null;
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
