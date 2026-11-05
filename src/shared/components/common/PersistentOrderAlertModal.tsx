import React from 'react';
import { Bell, X } from 'lucide-react';

export const PersistentOrderAlertModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white border border-emerald-300 rounded-xl p-4 shadow-xl flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
        <Bell className="w-4 h-4" />
      </div>
      <div className="flex-1 text-xs">
        <p className="font-bold text-gray-900">New Order Activity</p>
        <p className="text-gray-500 mt-0.5">Your grocery dispatch queue is active.</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
