import { Trophy, Compass, Sparkles } from 'lucide-react';

interface SorteiosViewProps {
  onShowToast?: (message: string) => void;
}

export default function SorteiosView({ onShowToast }: SorteiosViewProps) {
  return (
    <div className="flex-grow bg-[#F5F5F5] pb-24 flex flex-col justify-center items-center px-6 text-center select-none font-sans min-h-[60vh]">
      
      {/* Visual Container */}
      <div className="bg-white p-8 rounded-2xl border border-gray-150 shadow-sm max-w-sm w-full flex flex-col items-center animate-fade-in">
        
        {/* Animated Icon Ring */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border-2 border-brand-blue/10 text-brand-blue/80 animate-pulse">
            <Trophy className="w-10 h-10 stroke-[1.5]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-yellow border-2 border-white"></span>
          </span>
        </div>

        {/* Title */}
        <h2 className="text-gray-900 font-black text-base uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-brand-blue" />
          Sorteios Premiados
        </h2>

        {/* Under Development Badge */}
        <span className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-brand-blue/20 text-brand-blue text-[10.5px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-4 shadow-2xs">
          🚧 Em Desenvolvimento 🚧
        </span>

        {/* Informational Text */}
        <p className="text-xs text-gray-500 leading-relaxed max-w-[280px]">
          Estamos preparando uma plataforma incrível de prêmios e sorteios semanais gratuitos para nossos clientes especiais!
        </p>

        {/* Divider line */}
        <div className="w-full h-[1px] bg-gray-100 my-5" />

        {/* Meta details */}
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
          <Compass className="w-3.5 h-3.5" />
          <span>Lançamento em Breve</span>
        </div>

      </div>

    </div>
  );
}
