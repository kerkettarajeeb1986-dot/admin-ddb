import React, { useState, useEffect } from 'react';
import { X, Layers, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ProductCategory, CANONICAL_CATEGORIES } from '../../types';
import { categoryService } from '../../services/categoryService';

export const CategoryManagerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>(() => categoryService.getCachedCategories());

  useEffect(() => {
    const unsub = categoryService.subscribeToCategories((cats) => {
      setCategories(cats);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Store Categories (14 श्रेणियां)</h3>
              <p className="text-xs text-gray-500">Official catalog categories authorized for Dooars Daily Basket.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 divide-y divide-gray-100 pr-1 space-y-1">
          {categories.map((cat, idx) => (
            <div key={cat.id} className="py-2.5 px-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}.</span>
                <span className="text-xl p-1 bg-gray-50 rounded-lg shrink-0">{cat.icon || '🏷️'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900 truncate">{cat.name}</span>
                    {cat.hindiName && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-medium shrink-0">
                        {cat.hindiName}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate max-w-xs">{cat.description || cat.name}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  cat.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cat.isEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin-managed platform categories</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
