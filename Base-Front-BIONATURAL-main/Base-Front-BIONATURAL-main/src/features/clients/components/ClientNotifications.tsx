import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { useFavorites } from '../../../shared/hooks/useFavorites';
import { getProducts } from '../../../lib/api';
import {
  Bell, Package, Leaf, ArrowLeft, CheckCircle, RefreshCw, Home
} from 'lucide-react';

interface ClientNotificationsProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
}

interface StockNotification {
  id: string;
  productId: string;
  productName: string;
  image?: string;
  stock: number;
  isRead: boolean;
  timestamp: Date;
}

const NOTIF_STORAGE_KEY = 'bionatural_stock_notifs';

function loadNotifs(email: string): StockNotification[] {
  try {
    return JSON.parse(localStorage.getItem(`${NOTIF_STORAGE_KEY}_${email}`) || '[]');
  } catch { return []; }
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

  // Comprueba si algún favorito volvió a tener stock y genera notificación
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
          // Generar notif única por producto+día para no duplicar
          const notifId = `stock_${fav.id}_${new Date().toDateString()}`;
          if (!existingIds.has(notifId)) {
            newNotifs.push({
              id: notifId,
              productId: String(fav.id),
              productName: fav.name,
              image: fav.image,
              stock: product.stock,
              isRead: false,
              timestamp: new Date(),
            });
          }
        }
      }

      if (newNotifs.length > 0) {
        const updated = [...newNotifs, ...existing].slice(0, 50);
        setNotifications(updated);
        saveNotifs(user.email, updated);
      }
    } catch { /* silencioso */ }
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <Home className="h-4 w-4 mr-1.5" /> Inicio
          </Button>
          <div>
            <h1 className="text-base font-semibold flex items-center gap-1.5">
              <Bell className="h-4 w-4" /> Notificaciones
              {unread > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold leading-none">
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">Alertas de stock de tus favoritos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Marcar leídas
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={checkStock} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {/* Info si no hay favoritos */}
        {favorites.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Leaf className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Sin favoritos guardados</p>
              <p className="text-xs text-muted-foreground">
                Guarda productos en favoritos y te avisaremos cuando vuelvan a tener stock.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lista de notificaciones */}
        {notifications.length === 0 && favorites.length > 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Sin notificaciones aún</p>
              <p className="text-xs text-muted-foreground">
                Te avisaremos cuando alguno de tus {favorites.length} producto{favorites.length !== 1 ? 's' : ''} favorito{favorites.length !== 1 ? 's' : ''} vuelva a tener stock.
              </p>
            </CardContent>
          </Card>
        )}

        {notifications.map(notif => (
          <Card
            key={notif.id}
            className={`cursor-pointer transition-colors ${!notif.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}
            onClick={() => markRead(notif.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {notif.image ? (
                  <img src={notif.image} alt={notif.productName} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">¡Volvió al stock!</p>
                      <p className="text-sm font-medium truncate">{notif.productName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notif.stock} unidad{notif.stock !== 1 ? 'es' : ''} disponible{notif.stock !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <Badge className="bg-primary text-primary-foreground text-xs shrink-0">Nuevo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(notif.timestamp)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
