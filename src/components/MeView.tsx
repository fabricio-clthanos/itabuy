import { useState, FormEvent } from 'react';
import { 
  ClipboardList, Star, Shield, LogOut, CreditCard,
  Package, Truck, MessageSquare, Gift, ChevronRight, User, Mail, Lock, 
  CheckCircle2, Copy, RefreshCw, ArrowLeft, Info, MapPin, Sparkles,
  Moon, Sun
} from 'lucide-react';
import { Coupon, Product } from '../types';

interface MeViewProps {
  userCoupons: Coupon[];
  orderHistory: {
    id: string;
    date: string;
    total: number;
    itemsCount: number;
    status: string;
    cancellationRequested?: boolean;
    cancellationStatus?: string;
    qr_code?: string;
    qr_code_base64?: string;
    address?: string | {
      street: string;
      number: string;
      neighborhood: string;
      reference: string;
      fullname: string;
      email: string;
    } | null;
    paymentMethod?: 'pix' | 'cartao' | 'dinheiro';
    needsChange?: boolean;
    changeAmount?: string;
    items?: {
      product: {
        id: string;
        name: string;
        price: number;
        images: string[];
      };
      quantity: number;
      color: string;
      size: string;
      selectedSpec?: Record<string, string>;
    }[];
  }[];
  onClearHistory: () => void;
  favorites?: Product[];
  onSelectProduct?: (product: Product) => void;
  onShowToast?: (message: string) => void;
  // added props for Google Auth and Email Auth
  currentUser: { name: string; email: string; coins?: number; uid?: string } | null;
  onLoginWithEmail: (email: string, pass: string) => Promise<void>;
  onRegisterWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onCancelOrder: (order: any) => Promise<void>;
  onReopenPix?: (orderId: string, total: number, qr_code: string, qr_code_base64: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const getStatusIndex = (status: string) => {
  if (status === 'Pendente' || status === 'Aguardando Pagamento') return 1;
  if (status === 'Processamento') return 2;
  if (status === 'Pedido sendo empacotado') return 3;
  if (status === 'Pedido saindo para entrega') return 4;
  if (status === 'Pedido entregue') return 5;
  if (status === 'Cancelado') return -1;
  return 0;
};

export default function MeView({
  userCoupons,
  orderHistory,
  onClearHistory,
  favorites = [],
  onSelectProduct,
  onShowToast,
  currentUser,
  onLoginWithEmail,
  onRegisterWithEmail,
  onForgotPassword,
  onLogout,
  onGoogleLogin,
  onCancelOrder,
  onReopenPix,
  darkMode = false,
  onToggleDarkMode
}: MeViewProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);
  
  // Auth Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  const [forgotEmail, setForgotEmail] = useState('');

  // Internal component toast state for standalone safety
  const [localToast, setLocalToast] = useState<string | null>(null);

  // 2. Navigation State for Minhas Compras screen
  const [viewingOrdersDetail, setViewingOrdersDetail] = useState(false);

  // Helper to show feedbacks
  const triggerToast = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    } else {
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 3000);
    }
  };

  // Auth Form Handlers
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      triggerToast('Preencha e-mail e senha!');
      return;
    }
    if (loginPassword.length < 4) {
      triggerToast('A senha precisa ter no mínimo 4 caracteres!');
      return;
    }
    try {
      await onLoginWithEmail(loginEmail, loginPassword);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      triggerToast(err.message || 'Erro ao realizar login!');
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      triggerToast('Atenção: preencha todos os campos!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      triggerToast('Erro: As senhas não conferem!');
      return;
    }
    if (regPassword.length < 4) {
      triggerToast('A senha deve conter pelo menos 4 caracteres!');
      return;
    }
    try {
      await onRegisterWithEmail(regName, regEmail, regPassword);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      triggerToast(err.message || 'Erro ao criar conta!');
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      triggerToast('Insira seu e-mail cadastrado!');
      return;
    }
    try {
      await onForgotPassword(forgotEmail);
      setForgotEmail('');
      setAuthMode('login');
    } catch (err: any) {
      triggerToast(err.message || 'Erro ao redefinir senha!');
    }
  };

  const handleLogout = async () => {
    try {
      await onLogout();
      setAuthMode('login');
      setViewingOrdersDetail(false);
    } catch (err: any) {
      triggerToast('Erro ao desconectar!');
    }
  };

  const copyTrackingToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    triggerToast('Código de rastreamento copiado! 📋');
  };


  // ----------------------------------------------------
  // SUB-VIEW A: VIEWING DETAILED PURCHASES & TRACKING
  // ----------------------------------------------------
  if (currentUser && viewingOrdersDetail) {
    return (
      <div className="flex-grow bg-[#F5F5F5] pb-24 font-sans select-none animate-fade-in">
        
        {/* Sub-view Header */}
        <header className="bg-brand-blue text-white py-3.5 px-4 sticky top-0 z-40 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewingOrdersDetail(false)}
              className="bg-white/15 p-2 rounded-full hover:bg-white/25 active:scale-95 transition-transform"
              aria-label="Voltar ao perfil"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div>
              <span className="text-[10px] text-blue-200 uppercase font-bold tracking-widest block leading-none mb-1">
                MEU HISTÓRICO
              </span>
              <h1 className="text-sm font-black leading-none">Minhas Compras</h1>
            </div>
          </div>


        </header>

        {/* Local Feedbacks Toast */}
        {localToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-slate-900 border border-brand-yellow/30 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-xl z-55 flex items-center gap-1.5 min-w-[280px] justify-center text-center animate-scale-up">
            <span>✨</span>
            <span>{localToast}</span>
          </div>
        )}

        <div className="p-3 space-y-3.5">
          
          {orderHistory.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-150 text-center flex flex-col items-center justify-center my-6 shadow-2xs">
              <Package className="w-12 h-12 text-gray-300 mb-3" />
              <span className="text-gray-900 font-extrabold text-sm mb-1 uppercase tracking-wider">Sem Compras Recentes</span>
              <p className="text-xs text-gray-400 font-medium max-w-[240px]">
                Você ainda não realizou pagamentos ou fechou pedidos com cartão/PIX nesta sessão de testes.
              </p>
              <button 
                onClick={() => setViewingOrdersDetail(false)}
                className="mt-4 bg-brand-blue text-white font-black text-xs px-4 py-2 rounded-xl active:scale-95 transition-all text-center"
              >
                Voltar à Loja
              </button>
            </div>
          ) : (
            <>
              {/* Informative info banner */}
              <div className="bg-blue-50/70 border border-brand-blue/15 rounded-xl p-3 flex gap-2.5 text-xs text-brand-blue select-none">
                <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-[12px]">Rastreio Ativo Itacoatiara</h4>
                  <p className="text-[10.5px] mt-0.5 text-blue-700/95 leading-relaxed">
                    Seus pedidos são acompanhados pelo fuso AM. Entregas expressas no mesmo dia ocorrem até às 21h em todos os bairros.
                  </p>
                </div>
              </div>

              {/* Order Lists card loop */}
              {orderHistory.map((order, index) => {
                const trackingCode = `ITB-831-${9402 + index}-AM`;
                const statusIdx = getStatusIndex(order.status);
                return (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm space-y-3 font-sans animate-fade-in"
                  >
                    
                    {/* Upper order indicator wrapper line */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div>
                        <span className="text-[9.5px] text-gray-400 uppercase font-black block tracking-wide">CÓDIGO PEDIDO</span>
                        <h3 className="text-[12.5px] font-black text-gray-900 font-mono">#{order.id}</h3>
                      </div>

                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {order.cancellationRequested && (
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
                            ⚠️ Cancelando...
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                          order.status === 'Pedido entregue' || order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          order.status === 'Cancelado' ? 'bg-red-50 text-red-500 border border-red-200' :
                          order.status === 'Pedido saindo para entrega' ? 'bg-cyan-50 text-brand-blue border border-cyan-200 animate-pulse' :
                          'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          ● {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Meta information columns */}
                    <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 text-xs text-gray-700">
                      <div>
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase block mb-0.5">Data da Compra</span>
                        <span className="font-bold">{order.date}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase block mb-0.5">Valor Total Pago</span>
                        <span className="font-black text-brand-blue">R$ {(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* PRODUTOS COMPRADOS */}
                    <div className="border-t border-gray-100 pt-3">
                      <h4 className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Produtos Comprados</h4>
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-2">
                          {order.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex gap-2.5 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                              <img 
                                src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12'} 
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0 animate-fade-in" 
                                alt={item.product.name} 
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] font-black text-gray-800 truncate uppercase">{item.product.name}</h4>
                                {item.selectedSpec && Object.keys(item.selectedSpec).length > 0 && (
                                  <p className="text-[9.5px] text-gray-400 font-bold uppercase">
                                    {Object.entries(item.selectedSpec).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[11px] font-black text-gray-800 block animate-fade-in">R$ {(item.product.price || 0).toFixed(2)}</span>
                                <span className="text-[9.5px] text-gray-400 font-bold block">Qtd: {item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex gap-2.5 items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-505 text-gray-450 font-semibold shrink-0">🛒</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-black text-gray-850 block">Itens do Pedido</span>
                            <span className="text-[10px] text-gray-400 font-bold">{order.itemsCount} {order.itemsCount === 1 ? 'produto adquirido' : 'produtos adquiridos'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STEPS TIMELINE LOG (RASTREIO DE PEDIDOS) */}
                    <div className="border-t border-gray-100 pt-3">
                      <h4 className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3">Linha do Tempo de Rastreio</h4>
                      
                      {statusIdx === -1 ? (
                        <div className="bg-red-50/60 border border-red-200 text-red-650 font-semibold p-3.5 rounded-xl text-xs space-y-1 select-none animate-fade-in text-center font-sans">
                          <span className="text-lg block">❌</span>
                          <h4 className="font-extrabold text-[12px] uppercase">Este Pedido foi Cancelado</h4>
                          <p className="text-[10.5px] text-red-500 leading-relaxed font-bold">
                            Seu cancelamento foi processado e confirmado pelo administrador. O estorno correspondente foi emitido com sucesso.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 relative pl-4.5 border-l-2 border-brand-blue/15 ml-2.5 font-sans">
                          
                          {/* Step 1: Pendente */}
                          <div className="relative">
                            <div className={`absolute -left-[24.5px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                              statusIdx > 1 ? 'bg-emerald-500' :
                              statusIdx === 1 ? 'bg-amber-500 animate-pulse' : 'bg-gray-200'
                            }`} />
                            <div>
                              <span className="text-[11.5px] font-black text-gray-850 block flex items-center gap-1.5">
                                Pendente {order.status === 'Aguardando Pagamento' && <span className="text-[9.5px] text-amber-500 bg-amber-50 border border-amber-200 px-1 rounded-sm font-semibold">Aguardando Pagamento</span>}
                              </span>
                              <span className="text-[9.5px] text-gray-400 mt-0.5 block leading-relaxed">
                                {statusIdx >= 1 ? 'Seu pedido foi recebido e aguarda as confirmações padrão para o faturamento.' : 'Aguardando o registro inicial do pedido.'}
                              </span>
                            </div>
                          </div>

                          {/* Step 2: Processamento */}
                          <div className="relative">
                            <div className={`absolute -left-[24.5px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                              statusIdx > 2 ? 'bg-emerald-500' :
                              statusIdx === 2 ? 'bg-brand-blue animate-pulse' : 'bg-gray-200'
                            }`} />
                            <div>
                              <span className="text-[11.5px] font-black text-gray-850 block">Processamento</span>
                              <span className="text-[9.5px] text-gray-400 mt-0.5 block leading-relaxed">
                                {statusIdx > 2 ? 'Os detalhes de saldo e estoque foram validados de forma bem-sucedida.' : 
                                 statusIdx === 2 ? 'O administrador recebeu o seu pedido e está fazendo a verificação técnica em estoque.' : 'Aguardando faturamento completo.'}
                              </span>
                            </div>
                          </div>

                          {/* Step 3: Pedido sendo empacotado */}
                          <div className="relative">
                            <div className={`absolute -left-[24.5px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                              statusIdx > 3 ? 'bg-emerald-500' :
                              statusIdx === 3 ? 'bg-brand-blue animate-pulse' : 'bg-gray-200'
                            }`} />
                            <div>
                              <span className="text-[11.5px] font-black text-gray-850 block">Pedido sendo empacotado</span>
                              <span className="text-[9.5px] text-gray-400 mt-0.5 block leading-relaxed">
                                {statusIdx > 3 ? 'Embalagem certificada ItaBuy preenchida e lacrada.' :
                                 statusIdx === 3 ? 'Nossa expedição em Itacoatiara está separando, limpando e embalando seus produtos em caixa resistente.' : 'Aguardando empacotamento.'}
                              </span>
                            </div>
                          </div>

                          {/* Step 4: Pedido saindo para entrega */}
                          <div className="relative">
                            <div className={`absolute -left-[24.5px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                              statusIdx > 4 ? 'bg-emerald-500' :
                              statusIdx === 4 ? 'bg-brand-blue animate-pulse' : 'bg-gray-200'
                            }`} />
                            <div>
                              <span className="text-[11.5px] font-black text-gray-850 block">Pedido saindo para entrega</span>
                              <span className="text-[9.5px] text-gray-400 mt-0.5 block leading-relaxed">
                                {statusIdx > 4 ? 'O transportador coletou e viajou até seu bairro.' :
                                 statusIdx === 4 ? 'Excelente! O entregador expresso ItaBuy coletou seu pacote e está em rota para entrega no seu endereço!' : 'Aguardando despacho com o transportador.'}
                              </span>
                            </div>
                          </div>

                          {/* Step 5: Pedido entregue */}
                          <div className="relative pb-1">
                            <div className={`absolute -left-[24.5px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                              statusIdx === 5 ? 'bg-emerald-500' : 'bg-gray-200'
                            }`} />
                            <div>
                              <span className="text-[11.5px] font-black text-gray-850 block">Pedido entregue</span>
                              <span className="text-[9.5px] text-gray-400 mt-0.5 block leading-relaxed">
                                {statusIdx === 5 ? 'Finalizado - Seu pacote foi entregue com todo cuidado e segurança.' : 'Aguardando confirmação de recebimento no endereço de entrega.'}
                              </span>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>

                    {/* Map pinned address placeholder */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100 flex gap-2 text-[10.5px] text-gray-500">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-extrabold text-gray-700 block">Endereço de Entrega:</span>
                        <span className="mt-0.5 block text-gray-650 font-semibold break-words">
                          {(typeof order.address === 'object' && order.address !== null) 
                            ? `${(order.address as any).street || '--'}, ${(order.address as any).number || '--'} - ${(order.address as any).neighborhood || '--'} (${(order.address as any).reference || '--'})`
                            : (typeof order.address === 'string' ? order.address : "Endereço não informado.")}
                        </span>
                      </div>
                    </div>

                    {/* Cancellation Actions */}
                    <div className="space-y-2 pt-1.5 font-sans">
                      {/* Pagar com Pix Button when pending and Pix data exists on order */}
                      {(order.status === 'Aguardando Pagamento' || order.status === 'Pendente') && order.qr_code && order.qr_code_base64 && !order.cancellationRequested && (
                        <button 
                          onClick={() => {
                            if (onReopenPix) {
                              onReopenPix(order.id, order.total, order.qr_code, order.qr_code_base64);
                            }
                          }}
                          className="w-full text-center py-2.5 text-[11px] text-white font-extrabold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm outline-none active:scale-97 cursor-pointer select-none flex items-center justify-center gap-2"
                        >
                          <span className="text-[12px]">❖</span> Pagar com Pix (Reabrir Pix)
                        </button>
                      )}

                      {order.cancellationRequested ? (
                        <div className="w-full text-center py-2.5 text-[10px] text-amber-600 font-extrabold uppercase bg-amber-50 rounded-xl border border-amber-100 select-none animate-pulse">
                          ⏱️ Cancelamento Solicitado / Aguardando Estorno do Admin
                        </div>
                      ) : order.status === 'Cancelado' ? (
                        <div className="w-full text-center py-2.5 text-[10px] text-red-500 font-extrabold uppercase bg-red-50 rounded-xl border border-red-100 select-none">
                          ❌ Pedido Cancelado e Estornado
                        </div>
                      ) : (
                        <button 
                          onClick={() => setOrderToCancel(order)}
                          className="w-full text-center py-2.5 text-[10.5px] text-rose-500 font-extrabold uppercase tracking-wide bg-rose-50/50 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all border border-rose-100 outline-none active:scale-97 cursor-pointer select-none"
                        >
                          Cancelamento e Reembolso
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </>
          )}

        </div>

        {/* Cancellation Confirmation Modal specifically for detailed purchases view */}
        {orderToCancel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-150 space-y-4 animate-scale-up text-center">
              <div className="w-12 h-12 bg-red-100 text-red-650 rounded-full flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              
              <div className="space-y-1">
                <h3 className="text-gray-900 font-extrabold text-sm uppercase tracking-wider">Confirmar Cancelamento</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed font-semibold font-sans">
                  Você tem certeza que deseja cancelar e receber reembolso do pedido <strong className="font-extrabold text-gray-800">#{orderToCancel.id}</strong>?
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-left text-[10px] text-amber-750 font-bold leading-relaxed space-y-1 select-none font-sans">
                <p>📌 <strong>Forma de pagamento:</strong> {String(orderToCancel.paymentMethod || 'não identificada').toUpperCase()}</p>
                <p>💡 Um aviso de cancelamento imediato será enviado para o painel administrativo. O administrador confirmará a devolução e efetuará o estorno correspondente.</p>
              </div>

              <div className="flex gap-2 font-sans pt-1">
                <button
                  onClick={() => setOrderToCancel(null)}
                  className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95 outline-none cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={async () => {
                    const targetOrd = orderToCancel;
                    setOrderToCancel(null);
                    try {
                      await onCancelOrder(targetOrd);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-red-650 hover:bg-red-700 transition-all active:scale-95 outline-none cursor-pointer font-sans"
                >
                  Confirmar Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }


  // ----------------------------------------------------
  // SUB-VIEW B: LOGGED OUT - RENDER LOGIN/REGISTER/FORGOT
  // ----------------------------------------------------
  if (!currentUser) {
    return (
      <div className="flex-grow bg-[#F5F5F5] pb-24 min-h-[85vh] flex flex-col justify-center items-center px-4 font-sans select-none text-gray-800">
        
        {/* Core Auth Panel Wrapper */}
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-md border border-gray-150 animate-scale-up">
          
          {/* Logo Brand Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm text-brand-yellow font-black font-serif text-2xl">
              Ita
            </div>
            <h2 className="text-gray-900 font-black text-lg uppercase tracking-tight font-sans">ItaBuy</h2>
            <p className="text-xs text-gray-400">Plataforma de Compras • Itacoatiara AM</p>
          </div>

          {/* Local Feedbacks Toast */}
          {localToast && (
            <div className="bg-red-50 text-red-650 p-2.5 rounded-xl text-center text-xs font-semibold mb-3.5 border border-red-100 animate-fade-in flex items-center gap-1.5 justify-center">
              <span>⚠️</span>
              <span>{localToast}</span>
            </div>
          )}

          {/* MODE: LOGIN VIEW */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">E-mail Cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    type="email"
                    required
                    placeholder="exemplo@e-mail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-brand-blue focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Senha Secreta</label>
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('forgot')}
                    className="text-[10px] text-brand-blue hover:underline font-bold"
                  >
                    Redefinir senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    type="password"
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-brand-blue focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Submit trigger button */}
              <button 
                type="submit"
                className="w-full py-2.5 bg-brand-blue text-white hover:bg-brand-blue-hover active:bg-blue-800 active:scale-97 font-black text-xs sm:text-sm rounded-xl uppercase tracking-wider shadow-sm transition-all"
              >
                Entrar na Conta
              </button>

              <div className="text-center pt-2 select-none">
                <span className="text-xs text-gray-400">Ainda não tem cadastro?</span>
                <button 
                  type="button" 
                  onClick={() => setAuthMode('register')}
                  className="text-xs font-black text-brand-blue ml-1 hover:underline"
                >
                  Criar Conta Grátis
                </button>
              </div>

            </form>
          )}

          {/* MODE: REGISTER / ACCOUNT CREATION VIEW */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    type="text"
                    required
                    placeholder="Como deseja ser chamado?"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand-blue focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">E-mail para Acesso</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    type="email"
                    required
                    placeholder="seuemail@provedor.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand-blue focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Senha (Mínimo 4 caracteres)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    type="password"
                    required
                    placeholder="Crie uma senha de acesso"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand-blue focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Confirmar Senha Criada</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    type="password"
                    required
                    placeholder="Repita a mesma senha acima"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-brand-blue focus:bg-white font-medium"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-brand-blue text-white hover:bg-brand-blue-hover active:bg-blue-800 active:scale-97 font-black text-xs rounded-xl uppercase tracking-wider shadow-sm transition-all"
              >
                Cadastrar e Acessar
              </button>

              <div className="text-center pt-2.5">
                <span className="text-xs text-gray-400">Já possui cadastro?</span>
                <button 
                  type="button" 
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-black text-brand-blue ml-1 hover:underline text-center"
                >
                  Voltar para o Login
                </button>
              </div>

            </form>
          )}

          {/* MODE: PASSWORD RESET / RECOVERY */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="p-3 bg-blue-50/60 rounded-xl text-xs text-blue-700 font-medium leading-relaxed mb-1">
                Digite seu e-mail cadastrado e enviaremos um link de alteração de senha seguro imediatamente para Itacoatiara.
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Seu E-mail Cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    type="email"
                    required
                    placeholder="exemplo@e-mail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-brand-blue focus:bg-white font-medium"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-brand-blue text-white hover:bg-brand-blue-hover active:scale-97 font-black text-xs sm:text-sm rounded-xl uppercase tracking-wider shadow-sm transition-all text-center"
              >
                Redefinir Minha Senha
              </button>

              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-black text-brand-blue hover:underline text-center"
                >
                  Voltar ao Login de Acesso
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Google Authentication Trigger */}
        <button 
          onClick={async () => {
            try {
              await onGoogleLogin();
            } catch (err: any) {
              triggerToast('Falha no login com Google. Verifique e tente novamente.');
            }
          }}
          className="mt-6 w-full max-w-sm flex items-center justify-center gap-2 bg-white text-gray-700 font-bold border border-gray-300 rounded-xl px-4 py-2.5 hover:bg-gray-50 active:scale-95 transition-all text-xs shadow-xs"
        >
          <span className="text-base">🌐</span>
          <span>Entrar de forma segura com Google</span>
        </button>

      </div>
    );
  }


  // ----------------------------------------------------
  // SUB-VIEW C: LOGGED IN PROFILE DASHBOARD VIEW
  // ----------------------------------------------------
  return (
    <div className="flex-grow bg-[#F5F5F5] pb-24 font-sans select-none animate-fade-in relative">
      
      {/* Local Feedbacks Toast */}
      {localToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-slate-900 border border-brand-yellow/30 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-xl z-55 flex items-center gap-1.5 min-w-[280px] justify-center text-center animate-scale-up">
          <span>✨</span>
          <span>{localToast}</span>
        </div>
      )}

      {/* 1. Profile Header Box with Brand Blue Background */}
      <section className="bg-brand-blue text-white px-4 pt-6 pb-8 relative rounded-b-2xl shadow-sm">
        
        <div className="flex items-center gap-3.5">
          {/* Avatar frame */}
          <div className="w-14 h-14 bg-white/10 rounded-full border-2 border-white/60 flex items-center justify-center font-black text-2xl uppercase shadow-md relative group">
            <span className="text-brand-yellow font-serif">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </span>
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-brand-blue" />
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-bold flex items-center gap-1.5 font-sans capitalize">
              {currentUser.name}
            </h2>
            <p className="text-[11px] text-blue-100">{currentUser.email}</p>
          </div>
        </div>

        {/* Floating Quick metrics card */}
        <div className="absolute left-3 right-3 -bottom-5.5 bg-white text-gray-800 rounded-xl px-4 py-2.5 shadow-md flex items-center justify-around text-center divide-x divide-gray-100 border border-gray-100">
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-brand-blue">
              <ClipboardList className="w-4.5 h-4.5 animate-pulse" />
              <span className="text-xs font-black text-gray-900">{orderHistory.length}</span>
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 font-medium">Meus Pedidos</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-emerald-600">
              <Shield className="w-4.5 h-4.5" />
              <span className="text-xs font-black text-gray-900">100%</span>
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 font-medium">Conta Segura</span>
          </div>

        </div>

      </section>

      {/* 2. Simplified compras section (REMOVED: Now handled by separate Compras view) */}

      {/* 3. Minha Conta Section */}
      <section className="mt-8 bg-white p-4 mx-2.5 rounded-2xl border border-gray-150 shadow-2xs">
        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-4">Minha Conta</h3>
        <div className="space-y-3">
            <div className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border border-gray-100">
              <span>Favoritos</span>
              <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black">{favorites.length}</span>
            </div>
            
            {/* Dark Mode toggle button */}
            <button 
              onClick={onToggleDarkMode}
              className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 hover:bg-gray-100 transition-all cursor-pointer tap-highlight-transparent"
            >
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="w-4.5 h-4.5 text-indigo-500 fill-indigo-50/20" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
                <span>Modo Escuro</span>
              </div>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}>
                  {darkMode ? <Moon className="w-3 h-3 text-indigo-900" /> : <Sun className="w-3 h-3 text-yellow-500" />}
                </div>
              </div>
            </button>

            <a href="https://www.instagram.com/itabuy.com.br/" target="_blank" className="block w-full p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border border-gray-100 hover:bg-gray-100 transition-colors">Instagram da Loja</a>
            <button onClick={handleLogout} className="w-full p-3 bg-rose-50 rounded-xl text-xs font-extrabold text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors">Sair da Conta</button>
        </div>
      </section>

      {/* 2.5. Favorites Row Carousel (In profile view) */}
      {favorites.length > 0 && (
        <section className="mt-3 bg-white p-3 mx-2.5 rounded-2xl border border-gray-150 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2.5">
            <h3 className="text-xs font-black text-gray-755 flex items-center gap-1">
              <Star className="w-4 h-4 text-rose-500 fill-rose-500" />
              Favoritos Marcados ({favorites.length})
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold uppercase font-sans">Ver &gt;</span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar ios-scroll-inertia font-sans">
            {favorites.map((prod) => (
              <div 
                key={prod.id}
                onClick={() => onSelectProduct?.(prod)}
                className="w-24 shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 relative">
                  <img src={prod.images?.[0] || 'https://via.placeholder.com/150'} alt={prod.name} className="w-full h-full object-cover" />
                  {prod.discountPercentage && (
                    <span className="absolute top-1 left-1 bg-brand-yellow text-brand-blue text-[8px] font-black px-1.5 py-0.2 rounded-xs shadow-sm">
                      -{prod.discountPercentage}%
                    </span>
                  )}
                </div>
                <h4 className="text-[10px] font-bold text-gray-755 mt-1 line-clamp-1 truncate leading-tight">
                  {prod.name}
                </h4>
                <div className="text-[11px] font-extrabold text-brand-blue mt-0.5">
                  R$ {(prod.price || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Utility List details list (Central de Ajuda & Sair) */}
      <section className="mt-3 bg-white rounded-2xl border border-gray-150 mx-2.5 overflow-hidden shadow-2xs divide-y divide-gray-100 font-sans">
        

        {/* Support disclaimer notice inside panel */}
        <div className="p-3.5 bg-slate-50 text-[10px] text-gray-400 font-medium leading-relaxed">
          💡 Para dúvidas rápidas, use o botão de suporte whatsapp na página do produto.
        </div>

        {/* Logout handler */}
        <div 
          onClick={handleLogout}
          className="p-3.5 flex items-center justify-between hover:bg-red-50/20 cursor-pointer active:bg-red-50 text-xs text-rose-650 font-bold"
        >
          <div className="flex items-center gap-2.5 text-red-500 font-black">
            <LogOut className="w-4.5 h-4.5" />
            <span>Sair da Conta ({currentUser.name})</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>

      </section>

      {/* 5. Minimal Branded Footer */}
      <footer className="py-6 text-center text-[10px] text-gray-400 select-none">
        <p>© 2026 ItaBuy Magazine Ltda.</p>
        <p className="mt-0.5 font-sans">Versão Oficial ItaBuy App v1.5.0 (Mobile Experience)</p>
      </footer>

      {/* Cancellation Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-150 space-y-4 animate-scale-up text-center">
            <div className="w-12 h-12 bg-red-100 text-red-650 rounded-full flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            
            <div className="space-y-1">
              <h3 className="text-gray-900 font-extrabold text-sm uppercase tracking-wider">Confirmar Cancelamento</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold font-sans">
                Você tem certeza que deseja cancelar e receber reembolso do pedido <strong className="font-extrabold text-gray-800">#{orderToCancel.id}</strong>?
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-left text-[10px] text-amber-750 font-bold leading-relaxed space-y-1 select-none font-sans">
              <p>📌 <strong>Forma de pagamento:</strong> {String(orderToCancel.paymentMethod || 'não identificada').toUpperCase()}</p>
              <p>💡 Um aviso de cancelamento imediato será enviado para o painel administrativo. O administrador confirmará a devolução e efetuará o estorno correspondente.</p>
            </div>

            <div className="flex gap-2 font-sans pt-1">
              <button
                onClick={() => setOrderToCancel(null)}
                className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95 outline-none cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  const targetOrd = orderToCancel;
                  setOrderToCancel(null);
                  try {
                    await onCancelOrder(targetOrd);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-650 hover:bg-red-700 transition-all active:scale-95 outline-none cursor-pointer font-sans"
              >
                Confirmar Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
