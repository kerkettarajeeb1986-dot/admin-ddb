import React from 'react';
import { Truck, CheckCircle2, Clock, MapPin, Bike, QrCode, Banknote, ShieldCheck } from 'lucide-react';
import { GroceryOrder } from '../../types';

export const CustomerOrderTracking: React.FC<{ order: GroceryOrder }> = ({ order }) => {
  const isPaid = order.paymentStatus === 'completed';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <span className="text-[11px] font-mono text-gray-500">Order #{order.orderNumber}</span>
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5 mt-0.5">
            <Truck className="w-4 h-4 text-emerald-700" />
            <span className="capitalize">{order.status.replace(/_/g, ' ')}</span>
          </h3>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold">
            {order.localAreaName}
          </span>
          <div className="text-xs font-extrabold text-emerald-900 mt-1">₹{order.totalAmount}</div>
        </div>
      </div>

      {/* Payment Status Info */}
      <div className="bg-gray-50 rounded-xl p-3 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          {order.paymentMethod === 'upi' ? (
            <QrCode className="w-4 h-4 text-purple-600" />
          ) : (
            <Banknote className="w-4 h-4 text-emerald-600" />
          )}
          <div>
            <div className="font-bold text-gray-800">
              {order.paymentMethod === 'upi'
                ? 'UPI QR Code Payment'
                : order.isCOD
                ? 'Pay on Delivery (Cash / QR)'
                : 'Online Payment'}
            </div>
            <div className="text-[10px] text-gray-500">
              {isPaid
                ? 'Payment completed successfully'
                : 'Pay to delivery rider via Cash or scan rider QR code'}
            </div>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {isPaid ? '✓ Paid' : '⏳ Pending'}
        </span>
      </div>

      {/* Rider Info if assigned */}
      {order.deliveryPartnerName && (
        <div className="flex items-center gap-2 text-xs text-gray-700 bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl">
          <Bike className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            Assigned Delivery Rider: <strong>{order.deliveryPartnerName}</strong>
          </span>
        </div>
      )}

      {/* Address */}
      <div className="flex items-start gap-2 text-xs text-gray-600 pt-1">
        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          Destination: {order.shippingAddress?.street || 'Local Area'}, PIN: {order.shippingAddress?.pinCode || ''}
        </span>
      </div>
    </div>
  );
};
