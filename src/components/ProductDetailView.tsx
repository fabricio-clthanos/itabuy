import { useState, TouchEvent, MouseEvent } from 'react';
import { 
  ShoppingCart, Truck, ChevronRight, Heart,
  ZoomIn, ZoomOut, RotateCcw, X, Compass, Share2
} from 'lucide-react';
import { Product, Coupon } from '../types';
import { PRODUCTS } from '../data/mockData';
import ProductCard from './ProductCard';
import { ProductDetailsSkeleton } from './Skeleton';

interface ProductDetailViewProps {
  product: Product | null;
  onAddToCart: (item: Product, spec: { [key: string]: string }) => void;
  onBuyNow: (item: Product, spec: { [key: string]: string }) => void;
  onBack: () => void;
  storeCoupons: Coupon[];
  onClaimCoupon: (coupon: Coupon) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  onViewCart?: () => void;
  loading?: boolean;
}

export default function ProductDetailView({
  product,
  onAddToCart,
  onBuyNow,
  onBack,
  storeCoupons,
  onClaimCoupon,
  isFavorite = false,
  onToggleFavorite,
  onSelectProduct,
  onViewCart,
  loading
}: ProductDetailViewProps) {
  // Image selection state
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Zoom overlay modal states
  const [zoomOpened, setZoomOpened] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.5);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch coordinates for image swipe gestures
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (loading || !product) {
    return (
      <div className="flex-grow bg-[#F5F5F5] pb-24 font-sans min-h-screen">
         <header className="bg-brand-blue text-white py-3.5 px-4 sticky top-0 z-40 flex items-center gap-3">
           <button onClick={onBack} className="p-2 rounded-full bg-white/10"><X size={20} /></button>
           <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
         </header>
         <ProductDetailsSkeleton />
      </div>
    );
  }

  // Drag-to-pan implementation inside zoom modal
  const handleDragStart = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - panPosition.x, y: clientY - panPosition.y });
  };

  const handleDragMove = (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPanPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Specs selection
  const [selections, setSelections] = useState<{[key: string]: string}>({});

  // Tab views (Description)
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');
  const [descExpanded, setDescExpanded] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);

  // Swipe handlers
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) { // user swiped at least 40px
      if (diff > 0) {
        // Swiped left -> Show next image
        if (activeImgIndex < product.images.length - 1) {
          setActiveImgIndex(prev => prev + 1);
        }
      } else {
        // Swiped right -> Show previous image
        if (activeImgIndex > 0) {
          setActiveImgIndex(prev => prev - 1);
        }
      }
    }
    setTouchStartX(null);
  };

  // Add parameters helper
  const handleAddToCart = () => {
    onAddToCart(product, selections);
  };

  const handleBuyNow = () => {
    onBuyNow(product, selections);
  };

  // Filter similar items (same category, not this one)
  const similarProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  );

  // Filter recommended items (not this one, other categories optionally)
  const recommendedProducts = PRODUCTS.filter(
    (p) => p.id !== product.id
  );

  return (
    <div className="flex-grow bg-[#F5F5F5] pb-24 select-none font-sans">
      
      {/* 1. Image Slider header area with finger-swipe gesture translation */}
      <div 
        className="relative w-full aspect-square bg-white border-b border-gray-150 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal Translation Box */}
        <div 
          onClick={() => setZoomOpened(true)}
          className="w-full h-full flex transition-transform duration-350 ease-out cursor-zoom-in"
          style={{ transform: `translateX(-${activeImgIndex * 100}%)` }}
        >
          {product.images?.map((img, idx) => (
            <div key={idx} className="w-full h-full shrink-0 relative">
              <img 
                src={img} 
                alt={`${product.name} - ${idx + 1}`} 
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable="false"
              />
            </div>
          ))}
          {(!product.images || product.images.length === 0) && (
            <div className="w-full h-full shrink-0 relative bg-gray-50 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Sem imagens</span>
            </div>
          )}
        </div>

        {/* Floating Back Navigation overlay */}
        <button 
          onClick={onBack}
          className="absolute top-3 left-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-xs transition-colors z-20 active:scale-95"
          aria-label="Voltar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Floating actions overlay buttons (Right) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20 select-none">
          {/* Share Button */}
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: product.name,
                  text: `Confira este produto incrível: ${product.name}`,
                  url: window.location.href,
                }).catch(err => console.log(err));
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link do produto copiado com sucesso!');
              }
            }}
            className="bg-white text-gray-700 p-2.5 rounded-full shadow-md active:scale-90 transition-transform flex items-center justify-center hover:bg-slate-50 cursor-pointer"
            title="Compartilhar"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* View Cart Button */}
          {onViewCart && (
            <button 
              onClick={onViewCart}
              className="bg-white text-gray-700 p-2.5 rounded-full shadow-md active:scale-90 transition-transform flex items-center justify-center hover:bg-slate-50 cursor-pointer"
              title="Ver Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          )}

          {/* Favorite Toggle */}
          {onToggleFavorite && (
            <button 
              onClick={() => onToggleFavorite(product)}
              className="bg-white text-rose-500 p-2.5 rounded-full shadow-md active:scale-90 transition-transform flex items-center justify-center hover:bg-slate-50 cursor-pointer"
              aria-label="Favoritar"
            >
              <Heart className={`w-5.5 h-5.5 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Images Indicator Counter Badge */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full z-20">
          {activeImgIndex + 1} / {(product.images?.length || 0)}
        </div>
      </div>

      {/* Mini previews row */}
      {product.images?.length > 1 && (
        <div className="bg-white p-2 flex gap-2 border-b border-gray-100 overflow-x-auto no-scrollbar">
          {product.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImgIndex(idx)}
              className={`w-14 h-14 rounded-md overflow-hidden border-2 shrink-0 ${activeImgIndex === idx ? 'border-brand-blue' : 'border-transparent'}`}
            >
              <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* 2. Price Bar & Title */}
      <div className="bg-white px-3 py-3 border-b border-gray-200">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              R$ {(product.originalPrice || 0).toFixed(2)}
            </span>
          )}
          {product.discountPercentage && (
            <span className="bg-brand-yellow text-brand-blue text-[9px] font-black px-1.5 py-0.5 rounded-xs uppercase">
              -{product.discountPercentage}% OFF
            </span>
          )}
        </div>

        {/* Pricing Layout */}
        <div className="space-y-1 mb-3">
          <div className="flex items-baseline gap-0.5 text-brand-blue">
            <span className="text-sm font-bold">R$</span>
            <span className="text-2xl font-black">{Math.floor(product.price || 0)}</span>
            <span className="text-base font-bold">,{(((product.price || 0) % 1) * 100).toFixed(0).padStart(2, '0').slice(0, 2)}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
            <span className="text-[10px] font-black uppercase">no pix:</span>
            <span className="text-sm font-black">R$ {((product.price || 0) * 0.9).toFixed(2)}</span>
            <span className="text-[9px] font-bold text-emerald-500/80">(10% de desconto)</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-gray-900 text-sm font-bold leading-relaxed mb-3">
          {product.name}
        </h1>
      </div>

      {/* 3. Shipping Options detail panel */}
      <div className="bg-white px-3 py-4 mt-2 border-y border-gray-200 flex flex-col gap-2.5 text-xs text-gray-700">
        <div 
          onClick={() => setShowShippingModal(true)}
          className="flex items-center justify-between cursor-pointer active:bg-gray-100 hover:bg-gray-50/50 p-2.5 rounded-xl border border-dashed border-brand-blue/30 bg-blue-50/20"
        >
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-brand-blue shrink-0 animate-pulse" />
            <div>
              <span className="font-extrabold text-brand-blue text-[12px] block">
                Ver Previsão de entrega (Frete Grátis)
              </span>
              <span className="text-[10.5px] text-gray-500 font-semibold mt-0.5 block">
                🚚 Entregamos no mesmo dia em itacoatiara am.
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-brand-blue" />
        </div>
      </div>

      {/* 4. Store Coupons */}
      {storeCoupons.length > 0 && (
        <div className="bg-white px-3 py-3 mt-2 border-y border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 mb-2.5 uppercase">CUPONS DE DESCONTO DISPONÍVEIS</h3>
          <div className="flex gap-3 overflow-x-auto pb-1.5 no-scrollbar ios-scroll-inertia">
            {storeCoupons.map((coupon) => (
              <div 
                key={coupon.id}
                className="bg-white border border-brand-blue/20 rounded-lg flex overflow-hidden flex-shrink-0 w-[230px] shadow-sm select-none"
              >
                {/* Coupon Side Graphic */}
                <div className="bg-brand-blue text-white px-2.5 flex flex-col items-center justify-center shrink-0 border-r border-dashed border-gray-150">
                  <span className="text-sm font-black text-brand-yellow">Ita</span>
                  <span className="text-[8px] font-extrabold text-white/90">CUPOM</span>
                </div>
                
                {/* Coupon content */}
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-extrabold text-gray-800 line-clamp-1 leading-tight">
                      {coupon.title}
                    </h4>
                    <span className="text-[9.5px] text-gray-650 font-bold block mt-1">
                      Mín. compra: R${coupon.minSpent}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[8.5px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded-sm shrink-0">
                      {coupon.expiry}
                    </span>
                    <button 
                      onClick={() => onClaimCoupon(coupon)}
                      className="bg-brand-blue text-white active:bg-brand-blue-hover text-[8.5px] font-black px-2 py-0.5 rounded-sm active:scale-95 transition-transform shrink-0"
                    >
                      RESGATAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Variations Choices selector */}
      {product.availableOptions && product.availableOptions.length > 0 && (
        <div className="bg-white px-3 py-3 mt-2 border-y border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 mb-2.5 uppercase">Especificar Opções</h3>
          
          <div className="space-y-4">
            {product.availableOptions.map((opt, optIdx) => (
              <div key={`${opt.name}-${optIdx}`}>
                <span className="text-xs text-gray-600 font-semibold">{opt.name}:</span>
                <div className="flex gap-2 flex-wrap mt-1">
                  {opt.values.map((val, valIdx) => {
                    const label = typeof val === 'string' ? val : val.label;
                    const stock = typeof val === 'string' ? 10 : (val.stock ?? 10);
                    const isSelected = selections[opt.name] === label;
                    const isOutOfStock = stock === 0;

                    return (
                      <button
                        key={`${label}-${valIdx}`}
                        disabled={isOutOfStock}
                        onClick={() => setSelections(prev => ({ ...prev, [opt.name]: label }))}
                        className={`text-[11px] px-3 py-2 rounded-md border transition-all ${
                          isSelected 
                            ? 'border-brand-blue bg-blue-50 text-brand-blue font-black shadow-sm' 
                            : isOutOfStock
                              ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                              : 'border-gray-200 text-gray-700 active:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Product Description Tab */}
      <div className="bg-white px-3 mt-2 border-y border-gray-200">
        <div className="py-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-2">Descrição</h3>
            <p className={`text-xs text-gray-700 leading-relaxed font-normal whitespace-pre-line ${descExpanded ? '' : 'line-clamp-4'}`}>
              {product.description}
            </p>
            {product.description.length > 100 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="w-full text-center text-brand-blue text-xs font-extrabold py-2 mt-2 select-none active:scale-98"
              >
                {descExpanded ? 'Ver Menos ▲' : 'Ver Descrição Completa ▼'}
              </button>
            )}
        </div>
      </div>

      {/* 8. PRODUTOS SIMILARES (2 Columns Grid) */}
      <div className="bg-white px-3 py-3.5 mt-2 border-y border-gray-200">
        <h3 className="text-xs font-black text-gray-800 uppercase mb-3 tracking-wide">
          Produtos Similares
        </h3>
        {similarProducts.length === 0 ? (
          <p className="text-[11px] text-gray-400 font-medium">Nenhum produto similar encontrado.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-3 select-none">
            {similarProducts.map((prod) => (
              <ProductCard 
                key={prod.id}
                product={prod}
                onClick={(p) => {
                  onSelectProduct?.(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 9. PRODUTOS RECOMENDADOS (2 Columns Grid) */}
      <div className="bg-white px-3 py-3.5 mt-2 border-y border-gray-200">
        <h3 className="text-xs font-black text-gray-800 uppercase mb-3 tracking-wide">
          Recomendados Para Você
        </h3>
        {recommendedProducts.length === 0 ? (
          <p className="text-[11px] text-gray-400 font-medium">Nenhum produto recomendado encontrado.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-3 select-none">
            {recommendedProducts.map((prod) => (
              <ProductCard 
                key={prod.id}
                product={prod}
                onClick={(p) => {
                  onSelectProduct?.(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 10. Sticky Footer actions bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg select-none">
        <div className="mx-auto max-w-md h-14 flex items-stretch">
          
          {/* WhatsApp Support Button */}
          <button 
            onClick={() => {
              const url = `https://wa.me/5592999999999?text=Ol%C3%A1%21+Tenho+interesse+no+produto+no+ItaBuy%3A+${encodeURIComponent(product.name)}`;
              window.open(url, '_blank');
            }}
            className="w-16 flex flex-col items-center justify-center text-emerald-600 bg-emerald-50/20 hover:bg-emerald-100/40 border-r border-gray-150 active:bg-gray-105"
            aria-label="Contatar vendedor no WhatsApp"
          >
            <span className="text-[16px] animate-bounce">💬</span>
            <span className="text-[8px] mt-0.5 font-black uppercase tracking-tight text-emerald-600">WhatsApp</span>
          </button>

          {/* Add To Cart */}
          <button 
            onClick={handleAddToCart}
            className="flex-1 flex flex-col items-center justify-center text-brand-blue active:bg-blue-100 hover:text-brand-blue-hover border-r border-gray-155 bg-indigo-50/15"
          >
            <ShoppingCart className="w-5.5 h-5.5" />
            <span className="text-[9.5px] mt-0.5 font-black uppercase">Carrinho</span>
          </button>

          {/* Buy Now Button */}
          <button 
            onClick={handleBuyNow}
            className="bg-brand-blue active:bg-brand-blue-hover text-white flex-2 font-black text-xs sm:text-sm flex items-center justify-center tracking-wider active:scale-98 transition-all"
          >
            COMPRAR AGORA
          </button>

        </div>
      </div>

      {/* Shipping Estimate Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 border border-gray-150 animate-scale-up text-center">
            <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-3.5 border border-blue-200">
              <Truck className="w-6 h-6 stroke-[2.5px]" />
            </div>
            
            <h3 className="text-gray-900 font-extrabold text-sm uppercase tracking-wider">
              Previsão de Entrega
            </h3>
            <span className="text-[10px] text-brand-blue font-bold bg-blue-50 border border-blue-150 px-2.5 py-0.5 rounded-full inline-block mt-1">
              Fuso Amazonas GMT-4
            </span>

            <div className="my-4 text-left space-y-3.5 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-gray-700">
              <p className="font-extrabold text-emerald-600 flex items-center gap-1.5 text-[12.5px]">
                🟢 Entrega Disponível Hoje!
              </p>
              <p className="font-normal leading-relaxed text-gray-650">
                O fuso horário local ainda não atingiu as 20h! Seu pedido pode ser entregue hoje mesmo!
              </p>
              <p className="leading-relaxed border-t border-gray-200 pt-2.5 text-gray-500 font-semibold">
                Planejamos as entregas prioritárias até o anoitecer. Se não houver ninguém em casa na primeira tentativa, garantimos uma segunda tentativa posterior ou na manhã seguinte.
              </p>
            </div>

            <button
              onClick={() => setShowShippingModal(false)}
              className="w-full bg-brand-blue text-white font-black text-xs py-2.5 rounded-xl hover:bg-brand-blue-hover active:scale-95 transition-transform"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Interactive Image Zoom / Magnifier Modal Popup */}
      {zoomOpened && (
        <div className="fixed inset-0 bg-black/95 z-55 flex flex-col justify-between p-4 select-none touch-none animate-fade-in">
          
          {/* Zoom Header Controls */}
          <div className="flex items-center justify-between text-white py-2 z-50">
            <span className="text-[11px] uppercase tracking-widest font-bold text-gray-400">
              Visualizador Ampliado / ItaBuy Zoom
            </span>
            <button
              onClick={() => {
                setZoomScale(1.5);
                setPanPosition({ x: 0, y: 0 });
                setZoomOpened(false);
              }}
              className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white rounded-full"
              aria-label="Fechar zoom"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Interactive Panning Image Area */}
          <div 
            className="flex-grow flex items-center justify-center overflow-hidden relative cursor-grab active:cursor-grabbing w-full h-full"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <div 
              className="transition-transform duration-75 ease-out pointer-events-none"
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
              }}
            >
              <img 
                src={product.images?.[activeImgIndex] || 'https://via.placeholder.com/600'} 
                alt="Product Zoomable Preview" 
                className="max-h-[75vh] max-w-full object-contain select-none pointer-events-none rounded-sm"
                draggable="false"
              />
            </div>
          </div>

          {/* Zoom Action controls at bottom */}
          <div className="flex flex-col items-center gap-3 py-3 z-50">
            <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-md p-2 px-5 rounded-full border border-white/10 shadow-lg text-white">
              
              <button 
                onClick={() => setZoomScale(prev => Math.max(1, prev - 0.5))}
                disabled={zoomScale <= 1}
                className="p-2 hover:bg-white/10 rounded-full active:scale-90 transition-transform disabled:opacity-40"
                title="Menos zoom"
              >
                <ZoomOut className="w-4.5 h-4.5" />
              </button>

              <span className="text-xs font-bold font-mono min-w-[50px] text-center">
                {zoomScale.toFixed(1)}x
              </span>

              <button 
                onClick={() => setZoomScale(prev => Math.min(4, prev + 0.5))}
                disabled={zoomScale >= 4}
                className="p-2 hover:bg-white/10 rounded-full active:scale-90 transition-transform disabled:opacity-40"
                title="Mais zoom"
              >
                <ZoomIn className="w-4.5 h-4.5 animate-pulse" />
              </button>

              <div className="w-[1px] h-4 bg-white/20" />

              <button 
                onClick={() => {
                  setZoomScale(1.5);
                  setPanPosition({ x: 0, y: 0 });
                }}
                className="p-2 hover:bg-white/10 rounded-full active:scale-90 transition-transform text-brand-yellow"
                title="Resetar posição"
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              {zoomScale > 1 ? 'Deslize sobre a foto para navegar em detalhes' : 'Use as ferramentas acima ou clique para dar zoom'}
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
