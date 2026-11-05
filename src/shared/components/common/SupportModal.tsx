import React, { useState } from 'react';
import { X, Headphones, Phone, Mail, Globe, MapPin, Clock, MessageSquare, FileText } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { BusinessPolicyModal } from './BusinessPolicyModal';

export const SupportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { businessSettings, masterSettings } = useStore();
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  if (!isOpen) return null;

  const whatsappNumber = businessSettings.supportWhatsApp || '9609882564';
  const cleanWhatsApp = whatsappNumber.replace(/[^0-9]/g, '');
  const email = businessSettings.supportEmail || masterSettings.supportEmail || 'dooarsdailybasket@gmail.com';
  const website = businessSettings.website || 'dooardailybasket.in';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            {businessSettings.isLogoEnabled && businessSettings.logoUrl ? (
              <img
                src={businessSettings.logoUrl}
                alt={businessSettings.businessName}
                className="w-12 h-12 object-contain rounded-full border border-emerald-300 p-0.5 bg-white shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-lg">
                <Headphones className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {businessSettings.businessName || 'DOOARS DAILY BASKET'}
              </h3>
              <p className="text-xs text-emerald-700 font-medium">Customer Support & Helpdesk</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-4 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
            {businessSettings.customerSupportInfo ||
              'Our regional Dooars support desk is available to assist you with orders, deliveries, and merchant inquiries.'}
          </p>

          <div className="space-y-2.5 text-xs">
            {/* WhatsApp */}
            {businessSettings.isWhatsAppEnabled && (
              <a
                href={`https://wa.me/91${cleanWhatsApp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Support WhatsApp (Instant Chat)
                    </span>
                    <span className="font-bold text-sm text-emerald-950 font-mono">{whatsappNumber}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                  Chat Now →
                </span>
              </a>
            )}

            {/* Email */}
            {businessSettings.isEmailEnabled && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-700 text-white flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                    Support Email
                  </span>
                  <span className="font-medium text-xs text-gray-900 truncate block">{email}</span>
                </div>
              </a>
            )}

            {/* Website */}
            {businessSettings.isWebsiteEnabled && (
              <a
                href={`https://${website.replace(/^https?:\/\//, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                    Official Website
                  </span>
                  <span className="font-medium text-xs text-blue-700 hover:underline truncate block">
                    {website}
                  </span>
                </div>
              </a>
            )}

            {/* Business Hours */}
            {businessSettings.isBusinessHoursEnabled && businessSettings.businessHours && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                    Business Hours
                  </span>
                  <span className="font-medium text-xs text-gray-900">{businessSettings.businessHours}</span>
                </div>
              </div>
            )}

            {/* Registered Office Address */}
            {businessSettings.officeAddress && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                    Registered Office Address
                  </span>
                  <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                    {businessSettings.officeAddress}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setShowPolicyModal(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 underline cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms & Policies</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showPolicyModal && (
        <BusinessPolicyModal
          isOpen={showPolicyModal}
          onClose={() => setShowPolicyModal(false)}
          initialTab="support"
        />
      )}
    </>
  );
};

