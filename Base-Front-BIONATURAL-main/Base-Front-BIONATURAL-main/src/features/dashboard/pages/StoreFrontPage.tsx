import React, { useState, useEffect } from 'react';
import {
  Leaf, Heart, ShoppingCart, Search,
  Shield, Award, Sparkles, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { ProductDetailModal } from '../../products/pages/ProductDetailPage';
import { useCart } from '../../../shared/contexts/CartContext';

export interface UnifiedProduct {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  status?: 'Activo' | 'Inactivo' | 'Descontinuado';
  isActive?: boolean;
}

const formatCOP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

// ── Hero Carousel ───────────────────────────────────────────────────────────
function HeroCarousel({ products, userName }: { products: any[]; userName?: string }) {
  const [current, setCurrent] = useState(0);
  const images = products.filter(p => p.image).map(p => ({ id: p.id, src: p.image!, name: p.name }));

  useEffect(() => {
    if (images.length === 0) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);

  const bgSrc = images.length > 0 ? images[current % images.length].src : 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1400&q=80';

  return (
    <section style={{ position: 'relative', height: 580, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 24, marginBottom: 48 }}>
      <img key={bgSrc} src={bgSrc} alt="Producto"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.8s' }}
        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1400&q=80'; }} />

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 55%, rgba(58,125,68,0.2) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 680 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 99, padding: '6px 14px', marginBottom: 24, backdropFilter: 'blur(8px)' }}>
          <Sparkles style={{ width: 12, height: 12, color: '#81C784' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 500, letterSpacing: '0.03em' }}>100% Natural · Sin conservantes · Orgánico</span>
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
          {userName ? `¡Hola, ${userName.split(' ')[0]}!` : 'Tu bienestar,'}<br />
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 24px', fontWeight: 500 }}>
          {userName
            ? `¡Qué alegría tenerte de vuelta, ${userName.split(' ')[0]}! Explora nuestra selección de productos naturales pensados especialmente para tu bienestar.`
            : 'Explora lo mejor de la medicina natural seleccionada con cuidado para tu salud integral.'}
        </p>
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => <Star key={i} style={{ width: 14, height: 14, fill: '#FBBF24', color: '#FBBF24' }} />)}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Más de 500 clientes satisfechos</span>
        </div>
      </div>

      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 99, backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
          ))}
        </div>
      )}
    </section>
  );
}

export function ClientStorefront({ isFavorite, toggleFavorite, userName }: {
  isFavorite: (id: string | number) => boolean;
  toggleFavorite: (product: any) => void;
  userName?: string;
}) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<UnifiedProduct | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      const { getProducts } = await import('../../../lib/api');
      const res = await getProducts();
      if (res.success) {
        setProducts(res.data.filter((p: any) => p.isActive && p.stock > 0).map((p: any) => ({
          id: String(p.id), name: p.name, description: p.description || '',
          price: Number(p.price), image: p.image || '', category: p.category?.name || '',
          stock: p.stock || 0, isActive: true
        })));
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = products.filter(p =>
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === 'all' || p.category === categoryFilter)
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', padding: '0 24px 64px' }}>
      <div style={{ maxWidth: 1200, margin: '40px auto 0', width: '100%' }}>

        {/* HERO */}
        <HeroCarousel products={products} userName={userName} />

        {/* BENEFICIOS */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { icon: Leaf, bg: '#E8F5E9', color: '#3A7D44', title: '100% Natural', desc: 'Sin químicos ni conservantes artificiales en ningún producto.' },
              { icon: Award, bg: '#FEF3C7', color: '#D97706', title: 'Calidad Certificada', desc: 'Rigurosos controles de calidad en cada lote seleccionado.' },
              { icon: Shield, bg: '#E0F2FE', color: '#0284C7', title: 'Compra Segura', desc: 'Pago al recoger en tienda. Sin riesgos ni complicaciones.' },
            ].map(({ icon: Icon, bg, color, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 24px', borderRadius: 16, border: '1px solid #E5E5E2', backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 22, height: 22, color }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1A', marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 12, color: '#737370', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DESTACADOS */}
        {!loading && products.length > 0 && (
          <section style={{ marginBottom: 64 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1C1C1A', marginBottom: 16 }}>Productos destacados</h2>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' as const }}>
              {products.slice(0, 8).map(product => {
                const fav = isFavorite(product.id);
                return (
                  <div key={product.id} onClick={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}
                    style={{ width: 220, height: 360, borderRadius: 18, border: '1px solid #E5E5E2', backgroundColor: 'white', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: 180, backgroundColor: '#F0F4EF', overflow: 'hidden', flexShrink: 0 }}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Leaf style={{ width: 36, height: 36, color: '#3A7D44', opacity: 0.4 }} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)', padding: '20px 12px 10px' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatCOP(product.price)}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); toggleFavorite(product); }}
                        style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', backgroundColor: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Heart className={`w-4 h-4 ${fav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: 34, marginBottom: 4, overflow: 'hidden' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1A', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                      </div>
                      <div style={{ height: 16, marginBottom: 12 }}>
                        <p style={{ fontSize: 11, color: '#3A7D44', fontWeight: 600, margin: 0 }}>{product.category}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); addToCart(product as any); toast.success('Agregado'); }}
                        style={{ width: '100%', height: 38, borderRadius: 10, border: 'none', backgroundColor: '#3A7D44', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 'auto' }}>
                        <ShoppingCart style={{ width: 13, height: 13 }} /> Agregar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CATÁLOGO */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1C1C1A', marginBottom: 4 }}>Nuestro catálogo</h2>
              <p style={{ fontSize: 13, color: '#737370' }}>{loading ? 'Cargando...' : `${filtered.length} productos disponibles`}</p>
            </div>
            {/* Filtros Modernos (Idénticos a la Landing) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 350 }}>
                <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#A3A3A3', pointerEvents: 'none' }} />
                <input
                  placeholder="Busca en el catálogo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: 42,
                    paddingRight: 16,
                    height: 44,
                    borderRadius: 14,
                    border: '1.5px solid #E5E5E2',
                    backgroundColor: 'white',
                    fontSize: 14,
                    color: '#1C1C1A',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3A7D44'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E5E5E2'}
                />
              </div>

              {/* Selector de Categorías Estilo Tabs */}
              <div style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 8,
                paddingTop: 4,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              } as any}>
                <button
                  onClick={() => setCategoryFilter('all')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: categoryFilter === 'all' ? '#3A7D44' : '#F4F4F2',
                    color: categoryFilter === 'all' ? 'white' : '#737370',
                    whiteSpace: 'nowrap',
                    boxShadow: categoryFilter === 'all' ? '0 4px 12px rgba(58,125,68,0.25)' : 'none'
                  }}
                >
                  Todos
                </button>
                {categories.filter(c => c !== 'all').map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      backgroundColor: categoryFilter === cat ? '#3A7D44' : 'white',
                      color: categoryFilter === cat ? 'white' : '#737370',
                      border: categoryFilter === cat ? 'none' : '1.5px solid #E5E5E2',
                      whiteSpace: 'nowrap',
                      boxShadow: categoryFilter === cat ? '0 4px 12px rgba(58,125,68,0.25)' : 'none'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 220px)', gap: 20, justifyContent: 'center' }}>
            {loading ? (
              [...Array(8)].map((_, i) => <div key={i} style={{ width: 220, height: 360, backgroundColor: '#F4F4F2', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />)
            ) : filtered.map(product => {
              const fav = isFavorite(product.id);
              return (
                <div key={product.id} onClick={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}
                  style={{ width: 220, height: 360, borderRadius: 16, border: '1px solid #E5E5E2', backgroundColor: 'white', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', height: 180, backgroundColor: '#F4F4F2', flexShrink: 0 }}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf className="w-10 h-10 text-green-100" />
                      </div>
                    )}
                    <button onClick={e => { e.stopPropagation(); toggleFavorite(product); }}
                      style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <Heart className={`w-4.5 h-4.5 ${fav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '20px 12px 10px' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatCOP(product.price)}</span>
                    </div>
                  </div>
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 34, marginBottom: 4, overflow: 'hidden' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1A', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                    </div>
                    <div style={{ height: 16, marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: '#737370', margin: 0 }}>{product.category}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); addToCart(product as any); toast.success('Producto agregado'); }}
                      style={{ width: '100%', height: 38, borderRadius: 9, backgroundColor: '#3A7D44', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 'auto' }}>
                      <ShoppingCart style={{ width: 13, height: 13 }} /> Agregar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <ProductDetailModal product={selectedProduct} isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); setSelectedProduct(null); }}
        isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
    </div>
  );
}
