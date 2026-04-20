import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import {
  Plus, Minus, Trash2, ShoppingBag, CreditCard, ArrowRight, Package, CheckCircle,
} from 'lucide-react';
import { formatCOP } from '../../../shared/utils/storage';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  stock?: number; // stock disponible para limitar el +
}

interface ShoppingCartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function ShoppingCartSidebar({
  isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout,
}: ShoppingCartSidebarProps) {
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const subtotal   = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax        = subtotal * 0.19;
  const total      = subtotal + tax;

  const inc = (item: CartItem) => {
    const maxQty = item.stock ?? 999;
    if (item.quantity >= maxQty) {
      toast.error(`Solo hay ${maxQty} unidades disponibles de ${item.name}`);
      return;
    }
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const dec = (item: CartItem) => {
    if (item.quantity <= 1) {
      onRemoveItem(item.id);
      toast.success(`${item.name} eliminado del carrito`);
    } else {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const remove = (item: CartItem) => {
    onRemoveItem(item.id);
    toast.success(`${item.name} eliminado`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* h-full + flex flex-col para que el scroll funcione */}
      <SheetContent className="w-full sm:max-w-md h-full flex flex-col p-0 gap-0">

        {/* Header fijo */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4" />
            Carrito de Compras
          </SheetTitle>
          <SheetDescription className="text-xs">
            {totalItems > 0
              ? `${totalItems} artículo${totalItems !== 1 ? 's' : ''} en tu carrito`
              : 'Tu carrito está vacío'}
          </SheetDescription>
          {totalItems > 0 && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg mt-1">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">Retiro en tienda</span>
            </div>
          )}
        </SheetHeader>

        {cartItems.length === 0 ? (
          /* Carrito vacío */
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6 gap-3">
            <ShoppingBag className="h-14 w-14 text-muted-foreground" />
            <div>
              <p className="font-medium">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground mt-1">Agrega productos para comenzar</p>
            </div>
            <Button size="sm" onClick={onClose}>
              <Package className="h-4 w-4 mr-1.5" /> Explorar productos
            </Button>
          </div>
        ) : (
          <>
            {/* Lista scrollable — min-h-0 es clave para que flex-1 + overflow funcionen */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3 p-3 border rounded-xl bg-background hover:bg-muted/20 transition-colors">
                  {/* Imagen */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{item.category}</Badge>

                    <div className="flex items-center justify-between mt-2">
                      {/* Controles cantidad */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => dec(item)}
                          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => inc(item)}
                          disabled={item.stock !== undefined && item.quantity >= item.stock}
                          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        {item.stock !== undefined && (
                          <span className="text-xs text-muted-foreground ml-1">/ {item.stock}</span>
                        )}
                      </div>

                      {/* Precio + eliminar */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">
                          {formatCOP(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => remove(item)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Resumen — al final del scroll */}
              <div className="border rounded-xl p-3 bg-muted/30 space-y-1.5 text-sm mt-2">
                <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">Resumen</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({totalItems} art.)</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retiro en tienda</span>
                  <span className="text-green-600 font-medium">Gratis</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (19%)</span>
                  <span>{formatCOP(tax)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="text-primary">{formatCOP(total)}</span>
                </div>
              </div>
            </div>

            {/* Botones fijos al fondo */}
            <div className="shrink-0 border-t bg-background px-5 py-4 space-y-2">
              <Button className="w-full h-11 font-semibold gap-2" onClick={() => { onCheckout(); onClose(); }}>
                <CreditCard className="h-4 w-4" />
                Proceder con el Pedido
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
                  Seguir comprando
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1" onClick={() => { onClearCart(); toast.success('Carrito vaciado'); }}>
                  <Trash2 className="h-3.5 w-3.5" /> Vaciar
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
