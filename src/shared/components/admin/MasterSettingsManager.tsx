import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, QrCode, Smartphone, ExternalLink, ShieldCheck, Info, Building2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { UpiQrMode } from '../../types/settings';

interface MasterSettingsManagerProps {
  onNavigateTab?: (tab: string) => void;
}

export const MasterSettingsManager: React.FC<MasterSettingsManagerProps> = ({ onNavigateTab }) => {
  const { masterSettings, businessSettings, updateBusinessSettings } = useStore();
  const [appName, setAppName] = useState(masterSettings.appName || businessSettings.businessName);
  const [supportPhone, setSupportPhone] = useState(masterSettings.supportPhone || businessSettings.supportWhatsApp);
  const [supportEmail, setSupportEmail] = useState(masterSettings.supportEmail || businessSettings.supportEmail);
  const [upiId, setUpiId] = useState(masterSettings.upiId);
  const [upiPayeeName, setUpiPayeeName] = useState(masterSettings.upiPayeeName || 'Dooars Daily Basket');
  const [upiQrMode, setUpiQrMode] = useState<UpiQrMode>(masterSettings.upiQrMode || 'static_customer_fills');
  const [deliveryBaseFee, setDeliveryBaseFee] = useState(masterSettings.deliveryBaseFee ?? 40);
  const [deliveryPerKmFee, setDeliveryPerKmFee] = useState(masterSettings.deliveryPerKmFee ?? 15);
  const [packagingFee, setPackagingFee] = useState(masterSettings.packagingFee ?? 10);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setAppName(masterSettings.appName);
    setSupportPhone(masterSettings.supportPhone);
    setSupportEmail(masterSettings.supportEmail);
    setUpiId(masterSettings.upiId);
    setUpiPayeeName(masterSettings.upiPayeeName || 'Dooars Daily Basket');
    if (masterSettings.upiQrMode) setUpiQrMode(masterSettings.upiQrMode);
    setDeliveryBaseFee(masterSettings.deliveryBaseFee ?? 40);
    setDeliveryPerKmFee(masterSettings.deliveryPerKmFee ?? 15);
    setPackagingFee(masterSettings.packagingFee ?? 10);
  }, [masterSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await settingsService.updateSettings({
        appName,
        supportPhone,
        supportEmail,
        upiId: upiId.trim(),
        upiPayeeName: upiPayeeName.trim() || 'Dooars Daily Basket',
        upiQrMode,
        deliveryBaseFee: Number(deliveryBaseFee),
        deliveryPerKmFee: Number(deliveryPerKmFee),
        packagingFee: Number(packagingFee),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err: any) {
      console.error('Settings save error:', err);
      setErrorMsg(err.message || 'Failed to save settings to Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewUpiUri =
    upiQrMode === 'static_customer_fills'
      ? `upi://pay?pa=${encodeURIComponent(upiId || 'dooarsbasket@upi')}&pn=${encodeURIComponent(
          upiPayeeName || 'Dooars Daily Basket'
        )}&cu=INR`
      : `upi://pay?pa=${encodeURIComponent(upiId || 'dooarsbasket@upi')}&pn=${encodeURIComponent(
          upiPayeeName || 'Dooars Daily Basket'
        )}&am=350&cu=INR&tn=${encodeURIComponent('Dooars Order')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-700" />
            <span>Master Platform Settings</span>
          </h2>
          <p className="text-gray-500 text-sm">
            Update platform contacts, branding, delivery rates, and UPI QR Code settings.
          </p>
        </div>

        {onNavigateTab && (
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => onNavigateTab('business_settings')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-xs"
            >
              <Building2 className="w-4 h-4" />
              <span>Business Profile & Settings (बिजनेस सेटिंग्स)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('upi_qr')}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-2 cursor-pointer transition shadow-xs"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>UPI QR Studio (क्यूआर कोड)</span>
            </button>
          </div>
        )}
      </div>

      {isSaved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings saved to Firebase & updated live across all apps!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <Info className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* App Info & Contacts */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
            <span>Platform Identity & Support</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Application Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Support Phone
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Dedicated Section: UPI QR Code & Payment Settings */}
        <div className="pt-4 border-t border-gray-100 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-700" />
                <span>UPI QR Code & Payments (क्यूआर कोड और पेमेंट सेटिंग्स)</span>
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Delivery partner doorstep collection aur customer checkout ke liye UPI handle aur QR behavior.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full self-start">
              Live Real-Time
            </span>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
              QR Code Mode (क्यूआर कोड टाइप चुनें):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setUpiQrMode('static_customer_fills')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition relative bg-white ${
                  upiQrMode === 'static_customer_fills'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      upiQrMode === 'static_customer_fills'
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-gray-400'
                    }`}
                  >
                    {upiQrMode === 'static_customer_fills' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    📌 Fix QR Code (Customer Fills Order Amount)
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                  <strong>Fix amount nahi hoga:</strong> QR code hamesha fix rahega. Customer scan karke apna order amount khud bharega aur payment karega.
                </p>
              </div>

              <div
                onClick={() => setUpiQrMode('dynamic_order_amount')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition relative bg-white ${
                  upiQrMode === 'dynamic_order_amount'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      upiQrMode === 'dynamic_order_amount'
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-gray-400'
                    }`}
                  >
                    {upiQrMode === 'dynamic_order_amount' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    ⚡ Dynamic QR (Amount Pre-locked in QR)
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                  Har order ka total amount QR me pehle se lock rahega. Customer ko amount type nahi karna padega.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Left Inputs */}
            <div className="sm:col-span-8 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Platform UPI VPA / QR ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. dooarsbasket@upi or 9800012345@paytm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono font-bold bg-white"
                />
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  Paisa seedha is bank account me aayega.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  UPI Payee Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={upiPayeeName}
                  onChange={(e) => setUpiPayeeName(e.target.value)}
                  placeholder="e.g. Dooars Daily Basket Pvt Ltd"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white"
                />
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  Customer ke PhonePe / GPay par yahi naam aayega.
                </span>
              </div>
            </div>

            {/* Right Live Preview Box */}
            <div className="sm:col-span-4 bg-white p-3.5 rounded-xl border border-gray-200 text-center shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                Live QR Preview
              </span>
              <div className="flex justify-center">
                <QRCodeSVG
                  value={previewUpiUri}
                  size={120}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <div className="text-[10.5px] font-mono text-gray-600 truncate">
                {upiId || 'No UPI ID'}
              </div>
              <div className="text-[10px] font-semibold text-emerald-700">
                {upiQrMode === 'static_customer_fills'
                  ? '📌 Fix QR: Customer fills amount'
                  : '⚡ Dynamic: Amount pre-filled'}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery & Packaging Rates */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Delivery & Packaging Rates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Base Delivery Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={deliveryBaseFee}
                onChange={(e) => setDeliveryBaseFee(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                placeholder="40"
              />
              <span className="text-[11px] text-gray-500 mt-0.5 block">Default: ₹40 (Change to ₹50 anytime)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Per KM Distance Rate (₹/KM)
              </label>
              <input
                type="number"
                min="0"
                value={deliveryPerKmFee}
                onChange={(e) => setDeliveryPerKmFee(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                placeholder="15"
              />
              <span className="text-[11px] text-gray-500 mt-0.5 block">Rate per kilometre (₹15/km)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Packaging Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={packagingFee}
                onChange={(e) => setPackagingFee(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                placeholder="10"
              />
              <span className="text-[11px] text-gray-500 mt-0.5 block">Box / carry bag charge (₹10)</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving to Firebase...' : 'Save Master Settings (सेटिंग्स सुरक्षित करें)'}</span>
        </button>
      </form>
    </div>
  );
};
