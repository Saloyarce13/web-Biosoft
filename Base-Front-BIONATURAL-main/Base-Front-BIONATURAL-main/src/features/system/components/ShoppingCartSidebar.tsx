import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, Package, CheckCircle, Leaf, X } from 'lucide-react';
import { formatCOP } from '../../../shared/utils/storage';

export interface CartItem {
  id: number; name: string; price: number; image: string;
  quantity: number; category: string; stock?: number;
}

interface ShoppingCartSidebarProps {
  isOpen: boolean; onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function ShoppingCartSidebar({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout }: ShoppingCartSidebarProps) {
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const subtotal   = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const inc = (item: CartItem) => {
    const maxQty = item.stock ?? 999;
    if (item.quantity >= maxQty) { toast.error(`Solo hay ${maxQty} unidades disponibles`); return; }
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const dec = (item: CartItem) => {
    if (item.quantity <= 1) { onRemoveItem(item.id); toast.success(`${item.name} eliminado`); }
    else onUpdateQuantity(item.id, item.quantity - 1);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-sm h-full flex flex-col p-0 gap-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Carrito de compras</SheetTitle>
          <SheetDescription>Productos en tu carrito</SheetDescription>
        </SheetHeader>

        {/* Header — estilo tienda */}
        <div style={{ borderBottom: '1px solid #E5E5E2', padding: '16px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag style={{ width: 17, height: 17, color: '#3A7D44' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1A', margin: 0, letterSpacing: '-0.01em' }}>Carrito</p>
              <p style={{ fontSize: 11, color: '#737370', margin: 0 }}>
                {totalItems > 0 ? `${totalItems} artículo${totalItems !== 1 ? 's' : ''}` : 'Vacío'}
              </p>
            </div>
          </div>

          {totalItems > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', border: '1px solid #B7E4C7', borderRadius: 8, padding: '7px 12px' }}>
              <CheckCircle style={{ width: 13, height: 13, color: '#3A7D44', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1B4332' }}>Retiro en tienda · Pago al recoger</span>
            </div>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <ShoppingBag style={{ width: 32, height: 32, color: '#3A7D44' }} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: '#1C1C1A', marginBottom: 6, letterSpacing: '-0.01em' }}>Tu carrito está vacío</p>
            <p style={{ fontSize: 13, color: '#737370', marginBottom: 24, lineHeight: 1.6 }}>Agrega productos para comenzar tu pedido</p>
            <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, backgroundColor: '#3A7D44', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              <Leaf style={{ width: 15, height: 15 }} /> Explorar productos
            </button>
          </div>
        ) : (
          <>
            {/* Lista scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, padding: '12px', borderRadius: 14, backgroundColor: 'white', border: '1px solid #F0F0EE', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  {/* Imagen */}
                  <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#F0F4EF' }}>
                    <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</p>
                      <button onClick={() => { onRemoveItem(item.id); toast.success(`${item.name} eliminado`); }}
                        style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <X style={{ width: 12, height: 12, color: '#EF4444' }} />
                      </button>
                    </div>

                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 8px' }}>{item.category}</p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Controles cantidad */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, backgroundColor: '#F5F7FA', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                        <button onClick={() => dec(item)} style={{ width: 30, height: 30, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                          <Minus style={{ width: 12, height: 12 }} />
                        </button>
                        <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#1C1C1A' }}>{item.quantity}</span>
                        <button onClick={() => inc(item)} disabled={item.stock !== undefined && item.quantity >= item.stock}
                          style={{ width: 30, height: 30, border: 'none', backgroundColor: 'transparent', cursor: item.stock !== undefined && item.quantity >= item.stock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', opacity: item.stock !== undefined && item.quantity >= item.stock ? 0.4 : 1 }}>
                          <Plus style={{ width: 12, height: 12 }} />
                        </button>
                      </div>

                      <span style={{ fontSize: 15, fontWeight: 800, color: '#3A7D44', letterSpacing: '-0.01em' }}>{formatCOP(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Resumen */}
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: 14, padding: '14px 16px', border: '1px solid #F0F0EE', marginTop: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Resumen</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#737370' }}>
                    <span>Subtotal ({totalItems} art.)</span>
                    <span>{formatCOP(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#737370' }}>
                    <span>Envío</span>
                    <span style={{ color: '#3A7D44', fontWeight: 600 }}>Retiro en tienda</span>
                  </div>
                  <div style={{ height: 1, backgroundColor: '#E5E7EB', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#1C1C1A', letterSpacing: '-0.01em' }}>
                    <span>Total</span>
                    <span style={{ color: '#3A7D44' }}>{formatCOP(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones fijos */}
            <div style={{ padding: '12px 16px 20px', borderTop: '1px solid #F0F0EE', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => { onCheckout(); onClose(); }}
                style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #2D6A4F, #52B788)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '-0.01em' }}>
                Confirmar pedido <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
              <button onClick={() => { onClearCart(); toast.success('Carrito vaciado'); }}
                style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#FEF2F2', border: '1.5px solid #FEE2E2', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Trash2 style={{ width: 13, height: 13 }} /> Vaciar carrito
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
