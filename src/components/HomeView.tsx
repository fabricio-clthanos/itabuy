import { useState, useEffect } from 'react';
import { 
  Tv, Shirt, Sparkles, Footprints, Home, Dumbbell, Gamepad2, 
  Smartphone, Flame, Zap, Compass, CheckCircle2, Ticket, Percent, Coins
} from 'lucide-react';
import { Product, Coupon } from '../types';
import { BANNERS, CATEGORIES } from '../data/mockData';
import ProductCard from './ProductCard';

interface HomeViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectCoupon: (coupon: Coupon) => void;
  searchQuery: string;
  onNavigateToCategory: (categoryId: string) => void;
  onNavigateToFlashDeals: () => void;
  availableCoupons: Coupon[];
}

export default function HomeView({
  products,
  onSelectProduct,
  onSelectCoupon,
  searchQuery,
  onNavigateToCategory,
  onNavigateToFlashDeals,
  availableCoupons
}: HomeViewProps) {
  // Banner state
  const [activeBanner, setActiveBanner] = useState(0);

  // Flash sale countdown (simulating real expiration counts)
  const [timeLeft, setTimeLeft] = useState({ hr: 2, min: 45, sec: 18 });

  // Selected sub-tab for Daily Discover
  const [selectedSubTab, setSelectedSubTab] = useState<'all' | 'free' | 'high_rating'>('all');

  // Rotate banners gently and lightways
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Countdown clock tick
  useEffect(() => {
    const clock = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.sec > 0) return { ...prev, sec: prev.sec - 1 };
        if (prev.min > 0) return { hr: prev.hr, min: prev.min - 1, sec: 59 };
        if (prev.hr > 0) return { hr: prev.hr - 1, min: 59, sec: 59 };
        return { hr: 2, min: 59, sec: 59 }; // reset
      });
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // Map category strings to Lucide icon components
  const getCategoryIcon = (iconName: string) => {
    const classes = "w-6 h-6 text-brand-blue";
    switch (iconName) {
      case 'Smartphone': return <Smartphone className={classes} />;
      case 'Tv': return <Tv className={classes} />;
      case 'Shirt': return <Shirt className={classes} />;
      case 'Sparkles': return <Sparkles className={classes} />;
      case 'Footprints': return <Footprints className={classes} />;
      case 'Home': return <Home className={classes} />;
      case 'Dumbbell': return <Dumbbell className={classes} />;
      case 'Gamepad2': return <Gamepad2 className={classes} />;
      default: return <Compass className={classes} />;
    }
  };

  // Filter products by searching query
  const filteredProductsBySearch = products.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
  });

  // Category or tab filters
  const displayedProducts = filteredProductsBySearch.filter((p) => {
    if (selectedSubTab === 'free') return p.freeShipping;
    if (selectedSubTab === 'high_rating') return p.rating >= 4.7;
    return true;
  });

  // Pick 3 flash sale products (high discount)
  const flashSaleProducts = products
    .filter((p) => (p.discountPercentage || 0) >= 55)
    .slice(0, 4);

  // Best Sellers (Most sold)
  const bestSellersProducts = products
    .filter((p) => p.salesCount > 60)
    .slice(0, 4);

  // Weekly Highlights (Destaques da semana)
  const weeklyHighlightsProducts = products
    .filter((p) => p.rating >= 4.5)
    .slice(0, 4);

  // Latest Trends (Tendências)
  const trendingProducts = products
    .filter((p) => p.price < 500)
    .slice(0, 4);

  return (
    <div className="flex-grow bg-[#F5F5F5] pb-24">
      
      {/* 1. Hero Banner Area (Optimized Carousels without high power overhead) */}
      {!searchQuery && (
        <section className="relative overflow-hidden w-full h-34 sm:h-40 bg-brand-blue text-white">
          <div className="w-full h-full flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${activeBanner * 100}%)` }}>
            {BANNERS.map((banner) => (
              <div 
                key={banner.id} 
                className={`w-full h-full shrink-0 relative bg-gradient-to-r ${banner.gradient} flex items-center p-4 justify-between`}
              >
                {/* Text Content */}
                <div className="z-10 max-w-[60%] flex flex-col justify-center">
                  <span className="bg-brand-yellow text-brand-blue text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm self-start mb-1 shadow-xs">
                    {banner.badge}
                  </span>
                  <h2 className="text-sm sm:text-lg font-extrabold tracking-tight leading-tight">
                    {banner.title}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-blue-100 mt-1">
                    {banner.subtitle}
                  </p>
                </div>

                {/* Cover Image */}
                <div className="absolute right-2 bottom-0 top-0 w-[42%] flex items-end justify-center overflow-hidden">
                  <img 
                    src={banner.image} 
                    alt="Promo" 
                    className="h-[90%] w-auto object-cover rounded-t-lg shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1.5 z-20">
            {BANNERS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBanner(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeBanner === idx ? 'w-4 bg-brand-yellow' : 'w-1.5 bg-white/40'}`}
                aria-label={`Ir para slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Shortcuts Row (Quick Navigation) */}
      {!searchQuery && (
        <section className="bg-white py-3.5 px-3.5 border-b border-gray-200 flex gap-3 select-none justify-center shadow-[inset_0_-1px_0_0_#f3f4f6]">
          <button 
            onClick={() => {
              const el = document.getElementById('cupons-secao');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex-1 max-w-[170px] bg-red-500 text-white font-black uppercase text-[11.5px] tracking-wider py-2.5 px-4 rounded-xl shadow-xs border border-red-600 hover:bg-red-650 transition-all active:scale-95 text-center cursor-pointer font-sans"
          >
            Cupons R$
          </button>

          <a 
            href="https://www.instagram.com/itabuy.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 max-w-[170px] bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-black uppercase text-[11.5px] tracking-wider py-2.5 px-4 rounded-xl shadow-xs hover:opacity-95 transition-all text-center flex items-center justify-center cursor-pointer font-sans"
          >
            Instagram
          </a>
        </section>
      )}

      {/* 3. Category Grid - Styled like Shopee Category list with horizontal or dual grid */}
      {!searchQuery && (
        <section className="mt-2 bg-white p-3 border-y border-gray-200">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
            Categorias ItaBuy
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-1.5 no-scrollbar snap-x ios-scroll-inertia">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigateToCategory(cat.id)}
                className="flex-col items-center flex gap-1.5 min-w-[65px] active:scale-95 transition-transform shrink-0 snap-start"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-150 relative">
                  {getCategoryIcon(cat.icon)}
                </div>
                <span className="text-[10.5px] text-gray-600 font-medium line-clamp-1">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 4. Ofertas Relâmpago (Flash Sale - High Highlight Shopee component) */}
      {!searchQuery && (
        <section className="mt-2 bg-white p-3 border-y border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-red-650 fill-red-500 animate-pulse text-red-550" />
              <h3 className="text-sm font-black text-brand-blue uppercase tracking-tight flex items-center gap-1">
                Ofertas Relâmpago
              </h3>
              
              {/* Countdown Clocks */}
              <div className="flex items-center gap-1 ml-1 text-[11px] font-black">
                <span className="bg-gray-900 text-white px-1 py-0.5 rounded-sm">
                  {timeLeft.hr.toString().padStart(2, '0')}
                </span>
                <span className="text-gray-900">:</span>
                <span className="bg-gray-900 text-white px-1 py-0.5 rounded-sm">
                  {timeLeft.min.toString().padStart(2, '0')}
                </span>
                <span className="text-gray-900">:</span>
                <span className="bg-brand-yellow text-brand-blue px-1 py-0.5 rounded-sm">
                  {timeLeft.sec.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <span className="text-xs text-brand-blue font-bold cursor-pointer hover:underline" onClick={onNavigateToFlashDeals}>
              Ver Mais &gt;
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2.5 no-scrollbar snap-x ios-scroll-inertia">
            {flashSaleProducts.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center w-full font-medium">Não há ofertas relâmpago ativas no momento.</p>
            ) : (
              flashSaleProducts.map((p) => {
                // Calculate width of sold items bar (mock)
                const percentSold = Math.floor(((p.salesCount * 3) % 40) + 60); // 60% to 99%

                return (
                  <div 
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className="w-[110px] sm:w-[125px] flex-shrink-0 bg-white rounded-md overflow-hidden flex flex-col justify-between border border-gray-100 p-1 relative cursor-pointer snap-start active:bg-gray-50 hover:border-gray-300 tap-highlight-transparent"
                  >
                    <div className="absolute top-1 left-1 bg-brand-yellow text-brand-blue text-[8px] font-black px-1.5 py-0.5 rounded-xs z-10">
                      -{p.discountPercentage}%
                    </div>

                    <img 
                      src={p.images?.[0] || 'https://via.placeholder.com/150'} 
                      alt={p.name} 
                      className="w-full h-[95px] object-cover rounded-xs"
                      loading="lazy"
                    />

                    <div className="mt-1">
                      <div className="text-[12px] font-bold text-center text-brand-blue">
                        R$ {Math.floor(p.price)}
                      </div>
                      {p.originalPrice && (
                        <div className="text-[9px] text-gray-400 line-through text-center leading-none">
                          R$ {(p.originalPrice || 0).toFixed(2)}
                        </div>
                      )}
                      
                      {/* Progress sold bar */}
                      <div className="w-full bg-red-100 h-2.5 rounded-full mt-1.5 relative overflow-hidden flex items-center justify-center">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-red-650 h-full absolute left-0" 
                          style={{ width: `${percentSold}%` }}
                        />
                        <span className="text-[7.5px] text-white font-black z-10 absolute pointer-events-none drop-shadow-xs">
                          {percentSold < 90 ? 'RESTA POUCO' : 'QUASE ESGOTADO'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* 5. Vouchers Section list */}
      {!searchQuery && (
        <section id="cupons-secao" className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-y border-gray-200">
          <div className="flex items-center gap-1.5 mb-2">
            <Ticket className="w-4 h-4 text-brand-blue" />
            <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">
              Cupons de Desconto ItaBuy
            </h3>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar ios-scroll-inertia">
            {availableCoupons.map((coupon) => (
              <div 
                key={coupon.id} 
                className="bg-white border border-brand-blue/30 rounded-lg flex overflow-hidden flex-shrink-0 w-[240px] shadow-sm select-none"
              >
                {/* Logo or banner blue side */}
                <div className="bg-brand-blue text-white px-2.5 flex flex-col items-center justify-center shrink-0 border-r border-dashed border-gray-200">
                  <span className="text-lg font-black text-brand-yellow">Ita</span>
                  <span className="text-[8px] font-bold">CUPOM</span>
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-extrabold text-gray-800 line-clamp-1 leading-tight">
                      {coupon.title}
                    </h4>
                    <span className="text-[9px] text-gray-600">
                      Ped. Min: R${coupon.minSpent}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-gray-405 text-gray-400 bg-gray-100 px-1 py-0.5 rounded-sm">
                      {coupon.expiry}
                    </span>
                    <button 
                      onClick={() => onSelectCoupon(coupon)}
                      className="bg-brand-blue text-white active:bg-brand-blue-hover text-[9.5px] font-black px-2.5 py-1 rounded-sm active:scale-95 transition-transform"
                    >
                      RESGATAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Novas Seções Editáveis */}
      {!searchQuery && (
        <>
          {/* Seção 1: Mais Vendidos */}
          <section className="mt-2 bg-white p-3 border-y border-gray-200">
            <h3 className="text-xs font-black text-gray-800 uppercase mb-3 tracking-wide flex items-center gap-1">
              🔥 Mais Vendidos da Semana
            </h3>
            <div className="grid grid-cols-2 gap-2 select-none">
              {bestSellersProducts.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center col-span-2 font-medium">Nenhum produto cadastrado nos Mais Vendidos.</p>
              ) : (
                bestSellersProducts.map((prod) => (
                  <ProductCard 
                    key={prod.id}
                    product={prod}
                    onClick={onSelectProduct}
                  />
                ))
              )}
            </div>
          </section>

          {/* Seção 2: Destaques Imperdíveis */}
          <section className="mt-2 bg-white p-3 border-y border-gray-200">
            <h3 className="text-xs font-black text-gray-800 uppercase mb-3 tracking-wide flex items-center gap-1">
              ⭐ Destaques Imperdíveis
            </h3>
            <div className="grid grid-cols-2 gap-2 select-none">
              {weeklyHighlightsProducts.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center col-span-2 font-medium">Nenhum produto cadastrado em Destaques.</p>
              ) : (
                weeklyHighlightsProducts.map((prod) => (
                  <ProductCard 
                    key={prod.id}
                    product={prod}
                    onClick={onSelectProduct}
                  />
                ))
              )}
            </div>
          </section>

          {/* Seção 3: Tendências do Momento */}
          <section className="mt-2 bg-white p-3 border-y border-gray-200">
            <h3 className="text-xs font-black text-gray-800 uppercase mb-3 tracking-wide flex items-center gap-1">
              💡 Tendências do Momento
            </h3>
            <div className="grid grid-cols-2 gap-2 select-none">
              {trendingProducts.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center col-span-2 font-medium">Nenhum produto cadastrado em Tendências.</p>
              ) : (
                trendingProducts.map((prod) => (
                  <ProductCard 
                    key={prod.id}
                    product={prod}
                    onClick={onSelectProduct}
                  />
                ))
              )}
            </div>
          </section>
        </>
      )}

      {/* 6. Daily Discover Products Container (Diário de Descobertas) */}
      <section className="mt-2" id="discover-feed">
        {/* Sticky-like section choices */}
        <div className="bg-white border-b border-gray-200 sticky top-12.5 z-35 flex items-center justify-around font-semibold select-none shadow-xs">
          <button 
            onClick={() => setSelectedSubTab('all')}
            className={`flex-1 text-center py-3 text-xs border-b-2 transition-colors ${selectedSubTab === 'all' ? 'border-brand-blue text-brand-blue font-extrabold' : 'border-transparent text-gray-500'}`}
          >
            Recomendados
          </button>
          
          <button 
            onClick={() => setSelectedSubTab('free')}
            className={`flex-1 text-center py-3 text-xs border-b-2 transition-colors ${selectedSubTab === 'free' ? 'border-brand-blue text-brand-blue font-extrabold' : 'border-transparent text-gray-500'}`}
          >
            Frete Grátis 🚚
          </button>

          <button 
            onClick={() => setSelectedSubTab('high_rating')}
            className={`flex-1 text-center py-3 text-xs border-b-2 transition-colors ${selectedSubTab === 'high_rating' ? 'border-brand-blue text-brand-blue font-extrabold' : 'border-transparent text-gray-500'}`}
          >
            Mais Avaliados ⭐
          </button>
        </div>

        {/* Outer search state */}
        {searchQuery && (
          <div className="bg-white p-3 border-b border-gray-200 text-xs text-gray-600 flex items-center justify-between">
            <span>Resultados para: <strong>"{searchQuery}"</strong></span>
            <span className="text-gray-400">{displayedProducts.length} itens encontrados</span>
          </div>
        )}

        {/* Empty Search Feed State */}
        {displayedProducts.length === 0 ? (
          <div className="py-16 text-center px-4">
            <p className="text-lg text-gray-450 font-bold mb-1">Infelizmente nada foi encontrado</p>
            <p className="text-xs text-gray-400">Tente buscar por "fone", "reógio", "maquiagem" ou "polo"</p>
          </div>
        ) : (
          /* Real Grid of Products */
          <div className="grid grid-cols-2 gap-2 p-2 select-none">
            {displayedProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onClick={onSelectProduct} 
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
