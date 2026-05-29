import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, CircleX, ChevronLeft, ChevronRight, 
  Star, SlidersHorizontal, ArrowUpDown, Filter, Sparkles
} from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../data/mockData';

interface SearchViewProps {
  products: Product[];
  initialQuery: string;
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
  categoriesList?: { id: string; name: string; icon: string }[];
}

export default function SearchView({
  products,
  initialQuery,
  onSelectProduct,
  onBack,
  categoriesList = CATEGORIES
}: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc'>('relevance');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [freeShippingOnly, setFreeShippingOnly] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Sync with prop when search changes
  React.useEffect(() => {
    setQuery(initialQuery);
    setActiveQuery(initialQuery);
    setCurrentPage(1); // reset to page 1
  }, [initialQuery]);

  // Handle Search submit
  const handleSearchTrigger = (searchStr: string) => {
    setActiveQuery(searchStr);
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by Search Query (name or category or description)
    if (activeQuery.trim()) {
      const searchLower = activeQuery.toLowerCase().trim();
      result = result.filter(
        p => p.name.toLowerCase().includes(searchLower) || 
             p.category.toLowerCase().includes(searchLower) ||
             (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by Free Shipping
    if (freeShippingOnly) {
      result = result.filter(p => p.freeShipping);
    }

    // Filter by Price range
    if (minPrice.trim()) {
      const minVal = parseFloat(minPrice);
      if (!isNaN(minVal)) {
        result = result.filter(p => p.price >= minVal);
      }
    }
    if (maxPrice.trim()) {
      const maxVal = parseFloat(maxPrice);
      if (!isNaN(maxVal)) {
        result = result.filter(p => p.price <= maxVal);
      }
    }

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, activeQuery, selectedCategory, sortBy, minPrice, maxPrice, freeShippingOnly]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Handle page change
  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick preset price filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setSortBy('relevance');
    setMinPrice('');
    setMaxPrice('');
    setFreeShippingOnly(false);
    setCurrentPage(1);
  };

  return (
    <div className="flex-grow bg-[#ebebeb] pb-24 font-sans select-none min-h-screen">
      
      {/* 1. Dedicated SearchView Header */}
      <header className="bg-[#0005c7] text-white py-3.5 px-3 sticky top-0 z-45 shadow-sm border-b border-black/10">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {/* Back Action button */}
          <button 
            onClick={onBack}
            className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          {/* Search query input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input 
              type="text"
              placeholder="Buscar produtos no catálogo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchTrigger(query);
                }
              }}
              className="w-full bg-white text-gray-900 placeholder-gray-400 font-medium text-xs py-2.5 pl-9 pr-9 rounded-none outline-none border-none focus:ring-1 focus:ring-yellow-400 transition-all font-sans"
            />
            {query && (
              <button 
                onClick={() => {
                  setQuery('');
                  handleSearchTrigger('');
                }}
                className="absolute inset-y-0 right-3 flex items-center px-1 text-gray-400 hover:text-gray-600 active:scale-95"
              >
                <CircleX className="w-4 h-4" />
              </button>
            )}
          </div>

          <button 
            onClick={() => handleSearchTrigger(query)}
            className="bg-brand-yellow hover:bg-yellow-500 text-brand-blue font-black text-[11px] px-3.5 py-2.5 rounded-none active:scale-95 transition-transform uppercase tracking-wider h-[38px] flex items-center shrink-0"
          >
            BUSCAR
          </button>
        </div>
      </header>

      {/* Main search body section with max-w limit */}
      <div className="max-w-md mx-auto w-full px-2.5 pt-3 space-y-3">
        
        {/* Results Info Bar */}
        <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase px-1">
          <span>{filteredProducts.length} resultados encontrados</span>
          {(selectedCategory !== 'all' || minPrice || maxPrice || freeShippingOnly || sortBy !== 'relevance') && (
            <button 
              onClick={resetFilters}
              className="text-brand-blue hover:underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* 2. Filters Widget Panel */}
        <div className="bg-white border border-gray-200 p-3.5 space-y-4 rounded-none shadow-xs">
          
          {/* horizontal Category filter */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Filtrar por Categoria:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
              <button
                onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-[10.5px] border font-bold shrink-0 transition-colors uppercase rounded-none ${
                  selectedCategory === 'all' 
                    ? 'bg-brand-blue text-white border-brand-blue' 
                    : 'bg-gray-50 text-gray-650 border-gray-200 hover:border-gray-300'
                }`}
              >
                Todas
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-[10.5px] border font-bold shrink-0 transition-colors uppercase rounded-none ${
                    selectedCategory === cat.id 
                      ? 'bg-brand-blue text-white border-brand-blue' 
                      : 'bg-gray-50 text-gray-650 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Sorting + Free Shipping Toggles */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Sort Dropdown */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Ordenação:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="w-full bg-gray-50 border border-gray-200 p-2 text-xs font-bold text-gray-700 outline-none rounded-none focus:border-brand-blue"
              >
                <option value="relevance">Mais Relevantes</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
              </select>
            </div>

            {/* Price Limit Limits Inputs */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Preço (R$):
              </span>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-gray-50 border border-gray-205 py-1.5 px-2 text-xs text-center font-bold outline-none rounded-none text-gray-800 placeholder-gray-400 focus:border-brand-blue"
                />
                <span className="text-gray-400 text-[10px] font-bold">-</span>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-gray-50 border border-gray-205 py-1.5 px-2 text-xs text-center font-bold outline-none rounded-none text-gray-800 placeholder-gray-400 focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          {/* Quick options */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-650 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={freeShippingOnly}
                onChange={(e) => { setFreeShippingOnly(e.target.checked); setCurrentPage(1); }}
                className="rounded-none border-gray-300 w-4 h-4 text-brand-blue focus:ring-0 cursor-pointer"
              />
              <span>Apenas com Frete Grátis 🚚</span>
            </label>
            <div className="text-[10px] text-brand-blue font-extrabold bg-blue-50 px-2 py-0.5 border border-blue-100 rounded-none">
              ItaBuy Oficial
            </div>
          </div>

        </div>

        {/* 3. Products List Container (strictly 1 Column - Mercado Libre style) */}
        <div className="space-y-2 select-none">
          {paginatedProducts.map((product) => {
            const pixPrice = product.price * 0.95; // 5% Pix discount
            const [pixInteger, pixCents] = pixPrice.toFixed(2).split('.');

            return (
              <div 
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group bg-white border border-gray-200 overflow-hidden hover:shadow-md cursor-pointer transition-all duration-350 select-none flex p-3 gap-3.5 rounded-none"
              >
                {/* Left Side: Product Image (Strictly flat edge rectangle) */}
                <div className="w-[110px] h-[110px] shrink-0 bg-white border border-gray-150 relative rounded-none overflow-hidden flex items-center justify-center">
                  <img 
                    src={product.images?.[0] || 'https://via.placeholder.com/300'} 
                    alt={product.name} 
                    className="max-w-full max-h-full object-contain group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  {product.discountPercentage && (
                    <span className="absolute top-1 left-1 bg-emerald-500 text-white font-black text-[8px] px-1 py-0.5 rounded-none uppercase">
                      -{product.discountPercentage}%
                    </span>
                  )}
                </div>

                {/* Right Side: Information area */}
                <div className="flex-grow flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    {/* Store or category flag */}
                    <span className="text-[9px] font-black text-brand-blue uppercase tracking-wider block">
                      {product.category}
                    </span>

                    {/* Product Name Title */}
                    <h3 className="text-xs font-bold text-gray-800 leading-tight line-clamp-2 leading-relaxed">
                      {product.name}
                    </h3>

                    {/* Rating and sales */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-0.5 text-brand-yellow">
                        <Star className="w-3 h-3 fill-brand-yellow stroke-brand-yellow" />
                        <span className="text-[10px] font-bold text-gray-800">{product.rating ? product.rating.toFixed(1) : '4.5'}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">| {product.salesCount || '15'} vendidos</span>
                    </div>
                  </div>

                  {/* Pricing Layout */}
                  <div className="mt-2.5">
                    {product.originalPrice && (
                      <span className="text-[10px] text-gray-400 line-through block leading-none mb-0.5 font-normal">
                        R$ {product.originalPrice.toFixed(2)}
                      </span>
                    )}

                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-950 leading-none">
                        R$ {product.price.toFixed(2)}
                      </span>
                      {product.freeShipping && (
                        <span className="text-[9px] text-emerald-600 font-extrabold tracking-wide uppercase">
                          Frete Grátis
                        </span>
                      )}
                    </div>

                    {/* Pix discount details */}
                    <div className="flex items-center gap-1 mt-1 font-sans">
                      <span className="text-[10px] font-black text-emerald-600">R$ {pixInteger},{pixCents}</span>
                      <span className="text-[8.5px] font-extrabold text-emerald-600 bg-emerald-50 px-1 py-0.2 border border-emerald-100 rounded-none leading-none">
                        no PIX (5% OFF)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty Results Screen */}
          {filteredProducts.length === 0 && (
            <div className="bg-white p-12 border border-gray-200 text-center flex flex-col items-center justify-center rounded-none shadow-xs">
              <SlidersHorizontal className="w-12 h-12 text-gray-300 mb-4 animate-pulse" />
              <h3 className="text-gray-900 font-extrabold text-sm mb-1 uppercase tracking-wide">
                Nenhum resultado
              </h3>
              <p className="text-xs text-gray-400 font-semibold max-w-[240px] leading-relaxed">
                Não encontramos produtos para "{activeQuery}". Tente usar palavras menos específicas ou limpe seus filtros.
              </p>
              <button 
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-brand-blue text-white text-xs font-black rounded-none active:scale-95 transition-all"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          )}
        </div>

        {/* 4. Complete Responsive Numbered Pagination Block */}
        {filteredProducts.length > 0 && (
          <div className="bg-white border border-gray-200 p-4 flex flex-col items-center gap-3 rounded-none shadow-xs select-none">
            
            {/* Pages Information */}
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
              Página {currentPage} de {totalPages} ({filteredProducts.length} itens totais)
            </span>

            {/* Pagination Controls button row */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              
              {/* Back Page Button */}
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-gray-600 disabled:cursor-not-allowed transition-colors rounded-none"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Number Pages mapping */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isSelected = currentPage === pageNum;

                // Show first, last, current, and surrounding neighbors
                if (
                  totalPages > 5 && 
                  pageNum !== 1 && 
                  pageNum !== totalPages && 
                  Math.abs(currentPage - pageNum) > 1
                ) {
                  // Print ellipsis once
                  if (pageNum === 2 && currentPage > 3) {
                    return <span key={`ellipsis-start`} className="px-1 text-gray-400 font-bold text-xs select-none">...</span>;
                  }
                  if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key={`ellipsis-end`} className="px-1 text-gray-400 font-bold text-xs select-none">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-black border transition-all rounded-none ${
                      isSelected 
                        ? 'bg-brand-blue text-white border-brand-blue shadow-sm' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page Button */}
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-gray-600 disabled:cursor-not-allowed transition-colors rounded-none"
                aria-label="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
