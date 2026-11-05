import React, { useState } from 'react';
import { Shield, Headphones, User, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { SupportModal } from './SupportModal';

export const Header: React.FC<{
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
}> = ({ onOpenProfile, onOpenAdmin }) => {
  const { userProfile, role, isSuperAdmin } = useAuth();
  const { selectedLocalArea, businessSettings } = useStore();
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {businessSettings.isLogoEnabled && businessSettings.logoUrl ? (
            <img
              src={businessSettings.logoUrl}
              alt={businessSettings.businessName}
              className="w-10 h-10 object-contain rounded-full border border-emerald-300 shadow-xs bg-white p-0.5"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-400">
              {businessSettings.businessName ? businessSettings.businessName.slice(0, 2).toUpperCase() : 'DB'}
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">
              {businessSettings.businessName || 'DOOARS DAILY BASKET'}
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              {selectedLocalArea ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <MapPin className="w-3 h-3" /> {selectedLocalArea.name}
                </span>
              ) : (
                <span>Dooars Hyperlocal Delivery</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Help & Support Button */}
          <button
            onClick={() => setIsSupportOpen(true)}
            className="p-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
            title="Helpdesk & Customer Support"
          >
            <Headphones className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Support</span>
          </button>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                isSuperAdmin
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isSuperAdmin ? 'Admin Dashboard' : 'Admin Login'}</span>
            </button>
          )}

          <button
            onClick={onOpenProfile}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Account Profile"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {isSupportOpen && (
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      )}
    </>
  );
};

