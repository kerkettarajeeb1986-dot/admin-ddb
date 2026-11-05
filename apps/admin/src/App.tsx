import React from 'react';
import { AuthProvider, useAuth } from '../../../src/shared/context/AuthContext';
import { StoreProvider } from '../../../src/shared/context/StoreContext';
import { AdminApp } from '../../../src/shared/components/admin/AdminApp';
import { AdminLoginPage } from '../../../src/shared/components/admin/AdminLoginPage';
import { ErrorBoundary } from '../../../src/shared/components/common/ErrorBoundary';
import { ShieldCheck } from 'lucide-react';

const AdminRoot: React.FC = () => {
  const { isSuperAdmin, authLoading } = useAuth();

  if (authLoading) {
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

  if (!isSuperAdmin) {
    return (
      <AdminLoginPage
        onSuccess={() => {}}
        onCancel={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  return <AdminApp />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <AdminRoot />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
