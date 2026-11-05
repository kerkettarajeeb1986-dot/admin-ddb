import React, { useState } from 'react';
import { X, FileText, Shield, RotateCcw, Info, Headphones, MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export type PolicyType = 'terms' | 'privacy' | 'refund' | 'about' | 'support';

interface BusinessPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyType;
}

export const BusinessPolicyModal: React.FC<BusinessPolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const { businessSettings } = useStore();
  const [activeTab, setActiveTab] = useState<PolicyType>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-3">
            {businessSettings.isLogoEnabled && businessSettings.logoUrl ? (
              <img
                src={businessSettings.logoUrl}
                alt={businessSettings.businessName}
                className="w-9 h-9 object-contain rounded-full bg-white p-0.5 border border-emerald-400"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-sm">
                DB
              </div>
            )}
            <div>
              <h3 className="font-bold text-base leading-tight text-white">
                {businessSettings.businessName || 'DOOARS DAILY BASKET'}
              </h3>
              <p className="text-[11px] text-emerald-200">Official Business Policies & Information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'about'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Us</span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'support'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Helpdesk & Contacts</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'terms'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'refund'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund Policy</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-sm text-gray-700 leading-relaxed">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h4 className="font-bold text-emerald-900 text-base mb-1">
                  About {businessSettings.businessName}
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {businessSettings.businessDescription}
                </p>
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-800">
                {businessSettings.aboutUs}
              </div>
              {businessSettings.isBusinessHoursEnabled && businessSettings.businessHours && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Operational Business Hours</span>
                    <span className="text-xs text-gray-600">{businessSettings.businessHours}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                <h4 className="font-bold text-emerald-950 text-base mb-1">Direct Customer Support</h4>
                <p className="text-xs text-emerald-800">
                  {businessSettings.customerSupportInfo || 'Reach our regional support desk directly.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {businessSettings.isWhatsAppEnabled && businessSettings.supportWhatsApp && (
                  <a
                    href={`https://wa.me/91${businessSettings.supportWhatsApp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl flex items-center gap-3 transition group"
                  >
                    <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                        Support WhatsApp
                      </span>
                      <span className="text-sm font-black text-emerald-950 font-mono">
                        {businessSettings.supportWhatsApp}
                      </span>
                    </div>
                  </a>
                )}

                {businessSettings.isEmailEnabled && businessSettings.supportEmail && (
                  <a
                    href={`mailto:${businessSettings.supportEmail}`}
                    className="p-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-3 transition"
                  >
                    <div className="w-9 h-9 bg-gray-700 text-white rounded-lg flex items-center justify-center font-bold">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                        Support Email
                      </span>
                      <span className="text-xs font-semibold text-gray-900 truncate block">
                        {businessSettings.supportEmail}
                      </span>
                    </div>
                  </a>
                )}

                {businessSettings.isWebsiteEnabled && businessSettings.website && (
                  <a
                    href={`https://${businessSettings.website.replace(/^https?:\/\//, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-3 transition sm:col-span-2"
                  >
                    <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                        Official Website
                      </span>
                      <span className="text-xs font-semibold text-blue-700 hover:underline">
                        {businessSettings.website}
                      </span>
                    </div>
                  </a>
                )}
              </div>

              {businessSettings.officeAddress && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                      Registered Business & Office Address
                    </span>
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                      {businessSettings.officeAddress}
                    </p>
                  </div>
                </div>
              )}

              {businessSettings.serviceAreaInfo && (
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                  <strong>Service Coverage:</strong> {businessSettings.serviceAreaInfo}
                </div>
              )}
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="whitespace-pre-line text-xs sm:text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
              {businessSettings.termsAndConditions}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="whitespace-pre-line text-xs sm:text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
              {businessSettings.privacyPolicy}
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="whitespace-pre-line text-xs sm:text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
              {businessSettings.refundPolicy}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            {businessSettings.businessName} • {businessSettings.website || 'dooardailybasket.in'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
