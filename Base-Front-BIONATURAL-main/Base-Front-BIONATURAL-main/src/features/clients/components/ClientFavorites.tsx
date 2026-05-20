import React, { useEffect, useState } from 'react';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { formatCOP } from '../../../shared/utils/storage';
import { useFavorites } from '../../../shared/hooks/useFavorites';
import { Heart, ShoppingCart, Package, Leaf, ArrowLeft, RefreshCw } from 'lucide-react';
import { getProducts } from '../../../lib/api';
import { useCart } from '../../../shared/contexts/CartContext';

interface ClientFavoritesProps {
  user: { name: string; email: string; role: string };
  onBack: () => void;
}

export function ClientFavorites({ user, onBack }: ClientFavoritesProps) {
  const { addToCart } = useCart();
  const { favorites, removeFavorite } = useFavorites(user.email);
  const [validFavorites, setValidFavorites] = useState(favorites);
  const [loading, setLoading] = useState(true);

  // Validar favoritos contra la API — eliminar los que ya no existen o están inactivos
  useEffect(() => {
    const validate = async () => {
      setLoading(true);
      try {
        const res = await getProducts();
        if (res.success) {
          const activeIds = new Set(
            (res.data as any[])
              .filter((p: any) => p.isActive)
              .map((p: any) => String(p.id))
          );
          // Actualizar stock real desde la API
          const productMap = new Map(
            (res.data as any[]).map((p: any) => [String(p.id), p])
          );
          const valid = favorites
            .filter(f => activeIds.has(String(f.id)))
            .map(f => {
              const live = productMap.get(String(f.id));
              return live ? { ...f, stock: live.stock, price: Number(live.price), name: live.name, image: live.image || f.image } : f;
            });
          setValidFavorites(valid);
          // Limpiar del localStorage los que ya no existen
          favorites
            .filter(f => !activeIds.has(String(f.id)))
            .forEach(f => removeFavorite(f.id));
        } else {
          setValidFavorites(favorites);
        }
      } catch {
        setValidFavorites(favorites);
      } finally {
        setLoading(false);
      }
    };
    validate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar cuando cambian los favoritos del hook
  useEffect(() => {
    if (!loading) setValidFavorites(prev =>
      prev.filter(v => favorites.some(f => f.id === v.id))
    );
  }, [favorites, loading]);

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
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', display: 'block', lineHeight: 1.2 }}>Bionatural</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'block', lineHeight: 1 }}>Tienda Naturista</span>
            </div>
          </div>

          {/* Perfil Blanco */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#991B1B' }}>{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(252,165,165,0.2)', border: '1px solid rgba(252,165,165,0.4)', borderRadius: 99, padding: '4px 12px', marginBottom: 10 }}>
              <Heart style={{ width: 11, height: 11, color: '#FCA5A5', fill: '#FCA5A5' }} />
              <span style={{ fontSize: 10, color: '#FCA5A5', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mis favoritos</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
              Productos guardados ❤️
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4, margin: 0 }}>
              {loading ? 'Verificando productos...' : validFavorites.length > 0 ? `${validFavorites.length} producto${validFavorites.length !== 1 ? 's' : ''} en tu lista` : 'Aún no tienes productos guardados'}
            </p>
          </div>

          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'white', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: '0 20px', borderRadius: 12, height: 40, transition: 'all 0.2s' }}>
            <ArrowLeft style={{ width: 15, height: 15 }} /> Volver
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10, color: '#737370' }}>
          <RefreshCw style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Verificando productos...</span>
        </div>
      ) : validFavorites.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E5E5E2', padding: '56px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Heart style={{ width: 28, height: 28, color: '#EF4444' }} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#1C1C1A', marginBottom: 6 }}>Sin favoritos aún</p>
          <p style={{ fontSize: 13, color: '#737370', marginBottom: 24, lineHeight: 1.6 }}>
            Toca el corazón en cualquier producto para guardarlo aquí
          </p>
          <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, backgroundColor: '#3A7D44', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2D6A4F')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3A7D44')}>
            <Leaf style={{ width: 15, height: 15 }} /> Explorar productos
          </button>
        </div>
      ) : (
        <>
          {/* Contador */}
          <p style={{ fontSize: 13, color: '#737370', marginBottom: 16 }}>
            {validFavorites.length} producto{validFavorites.length !== 1 ? 's' : ''} guardado{validFavorites.length !== 1 ? 's' : ''}
          </p>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 220px))', gap: 20 }}>
            {validFavorites.map(product => (
              <div key={product.id}
                style={{ borderRadius: 16, border: '1px solid #E5E5E2', backgroundColor: 'white', overflow: 'hidden', transition: 'transform 0.18s ease, box-shadow 0.18s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>

                {/* Imagen */}
                <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', backgroundColor: '#F0F4EF' }}>
                  <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" />

                  {/* Botón quitar favorito */}
                  <button onClick={() => removeFavorite(product.id)}
                    style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', backgroundColor: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    aria-label="Quitar de favoritos">
                    <Heart style={{ width: 15, height: 15, fill: '#EF4444', color: '#EF4444' }} />
                  </button>

                  {/* Precio overlay */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '20px 12px 10px' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatCOP(product.price)}</span>
                  </div>

                  {product.stock === 0 && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99 }}>Agotado</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '14px 14px 16px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', margin: '0 0 3px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                  <p style={{ fontSize: 11, color: '#737370', margin: '0 0 12px' }}>{product.category}</p>
                  <button
                    disabled={product.stock === 0}
                    onClick={() => addToCart(product as any)}
                    style={{ width: '100%', height: 36, borderRadius: 9, border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: product.stock === 0 ? '#F3F4F6' : '#3A7D44', color: product.stock === 0 ? '#9CA3AF' : 'white' }}>
                    {product.stock === 0
                      ? <><Package style={{ width: 13, height: 13 }} /> Agotado</>
                      : <><ShoppingCart style={{ width: 13, height: 13 }} /> Agregar al carrito</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
