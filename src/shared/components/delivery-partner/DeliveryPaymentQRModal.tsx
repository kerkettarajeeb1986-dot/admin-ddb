import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, Banknote, ShieldCheck, Copy, Check, Smartphone, IndianRupee } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { GroceryOrder } from '../../types';
import { MasterSettings } from '../../types/settings';

interface DeliveryPaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: GroceryOrder;
  masterSettings: MasterSettings;
  riderName: string;
  onConfirmPayment: (orderId: string, method: 'upi' | 'cod', amount: number, transactionRef?: string) => Promise<void>;
}

export const DeliveryPaymentQRModal: React.FC<DeliveryPaymentQRModalProps> = ({
  isOpen,
  onClose,
  order,
  masterSettings,
  riderName,
  onConfirmPayment,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [txnRef, setTxnRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upi_qr' | 'cash'>('upi_qr');
  // Default to static_customer_fills so the QR code is fixed and customer enters order amount
  const [modalQrMode, setModalQrMode] = useState<'static_customer_fills' | 'dynamic_order_amount'>(
    masterSettings.upiQrMode === 'dynamic_order_amount' ? 'dynamic_order_amount' : 'static_customer_fills'
  );

  if (!isOpen) return null;

  const upiId = masterSettings.upiId || 'dooarsbasket@upi';
  const payeeName = masterSettings.upiPayeeName || masterSettings.appName || 'Dooars Daily Basket Pvt Ltd';
  const amount = order.totalAmount;
  
  // Standard NPCI UPI URI:
  // In Fix QR mode (static_customer_fills), NO am= parameter is passed, so the customer's UPI app asks them to enter the order amount.
  const upiPaymentUri =
    modalQrMode === 'static_customer_fills'
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR`
      : `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
          payeeName
        )}&am=${amount}&cu=INR&tn=${encodeURIComponent('Order ' + order.orderNumber)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  const handleConfirmUpi = async () => {
    setLoading(true);
    try {
      await onConfirmPayment(order.id, 'upi', amount, txnRef.trim());
      onClose();
    } catch (e: any) {
      alert(e.message || 'Payment confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCash = async () => {
    if (!window.confirm(`Confirm collection of cash ₹${amount} from customer ${order.customerName}?`)) {
      return;
    }
    setLoading(true);
    try {
      await onConfirmPayment(order.id, 'cod', amount);
      onClose();
    } catch (e: any) {
      alert(e.message || 'Cash confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pb-3 border-b border-gray-100">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
            Order #{order.orderNumber}
          </span>
          <h3 className="text-lg font-extrabold text-gray-900 mt-1">Collect Customer Payment</h3>
          <p className="text-xs text-gray-500">
            Customer: <strong className="text-gray-800">{order.customerName}</strong> ({order.customerPhone})
          </p>
        </div>

        {/* Tab Switcher: QR Code vs Cash */}
        <div className="flex bg-gray-100 p-1 rounded-xl mt-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upi_qr')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'upi_qr'
                ? 'bg-white text-emerald-800 shadow-sm font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>UPI QR Code (Scan & Pay)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cash')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'cash'
                ? 'bg-white text-emerald-800 shadow-sm font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>Cash on Delivery</span>
          </button>
        </div>

        {/* Amount Badge */}
        <div className="mt-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3 text-center">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-700">Total Collectible Amount</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 flex items-center justify-center gap-2">
            <span>₹{amount}</span>
            <button
              type="button"
              onClick={handleCopyAmount}
              className="text-xs px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold flex items-center gap-1 transition"
              title="Copy Amount"
            >
              {copiedAmount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedAmount ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center justify-center gap-2">
            <span>Items: ₹{order.subtotal || (amount - (order.deliveryFee || 0) - (order.packagingFee || 0))}</span>
            <span>•</span>
            <span>Delivery: ₹{order.deliveryFee || 0}</span>
            <span>•</span>
            <span>Pack: ₹{order.packagingFee || 0}</span>
          </div>
        </div>

        {activeTab === 'upi_qr' ? (
          <div className="space-y-3.5 mt-3.5">
            {/* QR Mode Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl text-[11px] font-semibold gap-1">
              <button
                type="button"
                onClick={() => setModalQrMode('static_customer_fills')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition ${
                  modalQrMode === 'static_customer_fills'
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900 bg-white/60'
                }`}
              >
                <span>📌 Fix QR (Customer Fills Amount)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalQrMode('dynamic_order_amount')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition ${
                  modalQrMode === 'dynamic_order_amount'
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900 bg-white/60'
                }`}
              >
                <span>⚡ Dynamic QR (₹{amount} Locked)</span>
              </button>
            </div>

            {/* QR Code Card */}
            <div className="bg-white border-2 border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm relative">
              <div className="mb-2 text-center">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                  {modalQrMode === 'static_customer_fills'
                    ? '📌 Fix QR Code (Amount Not Fixed)'
                    : `⚡ Pre-Filled QR (₹${amount})`}
                </span>
              </div>

              <div className="p-2 bg-white rounded-xl shadow-inner border border-gray-100">
                <QRCodeSVG
                  value={upiPaymentUri}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Supported apps icons */}
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-600">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">Google Pay</span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">PhonePe</span>
                <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md">Paytm</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">BHIM / CRED</span>
              </div>

              <div className="mt-2 text-center">
                <p className="text-xs font-semibold text-gray-800">
                  {modalQrMode === 'static_customer_fills' ? (
                    <>
                      Customer Order Amount भरेगा:{' '}
                      <span className="text-emerald-700 font-extrabold text-sm">₹{amount}</span>
                    </>
                  ) : (
                    <>
                      Scan to Pay:{' '}
                      <span className="text-emerald-700 font-extrabold text-sm">₹{amount}</span>
                    </>
                  )}
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="text-[11px] font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="text-gray-400 hover:text-emerald-700 p-0.5"
                    title="Copy UPI ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Payee: {payeeName}</p>
              </div>
            </div>

            {/* Instruction Box in Hindi */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11.5px] leading-relaxed">
                  <p>
                    <strong>पैसे सीधे कंपनी के बैंक खाते ({upiId}) में जमा होंगे।</strong>
                  </p>
                  {modalQrMode === 'static_customer_fills' ? (
                    <p className="text-emerald-900 font-medium">
                      📌 <strong>Fix QR Code:</strong> क्यूआर कोड फिक्स है (राशि लॉक नहीं है)। ग्राहक को अपना PhonePe / Google Pay / Paytm खोलकर स्कैन करने को कहें और ऐप में ऑर्डर राशि <strong className="text-emerald-950 font-black underline">₹{amount}</strong> दर्ज करके भुगतान करने को कहें।
                    </p>
                  ) : (
                    <p className="text-emerald-800">
                      ⚡ ग्राहक को अपना कोई भी UPI App खोलकर यह QR कोड स्कैन करने को कहें। राशि (₹{amount}) अपने-आप दर्ज रहेगी।
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Optional UTR / Reference */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                UPI Reference / UTR Number (Optional)
              </label>
              <input
                type="text"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="e.g. 12-digit UTR or last 4 digits"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Confirmation CTA */}
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmUpi}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Confirming...' : `Payment Received via QR • Mark Delivered (₹${amount})`}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
              <Banknote className="w-10 h-10 text-amber-600 mx-auto" />
              <h4 className="font-bold text-gray-900 text-sm">Cash on Delivery Collection</h4>
              <p className="text-xs text-gray-600">
                Please collect exact cash of <strong className="text-amber-800 font-extrabold text-base">₹{amount}</strong> from customer <strong>{order.customerName}</strong>.
              </p>
              <div className="p-2 bg-white rounded-lg text-[11px] text-gray-500 border border-amber-100">
                Cash collected will be recorded in your Driver Wallet reconciliation for handover to Super Admin.
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmCash}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Recording...' : `Confirm Cash Received • Mark Delivered (₹${amount})`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
