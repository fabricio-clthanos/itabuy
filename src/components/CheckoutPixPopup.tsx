import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Copy, CheckCircle2, Loader2, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Helper to dynamically get host URL for separate deployments (like Vercel)
const getApiBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_API_URL || '';
  const cleanUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  
  // If the target URL contains "run.app", it belongs to the temporary platform container.
  // Direct cross-origin calls to the platform preview host (run.app) will fail with CORS / security blocks.
  // We MUST use relative paths ('') on both our local/Cloud Run environments and Vercel environments
  // to ensure same-origin requests succeed natively.
  if (cleanUrl.includes('run.app')) {
    return '';
  }
  
  return cleanUrl;
};

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
        const baseUrl = getApiBaseUrl();
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
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative font-sans border border-gray-150"
      >
        <div className="p-5 text-center font-sans">
          
          {/* Header row with a compact logo */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="text-left font-sans">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Pagamento Expresso Pix</h2>
              <p className="text-[10px] text-gray-400 font-bold font-mono">Pedido #{orderId}</p>
            </div>
            
            {/* Pix Logo Tag Style */}
            <div className="px-2.5 py-1 bg-[#24d3c3]/15 text-[#1db8ab] font-black rounded text-[11px] select-none uppercase tracking-wide flex items-center gap-1 font-mono">
              ❖ Pix
            </div>
          </div>

          {/* Compact Total Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center mb-4 text-sm select-none font-sans">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Valor total à pagar:</span>
            <span className="text-base font-black text-slate-900">R$ {(total || 0).toFixed(2)}</span>
          </div>

          {status === 'confirmed' ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-6 flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
              </div>
              <h3 className="text-md font-black text-emerald-600 uppercase tracking-wider">Pagamento Confirmado!</h3>
              <p className="text-[11px] text-gray-500 font-bold mt-1.5 uppercase tracking-wide">Expedição ItaBuy recebeu seu saldo.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              
              {/* QR Code section */}
              <div className="flex flex-col items-center select-none font-sans">
                <div className="p-2 bg-white border border-gray-150 rounded-xl shadow-xs">
                  <img 
                    src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                    alt="QR Code Pix"
                    className="w-36 h-36"
                  />
                </div>
                <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-widest mt-2 font-sans">Aponte a câmera do celular para escanear</span>
              </div>

              {/* Copy Code Area */}
              <div className="space-y-2">
                <div className="text-[9.5px] text-slate-400 font-black uppercase tracking-widest text-left font-sans">Código Pix (Copia e Cola):</div>
                
                {/* Permanent Copy Button */}
                <button 
                  onClick={handleCopy}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-97 cursor-pointer border ${
                    copied 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250 shadow-xs' 
                      : 'bg-[#2c3e50] text-white hover:bg-[#34495e] border-[#2c3e50] shadow-sm'
                  }`}
                >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {copied ? 'Código Copiado!' : 'Copiar Código Pix'}
                </button>
                
                {/* Visual String Box */}
                <div 
                  onClick={handleCopy}
                  className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-left select-all cursor-pointer group active:bg-slate-100/80"
                >
                  <p className="text-[9px] font-mono text-gray-400 break-all line-clamp-2 leading-relaxed selection:bg-brand-blue/20">
                    {pixData.qr_code}
                  </p>
                </div>
              </div>

              {/* Status Loader */}
              <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50/20 border border-emerald-100/10 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider animate-pulse">
                  Aguardando confirmação automática...
                </span>
              </div>

              {/* Close Button Option */}
              <button 
                onClick={onClose}
                className="w-full py-2 bg-slate-150 hover:bg-slate-200 text-slate-500 rounded-xl text-[10.5px] font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 border border-slate-200"
              >
                Voltar aos Meus Pedidos
              </button>

              <p className="text-[9.5px] text-gray-400 font-bold leading-normal px-2">
                O pagamento é processado instantaneamente pelo Mercado Pago. Após pagar, esta tela fechará sozinha.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
