import React from 'react';
import { X, Wallet, ArrowUpRight, TrendingUp } from 'lucide-react';

export const MarketPartnerWalletView: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Merchant Settlement Wallet</h3>
            <p className="text-xs text-gray-500">Weekly bank credits & gross earnings</p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center space-y-1">
          <span className="text-xs text-emerald-700 font-medium">Available Balance</span>
          <div className="text-3xl font-bold text-emerald-900">₹0.00</div>
          <p className="text-[11px] text-emerald-600">Disbursed automatically every Monday by Super Admin</p>
        </div>

        <button onClick={onClose} className="w-full mt-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold">
          Close
        </button>
      </div>
    </div>
  );
};
