import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Page } from '../types';
import { ChevronLeft, Share2, MoreVertical } from 'lucide-react';

interface BannerPageViewProps {
  pageId: string;
  onBack: () => void;
}

export default function BannerPageView({ pageId, onBack }: BannerPageViewProps) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  const nameRef = React.useRef(page?.name);
  React.useEffect(() => { nameRef.current = page?.name; }, [page?.name]);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const docRef = doc(db, 'pages', pageId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPage(docSnap.data() as Page);
        }
      } catch (err) {
        console.error("Error fetching page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [pageId]);

  useEffect(() => {
    // Helper to update elements with response or alert
    const handleAIAction = async (type: string) => {
      // Find an element to display result (common patterns: #resultado, #dica, #desafio, #curiosidade)
      const outputIds = ['resultado', 'dica', 'desafio', 'curiosidade', 'output', 'res'];
      const outputEl = outputIds.map(id => document.getElementById(id)).find(el => el !== null);
      
      if (outputEl) {
        outputEl.innerText = 'Processando...';
        outputEl.classList.add('animate-pulse');
      }

      try {
        const resp = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, context: nameRef.current })
        });
        const data = await resp.json();
        const result = data.result || 'Pronto!';
        
        if (outputEl) {
          outputEl.innerText = result;
          outputEl.classList.remove('animate-pulse');
        } else {
          alert(result);
        }
      } catch (err) {
        console.error('AI Error:', err);
        if (outputEl) outputEl.innerText = 'Erro ao processar';
      }
    };

    // Expose to window for dynamic HTML
    (window as any).gerar = () => handleAIAction('gerar');
    (window as any).desafio = () => handleAIAction('desafio');
    (window as any).curiosidade = () => handleAIAction('curiosidade');
    (window as any).abrirCapsula = () => handleAIAction('capsula');

    return () => {
      // Do not delete from window to avoid ReferenceErrors in dynamic HTML or quick transitions
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-white p-8 text-center">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-2">Ops! Página não encontrada</h2>
        <p className="text-sm text-slate-400 font-bold mb-6">O conteúdo deste banner ainda não foi publicado.</p>
        <button onClick={onBack} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest">
           Voltar para o Início
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col bg-white overflow-hidden">
      {/* HEADER PAGE */}
      <header className="fixed top-0 z-50 w-full max-w-md h-14 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 border-b border-gray-100 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-900 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xs font-black text-slate-900 uppercase tracking-widest truncate max-w-[200px]">{page.name}</h1>
        <div className="flex items-center gap-1">
           <button className="p-2 text-slate-400"><Share2 size={18} /></button>
           <button className="p-2 text-slate-400"><MoreVertical size={18} /></button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mt-14 flex-1 overflow-auto pb-10">
         <div 
           className="w-full h-full prose prose-slate max-w-none banner-page-html-content"
           dangerouslySetInnerHTML={{ __html: page.content }} 
         />
      </main>
    </div>
  );
}
