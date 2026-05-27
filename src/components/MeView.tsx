import { useState, FormEvent } from 'react';
import { 
  ClipboardList, Star, Shield, HelpCircle, LogOut, CreditCard,
  Package, Truck, MessageSquare, Gift, ChevronRight, User, Mail, Lock, 
  CheckCircle2, Copy, RefreshCw, ArrowLeft, Info, MapPin, Sparkles
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
}

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
  onGoogleLogin
}: MeViewProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  
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

                      <span className={`px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                        order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        order.status === 'A Caminho' ? 'bg-cyan-50 text-brand-blue border border-cyan-200 animate-pulse' :
                        'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        ● {order.status}
                      </span>
                    </div>

                    {/* Meta information columns */}
                    <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 text-xs text-gray-700">
                      <div>
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase block mb-0.5">Data da Compra</span>
                        <span className="font-bold">{order.date}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase block mb-0.5">Valor Total Pago</span>
                        <span className="font-black text-brand-blue">R$ {order.total.toFixed(2)}</span>
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
                                <h4 className="text-[11px] font-black text-gray-800 truncate">{item.product.name}</h4>
                                <p className="text-[9.5px] text-gray-400 font-bold">
                                  Opção: {item.color} | Tam/Volts: {item.size}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[11px] font-black text-gray-800 block animate-fade-in">R$ {item.product.price.toFixed(2)}</span>
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
                      
                      <div className="space-y-4 relative pl-4.5 border-l-2 border-brand-blue/15 ml-2.5 font-sans">
                        
                        {/* Step 1: Pedido Confirmado / Pago */}
                        <div className="relative">
                          <div className={`absolute -left-[24.5px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs animate-fade-in ${
                            order.status !== 'Aguardando Pagamento' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                          }`} />
                          <div>
                            <span className="text-[11.5px] font-black text-gray-850 block">
                              {order.status === 'Aguardando Pagamento' ? 'Aguardando Pagamento' : 'Pedido Confirmado'}
                            </span>
                            <span className="text-[9.5px] text-gray-400 mt-0.5 block">
                              {order.date} - {order.status === 'Aguardando Pagamento' ? 'Seu pagamento ainda não foi processado.' : 'Seu pedido foi recebido e confirmado.'}
                            </span>
                          </div>
                        </div>

                        {/* Step 2: Em separação / Processamento */}
                        <div className="relative">
                          <div className={`absolute -left-[24.5px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                            ['Processamento', 'Pedido sendo empacotado', 'Pedido saindo para entrega', 'Pedido entregue'].includes(order.status) 
                              ? 'bg-emerald-500' 
                              : order.status === 'Pendente' ? 'bg-brand-blue animate-pulse' : 'bg-gray-200'
                          }`} />
                          <div>
                            <span className="text-[11.5px] font-black text-gray-850 block">Em Processamento e Separação</span>
                            <span className="text-[9.5px] text-gray-400 mt-0.5 block">
                              {order.status === 'Pedido sendo empacotado' ? 'Seu pedido está sendo cuidadosamente empacotado.' : 'Verificando estoque e preparando itens.'}
                            </span>
                          </div>
                        </div>

                        {/* Step 3: Em Rota de entrega */}
                        <div className="relative">
                          <div className={`absolute -left-[24.5px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                            order.status === 'Pedido entregue' ? 'bg-emerald-500' :
                            order.status === 'Pedido saindo para entrega' ? 'bg-brand-blue animate-pulse' : 'bg-gray-200'
                          }`} />
                          <div>
                            <span className="text-[11.5px] font-black text-gray-850 block">Rota de Entrega Expresso</span>
                            <span className="text-[9.5px] text-gray-400 mt-0.5 block">
                              {order.status === 'Pedido saindo para entrega' ? 'O entregador já saiu com seu pedido!' : 'Saiu da central para o destino final.'}
                            </span>
                          </div>
                        </div>

                        {/* Step 4: Entregue */}
                        <div className="relative pb-1">
                          <div className={`absolute -left-[24.5px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                            order.status === 'Pedido entregue' ? 'bg-emerald-500' : 'bg-gray-200'
                          }`} />
                          <div>
                            <span className="text-[11.5px] font-black text-gray-850 block">Pedido Entregue</span>
                            <span className="text-[9.5px] text-gray-400 mt-0.5 block">
                              {order.status === 'Pedido entregue' ? 'Finalizado - Entregue com sucesso.' : 'Obrigado por comprar na ItaBuy!'}
                            </span>
                          </div>
                        </div>

                      </div>
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

                    {/* Help Support button regarding this order */}
                    <button 
                      onClick={() => alert(`Central de Rastreio: Atendimento sobre o pedido #${order.id} em canais rápidos de Itacoatiara.`)}
                      className="w-full text-center py-2 text-[10.5px] text-brand-blue font-extrabold uppercase tracking-wide bg-blue-50/50 hover:bg-blue-50 rounded-xl transition-all border border-blue-100 outline-none"
                    >
                      Dúvidas sobre este pedido?
                    </button>

                  </div>
                );
              })}
            </>
          )}

        </div>

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

      {/* 2. Simplified compras section (replaces legacy 4 buttons) */}
      <section className="mt-8 bg-white p-4 mx-2.5 rounded-2xl border border-gray-150 shadow-2xs">
        
        {/* Banner header row */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3.5">
          <span className="flex items-center gap-1.5 text-xs text-gray-800 font-extrabold uppercase">
            <ClipboardList className="w-5 h-5 text-brand-blue" />
            Minhas Compras
          </span>
          <span className="bg-blue-50 text-brand-blue text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-blue-150">
            Fidelidade AM
          </span>
        </div>

        {/* Text of purchases and button */}
        <div className="text-center py-2.5 px-1 space-y-3.5">
          <p className="text-xs font-medium text-gray-500 leading-relaxed">
            Você possui <b className="text-gray-900 font-extrabold">{orderHistory.length} compras</b> em andamento ou finalizadas registradas no aplicativo.
          </p>

          <button 
            onClick={() => setViewingOrdersDetail(true)}
            className="w-full py-2.5 bg-brand-blue text-white active:bg-brand-blue-hover text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 text-center flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4 text-brand-yellow shrink-0" />
            <span>Ver Compras e Rastreio</span>
          </button>
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
                  R$ {prod.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Utility List details list (Central de Ajuda & Sair) */}
      <section className="mt-3 bg-white rounded-2xl border border-gray-150 mx-2.5 overflow-hidden shadow-2xs divide-y divide-gray-100 font-sans">
        
        {/* Help Center Item - Now configured to show "Em desenvolvimento" info */}
        <div 
          onClick={() => {
            triggerToast('🚧 Central de Ajuda em Desenvolvimento.');
          }}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer active:bg-gray-100 text-xs text-gray-700 select-none"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4.5 h-4.5 text-purple-600 animate-pulse" />
            <div className="flex items-center gap-2 font-black">
              <span>Central de Ajuda & Dúvidas FAQ</span>
              <span className="text-[7.5px] bg-purple-50 border border-purple-200 text-purple-600 px-1.5 py-0.2 rounded-full uppercase mr-1">
                Em desenvolvimento
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

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

    </div>
  );
}
