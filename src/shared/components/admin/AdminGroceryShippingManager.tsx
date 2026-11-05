import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  ShieldCheck,
  Save,
  CheckCircle2,
  Calculator,
  Info,
  Sparkles,
  ArrowRight,
  RotateCcw,
  IndianRupee,
  QrCode,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { AdminUpiQrManager } from './AdminUpiQrManager';

export const AdminGroceryShippingManager: React.FC = () => {
  const { masterSettings } = useStore();

  const [baseFee, setBaseFee] = useState<number>(masterSettings.deliveryBaseFee ?? 40);
  const [perKmFee, setPerKmFee] = useState<number>(masterSettings.deliveryPerKmFee ?? 15);
  const [packagingFee, setPackagingFee] = useState<number>(masterSettings.packagingFee ?? 10);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(
    masterSettings.freeDeliveryThreshold ?? 0
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live simulation state
  const [simulatedDistanceKm, setSimulatedDistanceKm] = useState<number>(3);
  const [simulatedOrderValue, setSimulatedOrderValue] = useState<number>(350);
  const [activeSubTab, setActiveSubTab] = useState<'rates' | 'upi_qr'>('rates');

  // Sync if masterSettings update from Firestore
  useEffect(() => {
    setBaseFee(masterSettings.deliveryBaseFee ?? 40);
    setPerKmFee(masterSettings.deliveryPerKmFee ?? 15);
    setPackagingFee(masterSettings.packagingFee ?? 10);
    setFreeDeliveryThreshold(masterSettings.freeDeliveryThreshold ?? 0);
  }, [
    masterSettings.deliveryBaseFee,
    masterSettings.deliveryPerKmFee,
    masterSettings.packagingFee,
    masterSettings.freeDeliveryThreshold,
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await settingsService.updateSettings({
        deliveryBaseFee: Number(baseFee),
        deliveryPerKmFee: Number(perKmFee),
        packagingFee: Number(packagingFee),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving shipping settings:', err);
      setErrorMessage(err.message || 'Failed to save shipping rates to Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  // Preset applicator
  const applyPreset = (base: number, km: number, pkg: number) => {
    setBaseFee(base);
    setPerKmFee(km);
    setPackagingFee(pkg);
  };

  // Calculations for live preview
  const isFreeDelivery =
    freeDeliveryThreshold > 0 && simulatedOrderValue >= freeDeliveryThreshold;
  const calculatedDistanceCharge = simulatedDistanceKm * perKmFee;
  const simulatedDeliveryCharge = isFreeDelivery ? 0 : baseFee + calculatedDistanceCharge;
  const simulatedTotalShippingAndPkg = isFreeDelivery
    ? packagingFee
    : baseFee + calculatedDistanceCharge + packagingFee;
  const riderShare = Math.round(
    simulatedDeliveryCharge * ((masterSettings.deliveryPartnerSharePercent ?? 80) / 100)
  );
  const platformShare = simulatedDeliveryCharge - riderShare;

  return (
    <div className="space-y-6">
      {/* Sub-tab switcher between Delivery Rates and UPI QR Setup */}
      <div className="flex bg-gray-200/80 p-1 rounded-xl text-xs font-bold gap-1 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('rates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer ${
            activeSubTab === 'rates'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-600" />
          <span>Delivery & Packaging Rates (₹40 Base, ₹15/km)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('upi_qr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer ${
            activeSubTab === 'upi_qr'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <QrCode className="w-4 h-4 text-purple-600" />
          <span>UPI QR Code & Payments Setup</span>
        </button>
      </div>

      {activeSubTab === 'upi_qr' ? (
        <AdminUpiQrManager />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-700" />
            Grocery Delivery & Packaging Rates
          </h2>
          <p className="text-gray-500 text-sm">
            Configure base delivery fee, per-kilometer rate, and package handling charges.
          </p>
        </div>

        {/* Current Active Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
            Base: ₹{masterSettings.deliveryBaseFee ?? 40}
          </span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
            Per KM: ₹{masterSettings.deliveryPerKmFee ?? 15}
          </span>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
            Package: ₹{masterSettings.packagingFee ?? 10}
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-sm flex items-center gap-3 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Delivery & Packaging Rates Updated Successfully!</p>
            <p className="text-xs text-emerald-700">
              New rates have been saved to Firebase and are now live on Customer Checkout and Delivery Partner dispatches.
            </p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-sm flex items-center gap-3">
          <Info className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Error saving rates</p>
            <p className="text-xs text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* How-To Guide / Admin Instructions Card */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-xl p-5 text-sm shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              Future me Delivery Charges kaise Edit karein? (₹40 ki jagah ₹50 etc.)
            </h3>
            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
              Admin panel se aap kisi bhi samay delivery charges aur package fee badal sakte hain:
            </p>
            <ol className="list-decimal list-inside text-xs sm:text-sm text-gray-800 font-medium space-y-1 pl-1">
              <li>
                <strong>Base Delivery Charge:</strong> Niche form me <strong>₹40</strong> ki jagah <strong>₹50</strong> (ya jo bhi rate rakhna chahein) likhein.
              </li>
              <li>
                <strong>Per Kilometer Rate:</strong> Distance rate ko <strong>₹15/km</strong> ya zaroorat anusaar edit karein.
              </li>
              <li>
                <strong>Packaging Charge:</strong> Packaging box / carry bag ke liye <strong>₹10</strong> per package / order set karein.
              </li>
              <li>
                <strong>'Save Shipping Rates' button</strong> par click karte hi sabhi customers ke checkout page par naya rate turant lagu ho jayega!
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Edit Form (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-gray-900 text-base">Edit Delivery & Packaging Fees</h3>
            </div>
            <span className="text-xs text-emerald-800 bg-emerald-100/70 font-semibold px-2.5 py-1 rounded-md">
              Live in Firebase
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Quick Rate Presets (Ek Click me bharein):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(40, 15, 10)}
                className={`px-3 py-2 border rounded-lg text-xs font-medium text-left transition flex flex-col justify-center ${
                  baseFee === 40 && perKmFee === 15 && packagingFee === 10
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="font-bold">Standard (Default)</span>
                <span className="text-[11px] text-gray-500">₹40 base + ₹15/km + ₹10 pkg</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(50, 15, 10)}
                className={`px-3 py-2 border rounded-lg text-xs font-medium text-left transition flex flex-col justify-center ${
                  baseFee === 50 && perKmFee === 15 && packagingFee === 10
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="font-bold">Revised (₹50 Base)</span>
                <span className="text-[11px] text-gray-500">₹50 base + ₹15/km + ₹10 pkg</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(60, 20, 15)}
                className={`px-3 py-2 border rounded-lg text-xs font-medium text-left transition flex flex-col justify-center ${
                  baseFee === 60 && perKmFee === 20 && packagingFee === 15
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="font-bold">Monsoon / Surge</span>
                <span className="text-[11px] text-gray-500">₹60 base + ₹20/km + ₹15 pkg</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Base Delivery Fee */}
              <div className="space-y-1.5 p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Base Delivery Fee (मूल शुल्क)
                  </label>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    ₹{baseFee}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={baseFee}
                    onChange={(e) => setBaseFee(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-base font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 40 or 50"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Customer order dispatch ka fixed starting charge (pehle ₹40 tha, yahan 50 badal sakte hain).
                </p>
              </div>

              {/* Per Kilometer Rate */}
              <div className="space-y-1.5 p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Per KM Distance Rate (प्रति किमी)
                  </label>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    ₹{perKmFee} / KM
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={perKmFee}
                    onChange={(e) => setPerKmFee(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-base font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 15"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Dukaan se grahak ke ghar ki doori per kilometer jodhi jayegi (default ₹15 per KM).
                </p>
              </div>

              {/* Packaging Charge */}
              <div className="space-y-1.5 p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Packaging Fee (पैकेजिंग शुल्क)
                  </label>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    ₹{packagingFee}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={packagingFee}
                    onChange={(e) => setPackagingFee(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-base font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 10"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Grocery basket packing material / bag charge (default ₹10 per order/package).
                </p>
              </div>

              {/* Free Delivery Order Value Threshold */}
              <div className="space-y-1.5 p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Free Delivery Threshold (Optional)
                  </label>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {freeDeliveryThreshold > 0 ? `> ₹${freeDeliveryThreshold}` : 'Disabled'}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={freeDeliveryThreshold}
                    onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-base font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="0 to disable"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Kitne rupaye ke upar free delivery deni hai (0 rakhein agar sabhi orders par charge lena hai).
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-sm font-bold shadow-md hover:shadow transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Firebase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Delivery & Packaging Rates</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setBaseFee(masterSettings.deliveryBaseFee ?? 40);
                  setPerKmFee(masterSettings.deliveryPerKmFee ?? 15);
                  setPackagingFee(masterSettings.packagingFee ?? 10);
                  setFreeDeliveryThreshold(masterSettings.freeDeliveryThreshold ?? 0);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Saved Values</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Calculation Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-md flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Live Rate Simulator</h3>
                  <p className="text-[11px] text-slate-400">See how customer bill calculates</p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                Interactive
              </span>
            </div>

            {/* Distance Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Customer Distance from Store:</span>
                <span className="font-bold text-emerald-400 font-mono">{simulatedDistanceKm} KM</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={simulatedDistanceKm}
                onChange={(e) => setSimulatedDistanceKm(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.5 km</span>
                <span>5 km</span>
                <span>10 km</span>
                <span>15 km</span>
              </div>
            </div>

            {/* Bill Breakdown Cards */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Delivery Charge:</span>
                <span className="font-bold text-white font-mono">₹{baseFee}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>
                  Distance Charge ({simulatedDistanceKm} km × ₹{perKmFee}):
                </span>
                <span className="font-bold text-white font-mono">₹{calculatedDistanceCharge}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Packaging Fee (1 Basket/Pkg):</span>
                <span className="font-bold text-amber-400 font-mono">+₹{packagingFee}</span>
              </div>

              <div className="border-t border-slate-700 pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-emerald-300">Total Customer Delivery Fee:</span>
                <span className="text-lg text-emerald-400 font-mono">
                  {isFreeDelivery ? (
                    <span className="flex items-center gap-1.5">
                      <span className="line-through text-xs text-slate-400">
                        ₹{baseFee + calculatedDistanceCharge + packagingFee}
                      </span>
                      <span>₹{packagingFee} (Free Delivery Promo)</span>
                    </span>
                  ) : (
                    `₹${simulatedTotalShippingAndPkg}`
                  )}
                </span>
              </div>
            </div>

            {/* Fleet & Platform Commission Distribution */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1.5 text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Estimated Distribution (At {masterSettings.deliveryPartnerSharePercent ?? 80}% Rider Share):
              </span>
              <div className="flex justify-between text-slate-300">
                <span>🚴 Delivery Partner Payout:</span>
                <span className="font-bold text-emerald-400 font-mono">₹{riderShare}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>🏢 Platform Commission:</span>
                <span className="font-bold text-blue-400 font-mono">₹{platformShare}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-700/80 pt-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Updates in real-time on all customer carts and checkout modal.</span>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
