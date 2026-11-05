import React from 'react';
import { X } from 'lucide-react';

export const UnifiedAuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Sign In to Dooars Basket</h3>
        <p className="text-xs text-gray-500 mb-4">Please select your account type to proceed.</p>
        <button onClick={onClose} className="w-full py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold">
          Close
        </button>
      </div>
    </div>
  );
};
