import React, { useState } from 'react';
import { Store, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const AdminMarketPayoutsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Market Partner Settlements</h2>
          <p className="text-gray-500 text-sm">Review grocery store earnings, commissions, and bank transfer logs.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'pending' ? 'bg-emerald-700 text-white' : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            Pending Settlements
          </button>
          <button
            onClick={() => setActiveTab('settled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'settled' ? 'bg-emerald-700 text-white' : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            Settled History
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-800">No partner payout requests</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
          Settlement batches will automatically populate as Market Partners complete customer orders.
        </p>
      </div>
    </div>
  );
};
