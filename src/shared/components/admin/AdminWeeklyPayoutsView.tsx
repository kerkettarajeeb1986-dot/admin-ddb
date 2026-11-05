import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

export const AdminWeeklyPayoutsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Delivery Fleet Weekly Payouts</h2>
        <p className="text-gray-500 text-sm">Disburse completed trip compensations and delivery base earnings.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-800">Weekly Cycle Up to Date</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
          No overdue driver disbursements. Next automatic settlement cycle closes on Sunday midnight.
        </p>
      </div>
    </div>
  );
};
