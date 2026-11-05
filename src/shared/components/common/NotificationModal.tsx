import React from 'react';
import { X, Bell } from 'lucide-react';

export const NotificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400">
          <X className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mb-3">
          <Bell className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Notifications</h3>
        <p className="text-xs text-gray-500">No new alerts at this moment.</p>
      </div>
    </div>
  );
};
