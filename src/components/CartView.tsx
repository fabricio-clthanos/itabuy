import { useState } from 'react';
import { Trash2, MapPin, CreditCard, Ticket, Loader2 } from 'lucide-react';
import { CartItem, Coupon, Product } from '../types';

interface CartViewProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onToggleSelectItem: (id: string) => void;
  onToggleSelectAll: (selected: boolean) => void;
  coupons: Coupon[];
  onCheckout: (
    appliedCoupon: Coupon | null,
    address: {
      street: string;
      number: string;
      neighborhood: string;
      reference: string;
      fullname: string;
      email: string;
    },
    paymentMethod: 'pix' | 'cartao' | 'dinheiro',
    needsChange: boolean,
    changeAmount: string
  ) => void;
  isCheckingOut?: boolean;
  favorites?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export default function CartView({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onToggleSelectItem,
  onToggleSelectAll,
  coupons,
  onCheckout,
  isCheckingOut = false
}: CartViewProps) {
  // Coupon state applied
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Checkout address and payment states
  const [street, setStreet] = useState(() => localStorage.getItem('itabuy_addr_street') || '');
  const [number, setNumber] = useState(() => localStorage.getItem('itabuy_addr_number') || '');
  const [neighborhood, setNeighborhood] = useState(() => localStorage.getItem('itabuy_addr_neighborhood') || '');
  const [reference, setReference] = useState(() => localStorage.getItem('itabuy_addr_reference') || '');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');

  // Persist address fields whenever they change
  useState(() => {
    localStorage.setItem('itabuy_addr_street', street);
    localStorage.setItem('itabuy_addr_number', number);
    localStorage.setItem('itabuy_addr_neighborhood', neighborhood);
    localStorage.setItem('itabuy_addr_reference', reference);
  });

  // All selected count
  const allSelected = cartItems.length > 0 && cartItems.every((item) => item.selected);
  const selectedItems = cartItems.filter((item) => item.selected);

  // Sum of items selected
  const itemsSubtotal = selectedItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Coupon calculations
  let couponDiscount = 0;
  if (selectedCoupon && itemsSubtotal >= selectedCoupon.minSpent) {
    if (selectedCoupon.type === 'percentage') {
      couponDiscount = itemsSubtotal * (selectedCoupon.discount / 100);
    } else {
      couponDiscount = selectedCoupon.discount;
    }
  }

  const orderTotal = Math.max(0, itemsSubtotal - couponDiscount);

  const handleSubmitCheckout = () => {
    if (!street.trim() || !number.trim() || !neighborhood.trim()) {
      alert('Preencha os dados de endereço: rua, número e bairro.');
      return;
    }
    if (paymentMethod === 'dinheiro' && needsChange && !changeAmount.trim()) {
      alert('Informe o troco!');
      return;
    }

    const addressObj = {
      street: street.trim(),
      number: number.trim(),
      neighborhood: neighborhood.trim(),
      reference: reference.trim(),
      fullname: '', 
      email: ''     
    };

    // Save permanently for next time
    localStorage.setItem('itabuy_addr_street', street.trim());
    localStorage.setItem('itabuy_addr_number', number.trim());
    localStorage.setItem('itabuy_addr_neighborhood', neighborhood.trim());
    localStorage.setItem('itabuy_addr_reference', reference.trim());

    if (isCheckingOut) return;
    onCheckout(selectedCoupon, addressObj, paymentMethod, needsChange, changeAmount);
  };

  return (
    <div className="flex-grow bg-[#FAFAFA] min-h-screen pb-36 font-sans">
      
      {/* Centered Modern Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 py-4 text-center sticky top-0 z-30 shadow-sm">
        <h2 className="text-gray-900 font-bold text-sm tracking-wide">MEU CARRINHO</h2>
      </div>

      {cartItems.length === 0 ? (
        <div className="py-24 text-center px-6 flex flex-col items-center">
          <span className="text-5xl border border-gray-100 rounded-full p-6 shadow-sm mb-4">🛍️</span>
          <h2 className="text-gray-800 text-sm font-semibold tracking-wide">Seu carrinho está vazio</h2>
        </div>
      ) : (
        <div className="p-3 space-y-4">
          
          {/* Select All */}
          <div className="bg-white p-3 rounded-none border border-gray-100 flex items-center justify-between text-xs shadow-sm">
            <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={allSelected} 
                onChange={(e) => onToggleSelectAll(e.target.checked)} 
                className="w-4 h-4 rounded-sm accent-brand-blue"
              />
              <span>Selecionar Todos ({cartItems.length})</span>
            </label>
          </div>

          {/* List of Items */}
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-none p-3 border ${item.selected ? 'border-brand-blue shadow-sm bg-blue-50/10' : 'border-gray-100'} flex gap-3 relative`}
              >
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={item.selected} 
                    onChange={() => onToggleSelectItem(item.id)}
                    className="w-4 h-4 rounded-sm accent-brand-blue"
                  />
                </div>

                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={item.product.images?.[0] || 'https://via.placeholder.com/150'} alt={item.product.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-gray-900 text-xs font-semibold line-clamp-1 pr-6 pb-1 text-ellipsis whitespace-nowrap overflow-hidden">
                      {item.product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between w-full mt-auto">
                    <span className="text-sm font-black text-brand-blue">
                      R$ {(item.product.price || 0).toFixed(2)}
                    </span>
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 font-black text-gray-500">-</button>
                      <span className="px-2 text-xs font-bold text-gray-800">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 font-black text-gray-500">+</button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onRemoveItem(item.id)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-500 active:scale-95 transition-transform"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Select Coupons */}
          {coupons.length > 0 && (
            <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <Ticket className="w-4 h-4 text-brand-blue" />
                <span>CUPOM DO PEDIDO</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 ios-scroll-inertia no-scrollbar">
                {coupons.map((coupon) => {
                  const eligible = itemsSubtotal >= coupon.minSpent;
                  const isSelected = selectedCoupon?.id === coupon.id;

                  return (
                    <button
                      key={coupon.id}
                      disabled={!eligible && !isSelected}
                      onClick={() => setSelectedCoupon(isSelected ? null : coupon)}
                      className={`text-[10px] px-3 py-2 rounded-none border font-semibold flex-shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-brand-blue text-white border-brand-blue' 
                          : eligible 
                            ? 'bg-white text-brand-blue border-gray-200' 
                            : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'
                      }`}
                    >
                      {coupon.code} {eligible ? `(-R$ ${coupon.discount})` : `(Min: R$${coupon.minSpent})`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADDRESS FIELD COMPACT */}
          <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <MapPin className="w-4 h-4 text-brand-blue" />
              <span>ENDEREÇO</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Rua / Avenida"
                className="col-span-3 text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue bg-gray-50"
              />
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Nº"
                className="col-span-1 text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue bg-gray-50"
              />
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Bairro"
                className="col-span-4 text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue bg-gray-50"
              />
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ponto de referência"
                className="col-span-4 text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-brand-blue bg-gray-50"
              />
            </div>
          </div>

          {/* PAYMENT COMPACT */}
          <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <CreditCard className="w-4 h-4 text-brand-blue" />
              <span>PAGAMENTO</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['pix', 'cartao', 'dinheiro'].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m as any)}
                  className={`py-2 px-1 rounded-none border text-center text-xs font-bold transition-all capitalize ${
                    paymentMethod === m ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {paymentMethod === 'cartao' && (
              <p className="text-[10px] text-brand-blue font-bold p-2 bg-blue-50 border border-blue-100 rounded-lg">
                💳 O pagamento com cartão será efetuado na entrega com a nossa maquininha.
              </p>
            )}

            {paymentMethod === 'dinheiro' && (
              <div className="flex items-center gap-2 mt-2">
                <label className="text-[10px] font-bold text-gray-600 flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={needsChange} onChange={(e) => setNeedsChange(e.target.checked)} className="accent-brand-blue" />
                  Troco?
                </label>
                {needsChange && (
                  <input
                    type="text"
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(e.target.value)}
                    placeholder="Para quanto?"
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-brand-blue bg-gray-50"
                  />
                )}
              </div>
            )}
          </div>

          {/* Bottom Summary Glass Bar */}
          <div className="fixed bottom-14 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-gray-200/60 shadow-sm">
            <div className="mx-auto max-w-md h-[4.5rem] px-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Total</span>
                <span className="text-brand-blue font-black text-[19px] leading-tight select-none">
                  R$ {selectedItems.length > 0 ? orderTotal.toFixed(2) : '0,00'}
                </span>
                {couponDiscount > 0 && <span className="text-[9px] text-emerald-600 font-bold tracking-wide">(-R${couponDiscount.toFixed(2)})</span>}
              </div>

              <button
                onClick={handleSubmitCheckout}
                disabled={selectedItems.length === 0 || isCheckingOut}
                className={`px-5 py-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center gap-2 ${
                  selectedItems.length > 0 && !isCheckingOut
                  ? 'bg-gray-900 text-white hover:bg-black shadow-md shadow-gray-900/20 active:scale-95 cursor-pointer' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isCheckingOut ? 'Processando' : 'Finalizar Pedido'}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
