import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, onSnapshot, query, updateDoc, setDoc, doc, orderBy, deleteDoc, getDocs 
} from 'firebase/firestore';
import { 
  Package, Ticket, LogOut, ClipboardList, Bell, X, 
  ChevronLeft, ChevronRight, ChevronDown,
  Copy, Printer, CheckCircle2, LayoutDashboard, 
  ImageIcon, Settings, Upload, Music,
  MapPin, CreditCard, User, Clock, Timer, ShieldAlert,
  RefreshCw, Trash2, Menu, MonitorPlay
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Coupon } from '../types';

// --- MAIN ADMIN DASHBOARD ---

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pedidos' | 'products' | 'categorias' | 'coupons' | 'settings' | 'cancelamentos'>('dashboard');
  const [audioUnlocked, setAudioUnlocked] = useState(() => {
    return localStorage.getItem('admin_notifications_unlocked_once') === 'true';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const unlockAudio = () => {
    // Play a silent sound to unlock audio context/playback
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhAAQACABAAAABkYXRhAgAAAAEA');
    audio.play().then(() => {
      setAudioUnlocked(true);
      localStorage.setItem('admin_notifications_unlocked_once', 'true');
    }).catch(err => {
      console.log('Error unlocking audio:', err);
      setAudioUnlocked(true);
      localStorage.setItem('admin_notifications_unlocked_once', 'true');
    });
  };

  const playTestSound = () => {
    // Tenta carregar áudio personalizado do localStorage primeiro
    const customAudio = localStorage.getItem('custom_notification_audio');
    
    const tryPlay = (src: string) => {
      const media = new Audio(src);
      return media.play();
    };

    const playChain = async () => {
      try {
        if (customAudio) {
           await tryPlay(customAudio);
        } else {
           throw new Error('no custom audio');
        }
      } catch {
        tryPlay('/notification.mp4')
          .catch(() => tryPlay('/notification.mp3'))
          .catch(() => tryPlay('https://www.myinstants.com/media/sounds/whatsapp-notification-sound.mp3'))
          .catch(e => console.log('Audio error:', e));
      }
    };

    playChain();
    
    setTimeout(() => {
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance('Simulação de novo pedido');
      utter.lang = 'pt-BR';
      synth.speak(utter);
    }, 1500);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar - Classic Professional 2018 Style */}
      <aside className={`bg-[#2c3e50] flex flex-col shrink-0 relative z-20 border-r border-slate-700 shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-6 border-b border-black/20 bg-[#1a252f] flex justify-between items-center">
          {!sidebarCollapsed && <h2 className="text-2xl font-black text-white tracking-tighter">ITABUY</h2>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-slate-400 hover:text-white transition-colors" title="Recolher / Expandir menu">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <SidebarButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={18} />} 
            label="Visão Geral" 
            collapsed={sidebarCollapsed}
          />
          <SidebarButton 
            active={activeTab === 'pedidos'} 
            onClick={() => setActiveTab('pedidos')} 
            icon={<ClipboardList size={18} />} 
            label="Gestão de Pedidos" 
            collapsed={sidebarCollapsed}
          />
          <SidebarButton 
            active={activeTab === 'cancelamentos'} 
            onClick={() => setActiveTab('cancelamentos')} 
            icon={<ShieldAlert size={18} className="text-red-400" />} 
            label="Cancelamentos" 
            collapsed={sidebarCollapsed}
          />
          
          <div className="mt-6 mb-2 px-6">
             {!sidebarCollapsed && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Catálogo</span>}
          </div>
          <SidebarButton 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
            icon={<Package size={18} />} 
            label="Produtos" 
            collapsed={sidebarCollapsed}
          />
          <SidebarButton 
            active={activeTab === 'categorias'} 
            onClick={() => setActiveTab('categorias')} 
            icon={<ImageIcon size={18} />} 
            label="Categorias" 
            collapsed={sidebarCollapsed}
          />
          <SidebarButton 
            active={activeTab === 'coupons'} 
            onClick={() => setActiveTab('coupons')} 
            icon={<Ticket size={18} />} 
            label="Cupons" 
            collapsed={sidebarCollapsed}
          />

          <div className="mt-6 mb-2 px-6">
             {!sidebarCollapsed && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configurações</span>}
          </div>
          <SidebarButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings size={18} />} 
            label="Sistema" 
            collapsed={sidebarCollapsed}
          />
        </nav>

        <div className="p-4 border-t border-white/5 bg-[#1a252f] space-y-2">
          <button 
            onClick={playTestSound}
            className={`w-full text-slate-300 p-2.5 rounded hover:bg-white/5 hover:text-white transition-all flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 text-xs font-medium'}`}
            title="Testar Alerta"
          >
            <Bell size={14} className="text-amber-500 shrink-0" /> {!sidebarCollapsed && "Testar Alerta"}
          </button>
          <button 
            onClick={onLogout} 
            className={`w-full text-red-400 p-2.5 rounded hover:bg-red-500/10 hover:text-red-300 transition-all flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 text-xs font-medium'}`}
            title="Sair do Painel"
          >
            <LogOut size={14} className="shrink-0" /> {!sidebarCollapsed && "Sair do Painel"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header - Classic Top Bar */}
        <header className="h-16 bg-white border-b border-gray-300 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Painel Geral / <span className="text-slate-900">{activeTab === 'dashboard' ? 'Visão Geral' : activeTab === 'pedidos' ? 'Gestão de Pedidos' : activeTab}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Administrador
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto relative">
          {!audioUnlocked && (
            <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
               <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-2xl border border-slate-200">
                  <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-8 shadow-sm">
                     <Bell size={40} className="animate-bounce" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest mb-4">Ativar Notificações</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-loose mb-10">
                    Para que o sistema possa avisar você sobre novos pedidos com som e voz, o navegador exige uma interação inicial.
                  </p>
                  <button 
                    onClick={unlockAudio}
                    className="w-full py-5 bg-emerald-600 text-white font-bold uppercase text-sm tracking-widest rounded hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                  >
                    Entrar no Painel
                  </button>
               </div>
            </div>
          )}
          <div className="p-0 h-full">
            {activeTab === 'dashboard' && <DashboardOverviewView />}
            {activeTab === 'pedidos' && <PedidosAdminView audioUnlocked={audioUnlocked} />}
            {activeTab === 'cancelamentos' && <CancelamentosAdminView />}
            {activeTab === 'products' && <ProductsAdminTab />}
            {activeTab === 'coupons' && <CouponsAdminView />}
            {activeTab === 'categorias' && <CategoriasAdminView />}
            {activeTab === 'settings' && <SettingsAdminView onBack={() => setActiveTab('dashboard')} onTestSound={playTestSound} />}
          </div>
        </div>
      </main>
    </div>
  );
}

function CategoriasAdminView() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'elementor'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().categories) {
        setCategories(docSnap.data().categories);
      } else {
        // Fallback to default list
        setCategories([
          { id: 'celulares', name: 'Celulares' },
          { id: 'eletronicos', name: 'Eletrônicos' },
          { id: 'moda', name: 'Moda' },
          { id: 'beleza', name: 'Beleza' },
          { id: 'calcados', name: 'Calçados' },
          { id: 'casa', name: 'Casa' },
          { id: 'esportes', name: 'Esportes' },
          { id: 'brinquedos', name: 'Brinquedos' },
        ]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveCategoriesList = async (updatedList: typeof categories) => {
    try {
      await updateDoc(doc(db, 'settings', 'elementor'), {
        categories: updatedList
      });
    } catch (err) {
      console.error('Error saving categories:', err);
      try {
        await setDoc(doc(db, 'settings', 'elementor'), { categories: updatedList }, { merge: true });
      } catch (err2) {
        console.error('Error fallback saving categories:', err2);
      }
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const computedId = newCatId.trim().toLowerCase().replace(/\s+/g, '-') || newCatName.trim().toLowerCase().replace(/\s+/g, '-');
    
    if (categories.some(c => c.id === computedId)) {
      alert('Já existe uma categoria com este ID!');
      return;
    }

    const updated = [
      ...categories,
      { id: computedId, name: newCatName.trim() }
    ];
    setCategories(updated);
    saveCategoriesList(updated);
    
    setNewCatName('');
    setNewCatId('');
  };

  const handleDeleteCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    saveCategoriesList(updated);
    setConfirmDeleteId(null);
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Carregando categorias...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Gerenciamento de Categorias</h2>
          <p className="text-[10px] text-slate-404 font-bold uppercase tracking-tight font-sans">Adicione e remova as categorias de exibição da sua loja</p>
        </div>
        <span className="text-[10px] bg-slate-950 text-white px-3 py-1.5 font-black rounded-none uppercase tracking-widest">
          {categories.length} Categorias Ativas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form area */}
        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm h-fit space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Nova Categoria</h3>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome da Categoria *</label>
              <input 
                type="text" 
                required
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Ex: Games, Livros..."
                className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-800 font-semibold outline-none focus:border-slate-900 rounded-none placeholder-slate-350"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">ID da Categoria (opcional)</label>
              <input 
                type="text" 
                value={newCatId}
                onChange={e => setNewCatId(e.target.value)}
                placeholder="Ex: games, livros"
                className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-800 font-mono outline-none focus:border-slate-900 rounded-none placeholder-slate-350"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-black rounded-none transition-colors uppercase tracking-widest"
            >
              Adicionar
            </button>
          </form>
        </div>

        {/* List view area */}
        <div className="md:col-span-2 bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-205">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Categorias Cadastradas</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
            {categories.map((cat, idx) => (
              <div key={cat.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 text-slate-800 p-2 border border-slate-205 w-10 h-10 flex items-center justify-center font-bold text-xs rounded-none animate-pulse">
                    📁
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">{cat.name}</span>
                    <span className="text-[9px] text-slate-405 font-bold block font-mono uppercase">ID: {cat.id}</span>
                  </div>
                </div>
                
                {confirmDeleteId === cat.id ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] px-3 py-1.5 rounded-none uppercase tracking-widest transition-colors"
                    >
                      Confirmar
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(null)}
                      className="bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-[10px] px-3 py-1.5 rounded-none uppercase tracking-widest transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmDeleteId(cat.id)}
                    className="bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-700 font-bold text-[10px] px-3 py-1.5 rounded-none uppercase tracking-widest transition-colors border border-red-200"
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma categoria encontrada.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsAdminView({ onBack, onTestSound }: { onBack: () => void, onTestSound: () => void }) {
  const [audioPreview, setAudioPreview] = useState<string | null>(localStorage.getItem('custom_notification_audio'));

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Arquivo muito grande! Máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      localStorage.setItem('custom_notification_audio', base64);
      setAudioPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeAudio = () => {
    localStorage.removeItem('custom_notification_audio');
    setAudioPreview(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-[800px] mx-auto space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest border-b-2 border-slate-100">Voltar</span>
        </button>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Configurações do Sistema</h2>
        <div className="w-10" />
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Music size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notificações Sonoras</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Personalize o som de novos pedidos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group text-center">
                <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                <Upload size={32} className="mx-auto text-slate-300 group-hover:text-emerald-500 mb-3 transition-colors" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Subir MP3</span>
                <span className="text-[9px] text-slate-300 uppercase mt-1 block">Tamanho máximo 2MB</span>
              </label>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Status do Áudio</span>
                {audioPreview ? (
                  <div className="flex items-center gap-3 text-emerald-600">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Personalizado Ativo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-400">
                    <Bell size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Padrão do Sistema</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button 
                  onClick={onTestSound}
                  className="flex-1 bg-slate-900 text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                >
                  Testar Agora
                </button>
                {audioPreview && (
                  <button 
                    onClick={removeAudio}
                    className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function SidebarButton({ active, onClick, icon, label, collapsed }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, collapsed?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      title={collapsed ? label : undefined}
      className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-6'} py-3 text-xs font-semibold tracking-wide transition-all border-l-4 ${
        active 
          ? 'bg-[#1a252f] text-brand-blue border-brand-blue' 
          : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <span className={active ? 'text-brand-blue' : 'text-slate-500'}>{icon}</span> {!collapsed && label}
    </button>
  );
}

// --- DASHBOARD OVERVIEW VIEW ---

function DashboardOverviewView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch orders
    const qOrders = query(collection(db, 'orders'), orderBy('date', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const all: any[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(all);
    });

    // Fetch products for stats
    const qProds = query(collection(db, 'products'));
    getDocs(qProds).then(snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubOrders();
  }, []);

  useEffect(() => {
    let result = [...orders];
    if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus);
    }
    if (filterMethod !== 'all') {
      result = result.filter(o => (o.paymentMethod || 'pix').toLowerCase() === filterMethod.toLowerCase());
    }
    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.id?.toLowerCase().includes(low) || 
        (o.address?.fullname || o.clientName || '').toLowerCase().includes(low)
      );
    }
    setFilteredOrders(result);
  }, [orders, filterStatus, filterMethod, searchTerm]);

  const stats = {
    total: orders.length,
    revenue: orders.filter(o => o.status === 'Pedido entregue').reduce((acc, o) => acc + (o.total || 0), 0),
    pending: orders.filter(o => o.status === 'Pendente' || o.status === 'Aguardando Pagamento').length,
    delivered: orders.filter(o => o.status === 'Pedido entregue').length,
    productsCount: products.length,
    totalSales: orders.filter(o => o.status === 'Pedido entregue').reduce((acc, o) => acc + (o.itemsCount || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto overflow-y-auto">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Financeiro (Vendas)" value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="emerald" icon={<CreditCard size={24} />} />
        <StatCard label="Volume de Pedidos" value={stats.total.toString()} color="slate" icon={<ClipboardList size={24} />} />
        <StatCard label="Itens em Estoque" value={stats.productsCount.toString()} color="blue" icon={<Package size={24} />} />
        <StatCard label="Total de Itens Vendidos" value={stats.totalSales.toString()} color="amber" icon={<CheckCircle2 size={24} />} />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 p-6 rounded shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pedidos Aguardando</span>
              <span className="text-2xl font-bold text-amber-600">{stats.pending}</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
              <Clock size={24} />
            </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entregas Realizadas</span>
              <span className="text-2xl font-bold text-emerald-600">{stats.delivered}</span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Pesquisar Registro</label>
            <input 
              type="text" 
              placeholder="Nome do cliente ou código ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-sm outline-none focus:border-slate-500 transition-colors"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Pagamento</label>
            <select 
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-sm outline-none cursor-pointer"
            >
              <option value="all">Todas as formas</option>
              <option value="pix">PIX</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>
          <div className="w-full md:w-64">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Filtrar por Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-sm outline-none cursor-pointer"
            >
              <option value="all">Todos os status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="Aguardando Pagamento">Aguardando Pagamento</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white border border-gray-200 shadow-sm rounded overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300 bg-[#f1f3f4] flex items-center justify-between">
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Histórico de Movimentação</h3>
           <span className="text-[10px] font-bold text-slate-400 uppercase">{filteredOrders.length} Resultados encontrados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f8f9fa]">
              <tr className="text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-gray-300">
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Beneficiário</th>
                <th className="px-6 py-4">Tipo Pagto.</th>
                <th className="px-6 py-4">Situação</th>
                <th className="px-6 py-4 text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-slate-600 divide-y divide-gray-100">
              {filteredOrders.length > 0 ? filteredOrders.slice(0, 20).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{o.date}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800 uppercase truncate block max-w-[200px]">
                      {o.address?.fullname || o.clientName || 'Cliente Itabuy'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">{o.paymentMethod || 'pix'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      o.status === 'Pedido entregue' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      (o.status === 'Pendente' || o.status === 'Aguardando Pagamento') ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-gray-100 text-slate-500 border border-gray-200'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 border-l border-gray-50 bg-gray-50/20">R$ {o.total?.toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-300 uppercase text-[10px] font-bold">Sem dados para exibir com estes filtros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string, value: string, color: string, icon: React.ReactNode }) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    slate: 'bg-gray-50 text-slate-600 border-gray-200',
  };

  return (
    <div className={`p-6 rounded border shadow-sm ${colors[color] || colors.slate} bg-white`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        <div className="p-2 bg-gray-50 rounded">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

// --- ORDERS VIEW ---

const STATUS_OPTIONS = [
  'Pendente',
  'Processamento',
  'Pedido sendo empacotado',
  'Pedido saindo para entrega',
  'Pedido entregue',
  'Cancelado'
];

function PedidosAdminView({ audioUnlocked }: { audioUnlocked: boolean }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [currentNewIdx, setCurrentNewIdx] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const voiceTriggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all: any[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(all);

      // Only Pending orders should show in alerts. 
      // For PIX, the server only sets 'Pendente' AFTER payment.
      const pending = all.filter(o => o.status === 'Pendente' && !o.isAdminSeen);
      
      if (!audioUnlocked) {
        setNewOrders(pending);
        return;
      }
      
      pending.forEach(order => {
        if (!voiceTriggeredRef.current.has(order.id)) {
          // Play notification only for new unseen Pendente orders
          const customAudio = localStorage.getItem('custom_notification_audio');
          
          const playOnNewOrder = (src: string) => {
            const media = new Audio(src);
            return media.play();
          };

          const playChain = async () => {
            try {
              if (customAudio) {
                await playOnNewOrder(customAudio);
              } else {
                throw new Error('no custom audio');
              }
            } catch {
              playOnNewOrder('/notification.mp4')
                .catch(() => playOnNewOrder('/notification.mp3'))
                .catch(() => playOnNewOrder('https://www.myinstants.com/media/sounds/whatsapp-notification-sound.mp3'));
            }
          };

          playChain();

          setTimeout(() => {
            const synth = window.speechSynthesis;
            const utter = new SpeechSynthesisUtterance('Novo pedido recebido');
            utter.lang = 'pt-BR';
            utter.rate = 1.0;
            utter.pitch = 1.1;
            utter.volume = 1.0; 
            synth.speak(utter);
            setTimeout(() => synth.speak(utter), 2000);
            setTimeout(() => synth.speak(utter), 4000);
          }, 1200);
          
          voiceTriggeredRef.current.add(order.id);
        }
      });
      
      setNewOrders(pending);
      if (pending.length === 0) setCurrentNewIdx(0);
    });
    return () => unsubscribe();
  }, [audioUnlocked]);

  const currentOrder = newOrders[currentNewIdx];
  const handleNext = () => setCurrentNewIdx((prev) => (prev + 1) % newOrders.length);
  const handlePrev = () => setCurrentNewIdx((prev) => (prev - 1 + newOrders.length) % newOrders.length);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearOrders = async () => {
    // We'll use a small internal state for double-click confirmation to avoid window.confirm issues in iframe
    if (!audioUnlocked) return; // safety check
    setIsClearing(true);
    try {
      const q = query(collection(db, 'orders'));
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.reduce((acc, d, i) => {
        // Firestore limits batch to 500
        const bIdx = Math.floor(i / 500);
        if (!acc[bIdx]) acc[bIdx] = [];
        acc[bIdx].push(d.id);
        return acc;
      }, [] as string[][]);

      for (const group of batch) {
        const pDeletions = group.map(id => deleteDoc(doc(db, 'orders', id)));
        await Promise.all(pDeletions);
      }
      
      voiceTriggeredRef.current = new Set();
      setNewOrders([]);
    } catch (err) {
      console.error("Error clearing orders:", err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleApproveFromAlert = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'Processamento', 
        isAdminSeen: true 
      });
    } catch (err) {
      console.error("Error approving order:", err);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'Pedido entregue') {
        updateData.finishedAt = Date.now();
      }
      await updateDoc(doc(db, 'orders', orderId), updateData);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const getClientName = (order: any) => {
    const addr = order.address;
    if (addr && typeof addr === 'object' && addr.fullname) return addr.fullname;
    if (order.clientName) return order.clientName;
    if (addr && typeof addr === 'string') {
      // Tentar extrair nome se estiver em formato fixo? Geralmente não está.
      return 'Cliente ItaBuy';
    }
    return 'Cliente ItaBuy';
  };

  const getStreetDisplay = (order: any) => {
    if (!order.address) return '--';
    if (typeof order.address === 'object') return order.address.street || '--';
    
    const addrStr = order.address as string;
    // Se for string, tenta pegar apenas a parte da rua
    const match = addrStr.match(/Rua:\s*(.*?)(?:,|\s*Nº:|$)/i);
    return match ? match[1].trim() : (addrStr.length > 20 ? addrStr.slice(0, 20) + '...' : addrStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pedido entregue': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Pendente': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Aguardando Pagamento': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Processamento': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'Pedido sendo empacotado': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Pedido saindo para entrega': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Cancelado': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto overflow-y-auto">
      <div className="flex flex-col gap-6">
        
        {/* Gestão de Pedidos Table */}
        <div className="bg-white border border-gray-200 shadow-sm rounded">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div className="w-1 h-4 bg-brand-blue rounded-full" />
              Monitor de Pedidos
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleClearOrders}
                disabled={isClearing || orders.length === 0}
                className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded border border-red-200/50 transition-all disabled:opacity-30"
              >
                {isClearing ? 'Limpando...' : 'Zerar Pedidos'}
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{orders.length} Pedidos Cadastrados</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f8f9fa]">
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Mercadoria</th>
                  <th className="px-6 py-4">Pagamento</th>
                  <th className="px-6 py-4 text-center">Data/Hora</th>
                  <th className="px-6 py-4 text-center">Situação</th>
                  <th className="px-6 py-4 text-center">Ficha</th>
                </tr>
              </thead>
              <tbody className="text-[12px] font-medium text-slate-600 divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">#{o.id ? o.id.slice(0, 8) : '---'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold uppercase">{getClientName(o)}</span>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">{getStreetDisplay(o)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 truncate max-w-[200px] text-slate-600">
                      {o.items?.[0]?.product?.name} {o.itemsCount > 1 ? `+${o.itemsCount - 1} pçs` : ''}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-500 text-[10px] px-2 py-1 bg-gray-100 rounded border border-gray-200">{o.paymentMethod || 'PIX'}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      <DeliveryTimer timestamp={o.timestamp} status={o.status} finishedAt={o.finishedAt} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block">
                        <select 
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className={`appearance-none px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all pr-8 ${getStatusColor(o.status)}`}
                        >
                          <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                           <ChevronDown size={12} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedOrder(o)}
                        className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded transition-all"
                        title="Ver Ficha Completa"
                      >
                        <ClipboardList size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas Novos - Classic Dashboard Panel Style */}
        {newOrders.length > 0 && (
          <div className="bg-white border border-gray-200 shadow-md rounded overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-amber-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="text-amber-600" size={16} />
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                  ALERTA DE NOVAS SOLICITAÇÕES EM ESPERA ({newOrders.length})
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <button onClick={handlePrev} className="p-1 hover:bg-amber-100 rounded text-amber-700">
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-[11px] font-bold text-amber-800 w-12 text-center">{currentNewIdx + 1} / {newOrders.length}</span>
                  <button onClick={handleNext} className="p-1 hover:bg-amber-100 rounded text-amber-700">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <button 
                  onClick={() => handleApproveFromAlert(currentOrder?.id)}
                  className="bg-emerald-600 text-white px-6 py-2 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 active:scale-95 shadow-sm"
                >
                  Confirmar Recebimento
                </button>
              </div>
            </div>

            <div className="p-6 bg-white flex items-center gap-8">
              <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded p-2 flex items-center justify-center">
                <img src={currentOrder?.items?.[0]?.product?.images?.[0]} className="w-full h-full object-contain" alt="" />
              </div>
              <div className="flex-1">
                <div className="mb-2">
                  <h4 className="text-slate-900 font-bold text-base uppercase leading-tight">{currentOrder?.items?.[0]?.product?.name}</h4>
                  <span className="text-[11px] font-mono text-slate-400">ID: #{currentOrder?.id}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">Cliente</span>
                    <span className="text-xs font-bold text-slate-800">{getClientName(currentOrder)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">Volume</span>
                    <span className="text-xs font-bold text-slate-800">{currentOrder?.itemsCount} Unidade(s)</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">Total</span>
                    <span className="text-xs font-bold text-emerald-600">R$ {currentOrder?.total?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">Hora</span>
                    <span className="text-xs font-bold text-slate-800">{currentOrder?.date?.split(',')[1]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsPopup 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            onStatusUpdate={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderDetailsPopup({ order, onClose, onStatusUpdate }: { order: any, onClose: () => void, onStatusUpdate: (id: string, s: string) => Promise<void> }) {
  const getAddrField = (field: string) => {
    if (!order.address) return '--';
    
    if (typeof order.address === 'string') {
      const addrStr = order.address;
      if (field === 'street') {
        const match = addrStr.match(/Rua:\s*(.*?)(?:,|\s*Nº:|$)/i);
        return match ? match[1].trim() : addrStr;
      }
      if (field === 'number') {
        const match = addrStr.match(/(?:Nº|Número):\s*(.*?)(?:,|\s*Bairro:|$)/i);
        return match ? match[1].trim() : '--';
      }
      if (field === 'neighborhood') {
        const match = addrStr.match(/Bairro:\s*(.*?)(?:,|\s*-?\s*Ref:|$)/i);
        return match ? match[1].trim() : '--';
      }
      if (field === 'reference') {
        const match = addrStr.match(/Ref:\s*(.*)/i);
        return match ? match[1].trim() : '--';
      }
      return '--';
    }

    return order.address[field] || '--';
  };

  const addressIsObject = typeof order.address === 'object' && order.address !== null;
  const currentClientName = (addressIsObject ? order.address.fullname : order.clientName) || 'Cliente ItaBuy';
  const currentClientEmail = (addressIsObject ? order.address.email : order.clientEmail) || 'E-mail não informado';

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-w-4xl w-full bg-white rounded shadow-2xl flex flex-col border border-gray-300 max-h-[90vh] overflow-hidden"
      >
        <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-slate-800 text-sm font-bold uppercase tracking-widest">
                FICHA DO PEDIDO <span className="text-brand-blue ml-2">#{order.id?.slice(0, 10)}</span>
              </h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="relative">
                <select 
                  value={order.status}
                  onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                  className="appearance-none bg-slate-800 text-white pl-4 pr-10 py-2 rounded text-[10px] font-bold uppercase tracking-widest outline-none border border-slate-700"
                >
                  <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-gray-200 rounded transition-all"><X size={20} /></button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <SectionHeader label="LOGÍSTICA / ENTREGA" />
              <div className="bg-gray-50/50 p-6 rounded border border-gray-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Rua / Avenida" value={getAddrField('street')} />
                  <DetailItem label="Nº" value={getAddrField('number')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Bairro" value={getAddrField('neighborhood')} />
                  <DetailItem label="Ponto de Referência" value={getAddrField('reference')} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader label="DADOS DO DESTINATÁRIO" />
              <div className="bg-gray-50/50 p-6 rounded border border-gray-200 space-y-4">
                <DetailItem label="Nome Completo" value={currentClientName} />
                <DetailItem label="E-mail de Contato" value={currentClientEmail} />
                <DetailItem label="Modalidade de Pagamento" value={order.paymentMethod || 'PIX'} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <SectionHeader label="RELAÇÃO DE ITENS E VALORES" />
             <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-gray-50">
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-gray-200">
                         <th className="px-6 py-3">Produto / Especificação</th>
                         <th className="px-6 py-3 text-center">Quantidade</th>
                         <th className="px-6 py-3 text-right">Preço Unitário</th>
                         <th className="px-6 py-3 text-right">Subtotal</th>
                      </tr>
                   </thead>
                   <tbody className="text-[11px] font-bold text-slate-700 divide-y divide-gray-100 uppercase">
                      {order.items?.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-slate-900">{item.product?.name}</span>
                               <span className="text-[9px] text-slate-400 font-mono mt-0.5">REF: {item.product?.id?.slice(0, 10)}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-center">{item.quantity} UN</td>
                           <td className="px-6 py-4 text-right text-slate-400">R$ {item.product?.price?.toFixed(2)}</td>
                           <td className="px-6 py-4 text-right font-bold text-slate-900">R$ {(item.quantity * (item.product?.price || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                   </tbody>
                   <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                      <tr>
                         <td colSpan={3} className="px-6 py-4 text-[11px] text-slate-500 text-right uppercase tracking-wider">Valor Total do Pedido</td>
                         <td className="px-6 py-4 text-right text-lg text-emerald-600 font-mono">R$ {order.total?.toFixed(2)}</td>
                      </tr>
                   </tfoot>
                </table>
             </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-slate-900 rounded text-white shadow-inner">
             <div className="flex items-center gap-6">
                <div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Status atual</span>
                   <span className="text-xs font-bold uppercase tracking-widest">{order.status}</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Data da Efetivação</span>
                   <span className="text-xs font-bold font-mono">{order.date}</span>
                </div>
             </div>
             <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Duração</span>
                <div className="text-sm font-bold text-slate-500 uppercase">
                   <DeliveryTimer timestamp={order.timestamp} status={order.status} finishedAt={order.finishedAt} />
                </div>
             </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
           <div className="flex gap-4">
              <button 
                onClick={() => window.print()} 
                className="bg-white text-slate-600 border border-gray-300 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-100 transition-all"
              >
                <Printer size={16} /> Imprimir Guia
              </button>
           </div>
           <button 
             onClick={onClose} 
             className="bg-slate-800 text-white px-8 py-2 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 active:scale-95 transition-all"
           >
             Fechar Guia
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-4 w-0.5 bg-brand-blue rounded-full" />
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</h4>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em] block">{label}</span>
      <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight block truncate">{value || '--'}</span>
    </div>
  );
}

function DeliveryTimer({ timestamp, status, finishedAt }: { timestamp?: number, status: string, finishedAt?: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status === 'Pedido entregue' || !timestamp) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status, timestamp]);

  if (!timestamp) return <span>--:--</span>;

  const endTime = (status === 'Pedido entregue' || status === 'Entregue') ? (finishedAt || now) : now;
  const elapsed = Math.max(0, endTime - timestamp);
  
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  return (
    <span className={(status === 'Pedido entregue' || status === 'Entregue') ? 'text-slate-400 font-mono' : 'text-emerald-500 font-mono animate-pulse'}>
      {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </span>
  );
}

function PopupField({ label, value, children, showCopy, onClick }: { label: string, value?: string, children?: React.ReactNode, showCopy?: boolean, onClick?: () => void }) {
  return (
    <div className="bg-slate-50 p-6 rounded-xl relative group border border-slate-100">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
      <div className="text-slate-900 font-bold tracking-tight text-sm uppercase">
        {children || value}
      </div>
      {showCopy && (
        <button 
          onClick={onClick}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100"
        >
          <Copy size={16} />
        </button>
      )}
    </div>
  );
}

// --- CANCELAMENTOS MANAGEMENT VIEW ---
function CancelamentosAdminView() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<'Pendentes' | 'Aprovados' | 'Todos'>('Pendentes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen in real-time to the cancellations collection
    const q = query(collection(db, 'cancellations'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(docsData);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (req: any) => {
    if (!window.confirm(`Deseja aprovar o cancelamento do pedido #${req.orderId}? Isso mudará o status final do pedido para 'Cancelado'.`)) {
      return;
    }

    try {
      // 1. Update in cancellations collection
      await updateDoc(doc(db, 'cancellations', req.id), {
        status: 'Aprovado',
        approvedAt: Date.now()
      });

      // 2. Update order status to 'Cancelado'
      await updateDoc(doc(db, 'orders', req.orderId), {
        status: 'Cancelado',
        cancellationStatus: 'Aprovado'
      });

      window.alert(`Cancelamento do pedido #${req.orderId} aprovado e status do pedido atualizado para 'Cancelado'.`);
    } catch (err: any) {
      console.error(err);
      window.alert('Erro ao aprovar cancelamento: ' + err.message);
    }
  };

  const handleReject = async (req: any) => {
    if (!window.confirm(`Deseja REJEITAR a solicitação de cancelamento para o pedido #${req.orderId}?`)) {
      return;
    }

    try {
      // 1. Update status in cancellations
      await updateDoc(doc(db, 'cancellations', req.id), {
        status: 'Rejeitado',
        rejectedAt: Date.now()
      });

      // 2. Revert order status flag
      await updateDoc(doc(db, 'orders', req.orderId), {
        cancellationRequested: false,
        cancellationStatus: 'Rejeitado'
      });

      window.alert(`Solicitação #${req.orderId} rejeitada com sucesso.`);
    } catch (err: any) {
      console.error(err);
      window.alert('Erro ao rejeitar: ' + err.message);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'Pendentes') return r.status === 'Pendente';
    if (filter === 'Aprovados') return r.status === 'Aprovado';
    return true; // Todos
  });

  const totals = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pendente').length,
    approved: requests.filter(r => r.status === 'Aprovado').length
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-950 uppercase tracking-widest">Controle de Cancelamentos & Estornos</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Veja solicitações enviadas por compradores (PIX, Dinheiro, Cartão)</p>
        </div>
        <button 
          onClick={() => { setLoading(true); }}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition text-slate-600 hover:text-slate-900"
          title="Recarregar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Período</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{totals.total}</h3>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">⏳ Aguardando Estorno (Pendentes)</span>
          <h3 className="text-2xl font-black text-amber-750 mt-1">{totals.pending}</h3>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">✅ Estornos Processados (Aprovados)</span>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{totals.approved}</h3>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['Pendentes', 'Aprovados', 'Todos'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              filter === tab 
                ? 'bg-[#2c3e50] text-white shadow-sm' 
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Request Lists */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest animate-pulse font-sans">Carregando solicitações...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-150 shadow-xs p-12 text-center text-slate-400 font-bold font-sans uppercase">
          🚨 Nenhuma solicitação encontrada para o filtro selecionado.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div 
              key={req.id} 
              className={`bg-white rounded-2xl border p-5 shadow-xs transition hover:shadow-md ${
                req.status === 'Pendente' ? 'border-amber-250 border-l-4 border-l-amber-500' : 'border-slate-200 border-l-4 border-l-emerald-500'
              }`}
            >
              <div className="flex justify-between items-start gap-4 font-sans">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-mono">Pedido #{req.orderId}</span>
                    <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${
                      req.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {req.status}
                    </span>
                    <span className="text-[10.5px] font-bold text-slate-400">{req.date}</span>
                  </div>

                  <div className="text-xs leading-relaxed space-y-0.5 text-slate-650 font-semibold font-sans">
                    <p>🧔 <strong>Comprador:</strong> {req.userName} ({req.userEmail})</p>
                    <p>💵 <strong>Valor:</strong> R$ {parseFloat(req.total || '0').toFixed(2)}</p>
                    <p>💳 <strong>Forma de Pagamento:</strong> <span className="bg-rose-50 border border-rose-200 text-rose-750 px-2 py-0.5 text-[9.5px] rounded-sm font-black uppercase">{String(req.paymentMethod).toUpperCase()}</span></p>
                    {req.items && req.items.length > 0 && (
                      <p className="mt-1 text-[11px] text-slate-500 leading-normal block">
                        🛍️ <strong>Produtos:</strong>{' '}
                        {req.items.map((it: any) => `${it.product?.name || 'Item'} (x${it.quantity})`).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {req.status === 'Pendente' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(req)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-bold transition active:scale-95 uppercase tracking-wide cursor-pointer"
                    >
                      Aprovar & Estornar
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10.5px] font-bold transition active:scale-95 uppercase tracking-wide cursor-pointer"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- PRODUCTS AND COUPONS PANELS ---

function ProductsAdminTab() {
  const [tab, setTab] = useState<'list' | 'create'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [pixPrice, setPixPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [salesCount, setSalesCount] = useState('15');
  const [imageUrlStr, setImageUrlStr] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Live Firestore products snapshot
    const q = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(q, (snap) => {
      const prods: Product[] = [];
      snap.forEach(docSnap => {
        prods.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(prods);
      setLoading(false);
    });

    // Categories
    const unsubCategories = onSnapshot(doc(db, 'settings', 'elementor'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().categories) {
        setCategories(docSnap.data().categories);
      } else {
        setCategories([
          { id: 'celulares', name: 'Celulares' },
          { id: 'eletronicos', name: 'Eletrônicos' },
          { id: 'moda', name: 'Moda' },
          { id: 'beleza', name: 'Beleza' },
          { id: 'calcados', name: 'Calçados' },
          { id: 'casa', name: 'Casa' },
          { id: 'esportes', name: 'Esportes' },
          { id: 'brinquedos', name: 'Brinquedos' },
        ]);
      }
    });

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setName(product.name || '');
    setDescription(product.description || '');
    setCategory(product.category || '');
    setPrice(product.price ? String(product.price) : '');
    setOriginalPrice(product.originalPrice ? String(product.originalPrice) : '');
    setPixPrice(product.pixPrice ? String(product.pixPrice) : '');
    setStock(product.stock !== undefined ? String(product.stock) : '10');
    setSalesCount(product.salesCount !== undefined ? String(product.salesCount) : '15');
    setImageUrlStr(product.images ? product.images.join('\n') : '');
    
    // Parse options back to text
    let optsStr = '';
    if (product.availableOptions) {
      optsStr = product.availableOptions
        .map(opt => `${opt.name}: ${opt.values.map(v => v.label).join(', ')}`)
        .join('\n');
    }
    setOptionsText(optsStr);
    
    setTab('create');
  };

  const handleResetForm = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategory('');
    setPrice('');
    setOriginalPrice('');
    setPixPrice('');
    setStock('10');
    setSalesCount('15');
    setImageUrlStr('');
    setOptionsText('');
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      alert('Por favor, preencha Título e Preço!');
      return;
    }

    // Parse images array
    const images = imageUrlStr.split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80'); // nice watch default placeholder
    }

    // Parse options array
    const availableOptions = optionsText.split('\n')
      .map(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const optName = parts[0].trim();
          const labels = parts.slice(1).join(':').split(',')
            .map(v => v.trim())
            .filter(v => v.length > 0);
          if (optName && labels.length > 0) {
            return {
              name: optName,
              values: labels.map(lbl => ({ label: lbl, stock: 99 }))
            };
          }
        }
        return null;
      })
      .filter((opt): opt is NonNullable<typeof opt> => opt !== null);

    const priceNum = parseFloat(price) || 0;
    const origPriceNum = originalPrice ? parseFloat(originalPrice) : undefined;
    const pixPriceNum = pixPrice ? parseFloat(pixPrice) : Math.round(priceNum * 0.95);

    const discountPercentage = origPriceNum && origPriceNum > priceNum
      ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100)
      : undefined;

    const productPayload: Omit<Product, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      category: category || (categories[0]?.id || 'celulares'),
      price: priceNum,
      originalPrice: origPriceNum,
      pixPrice: pixPriceNum,
      stock: parseInt(stock) || 0,
      salesCount: parseInt(salesCount) || 0,
      images,
      specs: editingProduct?.specs || {},
      availableOptions,
      freeShipping: true,
      rating: editingProduct?.rating || 4.8,
      location: editingProduct?.location || 'Itacoatiara - AM',
      storeName: editingProduct?.storeName || 'ItaBuy Oficial',
      storeRating: editingProduct?.storeRating || 4.9,
      storeProductsCount: editingProduct?.storeProductsCount || 120
    };

    try {
      if (editingProduct) {
        await setDoc(doc(db, 'products', editingProduct.id), productPayload, { merge: true });
        alert('Produto atualizado com sucesso!');
      } else {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, productPayload);
        alert('Produto cadastrado com sucesso!');
      }
      handleResetForm();
      setTab('list');
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Erro ao salvar no Firestore.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Catálogo de Produtos</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight font-sans">Cadastre e gerencie os itens visíveis na sua loja</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-none border border-slate-205">
          <button 
            onClick={() => { setTab('list'); handleResetForm(); }}
            className={`px-4 py-1.5 text-[10.5px] font-black uppercase tracking-wider transition-colors rounded-none ${tab === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-950'}`}
          >
            Lista de Produtos
          </button>
          <button 
            type="button"
            onClick={() => setTab('create')}
            className={`px-4 py-1.5 text-[10.5px] font-black uppercase tracking-wider transition-colors rounded-none ${tab === 'create' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-950'}`}
          >
            {editingProduct ? 'Editar Produto' : 'Criar Novo'}
          </button>
        </div>
      </div>

      {tab === 'list' ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-none overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-205 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Produtos Cadastrados ({filteredProducts.length})</span>
            <input 
              type="text"
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-205 py-1.5 px-3 text-xs font-semibold outline-none focus:border-slate-955 rounded-none w-full sm:w-64 placeholder-slate-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-wider">
                  <th className="p-3">Imagem</th>
                  <th className="p-3">Título / Detalhes</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Preço Normal</th>
                  <th className="p-3">Preço Pix</th>
                  <th className="p-3">Estoque</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                {filteredProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <img src={prod.images?.[0] || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=80'} alt={prod.name} className="w-10 h-10 object-contain bg-slate-55 border border-slate-150" />
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-905 block line-clamp-1 max-w-xs">{prod.name}</span>
                      <span className="text-[10px] text-slate-400 block line-clamp-1 max-w-xs font-sans mt-0.5">{prod.description || 'Sem descrição'}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] bg-slate-105 border border-slate-210 text-slate-700 px-2 py-0.5 uppercase tracking-wider font-semibold rounded-none">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-905">
                      R$ {prod.price ? prod.price.toFixed(2) : '0,00'}
                      {prod.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through block font-normal">
                          R$ {prod.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      R$ {prod.pixPrice ? prod.pixPrice.toFixed(2) : (prod.price * 0.95).toFixed(2)}
                    </td>
                    <td className="p-3">
                      {prod.stock <= 2 ? (
                        <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 font-bold uppercase rounded-none">
                          Urgente: {prod.stock} un
                        </span>
                      ) : (
                        <span className="text-slate-805 font-bold">{prod.stock} un</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(prod)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-none uppercase tracking-widest transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                        
                        {confirmDeleteId === prod.id ? (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="bg-red-650 hover:bg-red-700 text-white font-black text-[10px] px-2 py-1.5 rounded-none uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              Sim
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] px-2 py-1.5 rounded-none uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmDeleteId(prod.id)}
                            className="bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-700 font-bold text-[10px] px-2.5 py-1.5 rounded-none uppercase tracking-widest transition-colors border border-red-200 cursor-pointer"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                      {loading ? 'Carregando lista de produtos...' : 'Nenhum produto correspondente encontrado.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveProduct} className="bg-white border border-slate-200 shadow-sm p-6 space-y-5 rounded-none">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
              {editingProduct ? 'Editar Informações do Produto' : 'Cadastrar Novo Item no Catálogo'}
            </h3>
            {editingProduct && (
              <button 
                type="button"
                onClick={handleResetForm}
                className="text-[10px] font-black text-red-600 hover:underline cursor-pointer uppercase transition"
              >
                Cancelar Edição / Limpar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Título do Produto *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                  className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 rounded-none placeholder-slate-350"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Descrição</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Produto lacrado com garantia de 1 ano..."
                  className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-900 font-medium outline-none focus:border-slate-900 rounded-none placeholder-slate-350 resize-y"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoria *</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 rounded-none"
                >
                  <option value="">Selecione uma...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estoque (unidades) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 rounded-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contador de Vendas</label>
                  <input 
                    type="number" 
                    min="0"
                    value={salesCount}
                    onChange={e => setSalesCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 rounded-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Preço Normal (R$) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0.1"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="Ex: 1499.90"
                    className="w-full bg-slate-50 border border-slate-205 py-2 px-2 text-xs text-slate-905 font-bold outline-none focus:border-slate-900 rounded-none placeholder-slate-350"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Preço Riscado (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                    placeholder="Ex: 1799.00"
                    className="w-full bg-slate-50 border border-slate-205 py-2 px-2 text-xs text-slate-900 font-medium outline-none focus:border-slate-900 rounded-none placeholder-slate-350"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Preço no Pix (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={pixPrice}
                    onChange={e => setPixPrice(e.target.value)}
                    placeholder="Desconto auto: 5%"
                    className="w-full bg-slate-50 border border-slate-205 py-2 px-2 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 rounded-none placeholder-slate-350"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Imagens (URLs de Imagens - Uma por Linha) *</label>
                <textarea 
                  rows={3}
                  value={imageUrlStr}
                  onChange={e => setImageUrlStr(e.target.value)}
                  placeholder="https://exemplo.com/img1.jpg&#10;https://exemplo.com/img2.jpg"
                  className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-900 font-mono outline-none focus:border-slate-900 rounded-none placeholder-slate-350 resize-y"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Opções de Variação (Ex: Cor: Vermelho, Preto, Branco - uma por linha)</label>
                <textarea 
                  rows={2}
                  value={optionsText}
                  onChange={e => setOptionsText(e.target.value)}
                  placeholder="Tamanho: P, M, G, GG&#10;Voltagem: Bivolt, 110V, 220V"
                  className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-900 font-medium outline-none focus:border-slate-900 rounded-none placeholder-slate-350 resize-y"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 font-sans">
            <button 
              type="button" 
              onClick={() => { setTab('list'); handleResetForm(); }}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-none uppercase tracking-widest transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-black rounded-none uppercase tracking-widest transition-colors cursor-pointer"
            >
              {editingProduct ? 'Salvar Alterações' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function CouponsAdminView() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Coupon parameters
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('');
  const [type, setType] = useState<'fixed' | 'percentage'>('fixed');
  const [minSpent, setMinSpent] = useState('');
  const [expiry, setExpiry] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'coupons'));
    const unsub = onSnapshot(q, (snap) => {
      const coupList: Coupon[] = [];
      snap.forEach(docSnap => {
        coupList.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
      });
      setCoupons(coupList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discount) return;

    const computedCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const discountNum = parseFloat(discount) || 0;
    const minSpentNum = parseFloat(minSpent) || 0;

    // Use 30 days expiry as standard if blank
    const expiryStr = expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

    const couponPayload: Omit<Coupon, 'id'> = {
      code: computedCode,
      title: title.trim() || `${type === 'percentage' ? `${discountNum}%` : `R$ ${discountNum}`} de Desconto`,
      discount: discountNum,
      type,
      minSpent: minSpentNum,
      expiry: expiryStr
    };

    try {
      await setDoc(doc(db, 'coupons', computedCode), couponPayload);
      alert('Cupom cadastrado com sucesso!');
      
      setCode('');
      setTitle('');
      setDiscount('');
      setType('fixed');
      setMinSpent('');
      setExpiry('');
    } catch (err) {
      console.error('Error creating coupon:', err);
      alert('Erro ao cadastrar cupom no Firebase.');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Error deleting coupon:', err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Carregando cupons...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Gerenciamento de Cupons</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight font-sans">Crie novos cupons de desconto ativos para a sua loja</p>
        </div>
        <span className="text-[10px] bg-slate-950 text-white px-3 py-1.5 font-black rounded-none uppercase tracking-widest">
          {coupons.length} Cupons Ativos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm h-fit space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Novo Cupom</h3>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Código do Cupom *</label>
              <input 
                type="text" 
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Ex: CUPOM10, ITAOFF"
                className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-855 font-black outline-none focus:border-slate-900 rounded-none placeholder-slate-350"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Título / Alerta de Uso</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: R$ 10 de desconto acima de R$ 100"
                className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-800 font-semibold outline-none focus:border-slate-900 rounded-none placeholder-slate-350"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-800 font-bold outline-none focus:border-slate-900 rounded-none"
                >
                  <option value="fixed">Fixo (R$)</option>
                  <option value="percentage">Percentual (%)</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dcto / Desconto *</label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="0.1"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  placeholder="Ex: 10 ou 15"
                  className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 rounded-none placeholder-slate-350"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mínimo Gasto (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={minSpent}
                  onChange={e => setMinSpent(e.target.value)}
                  placeholder="Ex: 50.00"
                  className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-800 font-bold outline-none focus:border-slate-900 rounded-none placeholder-slate-355"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expiração</label>
                <input 
                  type="text" 
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  placeholder="Ex: 15/10/2026"
                  className="w-full bg-slate-50 border border-slate-205 py-2 px-3 text-xs text-slate-800 font-semibold outline-none focus:border-slate-900 rounded-none placeholder-slate-355"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-black rounded-none transition-colors uppercase tracking-widest"
            >
              Criar Cupom
            </button>
          </form>
        </div>

        {/* List view */}
        <div className="md:col-span-2 bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-205">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Cupons Cadastrados</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
            {coupons.map((coup, idx) => (
              <div key={coup.code || idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-sky-50 text-sky-700 px-3 py-1.5 border border-sky-100 font-black text-xs rounded-none font-mono">
                    🎫 {coup.code}
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">{coup.title}</span>
                    <span className="text-[9px] text-slate-405 font-bold block uppercase mt-0.5">
                      Desconto: {coup.type === 'percentage' ? `${coup.discount}%` : `R$ ${coup.discount.toFixed(2)}`} | Mínimo: R$ {coup.minSpent ? coup.minSpent.toFixed(2) : '0,00'} | Expira: {coup.expiry}
                    </span>
                  </div>
                </div>

                {confirmDeleteId === coup.id ? (
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleDeleteCoupon(coup.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] px-2.5 py-1.5 rounded-none uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Sim
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(null)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-805 font-bold text-[10px] px-2.5 py-1.5 rounded-none uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmDeleteId(coup.id)}
                    className="bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-755 font-bold text-[10px] px-3 py-1.5 rounded-none uppercase tracking-widest transition-colors border border-red-200 cursor-pointer"
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))}
            {coupons.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum cupom cadastrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
