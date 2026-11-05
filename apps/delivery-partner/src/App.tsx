import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../../../src/shared/context/AuthContext';
import { StoreProvider } from '../../../src/shared/context/StoreContext';
import { DeliveryPartnerApp } from '../../../src/shared/components/delivery-partner/DeliveryPartnerApp';
import { DeliveryPartnerAuthPage } from '../../../src/shared/components/auth/DeliveryPartnerAuthPage';
import { ErrorBoundary } from '../../../src/shared/components/common/ErrorBoundary';
import { Bike, Clock, ShieldCheck, LogOut } from 'lucide-react';

const DeliveryPartnerRoot: React.FC = () => {
  const { user, userProfile, authLoading, signOut } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-white font-bold text-sm">Authenticating Delivery Partner...</span>
      </div>
    );
  }

  // Not logged in: Show Login / Registration
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto pt-8 pb-4 text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bike className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Delivery Fleet Portal</h1>
          <p className="text-xs text-gray-500 mt-1">Dooars Daily Basket Hyperlocal Rider Network</p>
        </div>

        <DeliveryPartnerAuthPage onRegistered={() => setShowRegister(false)} />
      </div>
    );
  }

  // Pending Approval State Guard
  if (userProfile.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-md border border-amber-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Rider Profile Pending Approval</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Welcome, <strong>{userProfile.displayName || 'Rider Hero'}</strong>! Your delivery partner registration is under verification by our regional dispatch operations team.
          </p>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-left text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Assigned Area: {userProfile.localAreaName || 'Regional Hub'}</span>
            </div>
            <p className="text-[11px] text-amber-800">Once authorized, order assignments will appear immediately in your app.</p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Rider Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="DDB" className="w-8 h-8 rounded-full border border-emerald-400" />
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-none">Dooars Daily Basket</h1>
            <span className="text-[10px] text-emerald-700 font-semibold">Delivery Partner Portal</span>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="text-xs font-semibold text-gray-500 hover:text-rose-600 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </header>

      <main className="py-6">
        <DeliveryPartnerApp />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <DeliveryPartnerRoot />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
