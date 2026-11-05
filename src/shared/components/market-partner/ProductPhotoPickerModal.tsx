import React from 'react';
import { X, Image } from 'lucide-react';

export const ProductPhotoPickerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-gray-900 text-lg mb-2">Select Product Image</h3>
        <p className="text-xs text-gray-500 mb-4">Choose from gallery or upload fresh produce snapshot.</p>
        <button onClick={onClose} className="w-full py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold">
          Close
        </button>
      </div>
    </div>
  );
};
