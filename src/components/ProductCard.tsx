import { Star, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  key?: string | number;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const pixPrice = product.price * 0.95; // 5% discount on Pix
  const [pixInteger, pixCents] = pixPrice.toFixed(2).split('.');

  // Calculate a consistent, specific animation type based on the product ID hash
  const animTypeIndex = product.id 
    ? (product.id.charCodeAt(0) + (product.id.charCodeAt(product.id.length - 1) || 0)) % 3 
    : 0;

  return (
    <div 
      onClick={() => onClick(product)}
      className="group bg-white rounded-none overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-all duration-300 select-none tap-highlight-transparent relative"
    >
      
      {/* Product Image Area */}
      <div className="relative w-full aspect-square bg-[#FAF9F5]/40 overflow-hidden">
        <img 
          src={product.images?.[0] || 'https://via.placeholder.com/150'} 
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transform transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Hand Tap Visual Ripple Point Positioned on Product Image */}
        <div className="mascot-ripple absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-10" />

        {/* Speech/Thought Bubbles & Floating Hearts based on Animation Type */}
        {animTypeIndex === 0 && (
          <div className="absolute opacity-0 pointer-events-none anim-climber-bubble bg-slate-900/95 text-yellow-300 font-extrabold px-2.5 py-1.5 rounded-lg text-[8px] border border-yellow-300/40 w-[92%] left-1/2 top-2 text-center leading-normal z-30 shadow-lg">
            Por que esse cara tá me olhando??? 🧐 <br/> Para de olhar doidão!
            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 text-slate-900 text-[10px] transform rotate-45 select-none font-sans">◆</div>
          </div>
        )}

        {animTypeIndex === 1 && (
          <div className="absolute opacity-0 pointer-events-none anim-walker-bubble bg-slate-900/95 text-yellow-300 font-extrabold px-2.5 py-1.5 rounded-lg text-[8px] border border-yellow-300/40 w-[92%] left-1/2 bottom-12 text-center leading-normal z-30 shadow-lg">
            Se tu não comprar, <br/> eu compro, otário! 😂🛍️
            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 text-slate-900 text-[10px] transform rotate-45 select-none font-sans">◆</div>
          </div>
        )}

        {animTypeIndex === 2 && (
          <>
            <div className="absolute opacity-0 heart-icon-1 text-red-500 text-xs pointer-events-none select-none right-6 bottom-8 z-30">❤️</div>
            <div className="absolute opacity-0 heart-icon-2 text-rose-400 text-[10px] pointer-events-none select-none right-4 bottom-10 z-30">💖</div>
          </>
        )}

        {/* Cute Mascot "ItaBuddy" Interactive Sticker */}
        <div className={`absolute right-0.5 bottom-0.5 z-20 pointer-events-none select-none 
          ${animTypeIndex === 0 ? 'anim-climber' : ''} 
          ${animTypeIndex === 1 ? 'anim-walker' : ''} 
          ${animTypeIndex === 2 ? 'anim-lover' : ''}
        `}>
          <div className="mascot-container origin-bottom">
            <svg 
              width="46" 
              height="38" 
              viewBox="0 0 46 38" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
            >
              <g className="mascot-body-element">
                {/* Antennas / Ears */}
                <ellipse cx="14" cy="7" rx="3" ry="5" fill="#002A94" transform="rotate(-15, 14, 7)" />
                <ellipse cx="28" cy="7" rx="3" ry="5" fill="#002A94" transform="rotate(15, 28, 7)" />
                <circle cx="14" cy="4" r="1.5" fill="#FFF200" />
                <circle cx="28" cy="4" r="1.5" fill="#FFF200" />

                {/* Main Body */}
                <rect x="8" y="8" width="26" height="24" rx="12" fill="#002A94" stroke="#FFF200" strokeWidth="1.5" />
                
                {/* Rosy Cheeks */}
                <ellipse cx="12" cy="22" rx="2" ry="1.2" fill="#FF5C5C" opacity="0.8" />
                <ellipse cx="30" cy="22" rx="2" ry="1.2" fill="#FF5C5C" opacity="0.8" />

                {/* Eyes containing blinking mechanism */}
                <g className="mascot-eye">
                  <circle cx="15" cy="17" r="3.2" fill="white" />
                  <circle cx="15.8" cy="16.2" r="1.3" fill="#002A94" />
                </g>
                <g className="mascot-eye">
                  <circle cx="27" cy="17" r="3.2" fill="white" />
                  <circle cx="26.2" cy="16.2" r="1.3" fill="#002A94" />
                </g>

                {/* Mouth that smiles and opens */}
                <path d="M 18 21.5 Q 21 25.5 24 21.5" stroke="#FFF200" strokeWidth="1.5" strokeLinecap="round" fill="none" />

                {/* Tiny cute feet */}
                <rect x="12" y="31.5" width="5" height="2.5" rx="1" fill="#002A94" stroke="#FFF200" strokeWidth="0.8" />
                <rect x="25" y="31.5" width="5" height="2.5" rx="1" fill="#002A94" stroke="#FFF200" strokeWidth="0.8" />
              </g>

              {/* Animated reach arm pointing-and-laughing to the product (on left side) */}
              <g className="mascot-arm-element">
                {/* Arm Line connecting from right body boundary to pointing hand on the left */}
                <path d="M 14 19 Q 3 14 -3 10" stroke="#FFF200" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 14 19 Q 3 14 -3 10" stroke="#002A94" strokeWidth="1.4" strokeLinecap="round" />
                {/* Tiny hand pointing */}
                <circle cx="-3" cy="10" r="2.2" fill="#FFF200" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3 flex-grow flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="text-gray-800 text-xs sm:text-sm font-semibold leading-tight line-clamp-2 h-8 group-hover:text-brand-blue transition-colors duration-200">
            {product.name}
          </h3>
        </div>

        <div className="mt-3">
          {/* Pricing Section */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">
                R$ {(product.price || 0).toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-[10px] text-gray-400 line-through font-normal">
                  R$ {(product.originalPrice || 0).toFixed(2)}
                </span>
              )}
            </div>
            
            <div className="flex items-baseline mt-1">
              <span className="text-[10px] font-extrabold text-emerald-600 mr-0.5">R$</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-600">
                {pixInteger}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600">
                ,{pixCents}
              </span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-1.5">
                5% OFF no Pix
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
