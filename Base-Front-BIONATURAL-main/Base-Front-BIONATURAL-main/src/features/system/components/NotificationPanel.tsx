import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../../components/ui/sheet';
import { getProducts } from '../../../lib/api';
import { Bell, AlertTriangle, Package, RefreshCw, CheckCircle } from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string; role: string };
}

interface StockAlert {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  image?: string;
}

export function NotificationPanel({ isOpen, onClose, user }: NotificationPanelProps) {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts(true);
      if (res.success) {
        const low = (res.data as any[])
          .filter((p: any) => p.isActive && p.stock <= (p.minStock || 5))
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            minStock: p.minStock || 5,
            image: p.image || '',
          }));
        setAlerts(low);
      }
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isOpen) loadAlerts();
  }, [isOpen, loadAlerts]);

  const outOfStock = alerts.filter(a => a.stock === 0);
  const lowStock   = alerts.filter(a => a.stock > 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md h-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Notificaciones de Stock
            {alerts.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                {alerts.length}
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Alertas de inventario para {user.role}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
          {/* Refresh */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={loadAlerts} disabled={loading} className="text-xs text-muted-foreground gap-1">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Verificando stock...</span>
            </div>
          )}

          {!loading && alerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-medium text-foreground">Todo en orden</p>
              <p className="text-xs text-center">No hay productos con stock crítico en este momento.</p>
            </div>
          )}

          {!loading && outOfStock.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Agotados ({outOfStock.length})
              </p>
              {outOfStock.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-red-600 font-semibold">Sin stock</p>
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs shrink-0">0 uds</Badge>
                </div>
              ))}
            </div>
          )}

          {!loading && lowStock.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Stock bajo ({lowStock.length})
              </p>
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Mínimo: {p.minStock} uds</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 border text-xs shrink-0">
                    {p.stock} uds
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t px-5 py-4">
          <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
