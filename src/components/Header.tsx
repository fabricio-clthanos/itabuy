import { ArrowLeft, ShoppingCart, MessageCircle, Search, CircleX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  currentView: 'home' | 'product' | 'cart' | 'me' | 'sorteios';
  onNavigate: (view: 'home' | 'product' | 'cart' | 'me' | 'sorteios') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
}

export default function Header({
  currentView,
  onNavigate,
  searchQuery,
  setSearchQuery,
  cartCount
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-brand-blue text-white shadow-md select-none">
      {/* Upper Promotag */}
      {currentView === 'home' && (
        <div className="w-full bg-brand-yellow font-sans text-brand-blue font-black text-center text-[11px] py-1.5 uppercase tracking-wider px-2 flex items-center justify-center gap-1 border-b border-brand-blue/10">
          <span className="text-red-650 animate-bounce">⚡</span> Entregamos no mesmo dia em Itacoatiara - AM
        </div>
      )}
      <div className="mx-auto max-w-md px-3 pt-2.5 pb-2 flex flex-col gap-2">
        
        {/* Row 1: Logo/Back button on left, Title in middle if applicable, Actions on right */}
        <div className="flex items-center justify-between w-full h-9">
          {/* Left Action: Arrow or Logo */}
          {currentView === 'product' || currentView === 'cart' ? (
            <button 
              onClick={() => onNavigate('home')} 
              className="p-1 -ml-1 active:scale-95 transition-transform rounded-full hover:bg-white/10"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
          ) : (
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
              <img 
                src="https://i.ibb.co/bjjh6VkK/Ita-Magazine-1.png" 
                alt="ItaBuy Logo" 
                className="h-10 w-auto object-contain max-w-[120px]"
              />
            </div>
          )}

          {/* Middle Title (Only on Cart/Me screens) */}
          {(currentView === 'cart' || currentView === 'me') && (
            <div className="flex-1 text-center font-bold text-sm tracking-wide">
              {currentView === 'cart' ? 'Carrinho de Compras' : 'Minha Conta'}
            </div>
          )}

          {/* Right Actions: Cart & Messages */}
          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={() => onNavigate('cart')} 
              className="p-1 px-1.5 relative active:scale-95 transition-transform hover:bg-white/10 rounded-lg"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5.5 h-5.5 text-white" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-brand-yellow text-brand-blue font-black text-[9px] min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center border border-brand-blue"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={() => alert('Suporte ItaBuy: Chat offline no momento. Atendimento disponível das 08:00 às 18:00.')}
              className="p-1 relative active:scale-95 transition-transform hover:bg-white/10 rounded-lg"
              aria-label="Mensagens"
            >
              <MessageCircle className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar (Only shown on home & product detail view for fast discoverability) */}
        {(currentView === 'home' || currentView === 'product') && (
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            
            <input
              type="text"
              placeholder="Buscar em ItaBuy..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'home') {
                  onNavigate('home');
                }
              }}
              className="w-full bg-white text-gray-800 placeholder-gray-400 text-xs py-2 pl-8.5 pr-8 rounded-full outline-hidden border border-transparent focus:border-brand-yellow transition-colors"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-2 flex items-center px-1 text-gray-400 hover:text-gray-650 active:scale-90"
              >
                <CircleX className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
