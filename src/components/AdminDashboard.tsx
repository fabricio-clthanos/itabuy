import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, onSnapshot, query, updateDoc, doc, orderBy, deleteDoc, getDocs 
} from 'firebase/firestore';
import { 
  Package, Ticket, LogOut, ClipboardList, Bell, X, 
  ChevronLeft, ChevronRight, ChevronDown,
  Copy, Printer, CheckCircle2, LayoutDashboard, 
  ImageIcon, Settings, Upload, Music,
  MapPin, CreditCard, User, Clock, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- MAIN ADMIN DASHBOARD ---

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pedidos' | 'products' | 'banners' | 'coupons' | 'settings'>('dashboard');
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const unlockAudio = () => {
    // Play a silent sound to unlock audio context/playback
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhAAQACABAAAABkYXRhAgAAAAEA');
    audio.play().then(() => {
      setAudioUnlocked(true);
    }).catch(err => {
      console.log('Error unlocking audio:', err);
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
      <aside className="w-64 bg-[#2c3e50] flex flex-col shrink-0 relative z-20 border-r border-slate-700 shadow-lg">
        <div className="p-6 border-b border-black/20 bg-[#1a252f]">
          <h2 className="text-2xl font-black text-white tracking-tighter">
            ITABUY
          </h2>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <SidebarButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={18} />} 
            label="Visão Geral" 
          />
          <SidebarButton 
            active={activeTab === 'pedidos'} 
            onClick={() => setActiveTab('pedidos')} 
            icon={<ClipboardList size={18} />} 
            label="Gestão de Pedidos" 
          />
          
          <div className="mt-6 mb-2 px-6">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Catálogo</span>
          </div>
          <SidebarButton 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
            icon={<Package size={18} />} 
            label="Produtos" 
          />
          <SidebarButton 
            active={activeTab === 'banners'} 
            onClick={() => setActiveTab('banners')} 
            icon={<ImageIcon size={18} />} 
            label="Marketing" 
          />
          <SidebarButton 
            active={activeTab === 'coupons'} 
            onClick={() => setActiveTab('coupons')} 
            icon={<Ticket size={18} />} 
            label="Cupons" 
          />

          <div className="mt-6 mb-2 px-6">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configurações</span>
          </div>
          <SidebarButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings size={18} />} 
            label="Sistema" 
          />
        </nav>

        <div className="p-4 border-t border-white/5 bg-[#1a252f] space-y-2">
          <button 
            onClick={playTestSound}
            className="w-full text-slate-300 p-2.5 rounded hover:bg-white/5 hover:text-white transition-all flex items-center gap-3 text-xs font-medium"
          >
            <Bell size={14} className="text-amber-500" /> Testar Alerta
          </button>
          <button 
            onClick={onLogout} 
            className="w-full text-red-400 p-2.5 rounded hover:bg-red-500/10 hover:text-red-300 transition-all flex items-center gap-3 text-xs font-medium"
          >
            <LogOut size={14} /> Sair do Painel
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
            {activeTab === 'products' && <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Gerenciamento de Produtos em breve</div>}
            {activeTab === 'coupons' && <div className="p-12 text-center text-slate-400 bg-white rounded shadow-sm border border-slate-200 m-8">Gerenciamento de Cupons em breve</div>}
            {activeTab === 'banners' && <div className="p-12 text-center text-slate-400 bg-white rounded shadow-sm border border-slate-200 m-8">Gerenciamento de Banners em breve</div>}
            {activeTab === 'settings' && <SettingsAdminView onBack={() => setActiveTab('dashboard')} onTestSound={playTestSound} />}
          </div>
        </div>
      </main>
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

function SidebarButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-semibold tracking-wide transition-all border-l-4 ${
        active 
          ? 'bg-[#1a252f] text-brand-blue border-brand-blue' 
          : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <span className={active ? 'text-brand-blue' : 'text-slate-500'}>{icon}</span> {label}
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

// --- PLACEHOLDER COMPONENTS ---
function ProductsAdminTab() {
  return <div className="p-12 text-center text-slate-400">Gerenciamento de Produtos em breve</div>;
}

function ProductList() { return null; }
function ProductAddForm() { return null; }
