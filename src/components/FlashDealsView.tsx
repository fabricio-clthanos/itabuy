import { useState, useEffect } from 'react';
import { Flame, ArrowLeft, Hourglass, Sparkles, ChevronRight, Settings } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface FlashDealsViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
}

type DealTheme = {
  id: string;
  name: string;
  bgClass: string;
  headerClass: string;
  badgeClass: string;
  accentText: string;
  badgeText: string;
  title: string;
  subtitle: string;
};

const THEMES: DealTheme[] = [
  {
    id: 'fire',
    name: 'Super Relâmpago 🔥',
    bgClass: 'bg-gradient-to-b from-red-950 via-slate-900 to-slate-900 text-white',
    headerClass: 'bg-gradient-to-r from-red-650 to-orange-600 border-red-500',
    badgeClass: 'bg-brand-yellow text-brand-blue',
    accentText: 'text-amber-400',
    badgeText: 'EVENTO PRINCIPAL',
    title: 'Ofertas Relâmpago!',
    subtitle: 'Corra antes que o cronômetro chegue ao fim!'
  },
  {
    id: 'cyan-midnight',
    name: 'Dias Especiais de Ofertas 🛍️',
    bgClass: 'bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white',
    headerClass: 'bg-gradient-to-r from-indigo-600 to-blue-755 border-blue-500',
    badgeClass: 'bg-purple-600 text-white',
    accentText: 'text-cyan-400',
    badgeText: 'DIA ESPECIAL',
    title: 'Grande Liquida ItaBuy',
    subtitle: 'Estoque exclusivo por tempo extremamente limitado'
  },
  {
    id: 'lemon',
    name: 'Noite de Cupons 🍀',
    bgClass: 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white',
    headerClass: 'bg-gradient-to-r from-emerald-600 to-teal-700 border-emerald-500',
    badgeClass: 'bg-brand-yellow text-brand-blue',
    accentText: 'text-emerald-400',
    badgeText: 'NOITE DE CUPONS',
    title: 'Noite de Sorte ItaBuy',
    subtitle: 'Preços imbatíveis com frete totalmente grátis'
  }
];

export default function FlashDealsView({ products, onSelectProduct, onBack }: FlashDealsViewProps) {
  // Theme switcher state (simulates what an admin can tweak on database)
  const [activeTheme, setActiveTheme] = useState<DealTheme>(THEMES[0]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Time remaining clock simulation
  const [timeLeft, setTimeLeft] = useState({ hr: 1, min: 28, sec: 45 });

  useEffect(() => {
    const clock = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.sec > 0) return { ...prev, sec: prev.sec - 1 };
        if (prev.min > 0) return { hr: prev.hr, min: prev.min - 1, sec: 59 };
        if (prev.hr > 0) return { hr: prev.hr - 1, min: 59, sec: 59 };
        return { hr: 2, min: 0, sec: 0 };
      });
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // Filter only flash deals (discount >= 50%)
  const flashSaleProducts = products.filter((p) => p.discountPercentage && p.discountPercentage >= 50);

  return (
    <div className={`flex-grow pb-24 transition-all duration-500 ${activeTheme.bgClass} min-h-[90vh]`}>
      
      {/* 1. Header Navigation Row */}
      <header className="bg-slate-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-white/5 select-none text-white">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <h2 className="text-xs font-black uppercase tracking-widest font-sans flex items-center gap-1">
          <Flame className="w-4.5 h-4.5 text-red-500 fill-red-500 animate-pulse" />
          Outlet Relâmpago
        </h2>

        {/* Simulador de Customização de Admin Button */}
        <button
          onClick={() => setShowThemeSelector(!showThemeSelector)}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-brand-yellow"
          title="Simular visual do painel administrativo"
        >
          <Settings className="w-4 h-4 animate-spin-slow" />
        </button>
      </header>

      {/* Admin Simulator Panel (Drawer overlay) */}
      {showThemeSelector && (
        <div className="bg-slate-800 border-b border-white/10 p-3.5 mx-3 mt-3 rounded-xl shadow-lg select-none text-white animate-scale-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest font-black text-brand-yellow flex items-center gap-1">
              🔧 Simulador Painel Admin ItaBuy
            </span>
            <button onClick={() => setShowThemeSelector(false)} className="text-gray-400 text-xs">✕</button>
          </div>
          <p className="text-[10px] text-gray-300 mb-2.5">
            Mude o fundo de forma dinâmica abaixo para testar eventos / dias especiais:
          </p>
          <div className="flex flex-col gap-1.5">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setActiveTheme(theme);
                  setShowThemeSelector(false);
                }}
                className={`w-full text-left p-2 rounded text-[10.5px] font-bold flex items-center justify-between border ${activeTheme.id === theme.id ? 'bg-brand-blue border-brand-yellow text-white' : 'bg-slate-700/60 border-transparent text-gray-200 hover:bg-slate-700'}`}
              >
                <span>{theme.name}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Brand Event Jumbotron Hero Banner */}
      <section className="p-4 select-none">
        <div className={`p-5 rounded-2xl relative overflow-hidden flex flex-col justify-center border shadow-xl ${activeTheme.headerClass} animate-fade-in`}>
          
          {/* Subtle patterns overlay */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/20 pointer-events-none" />

          {/* Floating badge */}
          <span className={`self-start text-[8px] sm:text-[9.5px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest mb-2 shadow-xs ${activeTheme.badgeClass}`}>
            {activeTheme.badgeText}
          </span>

          <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">
            {activeTheme.title}
          </h1>

          <p className="text-[11px] sm:text-xs text-white/90 mt-1 max-w-[80%]">
            {activeTheme.subtitle}
          </p>

          <div className="h-[1px] bg-white/20 my-3.5" />

          {/* Countdown Clock Display */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest flex items-center gap-1">
              <Hourglass className="w-3.5 h-3.5 text-white/90 animate-spin" />
              Expira Em:
            </span>

            <div className="flex items-center gap-1 font-black text-xs">
              <span className="bg-black/40 text-white px-2 py-1 rounded-md min-w-[24px] text-center backdrop-blur-xs">
                {timeLeft.hr.toString().padStart(2, '0')}
              </span>
              <span className="text-white/60">:</span>
              <span className="bg-black/40 text-white px-2 py-1 rounded-md min-w-[24px] text-center backdrop-blur-xs">
                {timeLeft.min.toString().padStart(2, '0')}
              </span>
              <span className="text-white/60">:</span>
              <span className={`px-2 py-1 rounded-md min-w-[24px] text-center backdrop-blur-xs ${activeTheme.badgeClass}`}>
                {timeLeft.sec.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="absolute right-3.5 bottom-0 h-[85%] opacity-30 pointer-events-none flex items-end">
            <Flame className="w-24 h-24 stroke-[1]" />
          </div>

        </div>
      </section>

      {/* 3. Products Grid representation (strictly 2 columns, non-carousel list) */}
      <section className="px-2 mt-1">
        
        <div className="flex items-center gap-1.5 px-2.5 mb-2.5">
          <Sparkles className={`w-4 h-4 ${activeTheme.accentText}`} />
          <h3 className="text-xs font-black uppercase tracking-widest text-white/90 font-sans">
            Compre Agora ({flashSaleProducts.length} itens)
          </h3>
        </div>

        {flashSaleProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-450 font-semibold bg-white/5 rounded-2xl m-2 px-4 border border-white/5">
            Nenhuma oferta relâmpago disponível neste momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 select-none">
            {flashSaleProducts.map((p) => (
              <div 
                key={p.id} 
                className="bg-slate-800 rounded-lg overflow-hidden border border-white/5 text-gray-100 shadow-sm relative transition-transform duration-350 active:scale-98"
              >
                <ProductCard 
                  product={p} 
                  onClick={onSelectProduct} 
                />
              </div>
            ))}
          </div>
        )}

      </section>

    </div>
  );
}
