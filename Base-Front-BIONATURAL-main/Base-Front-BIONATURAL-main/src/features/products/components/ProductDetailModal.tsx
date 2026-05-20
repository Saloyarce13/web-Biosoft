import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { formatCOP } from '../../../shared/utils/storage';
import { useCart } from '../../../shared/contexts/CartContext';
import {
  ShoppingCart,
  Package,
  Leaf,
  Plus,
  Minus,
  Heart,
  Shield,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  status?: 'Activo' | 'Inactivo' | 'Descontinuado';
  sku?: string;
  supplier?: string;
  technicalSheet?: string;
  cost?: number;
  margin?: number;
  weight?: number;
  barcode?: string;
  minStock?: number;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
  totalSales?: number;
  lastSaleDate?: string | null;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: (id: string | number) => boolean;
  onToggleFavorite: (product: Product) => void;
}

export function ProductDetailModal({ product, isOpen, onClose, isFavorite, onToggleFavorite }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const favActive = product ? (isFavorite ? isFavorite(product.id) : false) : false;

  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen]);

  if (!product) return null;

  const isAvailable = product.stock > 0;
  const isLowStock = product.stock > 0 && product.stock < 10;
  const totalPrice = formatCOP(product.price * quantity);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  return (
    <>
      {/* Lightbox — solo la imagen sobre fondo negro */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={product.image || ''}
            alt={product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Cerrar imagen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
        {/* [&>button]:hidden oculta la X que shadcn inyecta automáticamente en DialogContent */}
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>{product.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col overflow-y-auto max-h-[90vh]">

            {/* Barra superior con X y favorito — fuera de la imagen */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
              <button
                onClick={() => {
                  if (onToggleFavorite && product) {
                    onToggleFavorite(product);
                    toast.success(favActive ? 'Eliminado de favoritos' : 'Guardado en favoritos');
                  }
                }}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                aria-label="Favorito"
              >
                <Heart className={`h-4 w-4 ${favActive ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Imagen — full width, click abre lightbox */}
            <div
              className="w-full shrink-0 cursor-pointer overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100"
              style={{ height: '240px' }}
              onClick={() => product.image && setLightboxOpen(true)}
            >
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                category={product.category}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Contenido */}
            <div className="p-5 space-y-4">

              {/* Categoría + stock */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                {isAvailable ? (
                  <Badge className={`text-xs font-medium border ${isLowStock ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {isLowStock ? `Solo ${product.stock} disponibles` : 'Disponible'}
                  </Badge>
                ) : (
                  <Badge className="bg-red-50 text-red-700 border-red-200 border text-xs font-medium">
                    <Package className="h-3 w-3 mr-1" />
                    Agotado
                  </Badge>
                )}
              </div>

              {/* Nombre + precio */}
              <div>
                <h2 className="text-xl font-bold text-foreground leading-tight">{product.name}</h2>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">{formatCOP(product.price)}</span>
                  <span className="text-sm text-muted-foreground">/ unidad</span>
                </div>
              </div>

              {/* Descripción */}
              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Pills */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs bg-primary/5 text-primary rounded-full px-3 py-1.5 font-medium">
                  <Leaf className="h-3.5 w-3.5" />
                  100% Natural
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-secondary/10 text-secondary rounded-full px-3 py-1.5 font-medium">
                  <Shield className="h-3.5 w-3.5" />
                  Certificado
                </div>
              </div>

              {/* Meta */}
              {(product.sku || product.supplier || product.weight) && (
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {product.sku && (
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 shrink-0" />
                      <span>SKU: <span className="font-medium text-foreground">{product.sku}</span></span>
                    </div>
                  )}
                  {product.supplier && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Proveedor: <span className="font-medium text-foreground">{product.supplier}</span></span>
                    </div>
                  )}
                  {product.weight && (
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 shrink-0" />
                      <span>Peso: <span className="font-medium text-foreground">{product.weight}g</span></span>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t" />

              {/* Cantidad + botón */}
              {isAvailable ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cantidad</span>
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleAddToCart} className="w-full h-11 font-semibold text-sm gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Agregar al carrito · {totalPrice}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Producto agotado</p>
                    <p className="text-xs text-red-600">Pronto tendremos más stock disponible</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
