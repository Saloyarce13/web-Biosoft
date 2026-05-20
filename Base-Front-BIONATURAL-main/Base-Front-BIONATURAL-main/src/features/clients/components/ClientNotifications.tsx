import React, { useState, useEffect, useCallback } from 'react';
import { useFavorites } from '../../../shared/hooks/useFavorites';
import { getProducts } from '../../../lib/api';
import { Bell, Package, Leaf, CheckCircle, RefreshCw, Home, Sparkles, ArrowLeft } from 'lucide-react';

interface ClientNotificationsProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
}

interface StockNotification {
  id: string; productId: string; productName: string;
  image?: string; stock: number; isRead: boolean; timestamp: Date;
}

const NOTIF_STORAGE_KEY = 'bionatural_stock_notifs';

function loadNotifs(email: string): StockNotification[] {
  try { return JSON.parse(localStorage.getItem(`${NOTIF_STORAGE_KEY}_${email}`) || '[]'); }
  catch { return []; }
}

function saveNotifs(email: string, notifs: StockNotification[]) {
  localStorage.setItem(`${NOTIF_STORAGE_KEY}_${email}`, JSON.stringify(notifs));
}

function formatTime(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return 'Hace un momento';
  if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return `Hace ${Math.floor(diff / 86_400_000)} día${Math.floor(diff / 86_400_000) > 1 ? 's' : ''}`;
}

export function ClientNotifications({ user, onBack }: ClientNotificationsProps) {
  const { favorites } = useFavorites(user.email);
  const [notifications, setNotifications] = useState<StockNotification[]>(() => loadNotifs(user.email));
  const [loading, setLoading] = useState(false);

  const checkStock = useCallback(async () => {
    if (favorites.length === 0) return;
    setLoading(true);
    try {
      const res = await getProducts();
      if (!res.success) return;
      const existing = loadNotifs(user.email);
      const existingIds = new Set(existing.map(n => n.id));
      const newNotifs: StockNotification[] = [];
      for (const fav of favorites) {
        const product = (res.data as any[]).find((p: any) => String(p.id) === String(fav.id));
        if (!product) continue;
        if (product.isActive && product.stock > 0) {
          const notifId = `stock_${fav.id}_${new Date().toDateString()}`;
          if (!existingIds.has(notifId)) {
            newNotifs.push({ id: notifId, productId: String(fav.id), productName: fav.name, image: fav.image, stock: product.stock, isRead: false, timestamp: new Date() });
          }
        }
      }
      if (newNotifs.length > 0) {
        const updated = [...newNotifs, ...existing].slice(0, 50);
        setNotifications(updated);
        saveNotifs(user.email, updated);
      }
    } catch { }
    finally { setLoading(false); }
  }, [favorites, user.email]);

  useEffect(() => { checkStock(); }, [checkStock]);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveNotifs(user.email, updated);
  };

  const markRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    saveNotifs(user.email, updated);
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F7FA', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Banner con Header Integrado */}
      <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', height: 200, margin: '0 auto 28px', maxWidth: 1280, background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #3A7D44 100%)', boxShadow: '0 10px 30px rgba(27,67,50,0.2)' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 220, height: 220, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 80, width: 180, height: 180, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
        
        {/* Header dentro del banner */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          {/* Logo Blanco */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
              <Leaf style={{ width: 17, height: 17, color: '#81C784' }} />
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', display: 'block', lineHeight: 1.2 }}>Bionatural</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'block', lineHeight: 1 }}>Tienda Naturista</span>
            </div>
          </div>

          {/* Perfil Blanco */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#451A03' }}>{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 99, padding: '4px 12px', marginBottom: 10 }}>
              <Bell style={{ width: 11, height: 11, color: '#FBBF24' }} />
              <span style={{ fontSize: 10, color: '#FBBF24', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notificaciones</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
              Avisos y stock 🔔
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4, margin: 0 }}>
              {unread > 0 ? `Tienes ${unread} notificación${unread !== 1 ? 'es' : ''} sin leer` : 'Estás al día con tus avisos'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'white', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: '0 16px', borderRadius: 12, height: 40 }}>
                <CheckCircle style={{ width: 14, height: 14 }} /> Leer todas
              </button>
            )}
            <button onClick={checkStock} disabled={loading} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <RefreshCw style={{ width: 16, height: 16, color: 'white', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'white', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: '0 20px', borderRadius: 12, height: 40 }}>
              <ArrowLeft style={{ width: 15, height: 15 }} /> Volver
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Sin favoritos */}
        {favorites.length === 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F0F0EE' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Leaf style={{ width: 28, height: 28, color: '#3A7D44' }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1A', marginBottom: 6 }}>Sin favoritos guardados</p>
            <p style={{ fontSize: 13, color: '#737370', lineHeight: 1.6 }}>
              Guarda productos en favoritos y te avisaremos cuando vuelvan a tener stock.
            </p>
          </div>
        )}

        {/* Sin notificaciones */}
        {notifications.length === 0 && favorites.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F0F0EE' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Bell style={{ width: 28, height: 28, color: '#F59E0B' }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1A', marginBottom: 6 }}>Sin notificaciones aún</p>
            <p style={{ fontSize: 13, color: '#737370', lineHeight: 1.6 }}>
              Te avisaremos cuando alguno de tus {favorites.length} producto{favorites.length !== 1 ? 's' : ''} favorito{favorites.length !== 1 ? 's' : ''} vuelva a tener stock.
            </p>
          </div>
        )}

        {/* Lista de notificaciones */}
        {notifications.map(notif => (
          <div key={notif.id} onClick={() => markRead(notif.id)}
            style={{ backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${!notif.isRead ? '#BBF7D0' : '#F0F0EE'}`, cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>

            {/* Franja verde si no leída */}
            {!notif.isRead && <div style={{ height: 3, background: 'linear-gradient(90deg, #3A7D44, #52B788)' }} />}

            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Imagen o placeholder */}
              {notif.image ? (
                <img src={notif.image} alt={notif.productName} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: '#F0F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package style={{ width: 22, height: 22, color: '#3A7D44' }} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Sparkles style={{ width: 12, height: 12, color: '#3A7D44', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2D6A4F' }}>¡Volvió al stock!</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1C1C1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.productName}</p>
                    <p style={{ fontSize: 12, color: '#737370', margin: '2px 0 0' }}>{notif.stock} unidad{notif.stock !== 1 ? 'es' : ''} disponible{notif.stock !== 1 ? 's' : ''}</p>
                  </div>
                  {!notif.isRead && (
                    <span style={{ backgroundColor: '#3A7D44', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>Nuevo</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '6px 0 0' }}>{formatTime(notif.timestamp)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
