import React, { useState } from 'react';
import { Product } from '../types';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OptionsPickerPopupProps {
  product: Product;
  onConfirm: (selections: { [key: string]: string }) => void;
  onCancel: () => void;
}

export default function OptionsPickerPopup({ product, onConfirm, onCancel }: OptionsPickerPopupProps) {
  const [selections, setSelections] = useState<{ [key: string]: string }>({});

  const allSelected = product.availableOptions?.every(opt => selections[opt.name]) ?? true;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-gray-900">Escolha as opções</h3>
            <p className="text-xs text-gray-400 font-medium">Selecione antes de adicionar ao carrinho</p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-950 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="flex gap-4 items-center mb-4">
            <img src={product.images[0]} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
            <div>
              <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
              <p className="text-indigo-600 font-black">R$ {product.price.toFixed(2)}</p>
            </div>
          </div>

          {product.availableOptions?.map((opt, optIdx) => (
            <div key={`${opt.name}-${optIdx}`} className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{opt.name}</label>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((v, valIdx) => {
                  const label = typeof v === 'string' ? v : v.label;
                  const stock = typeof v === 'string' ? 10 : (v.stock ?? 10);
                  const isSelected = selections[opt.name] === label;
                  const isOutOfStock = stock === 0;
                  
                  return (
                    <button
                      key={`${label}-${valIdx}`}
                      disabled={isOutOfStock}
                      onClick={() => setSelections(prev => ({ ...prev, [opt.name]: label }))}
                      className={`
                        group relative py-2.5 px-4 rounded-xl border text-sm font-bold transition-all
                        ${isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                          : isOutOfStock 
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                        }
                      `}
                    >
                      {label}
                      {stock !== undefined && stock < 5 && stock > 0 && !isSelected && (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full shadow-sm">
                          {stock} un
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => onConfirm(selections)}
            disabled={!allSelected}
            className={`
              w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all
              ${allSelected 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-[0.98]' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Confirmar Seleção <Check size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
