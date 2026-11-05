import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../shared/context/AuthContext';
import { AdminLoginPage } from '../shared/components/admin/AdminLoginPage';

interface SuperAdminRoleGuardProps {
  children: React.ReactNode;
}

export const SuperAdminRoleGuard: React.FC<SuperAdminRoleGuardProps> = ({ children }) => {
  const { isSuperAdmin, authLoading } = useAuth();

  // Show secure loader while Firebase determines authentication state
  // This guarantees the dashboard never flashes or appears before authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500/40 flex items-center justify-center mb-4">
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
    return <AdminLoginPage />;
  }

  return <>{children}</>;
};
