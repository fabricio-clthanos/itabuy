import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Search, CircleX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  storeSettings?: any;
  products?: any[];
  onSearchSubmit?: (query: string) => void;
}

export default function Header({
  currentView,
  onNavigate,
  searchQuery,
  setSearchQuery,
  cartCount,
  storeSettings,
  products = [],
  onSearchSubmit
 }: HeaderProps) {
  // Extract with defaults just in case
  const logoUrl = storeSettings?.headerLogoUrl || "https://i.ibb.co/bjjh6VkK/Ita-Magazine-1.png";
  const showSearch = storeSettings?.headerShowSearch ?? true;
  const promotagMsg = storeSettings?.headerPromotag || "⚡ Entregamos no mesmo dia em Itacoatiara - AM";

  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter matched products based on typed query (at least 2 letters)
  const suggestions = searchQuery.trim().length > 1
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())).slice(0, 5)
    : [];

  // Hide suggestions if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0005c7] text-white shadow-sm select-none border-b border-black/10">
      <div className="relative z-10 w-full">
        {/* Upper Promotag */}
        {currentView === 'home' && promotagMsg && (
          <div className="w-full bg-brand-yellow font-sans text-brand-blue font-black text-center text-[10px] py-1 uppercase tracking-wider flex items-center justify-center gap-1 border-b border-brand-blue/5">
            {promotagMsg}
          </div>
        )}
        <div className="mx-auto max-w-md px-3 pt-3 pb-3 flex flex-col gap-3 w-full">
          
          {/* Row 1: Logo/Back button on left, Title in middle if applicable, Actions on right */}
          <div className="flex items-center justify-between w-full h-11">
            {/* Left Action: Arrow or Logo */}
            {currentView === 'product' || currentView === 'cart' ? (
              <button 
                onClick={() => onNavigate('home')} 
                className="p-1 -ml-1 active:scale-95 transition-transform rounded-full hover:bg-white/10 flex items-center gap-1"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
            ) : (
              <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
                <img 
                  src={logoUrl} 
                  alt="ItaBuy Logo" 
                  className="h-10 w-auto object-contain max-w-[130px] drop-shadow-sm filter contrast-125 brightness-200"
                />
              </div>
            )}

            {/* Middle Title (Only on Cart/Me screens) */}
            {(currentView === 'cart' || currentView === 'me') && (
              <div className="flex-1 text-center font-bold text-sm tracking-wide text-white">
                {currentView === 'cart' ? 'Carrinho de Compras' : 'Minha Conta'}
              </div>
            )}

            {/* Right Actions: Restored Cart */}
            <div className="flex items-center gap-2 ml-auto">
              <button 
                onClick={() => onNavigate('cart')} 
                className="p-1.5 relative active:scale-95 transition-transform hover:bg-white/10 rounded-lg flex flex-col items-center"
                aria-label="Carrinho"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-white" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -right-2 bg-brand-yellow text-brand-blue font-black text-[9px] min-w-[14px] h-[14px] px-1 rounded-full flex items-center justify-center border border-brand-blue shadow-sm"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </div>
          </div>

          {/* Row 2: Search Bar - Restored */}
          {currentView === 'home' && showSearch && (
            <div className="relative w-full" ref={dropdownRef}>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search className="h-4 w-4 text-brand-blue/60 group-focus-within:text-brand-blue" />
                 </div>
                 <input
                   type="text"
                   className="block w-full bg-white/95 border-0 rounded-xl py-2.5 pl-10 pr-10 text-brand-blue placeholder:text-brand-blue/50 focus:ring-2 focus:ring-brand-yellow font-bold text-xs shadow-inner"
                   placeholder="Pesquise produtos, marcas e mais..."
                   value={searchQuery}
                   onChange={(e) => {
                     setSearchQuery(e.target.value);
                     setShowSuggestions(true);
                   }}
                   onFocus={() => setShowSuggestions(true)}
                 />
                 {searchQuery && (
                   <button 
                     onClick={() => setSearchQuery('')}
                     className="absolute inset-y-0 right-0 pr-3 flex items-center"
                   >
                     <CircleX className="h-4 w-4 text-brand-blue/30" />
                   </button>
                 )}
               </div>

               {/* Search Suggestions Dropdown */}
               <AnimatePresence>
                 {showSuggestions && suggestions.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="absolute mt-1 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-20"
                   >
                     {suggestions.map((product) => (
                       <button
                         key={product.id}
                         onClick={() => {
                           onNavigate({ type: 'product', data: product });
                           setShowSuggestions(false);
                           setSearchQuery('');
                         }}
                         className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b last:border-0 border-gray-100 text-left transition-colors"
                       >
                         <div className="w-8 h-8 rounded bg-gray-100 p-1 flex-shrink-0">
                           <img src={product.images[0]} alt="" className="w-full h-full object-contain" />
                         </div>
                         <div>
                            <p className="text-[11px] font-black text-brand-blue leading-none">{product.name}</p>
                            <p className="text-[10px] font-bold text-emerald-600 mt-1">R$ {product.price.toFixed(2)}</p>
                         </div>
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
