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

            {/* Right Actions: Cart */}
            <div className="flex items-center gap-2 ml-auto">
              <button 
                onClick={() => onNavigate('cart')} 
                className="p-1.5 relative active:scale-95 transition-transform hover:bg-white/10 rounded-lg flex flex-col items-center"
                aria-label="Carrinho"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                <span className="text-[9px] font-bold text-white mt-0.5">Carrinho</span>
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-brand-yellow text-brand-blue font-bold text-[9px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border border-white"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Row 2: Search Bar */}
          {showSearch && (currentView === 'home' || currentView === 'product') && (
            <div ref={dropdownRef} className="relative w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  if (currentView !== 'home') {
                    onNavigate('home');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowSuggestions(false);
                    if (onSearchSubmit) {
                      onSearchSubmit(searchQuery);
                    } else {
                      onNavigate('search');
                    }
                  }
                }}
                className="w-full bg-white text-gray-900 placeholder-gray-400 font-medium text-xs py-3 pl-9 pr-9 rounded-none outline-none border border-gray-205 focus:border-brand-yellow transition-colors shadow-none"
              />

              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-3 flex items-center px-1 text-gray-400 hover:text-gray-600 active:scale-90"
                >
                  <CircleX className="w-4 h-4" />
                </button>
              )}

              {/* Suggestions dropdown overlay */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg text-gray-800 z-55 divide-y divide-gray-105 rounded-none overflow-hidden"
                  >
                    {suggestions.map((item: any, idx: number) => (
                      <div
                        key={item.id || idx}
                        onClick={() => {
                          setSearchQuery(item.name);
                          setShowSuggestions(false);
                          if (onSearchSubmit) {
                            onSearchSubmit(item.name);
                          } else {
                            onNavigate('search');
                          }
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 transition-colors text-xs text-gray-700 font-medium"
                      >
                        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate flex-1">{item.name}</span>
                        <span className="text-[10px] text-emerald-600 font-extrabold flex-shrink-0">R$ {item.price.toFixed(2)}</span>
                      </div>
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
