import React, { useState } from 'react';
import { Product, Coupon } from '../types';
import { CATEGORIES } from '../data/mockData';
import ProductCard from './ProductCard';
import { ProductCardSkeleton, BannerSkeleton } from './Skeleton';

interface HomeViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectCoupon: (coupon: Coupon) => void;
  searchQuery: string;
  onNavigateToCategory: (categoryId: string) => void;
  onNavigateToPage: (pageId: string) => void;
  onNavigateToFlashDeals: () => void;
  availableCoupons: Coupon[];
  banners: any[];
  storeSettings?: any;
  inspectMode?: boolean;
  loading?: boolean;
}

export default function HomeView({
  products,
  onSelectProduct,
  onSelectCoupon,
  searchQuery,
  onNavigateToCategory,
  onNavigateToPage,
  onNavigateToFlashDeals,
  availableCoupons,
  banners,
  storeSettings,
  inspectMode,
  loading
}: HomeViewProps) {
  const defaultSections = ['banners', 'products'];
  const layoutOrder = storeSettings?.homeLayout || defaultSections;
  
  // Ensure 'banners' is always first, followed by other selected sections
  const sectionsToInclude = ['banners', 'products'];
  const baseLayout = layoutOrder.filter((id: string) => sectionsToInclude.includes(id));
  const activeLayout = ['banners', ...baseLayout.filter(id => id !== 'banners')];

  // Determine top horizontal tabs for Categories matching new catalog request
  // First is "Para você", then actual categories
  const categoryTabs = ['Para Você', ...(storeSettings?.categories || CATEGORIES).map((c: any) => c.name)];
  
  const [selectedSubTab, setSelectedSubTab] = useState<string>('Para Você');

  const filteredProductsBySearch = products.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = p.name || '';
    const category = p.category || '';
    const description = p.description || '';
    return name.toLowerCase().includes(query) || 
           category.toLowerCase().includes(query) || 
           description.toLowerCase().includes(query);
  });

  const displayedProducts = filteredProductsBySearch.filter((p) => {
    if (selectedSubTab === 'Para Você') return true; // show all
    
    // Find category in settings or catalog
    const cats = storeSettings?.categories || CATEGORIES || [];
    const activeCat = cats.find((c: any) => (c.name || '').toLowerCase() === (selectedSubTab || '').toLowerCase());
    
    const prodCat = (p.category || '').toLowerCase();
    
    if (activeCat) {
      // Check if product category matches active category's ID or its Name
      return prodCat === String(activeCat.id).toLowerCase() || prodCat === (activeCat.name || '').toLowerCase();
    }
    
    // Fallback simple comparison if category tab not found in CATEGORIES list
    return prodCat === (selectedSubTab || '').toLowerCase();
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

    banners: wrapSection('banners', (
      <section id="banners-secao" className="mt-2">
        <div className="flex gap-3 overflow-x-auto px-3 no-scrollbar ios-scroll-inertia snap-x snap-mandatory">
          {loading ? (
            <>
              <div className="w-[88%] shrink-0"><BannerSkeleton /></div>
              <div className="w-[88%] shrink-0"><BannerSkeleton /></div>
            </>
          ) : (
            <>
              {/* BANNERS LIST */}
              {banners.filter(b => b.isActive).map((banner: any) => (
                <div 
                  key={banner.id} 
                  onClick={() => {
                    if (banner.clickable) {
                      if (banner.targetType === 'category') {
                        onNavigateToCategory(banner.targetValue);
                      } else if (banner.targetType === 'page') {
                        onNavigateToPage(banner.targetValue);
                      }
                    }
                  }}
                  className={`w-[88%] flex-shrink-0 relative group snap-center ${banner.clickable ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
                >
                  <img src={banner.imageUrl} alt={banner.name} className="w-full h-36 object-cover rounded-xl shadow-md border border-gray-100" />
                </div>
              ))}

              {/* PREMIUM VOUCHER REDESIGN */}
              {availableCoupons.map((coupon) => (
                <div 
                  key={coupon.id} 
                  className="bg-white rounded-xl flex overflow-hidden flex-shrink-0 w-[88%] snap-center shadow-sm select-none h-32 border border-slate-100 relative group"
                >
                  <div className="w-1.5 h-full bg-slate-900 shrink-0" />
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-[13px] font-black text-slate-800 tracking-tight uppercase leading-none">{coupon.title}</h4>
                        <div className="mt-2 flex items-center gap-1.5">
                          <code className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-mono">{coupon.code}</code>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-900 font-extrabold text-lg leading-none">{coupon.type === 'percentage' ? `${coupon.discount}%` : `R$ ${coupon.discount}`}</div>
                        <span className="text-[9px] font-black text-slate-400">OFF</span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Mínimo: R${coupon.minSpent}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onSelectCoupon(coupon); }}
                        className="bg-slate-900 text-white text-[9px] font-black px-6 py-2.5 rounded-lg uppercase"
                      >
                        Resgatar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    ), true),

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

        {loading ? (
          <div className="grid grid-cols-2 gap-3 p-3">
            {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : displayedProducts.length === 0 ? (
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
