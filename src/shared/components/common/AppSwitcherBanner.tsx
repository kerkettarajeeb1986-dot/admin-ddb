import React from 'react';
import { ShoppingBag, Store, Bike, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AppSwitcherBannerProps {
  currentApp?: 'customer' | 'market' | 'delivery' | 'admin';
  onSwitchApp?: (app: 'customer' | 'market' | 'delivery' | 'admin') => void;
  onOpenAdmin?: () => void;
}

export const AppSwitcherBanner: React.FC<AppSwitcherBannerProps> = ({
  currentApp = 'customer',
  onSwitchApp,
  onOpenAdmin,
}) => {
  const { isSuperAdmin } = useAuth();

  return (
    <div className="bg-emerald-950 text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/80 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <img
          src="/logo.png"
          alt="Dooars Daily Basket"
          className="w-5 h-5 rounded-full object-contain bg-white"
          referrerPolicy="no-referrer"
        />
        <span className="font-extrabold text-white uppercase tracking-wider text-[11px] hidden sm:inline">
          Dooars Daily Basket
        </span>
        <span className="text-emerald-400 font-medium text-[11px] hidden md:inline">
          • 4 Standalone Enterprise Web Apps
        </span>
      </div>

      {/* App Switcher Tabs */}
      <div className="flex items-center gap-1 bg-emerald-900/60 p-1 rounded-xl border border-emerald-700/50">
        <button
          onClick={() => onSwitchApp ? onSwitchApp('customer') : (window.location.href = '/')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition ${
            currentApp === 'customer'
              ? 'bg-emerald-500 text-emerald-950 shadow-xs'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3 h-3" />
          <span>Customer</span>
        </button>

        <button
          onClick={() => onSwitchApp ? onSwitchApp('market') : (window.location.href = '/market')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition ${
            currentApp === 'market'
              ? 'bg-emerald-500 text-emerald-950 shadow-xs'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          <Store className="w-3 h-3" />
          <span>Merchant</span>
        </button>

        <button
          onClick={() => onSwitchApp ? onSwitchApp('delivery') : (window.location.href = '/delivery')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition ${
            currentApp === 'delivery'
              ? 'bg-emerald-500 text-emerald-950 shadow-xs'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          <Bike className="w-3 h-3" />
          <span>Rider Fleet</span>
        </button>

        <button
          onClick={() => {
            if (onSwitchApp) onSwitchApp('admin');
            else if (onOpenAdmin) onOpenAdmin();
            else window.location.href = '/admin';
          }}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition ${
            currentApp === 'admin'
              ? 'bg-emerald-500 text-emerald-950 shadow-xs'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Super Admin</span>
        </button>
      </div>
    </div>
  );
};
