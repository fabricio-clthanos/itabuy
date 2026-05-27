import { Star } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  key?: string | number;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  // Safe format function for sales count to match Shopee (e.g., 1.2k ou 250 vendidos)
  const formatSales = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`.replace('.0', '') + ' vendidos';
    }
    return `${count} vendidos`;
  };

  return (
    <div 
      onClick={() => onClick(product)}
      className="bg-white rounded-lg overflow-hidden border border-gray-150/70 shadow-2xs hover:shadow-xs active:bg-gray-50 flex flex-col cursor-pointer transition-all select-none relative tap-highlight-transparent"
    >
      
      {/* Product Image Area */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        <img 
          src={product.images?.[0] || 'https://via.placeholder.com/150'} 
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transform active:scale-101 transition-transform"
        />

        {/* Brand-colored Yellow Discount Badge (top right) */}
        {product.discountPercentage && (
          <div className="absolute top-0 right-0 bg-brand-yellow text-brand-blue font-extrabold text-[9px] sm:text-[10px] px-1.5 py-1 flex flex-col items-center justify-center rounded-bl-md shadow-xs" style={{ borderLeft: '1px solid #0046BE', borderBottom: '1px solid #0046BE' }}>
            <span className="text-red-650 tracking-tighter">{product.discountPercentage}%</span>
            <span className="text-[7px] uppercase tracking-widest text-brand-blue font-black leading-none">OFF</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-2 flex-grow flex flex-col justify-between">
        {/* Title */}
        <h3 className="text-gray-800 text-[11px] sm:text-xs font-semibold leading-normal line-clamp-2 h-8.5 mb-1.5 overflow-hidden">
          {product.name}
        </h3>

        <div>
          {/* Coupon or Promotion badge placeholder */}
          <div className="flex gap-1 mb-1">
            <span className="text-[8px] bg-red-50 text-red-600 font-bold border border-red-200 px-1 rounded-sm">
              Mais Vendido
            </span>
            {product.price > 100 && (
              <span className="text-[8px] bg-blue-50 text-brand-blue font-bold border border-blue-200 px-1 rounded-sm">
                10x Sem Juros
              </span>
            )}
          </div>

          {/* Pricing Section (Shopee Layout style) */}
          <div className="flex items-baseline gap-1 flex-wrap mb-1">
            {product.originalPrice && (
              <span className="text-[9px] text-gray-400 line-through">
                R${(product.originalPrice || 0).toFixed(2)}
              </span>
            )}
            <span className="text-[13px] sm:text-sm font-bold text-brand-blue">
              R$ <span className="text-xs sm:text-lg">{Math.floor(product.price || 0)}</span>
              <span className="text-[11px]">,{(((product.price || 0) % 1) * 100).toFixed(0).padStart(2, '0')}</span>
            </span>
          </div>

          {/* Star Rating + Sales Counter */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1 pt-1.5 border-t border-gray-100">
            <div className="flex items-center gap-0.5 text-brand-yellow font-medium">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span className="text-[10px] text-gray-700">{(product.rating || 0).toFixed(1)}</span>
            </div>
            <div className="text-[9.5px]">
              {formatSales(product.salesCount)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
