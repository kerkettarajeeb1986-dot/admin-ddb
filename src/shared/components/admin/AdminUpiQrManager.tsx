import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Save,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Bike,
  ShoppingBag,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Download,
  Printer,
  Info,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { UpiQrMode } from '../../types/settings';

export const AdminUpiQrManager: React.FC = () => {
  const { masterSettings } = useStore();

  const [upiId, setUpiId] = useState(masterSettings.upiId || 'dooarsbasket@upi');
  const [upiPayeeName, setUpiPayeeName] = useState(masterSettings.upiPayeeName || 'Dooars Daily Basket Pvt Ltd');
  const [qrMode, setQrMode] = useState<UpiQrMode>(masterSettings.upiQrMode || 'static_customer_fills');
  const [testAmount, setTestAmount] = useState<number>(350);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync if settings change in Firestore
  useEffect(() => {
    if (masterSettings.upiId) setUpiId(masterSettings.upiId);
    if (masterSettings.upiPayeeName) setUpiPayeeName(masterSettings.upiPayeeName);
    if (masterSettings.upiQrMode) setQrMode(masterSettings.upiQrMode);
  }, [masterSettings.upiId, masterSettings.upiPayeeName, masterSettings.upiQrMode]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    if (!upiId.trim()) {
      setErrorMessage('Please enter a valid UPI ID (e.g. yourname@upi or phone@paytm)');
      return;
    }

    setIsSaving(true);
    try {
      await settingsService.updateSettings({
        upiId: upiId.trim(),
        upiPayeeName: upiPayeeName.trim() || 'Dooars Daily Basket',
        upiQrMode: qrMode,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save UPI settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate UPI URI based on selected mode:
  // Static Fix QR mode: No am= parameter so customer fills amount in their UPI app
  // Dynamic mode: Includes am= parameter with pre-locked amount
  const liveUpiUri =
    qrMode === 'static_customer_fills'
      ? `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(
          upiPayeeName.trim() || 'Dooars Daily Basket'
        )}&cu=INR`
      : `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(
          upiPayeeName.trim() || 'Dooars Daily Basket'
        )}&am=${testAmount}&cu=INR&tn=${encodeURIComponent('Dooars Order')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase rounded-md tracking-wider">
              {qrMode === 'static_customer_fills' ? '📌 Fix QR Mode (Customer Fills Amount)' : '⚡ Dynamic QR'}
            </span>
            <span className="text-xs text-gray-500 font-medium">Real-Time Sync</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2 mt-1">
            <QrCode className="w-6 h-6 text-emerald-700" />
            <span>UPI QR Code & Payment Setup (क्यूआर कोड प्रबंधन)</span>
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Configure Fix QR code or Dynamic QR code for customer checkout and delivery partner doorstep collections.
          </p>
        </div>

        {isSaved && (
          <div className="px-3.5 py-2 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Saved! QR code is now live on Delivery & Customer Apps</span>
          </div>
        )}

        {errorMessage && (
          <div className="px-3.5 py-2 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Settings Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Bank Account / UPI Credentials</span>
              </h3>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Direct Settlement • 0% Fee
              </span>
            </div>

            {/* QR Code Mode Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                QR Code Amount Mode (क्यूआर कोड टाइप चुनें) <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Fix Static QR (Customer Fills Amount) */}
                <div
                  onClick={() => setQrMode('static_customer_fills')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition relative ${
                    qrMode === 'static_customer_fills'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          qrMode === 'static_customer_fills'
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {qrMode === 'static_customer_fills' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-gray-900">📌 Fix Static QR Code</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      User Requested
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                    <strong>Fix amount nahi hoga:</strong> QR code hamesha fix rahega. Customer scan karke apna order amount khud bharega aur payment karega.
                  </p>
                </div>

                {/* Option 2: Dynamic QR with pre-locked amount */}
                <div
                  onClick={() => setQrMode('dynamic_order_amount')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition relative ${
                    qrMode === 'dynamic_order_amount'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          qrMode === 'dynamic_order_amount'
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {qrMode === 'dynamic_order_amount' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-gray-900">⚡ Dynamic Pre-filled QR</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                    Har order ke total bill ka amount QR code me pehle se lock/darj rahega. Customer ko amount type nahi karna padega.
                  </p>
                </div>
              </div>
            </div>

            {/* UPI ID Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Admin Platform UPI ID / VPA <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. dooarsbasket@upi or 9800012345@paytm"
                  className="w-full pl-3 pr-24 py-2.5 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="absolute right-2 top-2 px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Aapka official Google Pay, PhonePe, Paytm, ya Bank ka UPI ID jahan customer ka paisa direct credit hoga.
              </p>
            </div>

            {/* Payee Name Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                UPI Merchant / Payee Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={upiPayeeName}
                onChange={(e) => setUpiPayeeName(e.target.value)}
                placeholder="e.g. Dooars Daily Basket Pvt Ltd"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Customer jab apne PhonePe ya Google Pay se scan karega to yahi dukaan / company ka naam dikhai dega.
              </p>
            </div>

            {/* Conditional: Dynamic QR Simulator */}
            {qrMode === 'dynamic_order_amount' ? (
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Preview Order Bill Amount (Test Simulator)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold font-mono text-emerald-800"
                  />
                  <span className="text-xs text-gray-500">
                    (Test scan karte waqt QR me yeh amount lock rahega)
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Fix QR Code Mode Active:</strong> Is QR code me koi fix amount lock nahi hai. Yeh QR code 100% fix rahega. Customer scan karke apna order amount (jaise ₹350, ₹520) khud type karke pay karega.
                </div>
              </div>
            )}

            {/* Save CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Updating Firebase...' : 'Save & Publish Live QR Code (सेव करें)'}</span>
              </button>
            </div>
          </form>

          {/* Operational Workflow Explainer */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Yeh QR Code Kahan-Kahan Kaam Karega?</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>1. Delivery Partner App</span>
                </div>
                <p className="text-gray-600 text-[11.5px] leading-relaxed">
                  Delivery Partner jab customer ke ghar pahuchega, to uski screen par yeh QR code dikhega. Customer scan karke order amount bhar kar pay karega.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>2. Customer Checkout</span>
                </div>
                <p className="text-gray-600 text-[11.5px] leading-relaxed">
                  Customer agar checkout par online pay karna chahega to website par yahi QR code dikhega aur amount enter karke turant pay kar sakega.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Code Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800 inline-block">
                {qrMode === 'static_customer_fills' ? '📌 Live Fixed QR Code' : '⚡ Dynamic QR Code'}
              </span>
              <h3 className="text-base font-extrabold text-white">Interactive UPI QR Code</h3>
              <p className="text-xs text-slate-400">
                {qrMode === 'static_customer_fills'
                  ? 'Scan karne par customer ka UPI app amount poochhega'
                  : 'Scan karne par amount pehle se bhar ke aayega'}
              </p>
            </div>

            {/* QR Card */}
            <div className="bg-white rounded-2xl p-4 inline-block shadow-2xl border-4 border-emerald-500/40">
              <QRCodeSVG
                value={liveUpiUri}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Amount & Destination info */}
            <div className="space-y-1.5 text-xs">
              {qrMode === 'static_customer_fills' ? (
                <div className="py-1 px-3 bg-emerald-950/90 border border-emerald-700/60 rounded-xl inline-block text-emerald-300 font-bold text-xs">
                  ₹ [ ग्राहक ऑर्डर राशि खुद भरेगा / Customer Fills Amount ]
                </div>
              ) : (
                <div className="text-2xl font-black text-emerald-400">₹{testAmount}.00</div>
              )}
              <div className="font-mono text-slate-300 text-xs bg-slate-800/80 py-1 px-3 rounded-lg inline-block border border-slate-700">
                {upiId}
              </div>
              <div className="text-[11px] text-slate-400">
                Payee: <strong className="text-slate-200">{upiPayeeName}</strong>
              </div>
            </div>

            {/* Supported App Badges */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded border border-blue-700">Google Pay</span>
              <span className="px-2 py-0.5 bg-purple-900/60 text-purple-300 rounded border border-purple-700">PhonePe</span>
              <span className="px-2 py-0.5 bg-sky-900/60 text-sky-300 rounded border border-sky-700">Paytm</span>
              <span className="px-2 py-0.5 bg-amber-900/60 text-amber-300 rounded border border-amber-700">BHIM UPI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
