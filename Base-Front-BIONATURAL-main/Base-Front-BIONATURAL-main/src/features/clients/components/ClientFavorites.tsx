import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { formatCOP } from '../../../shared/utils/storage';
import { useFavorites } from '../../../shared/hooks/useFavorites';
import { Home, Heart, ShoppingCart, Trash2, Package } from 'lucide-react';

interface ClientFavoritesProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
  onAddToCart: (product: any) => void;
}

export function ClientFavorites({ user, onBack, onAddToCart }: ClientFavoritesProps) {
  const { favorites, removeFavorite } = useFavorites(user.email);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 bg-background">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <Home className="h-4 w-4 mr-1.5" /> Inicio
        </Button>
        <div>
          <h1 className="text-base font-semibold flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-red-500" /> Mis Favoritos
          </h1>
          <p className="text-xs text-muted-foreground">{favorites.length} producto{favorites.length !== 1 ? 's' : ''} guardado{favorites.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {favorites.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-1">Sin favoritos aún</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Toca el corazón en cualquier producto para guardarlo aquí
              </p>
              <Button size="sm" onClick={onBack}>
                <Home className="h-4 w-4 mr-1.5" /> Explorar productos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square bg-muted overflow-hidden relative">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFavorite(product.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition-colors"
                    aria-label="Quitar de favoritos"
                  >
                    <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                  </button>
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">Agotado</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium line-clamp-2 leading-tight">{product.name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">{product.category}</Badge>
                  </div>
                  <p className="text-sm font-bold text-primary">{formatCOP(product.price)}</p>
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs gap-1"
                    disabled={product.stock === 0}
                    onClick={() => onAddToCart(product)}
                  >
                    {product.stock === 0 ? (
                      <><Package className="h-3 w-3" /> Agotado</>
                    ) : (
                      <><ShoppingCart className="h-3 w-3" /> Agregar</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
