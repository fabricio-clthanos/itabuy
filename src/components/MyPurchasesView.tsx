import { useState } from 'react';
import { Package, ArrowLeft, Info, MapPin, Truck, Check, AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  selectedSpec?: Record<string, string>;
}

interface Order {
  id: string;
  date: string;
  total: number;
  itemsCount: number;
  status: string;
  cancellationRequested?: boolean;
  cancellationStatus?: string;
  qr_code?: string;
  qr_code_base64?: string;
  address?: any;
  paymentMethod?: 'pix' | 'cartao' | 'dinheiro';
  needsChange?: boolean;
  changeAmount?: string;
  items?: OrderItem[];
}

interface MyPurchasesViewProps {
  orderHistory: Order[];
  onCancelOrder: (order: Order) => Promise<void>;
  onReopenPix?: (orderId: string, total: string, qr: string, qr64: string) => void;
  onShowToast: (msg: string) => void;
  onBack: () => void;
}

const getStatusIndex = (status: string) => {
  if (status === 'Pendente' || status === 'Aguardando Pagamento') return 1;
  if (status === 'Análise de Cancelamento') return -2;
  if (status === 'Processamento') return 2;
  if (status === 'Pedido sendo empacotado') return 3;
  if (status === 'Pedido saindo para entrega') return 4;
  if (status === 'Pedido entregue') return 5;
  if (status === 'Cancelado') return -1;
  return 0;
};

export default function MyPurchasesView({
  orderHistory,
  onCancelOrder,
  onReopenPix,
  onShowToast,
  onBack
}: MyPurchasesViewProps) {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      await onCancelOrder(orderToCancel);
      setOrderToCancel(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-grow bg-[#F5F5F5] pb-24 font-sans select-none animate-fade-in">
      <header className="bg-brand-blue text-white py-3.5 px-4 sticky top-0 z-40 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="bg-white/15 p-2 rounded-full hover:bg-white/25 active:scale-95 transition-transform" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <h1 className="text-sm font-black uppercase tracking-wider">Minhas Compras</h1>
        </div>
      </header>

      <div className="p-3 space-y-3.5">
        {orderHistory.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-150 text-center flex flex-col items-center justify-center my-6 shadow-2xs">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-900 font-extrabold text-sm mb-1 uppercase tracking-wider">Nenhum Pedido</p>
            <button onClick={onBack} className="mt-4 bg-brand-blue text-white font-black text-xs px-4 py-2 rounded-xl active:scale-95 transition-all">Voltar à Loja</button>
          </div>
        ) : (
          orderHistory.map((order) => {
            const isExpanded = expandedOrders[order.id];
            const statusIdx = getStatusIndex(order.status);
            
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm space-y-3 font-sans animate-fade-in">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(order.id)}>
                  <div>
                    <span className="text-[9.5px] text-gray-400 uppercase font-black tracking-wide">Pedido #{order.id}</span>
                    <h3 className="text-xs font-black text-gray-900">
                        {order.items && order.items.length > 0 ? order.items[0].product.name : 'Vários itens'} - R$ {(order.total || 0).toFixed(2)}
                    </h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${order.status === 'Análise de Cancelamento' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-brand-blue'}`}>
                    {order.status === 'Análise de Cancelamento' ? 'Em análise' : (isExpanded ? 'Ver menos' : 'Ver mais')}
                  </span>
                </div>
                
                {isExpanded && (
                  <div className="space-y-3 border-t border-gray-100 pt-3">
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                        <div><span className="text-[9px] text-gray-400 font-extrabold uppercase">Data:</span><div className="font-bold">{order.date}</div></div>
                        <div><span className="text-[9px] text-gray-400 font-extrabold uppercase">Pagamento:</span><div className="font-bold">{order.paymentMethod?.toUpperCase()}</div></div>
                    </div>
                    {order.status !== 'Análise de Cancelamento' && order.status !== 'Cancelado' && (
                      <div className="py-2">
                          <div className="flex justify-between items-center mb-1">
                              {['Pendente', 'Proc.', 'Empac.', 'Envio', 'Entr.'].map((s, i) => (
                                  <div key={i} className="flex flex-col items-center flex-1">
                                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${i < statusIdx ? 'bg-brand-blue' : 'bg-gray-200'} ${i === statusIdx - 1 ? 'ring-2 ring-blue-200' : ''}`}>
                                          {i < statusIdx && <Check className="w-2.5 h-2.5 text-white" />}
                                      </div>
                                      <span className="text-[7px] mt-1 font-bold text-gray-400 uppercase">{s}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                    )}
                    
                    {order.status === 'Análise de Cancelamento' && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-[10px] font-black text-amber-800 uppercase">Em Análise de Cancelamento</p>
                          <p className="text-[9px] text-amber-600 font-bold">O administrador está revisando sua solicitação.</p>
                        </div>
                      </div>
                    )}

                    {order.status === 'Cancelado' && (
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        <div>
                          <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Pedido Cancelado</p>
                          <p className="text-[9px] text-rose-600 font-bold">O valor foi estornado ou a compra foi anulada.</p>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl text-xs">
                        <img src={item.product.images?.[0]} className="w-10 h-10 object-cover rounded-lg" />
                        <div className="flex-1">
                          <div className="font-black truncate">{item.product.name}</div>
                          <div className="text-gray-500">Qtd: {item.quantity} - R$ {(item.product.price || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                        <button 
                          onClick={() => setOrderToCancel(order)}
                          disabled={order.cancellationRequested || order.status === 'Cancelado' || order.status === 'Pedido entregue'}
                          className={`w-full py-2 font-bold rounded-lg text-xs ${order.cancellationRequested || order.status === 'Cancelado' || order.status === 'Pedido entregue' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-rose-50 text-rose-600 active:scale-95 transition-transform'}`}
                        >
                          {order.cancellationRequested ? 'Cancelamento Solicitado' : order.status === 'Cancelado' ? 'Pedido Cancelado' : 'Solicitar Cancelamento'}
                        </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setOrderToCancel(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full"
              >
                <X size={16} />
              </button>

              <div className="p-6">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
                  <AlertTriangle size={28} />
                </div>
                
                <h3 className="text-sm font-black text-gray-900 text-center uppercase tracking-widest mb-2">Solicitar Cancelamento?</h3>
                <p className="text-[11px] text-gray-500 text-center font-bold px-4 leading-relaxed mb-6">
                  Deseja realmente solicitar o cancelamento do pedido <span className="text-gray-900 font-extrabold">#{orderToCancel.id}</span>? 
                  Esta ação passará por análise administrativa.
                </p>

                <div className="space-y-2.5">
                  <button 
                    onClick={handleConfirmCancel}
                    className="w-full py-3 bg-brand-blue text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all shadow-md"
                  >
                    Confirmar Solicitação
                  </button>
                  <button 
                    onClick={() => setOrderToCancel(null)}
                    className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                  >
                    Não, Manter Pedido
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
