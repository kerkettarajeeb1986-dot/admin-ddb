import React from 'react';
import { X, QrCode } from 'lucide-react';

export const UpiQrPreviewModals: React.FC<{ isOpen: boolean; onClose: () => void; upiId: string; payeeName: string }> = ({
  isOpen,
  onClose,
  upiId,
  payeeName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-xl border border-gray-200">
        <div className="flex justify-end">
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg">UPI Payment Receiver</h3>
        <p className="text-xs text-gray-500 mt-1">{payeeName}</p>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg font-mono text-sm border border-gray-200">
          {upiId}
        </div>
      </div>
    </div>
  );
};
