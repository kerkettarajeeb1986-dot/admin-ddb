import React from 'react';
import { X, Printer } from 'lucide-react';
import { GroceryOrder } from '../../types';

export const OrderReceiptModal: React.FC<{ order: GroceryOrder | null; onClose: () => void }> = ({
  order,
  onClose,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Order Invoice #{order.orderNumber}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4 space-y-2 text-sm">
          <p><span className="text-gray-500">Customer:</span> {order.customerName}</p>
          <p><span className="text-gray-500">Area:</span> {order.localAreaName}</p>
          <p><span className="text-gray-500">Total:</span> ₹{order.totalAmount}</p>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-sm"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>
    </div>
  );
};
