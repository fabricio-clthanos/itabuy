import { useState, useEffect } from 'react';
import { Trash2, ShieldCheck, Ticket, Heart, ChevronRight, MapPin, CreditCard, Copy, CheckCircle2, Loader2, X } from 'lucide-react';
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
  favorites: Product[];
  onSelectProduct: (product: Product) => void;
}

export default function CartView({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onToggleSelectItem,
  onToggleSelectAll,
  coupons,
  onCheckout,
  favorites = [],
  onSelectProduct
}: CartViewProps) {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'cart' | 'favorites'>('cart');

  // Coupon state applied
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Manual coupon typing states
  const [typedCoupon, setTypedCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Checkout address and payment states
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');

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

  // Shipping
  const shippingCost = 0;
  const isFreeShipping = true;

  const orderTotal = Math.max(0, itemsSubtotal - couponDiscount + shippingCost);

  // Handle typing manual coupon code
  const handleApplyTypedCoupon = () => {
    const code = typedCoupon.trim().toUpperCase();
    if (!code) return;

    // Check against available list of coupons
    const match = coupons.find((c) => c.code.toUpperCase() === code);
    if (match) {
      if (itemsSubtotal < match.minSpent) {
        setCouponFeedback({
          type: 'error',
          text: `Este cupom exige compras de no mínimo R$ ${match.minSpent.toFixed(2)}.`
        });
      } else {
        setSelectedCoupon(match);
        setCouponFeedback({
          type: 'success',
          text: `Cupom ${match.code} de R$ ${match.discount.toFixed(0)} de Desconto aplicado com sucesso!`
        });
      }
    } else {
      // Support manual standard fallback coupon definitions in case
      if (code === 'ITAFRETE') {
        setSelectedCoupon({ id: 'c1', code: 'ITAFRETE', title: 'Frete Grátis ItaBuy', discount: 20, type: 'fixed', minSpent: 39, expiry: 'Válido' });
        setCouponFeedback({ type: 'success', text: 'Cupom ITAFRETE aplicado com sucesso!' });
      } else if (code === 'BOASVINDAS') {
        setSelectedCoupon({ id: 'c2', code: 'BOASVINDAS', title: 'Cupom de Boas-Vindas R$15', discount: 15, type: 'fixed', minSpent: 50, expiry: 'Válido' });
        setCouponFeedback({ type: 'success', text: 'Cupom BOASVINDAS aplicado com sucesso!' });
      } else if (code === 'ITA10') {
        setSelectedCoupon({ id: 'c3', code: 'ITA10', title: 'Desconto de 10% Especial', discount: 10, type: 'percentage', minSpent: 100, expiry: 'Válido' });
        setCouponFeedback({ type: 'success', text: 'Cupom ITA10 aplicado com sucesso!' });
      } else {
        setCouponFeedback({
          type: 'error',
          text: 'Cupom inválido ou expirado.'
        });
      }
    }
  };

  const handleSubmitCheckout = () => {
    if (!street.trim()) {
      alert('Por favor, informe a Rua!');
      return;
    }
    if (!number.trim()) {
      alert('Por favor, informe o Número!');
      return;
    }
    if (!neighborhood.trim()) {
      alert('Por favor, informe o Bairro!');
      return;
    }
    if (!reference.trim()) {
      alert('Por favor, informe o Ponto de Referência!');
      return;
    }
    if (paymentMethod === 'dinheiro' && needsChange && !changeAmount.trim()) {
      alert('Por favor, informe para quanto precisa de troco!');
      return;
    }

    const addressObj = {
      street: street.trim(),
      number: number.trim(),
      neighborhood: neighborhood.trim(),
      reference: reference.trim(),
      fullname: '', // Will be filled in App.tsx
      email: ''     // Will be filled in App.tsx
    };
    onCheckout(selectedCoupon, addressObj, paymentMethod, needsChange, changeAmount);
  };

  return (
    <div className="flex-grow bg-[#F5F5F5] min-h-screen pb-36 font-sans">
      
      {/* Dual Tab Switcher */}
      <div className="bg-white border-b border-gray-150 flex text-center font-bold text-xs sticky top-0 z-30 shadow-xs">
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex-1 py-3.5 border-b-2 transition-all select-none ${
            activeTab === 'cart' 
              ? 'border-brand-blue text-brand-blue font-black' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Meu Carrinho ({cartItems.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-3.5 border-b-2 transition-all flex items-center justify-center gap-1.5 select-none ${
            activeTab === 'favorites' 
              ? 'border-brand-blue text-brand-blue font-black' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-brand-blue text-brand-blue' : 'text-gray-400'}`} />
          Meus Favoritos ({favorites.length})
        </button>
      </div>

      {activeTab === 'favorites' ? (
        /* Favorites Tab Content */
        favorites.length === 0 ? (
          <div className="py-20 text-center px-4 flex flex-col items-center select-none animate-fade-in">
            <span className="text-5xl text-rose-300 mb-3.5">❤️</span>
            <h3 className="text-gray-800 text-sm font-bold uppercase tracking-wider">Nenhum favorito salvo</h3>
            <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed max-w-xs">
              Mantenha o controle de seus produtos preferidos. Clique no coração vermelho ao visualizar qualquer produto para criar sua lista!
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2.5 select-none animate-fade-in">
            {favorites.map((product) => (
              <div 
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="bg-white rounded-xl p-3 border border-gray-150 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex gap-3 relative overflow-hidden active:bg-slate-50"
              >
                <div className="w-18 h-18 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                  <img src={product.images?.[0] || 'https://via.placeholder.com/150'} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[12.5px] font-bold text-gray-800 leading-normal truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9.5px] text-brand-blue font-extrabold px-1.5 py-0.5 bg-blue-50 rounded-xs">
                        ★ {(product.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-gray-400">({product.salesCount} vendidos)</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mt-1.5 flex-wrap gap-2">
                    <span className="text-xs sm:text-sm font-black text-brand-blue">
                      R$ {(product.price || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-brand-blue font-extrabold flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 border border-blue-150 rounded-full">
                      Ver Detalhes <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Cart View Content */
        <>
          {/* Header Guarantee Banner */}
          <div className="bg-brand-blue/5 px-3 py-2 text-brand-blue flex items-center gap-1.5 text-xs font-semibold justify-center border-b border-gray-200">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Compra elegível para a Garantia e Segurança ItaBuy</span>
          </div>

          {cartItems.length === 0 ? (
            <div className="py-20 text-center px-4 flex flex-col items-center">
              <span className="text-5xl mb-3">🛒</span>
              <h2 className="text-gray-805 text-[13px] font-bold uppercase tracking-wider">Seu carrinho está vazio</h2>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                Explore nossa página inicial para encontrar os melhores produtos com super descontos e frete grátis!
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              
              {/* Select All Checkbox Card */}
              <div className="bg-white p-3 rounded-xl border border-gray-150 flex items-center justify-between text-xs shadow-xs">
                <label className="flex items-center gap-2.5 font-bold text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={allSelected} 
                    onChange={(e) => onToggleSelectAll(e.target.checked)} 
                    className="w-4.5 h-4.5 rounded-sm accent-brand-blue"
                  />
                  <span>Selecionar todos os itens ({cartItems.length})</span>
                </label>

                <span className="text-gray-400 font-semibold text-[11px]">
                  {selectedItems.length} selecionado(s)
                </span>
              </div>

              {/* List of Items in Cart */}
              <div className="space-y-2.5">
                {cartItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-xl p-3 border ${item.selected ? 'border-brand-blue/35 shadow-xs bg-blue-50/5' : 'border-gray-150'} flex gap-3 transition-all relative`}
                  >
                    {/* Checkbox item */}
                    <div className="flex items-center justify-center pr-0.5 shrink-0">
                      <input 
                        type="checkbox" 
                        checked={item.selected} 
                        onChange={() => onToggleSelectItem(item.id)}
                        className="w-4.5 h-4.5 rounded-sm accent-brand-blue"
                      />
                    </div>

                    {/* Left product image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                      <img src={item.product.images?.[0] || 'https://via.placeholder.com/150'} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Right Info info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="text-gray-900 text-[11.5px] font-bold leading-snug line-clamp-1 pr-6">
                          {item.product.name}
                        </h3>
                        
                        {/* Selected variations */}
                        {item.selectedSpec && Object.keys(item.selectedSpec).length > 0 && (
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {Object.entries(item.selectedSpec).map(([key, value]) => (
                              <span key={key} className="text-[9.5px] bg-slate-50 text-gray-500 px-1.5 py-0.5 rounded-sm border border-gray-150 font-bold">
                                <span className="opacity-60">{key}:</span> {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pb-0.5">
                        {/* Unit price */}
                        <span className="text-xs font-black text-brand-blue">
                          R$ {(item.product.price || 0).toFixed(2)}
                        </span>

                        {/* Quantity controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-3xs">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1 text-xs hover:bg-gray-100 font-black active:scale-90 transition-transform text-gray-500"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-black text-gray-800">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-1 text-xs hover:bg-gray-100 font-black active:scale-90 transition-transform text-gray-500"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove Trash toggle */}
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="absolute top-2.5 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full active:scale-90 transition-transform"
                      aria-label="Apagar Item"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Coupon typing and choosing section */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <Ticket className="w-4.5 h-4.5 text-brand-blue" />
                  <span>CUPOM DO PEDIDO</span>
                </div>

                {/* TEXT INPUT FIELD FOR TYPING COUPON */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={typedCoupon}
                    onChange={(e) => {
                      setTypedCoupon(e.target.value);
                      if (couponFeedback) setCouponFeedback(null);
                    }}
                    placeholder="Digitar código do cupom"
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 uppercase placeholder:text-gray-400 font-bold focus:outline-none focus:border-brand-blue"
                  />
                  <button
                    onClick={handleApplyTypedCoupon}
                    className="bg-brand-blue text-white font-black text-xs px-4 py-2 rounded-lg hover:bg-brand-blue-hover active:scale-95 transition-transform"
                  >
                    APLICAR
                  </button>
                </div>

                {couponFeedback && (
                  <p className={`text-[10.5px] font-bold ${couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-650'}`}>
                    {couponFeedback.type === 'success' ? '🟢 ' : '❌ '}
                    {couponFeedback.text}
                  </p>
                )}

                {/* Quick select list */}
                {coupons.length > 0 && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase">Cupons recomendados:</span>
                    <div className="flex gap-2 overflow-x-auto pb-1 ios-scroll-inertia no-scrollbar">
                      {coupons.map((coupon) => {
                        const eligible = itemsSubtotal >= coupon.minSpent;
                        const isSelected = selectedCoupon?.id === coupon.id;

                        return (
                          <button
                            key={coupon.id}
                            disabled={!eligible && !isSelected}
                            onClick={() => {
                              setSelectedCoupon(isSelected ? null : coupon);
                              setCouponFeedback(null);
                            }}
                            className={`text-[10.5px] px-3 py-2 whitespace-nowrap rounded-lg border flex items-center gap-1.5 transition-all ${
                              isSelected 
                                ? 'bg-brand-blue text-white border-brand-blue font-black shadow-3xs' 
                                : eligible 
                                  ? 'bg-red-50 text-red-650 border-red-200 font-bold' 
                                  : 'bg-gray-50 border-gray-150 text-gray-400 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            {isSelected ? '✓ ' + coupon.code : coupon.code}
                            {!isSelected && !eligible && ` (+R$ ${(coupon.minSpent - itemsSubtotal).toFixed(0)})`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ADDRESS FIELD */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <MapPin className="w-4.5 h-4.5 text-brand-blue" />
                  <span>ENDEREÇO DE ENTREGA (ITACOATIARA)</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block mb-0.5">Rua / Avenida</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Rua Eduardo Ribeiro"
                      className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue font-semibold bg-[#FAFAFA]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block mb-0.5">Número</label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="Ex: 1234, s/n"
                        className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue font-semibold bg-[#FAFAFA]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block mb-0.5">Bairro</label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Ex: Centro"
                        className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue font-semibold bg-[#FAFAFA]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block mb-0.5">Ponto de Referência</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Ex: Em frente à Praça da Matriz"
                      className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-brand-blue font-semibold bg-[#FAFAFA]"
                    />
                  </div>
                </div>

                <span className="text-[9.5px] text-gray-400 font-semibold italic block pt-1">
                  📍 Envio expresso ItaBuy. Entregamos em qualquer bairro de Itacoatiara.
                </span>
              </div>

              {/* FORMA DE PAGAMENTO */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <CreditCard className="w-4.5 h-4.5 text-brand-blue" />
                  <span>FORMA DE PAGAMENTO</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`py-2 px-1 rounded-lg border text-center text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'pix'
                        ? 'border-brand-blue bg-blue-50/50 text-brand-blue shadow-3xs'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base">🌀</span>
                    <span>PIX</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cartao')}
                    className={`py-2 px-1 rounded-lg border text-center text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'cartao'
                        ? 'border-brand-blue bg-blue-50/50 text-brand-blue shadow-3xs'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base">💳</span>
                    <span>CARTÃO</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`py-2 px-1 rounded-lg border text-center text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'dinheiro'
                        ? 'border-brand-blue bg-blue-50/50 text-brand-blue shadow-3xs'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base">💵</span>
                    <span>DINHEIRO</span>
                  </button>
                </div>

                {/* Warning for CARD */}
                {paymentMethod === 'cartao' && (
                  <div className="bg-blue-50/70 border border-brand-blue/20 p-3 rounded-lg text-xs leading-relaxed text-brand-blue font-bold">
                    📌 Pagamento na Entrega
                    <p className="text-[11px] font-semibold text-gray-700 mt-1">
                      O pagamento será realizado no momento da entrega do produto utilizando a nossa maquininha em seu endereço (débito ou crédito).
                    </p>
                  </div>
                )}

                {/* Option for CASH */}
                {paymentMethod === 'dinheiro' && (
                  <div className="bg-slate-50 border border-gray-200 p-3 rounded-lg space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>💵 Precisa de troco?</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={needsChange === false}
                            onChange={() => setNeedsChange(false)}
                            className="accent-brand-blue"
                          />
                          <span>Não</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={needsChange === true}
                            onChange={() => setNeedsChange(true)}
                            className="accent-brand-blue"
                          />
                          <span>Sim</span>
                        </label>
                      </div>
                    </div>

                    {needsChange && (
                      <div className="space-y-1 select-none animate-fade-in pt-1.5 border-t border-gray-200">
                        <label className="block text-[10px] font-bold text-gray-505 uppercase">Qual o valor do troco?</label>
                        <input
                          type="text"
                          value={changeAmount}
                          onChange={(e) => setChangeAmount(e.target.value)}
                          placeholder="Ex: Troco para R$ 100,00"
                          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-blue font-bold bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summary Breakdown block */}
              {selectedItems.length > 0 && (
                <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-2xs space-y-2 text-xs text-gray-600 select-none">
                  <div className="flex justify-between">
                    <span>Subtotal ({selectedItems.length} itens)</span>
                    <span className="font-bold text-gray-800">R$ {itemsSubtotal.toFixed(2)}</span>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-red-650 font-bold">
                      <span>Desconto Cupom ({selectedCoupon?.code})</span>
                      <span>- R$ {couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Custo Frete</span>
                    <span className="text-brand-blue font-black">Grátis 🚚</span>
                  </div>

                  <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-sm text-gray-900">
                    <span>Total Estimado</span>
                    <span className="text-brand-blue text-base">R$ {orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Bottom Checkout bar */}
              <div className="fixed bottom-14 left-0 right-0 z-40 bg-white border-t border-gray-150 shadow-md">
                <div className="mx-auto max-w-md h-14 px-3.5 flex items-center justify-between">
                  
                  <div className="flex flex-col select-none">
                    <span className="text-[10px] text-gray-400 leading-none font-bold uppercase tracking-wider">Preço final</span>
                    <span className="text-brand-blue font-black text-base leading-tight">
                      R$ {selectedItems.length > 0 ? orderTotal.toFixed(2) : '0,00'}
                    </span>
                  </div>

                  <button
                    onClick={handleSubmitCheckout}
                    disabled={selectedItems.length === 0}
                    className={`px-5 py-2.5 rounded-lg font-black text-xs tracking-wider uppercase transition-transform active:scale-97 select-none ${
                      selectedItems.length > 0 
                      ? 'bg-brand-blue text-white hover:bg-brand-blue-hover cursor-pointer shadow-sm' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    FINALIZAR PEDIDO
                  </button>

                </div>
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}
