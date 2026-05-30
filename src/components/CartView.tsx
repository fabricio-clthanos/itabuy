import { useState, useEffect } from 'react';
import { Trash2, MapPin, CreditCard, Ticket, Loader2, ShoppingBag } from 'lucide-react';
import { CartItem, Coupon, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';

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

function TypingHeader({ onComplete }: { onComplete: () => void }) {
  const text = "carrinho →";

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      key="typing-internal"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="flex items-center justify-center pointer-events-none"
    >
      <div className="flex">
        {text.split('').map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.1 }}
            className="text-brand-blue font-black text-2xl uppercase tracking-[0.2em]"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
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
  const [showTyping, setShowTyping] = useState(true);
  
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
  useEffect(() => {
    localStorage.setItem('itabuy_addr_street', street);
    localStorage.setItem('itabuy_addr_number', number);
    localStorage.setItem('itabuy_addr_neighborhood', neighborhood);
    localStorage.setItem('itabuy_addr_reference', reference);
  }, [street, number, neighborhood, reference]);

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
    <div className="flex-grow bg-[#FAFAFA] min-h-screen pb-36 font-sans select-none">
      
      {/* Centered Modern Header - Larger and Animated */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 h-32 sticky top-0 z-30 shadow-sm flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {showTyping ? (
            <TypingHeader onComplete={() => setShowTyping(false)} />
          ) : (
            <motion.div 
              key="icon"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.6 
              }}
              className="flex flex-col items-center"
            >
              <ShoppingBag className="w-14 h-14 text-brand-blue" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {cartItems.length === 0 ? (
        <div className="py-24 text-center px-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 border border-blue-100 shadow-inner">
             <ShoppingBag className="w-10 h-10 text-brand-blue opacity-40" />
          </div>
          <h2 className="text-gray-800 text-sm font-black uppercase tracking-widest px-8 py-2 border-b-2 border-brand-blue/10">Carrinho Vazio</h2>
          <p className="mt-4 text-xs text-gray-400 font-medium">Volte para a loja e adicione produtos!</p>
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
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-brand-blue">
                        R$ {(item.product.price || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600">
                        Pix: R$ {((item.product.price || 0) * 0.9).toFixed(2)}
                      </span>
                    </div>
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

          {/* Quick Select Coupons & Manual Input */}
          <div className="bg-white p-4 rounded-none border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <Ticket className="w-4 h-4 text-brand-blue" />
              <span>CUPOM DE DESCONTO</span>
            </div>
            
            {/* Manual Coupon Input */}
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Insira o código" 
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-blue bg-gray-50"
                id="manual-coupon-input"
              />
              <button 
                onClick={() => {
                  const input = document.getElementById('manual-coupon-input') as HTMLInputElement;
                  const code = input?.value?.trim().toUpperCase();
                  if (!code) return;
                  const found = coupons.find(c => c.code.toUpperCase() === code);
                  if (found) {
                    if (itemsSubtotal >= found.minSpent) {
                      setSelectedCoupon(found);
                    } else {
                      alert(`Este cupom requer gasto mínimo de R$ ${found.minSpent}`);
                    }
                  } else {
                    alert('Cupom inválido ou expirado.');
                  }
                }}
                className="bg-brand-blue text-white text-[10px] font-bold px-4 py-2 rounded-lg active:scale-95 transition-transform"
              >
                APLICAR
              </button>
            </div>

            {coupons.length > 0 && (
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
                      {coupon.code} {eligible ? `(-R$ ${(coupon.discount || 0).toFixed(2)})` : `(Min: R$${(coupon.minSpent || 0).toFixed(2)})`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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

          {/* RESUMO DO PEDIDO */}
          <div className="bg-white p-4 border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Resumo do Pedido</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtotal</span>
                <span>R$ {(itemsSubtotal || 0).toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                  <span>Cupom ({selectedCoupon?.code})</span>
                  <span>- R$ {(couponDiscount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-brand-blue font-bold">
                <span>Frete</span>
                <span className="uppercase">Grátis</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between font-black text-sm text-gray-900">
                <span>Total</span>
                <span>R$ {(orderTotal || 0).toFixed(2)}</span>
              </div>
              {paymentMethod === 'pix' && (
                <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg text-[10px] font-bold flex justify-between">
                  <span>Total com Desconto Pix (10%):</span>
                  <span>R$ {((orderTotal || 0) * 0.9).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Summary Glass Bar */}
          <div className="fixed bottom-14 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-gray-200/60 shadow-sm">
            <div className="mx-auto max-w-md h-[4.5rem] px-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Total</span>
                <span className="text-brand-blue font-black text-[19px] leading-tight select-none">
                  R$ {selectedItems.length > 0 ? (orderTotal || 0).toFixed(2) : '0,00'}
                </span>
                {couponDiscount > 0 && <span className="text-[9px] text-emerald-600 font-bold tracking-wide">(-R${(couponDiscount || 0).toFixed(2)})</span>}
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
