import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, onSnapshot, setDoc, getDoc, collection } from 'firebase/firestore';
import { Banner } from '../types';
import { Plus, Trash2, Edit3, X, Save, Eye, EyeOff } from 'lucide-react';

export default function BannersAdminView() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const bannerNameRef = React.useRef(editingBanner?.name);
  React.useEffect(() => { bannerNameRef.current = editingBanner?.name; }, [editingBanner?.name]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'banners'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().banners) {
        setBanners(docSnap.data().banners);
      }
    });

    const handleAIAction = async (type: string) => {
      const outputIds = ['resultado', 'dica', 'desafio', 'curiosidade', 'output', 'res'];
      const outputEl = outputIds.map(id => document.getElementById(id)).find(el => el !== null);
      if (outputEl) { outputEl.innerText = 'Processando...'; outputEl.classList.add('animate-pulse'); }
      try {
        const resp = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, context: bannerNameRef.current })
        });
        const data = await resp.json();
        const result = data.result || 'Pronto!';
        if (outputEl) { outputEl.innerText = result; outputEl.classList.remove('animate-pulse'); } else { alert(result); }
      } catch (error) { console.error('AI Error:', error); if (outputEl) outputEl.innerText = 'Erro ao processar'; }
    };

    (window as any).gerar = () => handleAIAction('gerar');
    (window as any).desafio = () => handleAIAction('desafio');
    (window as any).curiosidade = () => handleAIAction('curiosidade');
    (window as any).abrirCapsula = () => handleAIAction('capsula');

    return () => {
      unsub();
      // Do not delete from window to avoid ReferenceErrors in dynamic HTML or quick transitions
    };
  }, []);

  const saveBanner = async () => {
    if (!editingBanner?.name || !editingBanner?.imageUrl) {
      alert("Nome e URL da imagem são obrigatórios");
      return;
    }
    
    const bannerData: Banner = {
      id: editingBanner.id || Date.now().toString(),
      name: editingBanner.name,
      imageUrl: editingBanner.imageUrl,
      isActive: editingBanner.isActive ?? true,
      clickable: !!editingBanner.clickable,
      targetType: 'category',
      targetValue: editingBanner.targetValue || ''
    };

    const updatedBanners = editingBanner.id 
      ? banners.map(b => b.id === editingBanner.id ? bannerData : b)
      : [...banners, bannerData];
    
    try {
      await setDoc(doc(db, 'settings', 'banners'), { banners: updatedBanners }, { merge: true });
      setIsFormOpen(false);
      setEditingBanner(null);
    } catch (error) {
      console.error("Error saving banner:", error);
      alert("Erro ao salvar banner");
    }
  };

  const toggleBannerStatus = async (banner: Banner) => {
    const updatedBanners = banners.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b);
    await setDoc(doc(db, 'settings', 'banners'), { banners: updatedBanners }, { merge: true });
  };

  const deleteBanner = async (id: string) => {
    try {
      const updatedBanners = banners.filter(b => b.id !== id);
      await setDoc(doc(db, 'settings', 'banners'), { banners: updatedBanners }, { merge: true });
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting banner:", error);
      alert("Erro ao excluir banner");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Gestão de Banners</h2>
         <button 
           onClick={() => { setEditingBanner({}); setIsFormOpen(true); }}
           className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 font-black text-xs uppercase tracking-widest rounded transition-all hover:bg-slate-800"
         >
             <Plus size={16} /> Novo Banner
         </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded border border-slate-200 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 uppercase text-sm tracking-widest">{editingBanner?.id ? 'Editar Banner' : 'Novo Banner'}</h3>
              <button onClick={() => setIsFormOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nome do Banner</label>
                  <input placeholder="Ex: Banner Promoção Verão" className="w-full border p-2.5 rounded text-sm outline-none focus:border-slate-400" value={editingBanner?.name || ''} onChange={e => setEditingBanner({ ...editingBanner, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-brand-blue uppercase tracking-widest block mb-1">URL da Imagem</label>
                  <div className="bg-amber-50 border border-amber-100 p-2 rounded mb-2 text-[10px] text-amber-700 font-bold flex items-center gap-2 italic">
                     Banner Recomendado: 700x320px
                  </div>
                  <input placeholder="https://exemplo.com/imagem.jpg" className="w-full border p-2.5 rounded text-sm outline-none focus:border-slate-400" value={editingBanner?.imageUrl || ''} onChange={e => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })} />
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Banner é Clicável?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={!!editingBanner?.clickable} onChange={e => setEditingBanner({ ...editingBanner, clickable: e.target.checked })} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                {editingBanner?.clickable && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ID da Categoria de Destino</label>
                    <input placeholder="Ex: eletronicos ou smartphones" className="w-full border p-2 rounded text-sm" value={editingBanner?.targetValue || ''} onChange={e => setEditingBanner({ ...editingBanner, targetValue: e.target.value, targetType: 'category' })} />
                    <p className="text-[9px] text-slate-400 font-medium">Ao clicar, o usuário será levado para esta categoria.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
                <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancelar</button>
                <button onClick={saveBanner} className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded flex items-center gap-2 hover:bg-slate-800 shadow-md">
                   <Save size={16}/> Salvar Banner
                </button>
            </div>
        </div>
      )}

      <div className="grid gap-3">
        {banners.length === 0 && !isFormOpen && (
          <div className="text-center py-20 bg-slate-50 rounded border border-dashed border-slate-300">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Nenhum banner cadastrado</p>
          </div>
        )}
        
        {banners.map(banner => (
          <div key={banner.id} className={`bg-white p-4 rounded border transition-all ${banner.isActive ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-60 grayscale shadow-none'}`}>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                   <div className="relative group">
                     <img src={banner.imageUrl} alt={banner.name} className="w-24 h-14 object-cover rounded shadow-inner border border-slate-100" />
                     {banner.clickable && (
                       <div className="absolute -top-1 -right-1 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                          <Eye size={8} />
                       </div>
                     )}
                   </div>
                   <div>
                      <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight leading-none mb-1.5">{banner.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${banner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {banner.isActive ? 'Ativo' : 'Desativado'}
                        </span>
                        {banner.clickable && (
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            ➔ Categoria: {banner.targetValue}
                          </span>
                        )}
                      </div>
                   </div>
               </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => toggleBannerStatus(banner)}
                    title={banner.isActive ? 'Desativar' : 'Ativar'}
                    className={`p-2.5 rounded transition-all shrink-0 ${banner.isActive ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                  >
                    {banner.isActive ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                  <button 
                    onClick={() => { setEditingBanner(banner); setIsFormOpen(true); }}
                    className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded transition-all shrink-0"
                  >
                    <Edit3 size={18}/>
                  </button>

                  <div className="flex items-center">
                    {deletingId === banner.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-100 animate-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => deleteBanner(banner.id)}
                          className="bg-rose-600 text-white px-2 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md hover:bg-rose-700 shadow-sm"
                        >
                          Sim
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="bg-white text-slate-500 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-200 hover:bg-slate-50"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeletingId(banner.id)}
                        className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all shrink-0"
                      >
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
