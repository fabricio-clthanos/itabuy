import React, { useState } from 'react';
import { Ticket } from 'lucide-react';
import { Product, Coupon } from '../types';
import { CATEGORIES } from '../data/mockData';
import ProductCard from './ProductCard';

interface HomeViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectCoupon: (coupon: Coupon) => void;
  searchQuery: string;
  onNavigateToCategory: (categoryId: string) => void;
  onNavigateToFlashDeals: () => void;
  availableCoupons: Coupon[];
  storeSettings?: any;
  inspectMode?: boolean;
}

export default function HomeView({
  products,
  onSelectProduct,
  onSelectCoupon,
  searchQuery,
  onNavigateToCategory,
  onNavigateToFlashDeals,
  availableCoupons,
  storeSettings,
  inspectMode
}: HomeViewProps) {
  const defaultSections = ['coupons', 'products'];
  const layoutOrder = storeSettings?.homeLayout || defaultSections;
  
  // Filter only the allowed sections array
  const activeLayout = layoutOrder.filter((id: string) => ['coupons', 'products'].includes(id));

  // Determine top horizontal tabs for Categories matching new catalog request
  // First is "Para você", then actual categories
  const categoryTabs = ['Para Você', ...(storeSettings?.categories || CATEGORIES).map((c: any) => c.name)];
  
  const [selectedSubTab, setSelectedSubTab] = useState<string>('Para Você');

  const filteredProductsBySearch = products.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || (p.category || '').toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
  });

  const displayedProducts = filteredProductsBySearch.filter((p) => {
    if (selectedSubTab === 'Para Você') return true; // show all
    
    // Find category in settings or catalog
    const cats = storeSettings?.categories || CATEGORIES || [];
    const activeCat = cats.find((c: any) => (c.name || '').toLowerCase() === selectedSubTab.toLowerCase());
    
    const prodCat = (p.category || '').toLowerCase();
    
    if (activeCat) {
      // Check if product category matches active category's ID or its Name
      return prodCat === String(activeCat.id).toLowerCase() || prodCat === (activeCat.name || '').toLowerCase();
    }
    
    // Fallback simple comparison if category tab not found in CATEGORIES list
    return prodCat === selectedSubTab.toLowerCase();
  });

  const handleDragStart = (e: any, id: string) => {
    if (!inspectMode) return;
    e.dataTransfer.setData('text/plain', id);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: any) => {
    if (!inspectMode) return;
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e: any) => {
    if (!inspectMode) return;
    e.preventDefault();
  };

  const handleDrop = (e: any, targetId: string) => {
    if (!inspectMode) return;
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId === targetId) return;
    
    const newLayout = [...layoutOrder];
    const sourceIndex = newLayout.indexOf(sourceId);
    if (sourceIndex === -1) return;
    
    const targetIndex = newLayout.indexOf(targetId);
    newLayout.splice(sourceIndex, 1);
    newLayout.splice(targetIndex, 0, sourceId);
    
    window.parent.postMessage({ type: 'ELEMENTOR_UPDATE_SETTING', payload: { key: 'homeLayout', value: newLayout } }, '*');
  };

  const wrapSection = (id: string, children: React.ReactNode, isEnabled: boolean) => {
    if (!isEnabled) return null;
    if (searchQuery && id !== 'products') return null;
    return (
      <div 
        key={id}
        draggable={inspectMode}
        onDragStart={(e) => handleDragStart(e, id)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, id)}
        className={`${inspectMode ? 'relative border-[3px] border-transparent hover:border-brand-yellow hover:bg-black/5 cursor-move transition-all rounded m-1' : ''}`}
        onClickCapture={(e) => {
          if (inspectMode) {
            e.preventDefault();
            e.stopPropagation();
            window.parent.postMessage({ type: 'ELEMENTOR_INSPECT_RESULT', payload: { sectionId: id } }, '*');
          }
        }}
      >
        {inspectMode && (
          <div className="absolute top-0 right-0 bg-brand-yellow text-slate-900 border-b border-l border-slate-900/10 text-[9px] px-1.5 py-0.5 font-bold z-30 pointer-events-none rounded-bl uppercase tracking-wider shadow">
            Arrastar • Seção {id}
          </div>
        )}
        <div className={inspectMode ? 'pointer-events-none' : ''}>
          {children}
        </div>
      </div>
    );
  };

  const SectionComponents: Record<string, React.ReactNode> = {
    categories: wrapSection('categories', (
      <section className="mt-2 bg-white p-3 border-y border-gray-200">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          Categorias ItaBuy
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-1.5 no-scrollbar snap-x ios-scroll-inertia">
          {(storeSettings?.categories || CATEGORIES).map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => onNavigateToCategory(cat.id)}
              className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm text-xs font-semibold text-gray-700 active:scale-95 transition-transform shrink-0 snap-start"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>
    ), storeSettings?.homeShowCategories ?? true),

    coupons: wrapSection('coupons', (
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
    ), storeSettings?.homeShowCoupons ?? true),

    products: wrapSection('products', (
      <section className="mt-2 text-gray-800" id="discover-feed">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-14 z-35 flex items-center overflow-x-auto no-scrollbar font-medium select-none shadow-sm pb-1 px-2">
          {categoryTabs.map((tab) => (
            <button 
              key={tab}
              onClick={() => setSelectedSubTab(tab)}
              className={`flex-shrink-0 px-4 py-3 text-xs border-b-2 transition-all whitespace-nowrap ${selectedSubTab === tab ? 'border-brand-blue text-brand-blue font-bold shadow-[0_1px_0_0_transparent]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {searchQuery && (
          <div className="bg-white/80 backdrop-blur-sm p-3 border-b border-gray-200/50 text-xs text-gray-600 flex items-center justify-between">
            <span>Resultados para: <strong>"{searchQuery}"</strong></span>
            <span className="text-gray-400">{displayedProducts.length} itens encontrados</span>
          </div>
        )}

        {displayedProducts.length === 0 ? (
          <div className="py-16 text-center px-4">
            <p className="text-lg text-gray-450 font-bold mb-1">Infelizmente nada foi encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3 select-none">
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
    ), true)
  };

  return (
    <div className="flex-grow bg-[#FAFAFA] pb-24">
      {activeLayout.map((sectionId: string) => SectionComponents[sectionId])}
    </div>
  );
}
