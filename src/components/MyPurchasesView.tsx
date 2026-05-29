import { useState } from 'react';
import { Package, ArrowLeft, Info, MapPin, Truck, Check } from 'lucide-react';

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
                        {order.items && order.items.length > 0 ? order.items[0].product.name : 'Vários itens'} - R$ {order.total.toFixed(2)}
                    </h3>
                  </div>
                  <span className="text-xs text-brand-blue font-bold px-2 py-1 bg-blue-50 rounded-lg">{isExpanded ? 'Ver menos' : 'Ver mais'}</span>
                </div>
                
                {isExpanded && (
                  <div className="space-y-3 border-t border-gray-100 pt-3">
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                        <div><span className="text-[9px] text-gray-400 font-extrabold uppercase">Data:</span><div className="font-bold">{order.date}</div></div>
                        <div><span className="text-[9px] text-gray-400 font-extrabold uppercase">Pagamento:</span><div className="font-bold">{order.paymentMethod?.toUpperCase()}</div></div>
                    </div>
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
                    {/* Items */}
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl text-xs">
                        <img src={item.product.images?.[0]} className="w-10 h-10 object-cover rounded-lg" />
                        <div className="flex-1">
                          <div className="font-black truncate">{item.product.name}</div>
                          <div className="text-gray-500">Qtd: {item.quantity} - R$ {item.product.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                        <button onClick={() => setOrderToCancel(order)} className="w-full py-2 bg-rose-50 text-rose-600 font-bold rounded-lg text-xs">Solicitar Cancelamento</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
