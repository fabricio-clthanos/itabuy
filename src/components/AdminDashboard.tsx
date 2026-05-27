import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, onSnapshot, query, updateDoc, doc, orderBy 
} from 'firebase/firestore';
import { 
  Package, Ticket, LogOut, ClipboardList, Bell, X, 
  ChevronLeft, ChevronRight, 
  Copy, Printer, CheckCircle2, LayoutDashboard, 
  ImageIcon, Settings, Upload, Music,
  MapPin, CreditCard, User
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
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar - Refined Style */}
      <aside className="w-56 bg-slate-900 flex flex-col shrink-0 relative z-20 shadow-xl border-r border-slate-800">
        <div className="p-6 mb-2">
          <h2 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            ITA Admin
          </h2>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <SidebarButton 
            active={activeTab === 'dashboard' || activeTab === 'pedidos'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
          />
          <SidebarButton 
            active={activeTab === 'pedidos'} 
            onClick={() => setActiveTab('pedidos')} 
            icon={<ClipboardList size={18} />} 
            label="Pedidos" 
          />
          <div className="pt-4 pb-1 border-t border-slate-800 my-4">
             <span className="px-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Catálogo</span>
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
            label="Banners" 
          />
          <SidebarButton 
            active={activeTab === 'coupons'} 
            onClick={() => setActiveTab('coupons')} 
            icon={<Ticket size={18} />} 
            label="Cupons" 
          />
          <div className="pt-4 pb-1 border-t border-slate-800 my-4">
             <span className="px-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sistema</span>
          </div>
          <SidebarButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings size={18} />} 
            label="Configurações" 
          />
        </nav>

        <div className="p-3 space-y-2">
          <button 
            onClick={playTestSound}
            className="w-full bg-slate-800 text-slate-300 p-2.5 rounded-lg font-bold uppercase text-[9px] tracking-widest hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Bell size={14} className="text-emerald-500" /> Testar Som
          </button>
          <button 
            onClick={onLogout} 
            className="w-full bg-red-500/10 text-red-400 p-2.5 rounded-lg font-bold uppercase text-[9px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {!audioUnlocked && (
          <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
             <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl border border-slate-200">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-8 shadow-sm">
                   <Bell size={40} className="animate-bounce" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4">Ativar Notificações</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-loose mb-10">
                  Para que o sistema possa avisar você sobre novos pedidos com som e voz, o navegador exige uma interação inicial.
                </p>
                <button 
                  onClick={unlockAudio}
                  className="w-full py-5 bg-emerald-500 text-white font-black uppercase text-sm tracking-[0.3em] rounded-2xl hover:bg-emerald-400 transition-all shadow-xl active:scale-95 shadow-emerald-500/20"
                >
                  Entrar no Painel
                </button>
             </div>
          </div>
        )}
        <div className="p-6 h-full">
          {(activeTab === 'dashboard' || activeTab === 'pedidos') && <PedidosAdminView audioUnlocked={audioUnlocked} />}
          {activeTab === 'products' && <div className="p-12 text-center text-slate-400">Gerenciamento de Produtos em breve</div>}
          {activeTab === 'coupons' && <div className="p-12 text-center text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-200">Gerenciamento de Cupons em breve</div>}
          {activeTab === 'banners' && <div className="p-12 text-center text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-200">Gerenciamento de Banners em breve</div>}
          {activeTab === 'settings' && <SettingsAdminView onBack={() => setActiveTab('dashboard')} onTestSound={playTestSound} />}
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
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
        active 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }`}
    >
      {icon} {label}
    </button>
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
    if (order.address?.fullname) return order.address.fullname;
    if (order.clientName) return order.clientName;
    return 'Cliente';
  };

  const getStreetDisplay = (order: any) => {
    if (typeof order.address === 'string') {
      // If it's the full string, return it but truncated
      return order.address.replace(/^Rua:\s*/i, '');
    }
    return order.address?.street || '--';
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col gap-6">
        {/* Gestão de Pedidos (Top) */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
          <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={18} className="text-emerald-500" />
              Gestão de Pedidos
            </h3>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-700">
                 {orders.length} pedidos no total
               </span>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-6 py-5">Código</th>
                  <th className="px-6 py-5">Cliente</th>
                  <th className="px-6 py-5">Itens</th>
                  <th className="px-6 py-5">Forma</th>
                  <th className="px-6 py-5 text-center">Tempo de Entrega</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-bold text-slate-700 divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 font-mono text-slate-400">#{o.id}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-slate-900 uppercase">{getClientName(o)}</span>
                        <span className="text-[9px] text-slate-400 font-medium tracking-tight truncate max-w-[150px]">{getStreetDisplay(o)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 truncate max-w-[200px] uppercase text-slate-500">
                      {o.items?.[0]?.product?.name} {o.itemsCount > 1 ? `+${o.itemsCount - 1} itens` : ''}
                    </td>
                    <td className="px-6 py-5">
                      <span className="uppercase font-black text-sky-600 px-2 py-1 bg-sky-50 rounded-lg border border-sky-100">{o.paymentMethod || 'PIX'}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <DeliveryTimer timestamp={o.timestamp} status={o.status} finishedAt={o.finishedAt} />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="relative inline-block">
                        <select 
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className={`appearance-none px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border cursor-pointer transition-all pr-8 ${
                            o.status === 'Pedido entregue' ? 'bg-slate-50 text-slate-400 border-slate-200' : 
                            o.status === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            o.status === 'Processamento' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            o.status === 'Pedido sendo empacotado' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                           <ChevronRight size={10} className="rotate-90" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button 
                        onClick={() => setSelectedOrder(o)}
                        className="bg-slate-900 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition-all active:scale-95 shadow-sm group-hover:shadow-md"
                      >
                        ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas Novos (Carousel) */}
        <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -z-10" />
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3">
              <Bell className="animate-bounce" size={18} />
              Alertas de Novos Pedidos ({newOrders.length})
            </h3>
          </div>
          
          <div className="flex flex-col items-center">
            {newOrders.length > 0 && currentOrder ? (
              <div className="container max-w-2xl w-full">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-inner relative">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-slate-800 rounded-2xl overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center p-2">
                       <img src={currentOrder.items?.[0]?.product?.images?.[0]} className="w-full h-full object-contain opacity-80" alt="" />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">
                          #{currentOrder.id}
                        </span>
                        <span className="text-white font-black text-lg uppercase tracking-tight line-clamp-1">
                          {currentOrder.items?.[0]?.product?.name}
                        </span>
                      </div>
                      
                      <p className="text-slate-400 text-xs font-bold leading-relaxed">
                        Pedido de <strong>{getClientName(currentOrder)}</strong> contendo {currentOrder.itemsCount} itens no total de R$ {currentOrder.total?.toFixed(2)}.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <button onClick={handlePrev} className="w-12 h-12 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full flex items-center justify-center transition-all">
                        <ChevronLeft size={24} />
                      </button>
                      <span className="text-xs font-black text-slate-600 tracking-widest">{currentNewIdx + 1} / {newOrders.length}</span>
                      <button onClick={handleNext} className="w-12 h-12 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full flex items-center justify-center transition-all">
                        <ChevronRight size={24} />
                      </button>
                    </div>

                    <button 
                      onClick={() => handleApproveFromAlert(currentOrder.id)}
                      className="flex-1 py-4 bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-xl active:scale-95 shadow-emerald-500/20 flex items-center justify-center gap-3"
                    >
                      Enviar para Gestão <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <CheckCircle2 size={32} className="text-emerald-500/20 mx-auto mb-6" />
                <h4 className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Sem Alertas Pendentes</h4>
              </div>
            )}
          </div>
        </div>
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

function NewOrderPopup() { return null; }

function OrderDetailsPopup({ order, onClose, onStatusUpdate }: { order: any, onClose: () => void, onStatusUpdate: (id: string, s: string) => Promise<void> }) {
  const getAddrField = (field: string) => {
    if (!order.address) return '--';
    
    if (typeof order.address === 'string') {
      const addrStr = order.address;
      // Tentativa de parsear a string caso ela esteja no formato legível
      if (field === 'street') {
        const match = addrStr.match(/Rua:\s*([^,]+)/i);
        return match ? match[1].trim() : addrStr;
      }
      if (field === 'number') {
        const match = addrStr.match(/Nº:\s*([^,]+)/i);
        return match ? match[1].trim() : '--';
      }
      if (field === 'neighborhood') {
        const match = addrStr.match(/Bairro:\s*([^-]+)/i);
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

  const currentClientName = order.address?.fullname || order.clientName || 'Cliente ItaBuy';
  const currentClientEmail = order.address?.email || order.clientEmail || 'E-mail não informado';

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center p-4 backdrop-blur-xl overflow-hidden">
      <motion.div 
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        className="max-w-[750px] w-full bg-slate-50 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col border border-white/50 max-h-[94vh] overflow-hidden"
      >
        <div className="p-10 pb-6 border-b border-slate-200 bg-white flex items-center justify-between">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <ClipboardList size={28} />
              </div>
              <div>
                <h2 className="text-slate-900 text-xl font-black uppercase tracking-widest mb-2">Detalhes do Pedido</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">#{order.id}</span>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <select 
                value={order.status}
                onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none border-0 ring-0"
              >
                <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={onClose} className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center"><X size={24} /></button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <HeaderLabel icon={<MapPin size={16} />} label="Logística de Entrega" />
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label="Rua" value={getAddrField('street')} />
                  <DetailItem label="Número" value={getAddrField('number')} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label="Bairro" value={getAddrField('neighborhood')} />
                  <DetailItem label="Referência" value={getAddrField('reference')} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <HeaderLabel icon={<User size={16} />} label="Informações do Cliente" />
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 space-y-6">
                <DetailItem label="Nome Completo" value={currentClientName} />
                <DetailItem label="E-mail de Contato" value={currentClientEmail} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <HeaderLabel icon={<CreditCard size={16} />} label="Resumo Financeiro" />
             <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden">
                <div className="grid grid-cols-2 gap-6 relative">
                  <DetailItem label="Método de Pagto" value={order.paymentMethod} light />
                  <DetailItem label="Total" value={`R$ ${order.total?.toFixed(2)}`} light />
                </div>
                <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                   <div className="text-xl font-black text-emerald-400">
                      <DeliveryTimer timestamp={order.timestamp} status={order.status} finishedAt={order.finishedAt} />
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-bold text-white font-mono">{order.date}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <HeaderLabel icon={<Package size={16} />} label="Itens" />
             <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <th className="px-10 py-6">Produto</th>
                         <th className="px-10 py-6 text-center">Quant.</th>
                         <th className="px-10 py-6 text-right">Valor</th>
                      </tr>
                   </thead>
                   <tbody className="text-xs font-black text-slate-700 divide-y divide-slate-50 uppercase">
                      {order.items?.map((item: any, i: number) => (
                        <tr key={i}>
                           <td className="px-10 py-6 truncate max-w-[280px]">{item.product?.name}</td>
                           <td className="px-10 py-6 text-center">{item.quantity}x</td>
                           <td className="px-10 py-6 text-right font-mono">R$ {item.product?.price?.toFixed(2)}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="p-10 bg-white border-t border-slate-100 flex items-center justify-between">
           <button onClick={() => window.print()} className="bg-slate-100 text-slate-500 px-8 py-5 rounded-[24px] font-black text-xs uppercase flex items-center gap-2 tracking-widest"><Printer size={18} /> Imprimir</button>
           <button onClick={onClose} className="bg-slate-900 text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest">Fechar</button>
        </div>
      </motion.div>
    </div>
  );
}

function HeaderLabel({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 border-l-2 border-emerald-500">
      {icon} {label}
    </div>
  );
}

function DetailItem({ label, value, light }: { label: string, value: string, light?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-[8.5px] font-black uppercase tracking-widest ${light ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      <span className={`text-[11px] font-black uppercase tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>{value || '--'}</span>
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
