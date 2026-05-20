import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { formatCOP } from '../../../shared/utils/storage';
import {
  Leaf, Search, ShoppingCart, Package, LogIn,
  Shield, Award, Heart, Sparkles, Star, ArrowRight
} from 'lucide-react';

interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

interface LandingPageProps {
  onLoginOpen?: () => void;
}

// ── Hero con carrusel automático de productos reales ─────────────────────────
function HeroCarousel({ products, onLoginOpen }: { products: { id: string | number; image?: string; name: string }[]; onLoginOpen?: () => void }) {
  const [current, setCurrent] = React.useState(0);
  const images = products.filter(p => p.image).map(p => ({ id: p.id, src: p.image!, name: p.name }));

  React.useEffect(() => {
    if (images.length === 0) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);

  const bgSrc = images.length > 0 ? images[current % images.length].src : 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1400&q=80';

  return (
    <section style={{ position: 'relative', height: 580, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Imagen de fondo — cambia automáticamente */}
      <img key={bgSrc} src={bgSrc} alt="Producto"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'heroFade 0.8s ease-in-out', transition: 'opacity 0.8s' }}
        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1400&q=80'; }} />

      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 55%, rgba(58,125,68,0.2) 100%)' }} />

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 680 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 99, padding: '6px 14px', marginBottom: 24, backdropFilter: 'blur(8px)' }}>
          <Sparkles style={{ width: 12, height: 12, color: '#81C784' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 500, letterSpacing: '0.03em' }}>100% Natural · Sin conservantes · Orgánico</span>
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
          Tu bienestar,<br /><span style={{ color: '#81C784' }}>nuestra misión</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 36px' }}>
          Hierbas medicinales, aceites esenciales y suplementos orgánicos seleccionados con cuidado para tu bienestar.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <button onClick={() => onLoginOpen?.()} style={{ padding: '14px 32px', borderRadius: 12, backgroundColor: '#3A7D44', color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(58,125,68,0.4)' }}>
            <ShoppingCart style={{ width: 18, height: 18 }} /> Comprar ahora
          </button>
          <button onClick={() => onLoginOpen?.()} style={{ padding: '14px 28px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 15, fontWeight: 600, border: '1.5px solid rgba(255,255,255,0.4)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
            Crear cuenta gratis
          </button>
        </div>
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5].map(i => <Star key={i} style={{ width: 14, height: 14, fill: '#FBBF24', color: '#FBBF24' }} />)}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Más de 500 clientes satisfechos</span>
        </div>
      </div>

      {/* Indicadores del carrusel */}
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

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginOpen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../../../lib/api').then(({ getProducts }) => {
      getProducts()
        .then(res => {
          if (res.success) {
            setApiProducts(
              res.data
                .filter((p: any) => p.isActive && p.stock > 0)
                .map((p: any) => ({
                  id: String(p.id),
                  name: p.name,
                  description: p.description || '',
                  price: Number(p.price),
                  category: p.category?.name || '',
                  stock: p.stock || 0,
                  image: p.image || '',
                }))
            );
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const categories = ['all', ...Array.from(new Set(apiProducts.map(p => p.category)))];
  const filteredProducts = apiProducts.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info('Inicia sesión para agregar productos al carrito.');
    onLoginOpen?.();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ══ HEADER ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #E5E5E2',
        backgroundColor: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf style={{ width: 18, height: 18, color: '#3A7D44' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1C1C1A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Bionatural</div>
              <div style={{ fontSize: 11, color: '#737370', lineHeight: 1 }}>Tienda Naturista</div>
            </div>
          </div>
          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => onLoginOpen?.()}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E5E2', backgroundColor: 'white', fontSize: 13, fontWeight: 500, color: '#1C1C1A', cursor: 'pointer' }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => onLoginOpen?.()}
              style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#3A7D44', fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ShoppingCart style={{ width: 14, height: 14 }} />
              Comprar
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>

        {/* ══ HERO con carrusel de productos reales ══ */}
        <HeroCarousel products={apiProducts} onLoginOpen={onLoginOpen} />

        {/* ══ BENEFICIOS ══ */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { icon: Leaf,   bg: '#E8F5E9', color: '#3A7D44', title: '100% Natural',        desc: 'Sin químicos ni conservantes artificiales en ningún producto de nuestra tienda.' },
              { icon: Award,  bg: '#FEF3C7', color: '#D97706', title: 'Calidad Certificada', desc: 'Rigurosos controles de calidad en cada lote. Productos seleccionados por expertos.' },
              { icon: Shield, bg: '#E0F2FE', color: '#0284C7', title: 'Compra Segura',       desc: 'Pago al recoger en tienda. Sin riesgos, sin sorpresas, sin complicaciones.' },
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

        {/* ══ CARRUSEL DESTACADOS ══ */}
        {!loading && apiProducts.length > 0 && (
          <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1C1C1A', letterSpacing: '-0.02em', marginBottom: 4 }}>Productos destacados</h2>
                <p style={{ fontSize: 13, color: '#737370' }}>Los más populares de nuestra tienda natural</p>
              </div>
              <button onClick={() => onLoginOpen?.()} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#3A7D44', background: 'none', border: '1.5px solid #B7E4C7', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', backgroundColor: '#F0FDF4' }}>
                Ver todos <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' as const }}>
              {apiProducts.slice(0, 8).map(product => (
                <div key={product.id}
                  onClick={handleBuy}
                  style={{ minWidth: 190, maxWidth: 190, borderRadius: 18, border: '1px solid #E5E5E2', backgroundColor: 'white', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, transition: 'transform 0.18s, box-shadow 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}>
                  {/* Imagen */}
                  <div style={{ position: 'relative', height: 160, backgroundColor: '#F0F4EF', overflow: 'hidden' }}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.06)'; }}
                        onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf style={{ width: 36, height: 36, color: '#3A7D44', opacity: 0.4 }} />
                      </div>
                    )}
                    {/* Precio overlay */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)', padding: '20px 12px 10px' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatCOP(product.price)}</span>
                    </div>
                    {product.stock < 10 && (
                      <div style={{ position: 'absolute', top: 8, left: 8 }}>
                        <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>¡{product.stock} restantes!</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '12px 14px 14px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1A', margin: '0 0 2px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{product.name}</p>
                    <p style={{ fontSize: 10, color: '#737370', margin: '0 0 10px' }}>{product.category}</p>
                    <button onClick={handleBuy} style={{ width: '100%', height: 34, borderRadius: 10, border: 'none', backgroundColor: '#3A7D44', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <ShoppingCart style={{ width: 11, height: 11 }} /> Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══ CATÁLOGO ══ */}
        <section id="catalogo" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px' }}>

          {/* Header catálogo */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1C1C1A', letterSpacing: '-0.02em', marginBottom: 4 }}>Nuestro catálogo</h2>
              <p style={{ fontSize: 13, color: '#737370' }}>
                {loading ? 'Cargando productos...' : `${filteredProducts.length} productos disponibles`}
              </p>
            </div>
            {/* Filtros Modernos */}
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

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 16, border: '1px solid #E5E5E2', backgroundColor: 'white', overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1', backgroundColor: '#F4F4F2', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ height: 14, backgroundColor: '#F4F4F2', borderRadius: 6, width: '70%' }} />
                    <div style={{ height: 11, backgroundColor: '#F4F4F2', borderRadius: 6, width: '45%' }} />
                    <div style={{ height: 36, backgroundColor: '#F4F4F2', borderRadius: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', color: '#737370' }}>
              <Package style={{ width: 48, height: 48, opacity: 0.25, marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No se encontraron productos</p>
              <p style={{ fontSize: 13 }}>Intenta ajustar los filtros de búsqueda</p>
              {(searchTerm || categoryFilter !== 'all') && (
                <button onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}
                  style={{ marginTop: 12, fontSize: 13, color: '#3A7D44', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={handleBuy}
                  style={{ borderRadius: 16, border: '1px solid #E5E5E2', backgroundColor: 'white', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
                >
                  {/* Imagen */}
                  <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', backgroundColor: '#F4F4F2' }}>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        onError={e => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const ph = img.parentElement?.querySelector('.img-placeholder') as HTMLElement;
                          if (ph) ph.style.display = 'flex';
                        }}
                        onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.06)'; }}
                        onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
                      />
                    ) : null}
                    {/* Placeholder */}
                    <div className="img-placeholder" style={{ display: product.image ? 'none' : 'flex', position: 'absolute', inset: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0F7F1' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(58,125,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf style={{ width: 24, height: 24, color: '#3A7D44' }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#3A7D44', fontWeight: 600, opacity: 0.7 }}>{product.category}</span>
                    </div>
                    {/* Precio overlay */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '20px 12px 10px' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatCOP(product.price)}</span>
                    </div>
                    {/* Stock bajo */}
                    {product.stock < 10 && (
                      <div style={{ position: 'absolute', top: 10, left: 10 }}>
                        <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                          ¡{product.stock} restantes!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px 14px 16px' }}>
                    <p style={{ 
                      fontSize: 13, 
                      fontWeight: 600, 
                      color: '#1C1C1A', 
                      lineHeight: 1.4, 
                      marginBottom: 3, 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden' 
                    } as any}>
                      {product.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#737370', marginBottom: 12 }}>{product.category}</p>
                    <button
                      onClick={handleBuy}
                      style={{ width: '100%', height: 36, borderRadius: 9, backgroundColor: '#3A7D44', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <ShoppingCart style={{ width: 13, height: 13 }} />
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ DÓNDE ENCONTRARNOS ══ */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
          <div style={{ borderRadius: 20, border: '1px solid #E5E5E2', backgroundColor: 'white', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1B4332 0%, #3A7D44 100%)', padding: '24px 32px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(129,199,132,0.9)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Visítanos</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>¿Dónde encontrarnos?</h3>
            </div>
            {/* Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0 }}>
              {/* Dirección */}
              <div style={{ padding: '24px 28px', borderRight: '1px solid #E5E5E2', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A7D44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1A', marginBottom: 4 }}>Dirección</p>
                  <p style={{ fontSize: 13, color: '#1C1C1A', fontWeight: 600, marginBottom: 2 }}>Calle 47 #45-87</p>
                  <p style={{ fontSize: 12, color: '#737370', lineHeight: 1.5 }}>Centro Comercial San Antonio<br />Local 101</p>
                </div>
              </div>
              {/* Horarios */}
              <div style={{ padding: '24px 28px', borderRight: '1px solid #E5E5E2', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A7D44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1A', marginBottom: 4 }}>Horarios de atención</p>
                  <p style={{ fontSize: 12, color: '#1C1C1A', fontWeight: 600, marginBottom: 2 }}>Lunes a viernes</p>
                  <p style={{ fontSize: 12, color: '#737370', marginBottom: 6 }}>8:00 a.m. – 6:00 p.m.</p>
                  <p style={{ fontSize: 12, color: '#1C1C1A', fontWeight: 600, marginBottom: 2 }}>Sábados</p>
                  <p style={{ fontSize: 12, color: '#737370' }}>8:00 a.m. – 2:00 p.m.</p>
                </div>
              </div>
              {/* Contacto */}
              <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A7D44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.5z"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1A', marginBottom: 4 }}>Contáctanos</p>
                  <a href="tel:+573155397493" style={{ fontSize: 15, fontWeight: 700, color: '#3A7D44', textDecoration: 'none', display: 'block', marginBottom: 4 }}>+57 315 5397493</a>
                  <p style={{ fontSize: 11, color: '#737370' }}>Llámanos o escríbenos por WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ══ */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 72px' }}>
          <div style={{ borderRadius: 24, background: 'linear-gradient(135deg, #2E6B38 0%, #3A7D44 50%, #4A9455 100%)', padding: '56px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Decoración */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -30, width: 250, height: 250, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Heart style={{ width: 28, height: 28, color: 'white' }} />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 10 }}>¿Listo para empezar?</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 32px' }}>
                Crea tu cuenta gratis y accede a todo nuestro catálogo. Pago al recoger en tienda, sin complicaciones.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onLoginOpen?.()}
                  style={{ padding: '14px 32px', borderRadius: 12, backgroundColor: 'white', color: '#3A7D44', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <LogIn style={{ width: 16, height: 16 }} />
                  Crear cuenta gratis
                </button>
                <button
                  onClick={() => onLoginOpen?.()}
                  style={{ padding: '14px 28px', borderRadius: 12, backgroundColor: 'transparent', color: 'white', fontSize: 14, fontWeight: 600, border: '1.5px solid rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  Ya tengo cuenta
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid #E5E5E2', backgroundColor: 'white', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf style={{ width: 14, height: 14, color: '#3A7D44' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1A' }}>Bionatural</span>
          </div>
          <p style={{ fontSize: 12, color: '#737370' }}>
            © {new Date().getFullYear()} Bionatural · Tienda Naturista. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
