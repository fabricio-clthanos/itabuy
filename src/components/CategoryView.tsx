import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { CATEGORIES } from '../data/mockData';

interface CategoryViewProps {
  categoryId: string;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
}

export default function CategoryView({
  categoryId,
  products,
  onSelectProduct,
  onBack
}: CategoryViewProps) {
  
  // Find category details
  const categoryDetails = CATEGORIES.find(c => c.id === categoryId) || {
    id: categoryId,
    name: categoryId,
    icon: 'Compass'
  };

  // Filter products matching this category ID
  const categoryProducts = products.filter(p => p.category === categoryId);

  return (
    <div className="flex-grow bg-[#F5F5F5] pb-24 select-none font-sans min-h-[95vh]">
      
      {/* 1. Category View Header */}
      <header className="bg-brand-blue text-white py-3.5 px-4 sticky top-0 z-40 flex items-center gap-3 shadow-md">
        <button 
          onClick={onBack}
          className="bg-white/15 p-2 rounded-full hover:bg-white/25 active:scale-95 transition-transform text-white mr-1"
          aria-label="Voltar para o início"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div>
          <span className="text-[10px] text-blue-200 uppercase font-bold tracking-widest block leading-none mb-1">
            CATEGORIA OFICIAL
          </span>
          <h1 className="text-sm sm:text-base font-black flex items-center gap-1.5 capitalize font-sans leading-none">
            {categoryDetails.name}
          </h1>
        </div>
      </header>

      {/* 2. Products List Container (strictly 2 columns) */}
      <div className="p-2.5">
        
        {categoryProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-150 text-center flex flex-col items-center justify-center my-6 shadow-2xs">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
            <span className="text-gray-900 font-extrabold text-sm mb-1 uppercase tracking-wide">Sem Estoque Disponível</span>
            <p className="text-xs text-gray-400 font-medium max-w-[240px]">
              Nenhum produto foi cadastrado sob o selo desta categoria no momento.
            </p>
          </div>
        ) : (
          <>
            {/* Promo label header */}
            <div className="flex items-center gap-1.5 px-1.5 mb-2.5 select-none text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <span>Destaques da Categoria ({categoryProducts.length})</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-2 select-none">
              {categoryProducts.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onClick={onSelectProduct} 
                />
              ))}
            </div>
          </>
        )}

      </div>

    </div>
  );
}
