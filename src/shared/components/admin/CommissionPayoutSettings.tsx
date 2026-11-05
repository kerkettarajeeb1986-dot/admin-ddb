import React, { useState } from 'react';
import { Percent, CheckCircle2, Save } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';

export const CommissionPayoutSettings: React.FC = () => {
  const { masterSettings } = useStore();
  const [platformFee, setPlatformFee] = useState(masterSettings.platformFeePercent);
  const [marketCommission, setMarketCommission] = useState(masterSettings.marketPartnerCommissionPercent);
  const [deliveryShare, setDeliveryShare] = useState(masterSettings.deliveryPartnerSharePercent);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsService.updateSettings({
      platformFeePercent: Number(platformFee),
      marketPartnerCommissionPercent: Number(marketCommission),
      deliveryPartnerSharePercent: Number(deliveryShare),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Commission & Split Structure</h2>
        <p className="text-gray-500 text-sm">Define profit percentages and partner allocations.</p>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Commission settings saved to Firebase.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Platform Fee (%)
            </label>
            <input
              type="number"
              value={platformFee}
              onChange={(e) => setPlatformFee(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Market Commission (%)
            </label>
            <input
              type="number"
              value={marketCommission}
              onChange={(e) => setMarketCommission(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Delivery Partner Share (%)
            </label>
            <input
              type="number"
              value={deliveryShare}
              onChange={(e) => setDeliveryShare(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition"
        >
          <Save className="w-4 h-4" />
          Update Split Rates
        </button>
      </form>
    </div>
  );
};
