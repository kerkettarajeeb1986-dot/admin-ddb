import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { StoreProvider } from './shared/context/StoreContext';
import { AdminApp } from './shared/components/admin/AdminApp';
import { AdminLoginPage } from './shared/components/admin/AdminLoginPage';
import { MarketPartnerApp } from './shared/components/market-partner/MarketPartnerApp';
import { MarketPartnerAuthPage } from './shared/components/auth/MarketPartnerAuthPage';
import { DeliveryPartnerApp } from './shared/components/delivery-partner/DeliveryPartnerApp';
import { DeliveryPartnerAuthPage } from './shared/components/auth/DeliveryPartnerAuthPage';
import { CustomerApp } from './shared/components/customer/CustomerApp';
import { Header } from './shared/components/common/Header';
import { ProfileView } from './shared/components/common/ProfileView';
import { ErrorBoundary } from './shared/components/common/ErrorBoundary';
import { ShieldCheck, Store, Bike } from 'lucide-react';

function extractAppPath(rawPath?: string): string {
  // 1. Support hash-based routing (#/admin, #admin, #/market, etc.)
  if (typeof window !== 'undefined' && window.location.hash) {
    const cleanHash = window.location.hash.replace(/^#\/?/, '/');
    const hashMatch = cleanHash.match(/(\/(admin|market|delivery|login)(\/.*)?)$/i);
    if (hashMatch) {
      return hashMatch[1];
    }
  }

  // 2. Support pathname routing (/admin, /dooarsdailybasketadmin/admin, etc.)
  const p = rawPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const match = p.match(/(\/(admin|market|delivery|login)(\/.*)?)$/i);
  if (match) {
    return match[1];
  }
  return '/';
}

function getRepoBasePrefix(): string {
  const p = typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
  const match = p.match(/^(.*?)(\/(admin|market|delivery|login)(\/.*)?|\/?)$/i);
  if (match && match[1] && match[1] !== '/') {
    return match[1].replace(/\/$/, '');
  }
  return '';
}

const AppContent: React.FC = () => {
  const { user, role, userProfile, isSuperAdmin, authLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => extractAppPath());
  const [showProfile, setShowProfile] = useState(false);
  const [showPartnerRegister, setShowPartnerRegister] = useState(false);

  // Sync with browser navigation (both history popstate & hash changes)
  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(extractAppPath());
    };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  const navigate = (to: string, replace = false) => {
    const cleanTo = to.startsWith('/') ? to : '/' + to;
    const prefix = getRepoBasePrefix();
    
    // If the browser currently has a hash (or server does not support rewrites), preserve hash navigation
    if (window.location.hash) {
      if (replace) {
        window.history.replaceState(null, '', `#${cleanTo}`);
      } else {
        window.location.hash = cleanTo;
      }
    } else {
      const fullTarget = prefix ? `${prefix}${cleanTo}` : cleanTo;
      if (replace) {
        window.history.replaceState(null, '', fullTarget);
      } else {
        window.history.pushState(null, '', fullTarget);
      }
    }
    setCurrentPath(cleanTo);
  };

  const normalized = extractAppPath(currentPath);
  const isAdminRoute = normalized.startsWith('/admin');
  const isLoginRoute = normalized === '/login';
  const isMarketRoute = normalized.startsWith('/market');
  const isDeliveryRoute = normalized.startsWith('/delivery');

  // Redirect to admin dashboard if already logged in as super admin on /login
  useEffect(() => {
    if (!authLoading && isSuperAdmin && isLoginRoute) {
      navigate('/admin/dashboard', true);
    }
  }, [authLoading, isSuperAdmin, isLoginRoute]);

  // Auth loading state for admin route
  if (authLoading && (isAdminRoute || isLoginRoute)) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500/40 flex items-center justify-center mb-4 shadow-lg">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verifying Super Admin Authorization...</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Checking Firebase credentials & security policies</p>
      </div>
    );
  }

  // 1. Super Admin Login & Protected Routes
  if (isLoginRoute) {
    return (
      <AdminLoginPage
        onSuccess={() => navigate('/admin/dashboard', true)}
        onCancel={() => navigate('/', false)}
      />
    );
  }

  if (isAdminRoute) {
    if (!isSuperAdmin) {
      return (
        <AdminLoginPage
          onSuccess={() => navigate('/admin/dashboard', true)}
          onCancel={() => navigate('/', false)}
        />
      );
    }
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <AdminApp />
      </div>
    );
  }

  // 2. Standalone Market Partner Web App (/market)
  if (isMarketRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <main className="flex-1">
          {(!user || !userProfile) && (
            <div className="py-6">
              <MarketPartnerAuthPage onRegistered={() => navigate('/market')} />
            </div>
          )}
          {user && userProfile && (
            <div className="space-y-4 py-4">
              <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <span>Market Partner App ({userProfile.storeName || 'My Store'})</span>
                </span>
                <button
                  onClick={() => setShowPartnerRegister(!showPartnerRegister)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                >
                  {showPartnerRegister ? '← Back to Merchant Store' : 'View Registration Details →'}
                </button>
              </div>
              {showPartnerRegister ? (
                <MarketPartnerAuthPage onRegistered={() => setShowPartnerRegister(false)} />
              ) : (
                <MarketPartnerApp />
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // 3. Standalone Delivery Partner Web App (/delivery)
  if (isDeliveryRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <main className="flex-1">
          {(!user || !userProfile) ? (
            <div className="py-6">
              <DeliveryPartnerAuthPage onRegistered={() => navigate('/delivery')} />
            </div>
          ) : (
            <div className="py-4">
              <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-emerald-700" />
                  <span>Rider Fleet Portal ({userProfile.displayName || 'Active Rider'})</span>
                </span>
              </div>
              <DeliveryPartnerApp />
            </div>
          )}
        </main>
      </div>
    );
  }

  // 4. Standalone Customer Storefront Web App (/)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header
        onOpenProfile={() => setShowProfile(!showProfile)}
        onOpenAdmin={() => navigate(isSuperAdmin ? '/admin/dashboard' : '/login')}
      />

      <main className="flex-1">
        {showProfile ? (
          <div className="p-4 sm:p-8 max-w-4xl mx-auto">
            <ProfileView onClose={() => setShowProfile(false)} />
          </div>
        ) : (
          <CustomerApp />
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
