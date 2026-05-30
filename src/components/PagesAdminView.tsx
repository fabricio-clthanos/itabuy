import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Page } from '../types';
import { Plus, Trash2, Edit3, X, Save, Eye, Layout, Code } from 'lucide-react';

export default function PagesAdminView() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<Page> | null>(null);

  const pageNameRef = React.useRef(editingPage?.name);
  React.useEffect(() => { pageNameRef.current = editingPage?.name; }, [editingPage?.name]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pages'), (snapshot) => {
      const list: Page[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Page);
      });
      setPages(list);
    });

    const handleAIAction = async (type: string) => {
      const outputIds = ['resultado', 'dica', 'desafio', 'curiosidade', 'output', 'res'];
      const outputEl = outputIds.map(id => document.getElementById(id)).find(el => el !== null);
      if (outputEl) { outputEl.innerText = 'Processando...'; outputEl.classList.add('animate-pulse'); }
      try {
        const resp = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, context: pageNameRef.current })
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

  const savePage = async () => {
    if (!editingPage?.name || !editingPage?.id) {
       alert("ID e Nome são obrigatórios");
       return;
    }
    
    try {
      await setDoc(doc(db, 'pages', editingPage.id), {
        id: editingPage.id,
        name: editingPage.name,
        content: editingPage.content || ''
      });
      setIsEditorOpen(false);
      setEditingPage(null);
    } catch (error) {
      console.error("Error saving page:", error);
      alert("Erro ao salvar página");
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta página?")) return;
    try {
      await deleteDoc(doc(db, 'pages', id));
    } catch (error) {
      console.error("Error deleting page:", error);
      alert("Erro ao excluir página");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Páginas Personalizadas</h2>
         <button 
           onClick={() => { setEditingPage({ id: `page_${Date.now()}`, name: '', content: '' }); setIsEditorOpen(true); }}
           className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 font-black text-xs uppercase tracking-widest rounded transition-all hover:bg-slate-800"
         >
             <Plus size={16} /> Nova Página
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map(page => (
          <div key={page.id} className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-colors">
             <div className="mb-4">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                       <Code size={16} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 uppercase tracking-widest truncate">{page.name}</h4>
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {page.id}</p>
             </div>
             <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-50">
                <button onClick={() => { setEditingPage(page); setIsEditorOpen(true); }} className="p-2 text-slate-500 hover:text-slate-900 transition-colors"><Edit3 size={18}/></button>
                <button onClick={() => deletePage(page.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
             </div>
          </div>
        ))}
      </div>

      {/* PAGE EDITOR MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
           <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-t-xl border-b">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-100 text-indigo-600 rounded">
                    <Code size={20} />
                 </div>
                 <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <input 
                      className="font-black text-slate-900 uppercase text-sm tracking-widest bg-slate-50 border-none outline-none p-1 rounded min-w-[200px]"
                      placeholder="NOME DA PÁGINA"
                      value={editingPage?.name || ''}
                      onChange={e => setEditingPage({ ...editingPage, name: e.target.value })}
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {editingPage?.id}</span>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                   onClick={savePage}
                   className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded hover:bg-slate-800 transition-all flex items-center gap-2"
                 >
                    <Save size={16} /> Salvar & fechar
                 </button>
                 <button onClick={() => setIsEditorOpen(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
              </div>
           </div>

           <div className="flex-1 flex gap-4 overflow-hidden">
              <div className="w-1/2 flex flex-col bg-slate-950 rounded-bl-xl overflow-hidden border border-slate-800">
                 <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Layout size={12} /> CÓDIGO HTML / CSS
                    </span>
                 </div>
                 <textarea 
                   className="flex-1 bg-transparent text-slate-300 font-mono text-sm p-6 outline-none resize-none no-scrollbar"
                   placeholder="<div><h1>Título</h1><p>Conteúdo</p></div>"
                   spellCheck={false}
                   value={editingPage?.content || ''}
                   onChange={e => setEditingPage({ ...editingPage, content: e.target.value })}
                 />
              </div>

              <div className="w-1/2 flex flex-col bg-white rounded-br-xl overflow-hidden border border-slate-200">
                 <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Eye size={12} /> VISUALIZAÇÃO EM TEMPO REAL
                    </span>
                 </div>
                 <div className="flex-1 overflow-auto p-4 preview-container">
                    {editingPage?.content ? (
                      <div dangerouslySetInnerHTML={{ __html: editingPage.content }} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-sm">
                         Nenhum conteúdo HTML definido ainda...
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
