import React, { useState } from 'react';
import { Shield, LogOut, Phone, Mail, CheckCircle2, Headphones, FileText, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { SupportModal } from './SupportModal';
import { BusinessPolicyModal, PolicyType } from './BusinessPolicyModal';

export const ProfileView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { userProfile, role, signOut, isSuperAdmin } = useAuth();
  const { businessSettings } = useStore();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; tab: PolicyType }>({
    isOpen: false,
    tab: 'terms',
  });

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-xl">
            {userProfile?.displayName?.slice(0, 2).toUpperCase() || 'DB'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{userProfile?.displayName || 'User Profile'}</h2>
            <p className="text-xs text-gray-500">{userProfile?.email || 'Authenticated User'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
              {isSuperAdmin ? 'Super Administrator' : role.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Role: <strong className="capitalize">{isSuperAdmin ? 'Super Administrator' : role.replace('_', ' ')}</strong></span>
          </div>
          {userProfile?.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Email: {userProfile.email}</span>
            </div>
          )}
          {userProfile?.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Phone: {userProfile.phone}</span>
            </div>
          )}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 text-emerald-700 font-medium text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Verified Super Administrator UID: yFxa1vrBF5PdjdTfm9DuHgmDiNW2</span>
            </div>
          )}
        </div>

        {/* Business Helpdesk & Policies Bar in Profile */}
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
            {businessSettings.businessName || 'DOOARS DAILY BASKET'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSupportOpen(true)}
              className="flex-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Customer Helpdesk</span>
            </button>
            <button
              type="button"
              onClick={() => setPolicyModal({ isOpen: true, tab: 'terms' })}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Policies</span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={async () => {
              await signOut();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {isSupportOpen && (
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      )}
      {policyModal.isOpen && (
        <BusinessPolicyModal
          isOpen={policyModal.isOpen}
          onClose={() => setPolicyModal({ isOpen: false, tab: 'terms' })}
          initialTab={policyModal.tab}
        />
      )}
    </>
  );
};
