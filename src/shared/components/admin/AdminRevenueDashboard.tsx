import React from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Users, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminRevenueDashboard: React.FC = () => {
  const { masterSettings, localAreas } = useStore();

  const metrics = [
    { title: 'Total Revenue (GMV)', value: '₹0.00', icon: DollarSign, change: '+0% this week', color: 'text-emerald-700 bg-emerald-50' },
    { title: 'Completed Orders', value: '0', icon: ShoppingBag, change: '0 orders today', color: 'text-blue-700 bg-blue-50' },
    { title: 'Platform Commissions', value: '₹0.00', icon: TrendingUp, change: `${masterSettings.platformFeePercent}% standard fee`, color: 'text-purple-700 bg-purple-50' },
    { title: 'Operational Areas', value: `${localAreas.filter(a => a.status === 'active').length}`, icon: Truck, change: 'Configured in Firebase', color: 'text-amber-700 bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Revenue & Operations Overview</h2>
          <p className="text-gray-500 text-sm">Real-time financial metrics and transaction volume.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.title} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{m.title}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{m.value}</div>
              <div className="text-xs text-gray-500">{m.change}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
