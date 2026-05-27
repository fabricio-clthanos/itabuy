import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Copy, CheckCircle2, Loader2, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface CheckoutPixPopupProps {
  orderId: string;
  total: number;
  pixData: {
    qr_code: string;
    qr_code_base64: string;
  };
  onSuccess: () => void;
  onClose: () => void;
}

export default function CheckoutPixPopup({ orderId, total, pixData, onSuccess, onClose }: CheckoutPixPopupProps) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'pending' | 'confirmed'>('pending');

  // Monitor order status in Firestore and poll backend as fallback
  useEffect(() => {
    // Firestore listener (Passive)
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.paid === true) {
          setStatus('confirmed');
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    });

    // Polling Backend (Active fallback for when webhooks fail)
    const pollInterval = setInterval(async () => {
      if (status === 'confirmed') return;
      
      try {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${baseUrl}/api/check-payment/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'approved') {
            setStatus('confirmed');
          }
        }
      } catch (err) {
        console.error("Polling check-payment error:", err);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      unsub();
      clearInterval(pollInterval);
    };
  }, [orderId, onSuccess, status]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixData.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative"
      >
        <div className="p-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-3xl">🌀</span>
            </div>
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-1">Pagamento via Pix</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Pedido #{orderId}</p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
            <div className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">Valor Total</div>
            <div className="text-2xl font-black text-brand-blue">R$ {total.toFixed(2)}</div>
          </div>

          {status === 'confirmed' ? (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="py-8 flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black text-emerald-600">Pagamento Confirmado!</h3>
              <p className="text-xs text-gray-500 font-bold mt-2">Estamos preparando seu pedido...</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="p-3 bg-white border-4 border-gray-50 rounded-2xl shadow-sm">
                  <img 
                    src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                    alt="QR Code Pix"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Copia e Cola</div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group">
                  <p className="text-[10px] font-mono text-gray-500 break-all line-clamp-2 text-left">
                    {pixData.qr_code}
                  </p>
                  <button 
                    onClick={handleCopy}
                    className="absolute inset-0 bg-brand-blue/0 hover:bg-brand-blue/5 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 rounded-2xl"
                  >
                    <div className="bg-brand-blue text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg">
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      {copied ? 'Copiado!' : 'Copiar Código'}
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-3 py-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
                  <span className="text-[11px] text-brand-blue font-black uppercase tracking-wider">
                    Aguardando Pagamento...
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-4">
                O pagamento é processado instantaneamente pelo Mercado Pago. Após pagar, esta tela fechará sozinha.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
