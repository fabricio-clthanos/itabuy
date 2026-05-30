import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent browser from showing the default prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      // Logic to show our custom prompt after a short delay
      const hasShown = localStorage.getItem('itabuy_install_prompt_shown');
      if (!hasShown) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback for testing or if the event already fired
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    if (!isStandalone) {
       const hasShown = localStorage.getItem('itabuy_install_prompt_shown');
       if (!hasShown) {
          // If we can't capture the event yet, we still show a "how to install" or just wait
        }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If prompt is not available, alert the user on how to install manually
      alert("Para instalar\n\n1. Toque no ícone de compartilhamento (iPhone) ou no menu de 3 pontos (Android)\n2. Selecione 'Adicionar à Tela de Início'");
      setShowPrompt(false);
      localStorage.setItem('itabuy_install_prompt_shown', 'true');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('itabuy_install_prompt_shown', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('itabuy_install_prompt_shown', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:w-80"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-50 p-5 relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50" />
             
             <button 
               onClick={handleDismiss}
               className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
             >
               <X size={18} />
             </button>

             <div className="flex items-start gap-4">
                <div className="bg-brand-blue/10 p-3 rounded-xl text-brand-blue shrink-0">
                   <Smartphone size={24} />
                </div>
                <div className="flex-1">
                   <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest leading-tight">
                     Instalar ItaBuy
                   </h3>
                   <p className="text-[11px] text-gray-500 mt-1 font-medium leading-relaxed">
                     Tenha acesso mais rápido e receba notificações exclusivas direto no seu celular.
                   </p>
                   
                   <button
                     onClick={handleInstallClick}
                     className="mt-4 w-full bg-brand-blue text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                   >
                     <Download size={14} /> Baixar Aplicativo
                   </button>
                </div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
