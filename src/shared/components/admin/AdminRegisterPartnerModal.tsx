import React, { useState } from 'react';
import {
  X,
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
} from 'lucide-react';
import { UserProfile, LocalArea, CANONICAL_CATEGORIES } from '../../types';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';

interface AdminRegisterPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  localAreas: LocalArea[];
  onPartnerRegistered?: (partner: UserProfile) => void;
}

export const AdminRegisterPartnerModal: React.FC<AdminRegisterPartnerModalProps> = ({
  isOpen,
  onClose,
  localAreas,
  onPartnerRegistered,
}) => {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [localAreaId, setLocalAreaId] = useState('');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setErrorMsg('Store name is required (दुकान का नाम आवश्यक है).');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('Owner / Proprietor name is required (मालिक का नाम आवश्यक है).');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Valid mobile number is required (मान्य मोबाइल नंबर आवश्यक है).');
      return;
    }
    if (!localAreaId) {
      setErrorMsg('Please select an operational Local Area (सेवा क्षेत्र चुनें).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const chosenArea = localAreas.find((a) => a.id === localAreaId);
    const partnerUid = `partner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedEmail =
      email.trim() ||
      `shop_${phone.replace(/\D/g, '') || Date.now()}@dooarsdailybasket.com`;

    const partnerProfile: UserProfile = {
      uid: partnerUid,
      email: sanitizedEmail.toLowerCase(),
      displayName: ownerName.trim(),
      name: ownerName.trim(),
      phone: phone.trim(),
      role: 'market_partner',
      storeName: storeName.trim(),
      category: category.trim(),
      localAreaId,
      localAreaName: chosenArea ? chosenArea.name : 'Dooars Region',
      district: chosenArea?.district || 'Jalpaiguri',
      state: chosenArea?.state || 'West Bengal',
      pinCode: chosenArea?.pinCodes?.[0] || '734501',
      address: address.trim() || (chosenArea ? `${chosenArea.name}, Dooars` : ''),
      fssaiNumber: fssaiNumber.trim(),
      bankDetails: {
        upiId: upiId.trim(),
      },
      status: 'active', // Admin direct registration is pre-approved
      isOnline: true,
      totalProducts: 0,
      totalPartnerEarnings: 0,
    };

    try {
      await userService.createUserProfile(partnerProfile);

      // System notification
      try {
        await notificationService.sendNotification(
          'new_partner_application',
          'New Shop Registered by Admin',
          `Admin registered store "${partnerProfile.storeName}" (${partnerProfile.displayName}) in ${partnerProfile.localAreaName}.`,
          'market_partners',
          partnerProfile.uid
        );
      } catch (notifErr) {
        console.warn('Could not post notification:', notifErr);
      }

      if (onPartnerRegistered) {
        onPartnerRegistered(partnerProfile);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to register partner:', err);
      setErrorMsg(err.message || 'Failed to register shop in Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8 max-h-[92vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Register New Shop / Partner (नया दुकान जोड़ें)
              </h3>
              <p className="text-xs text-gray-500">
                Directly register a local merchant or partner store on Dooars Daily Basket.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Store Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Store / Shop Name (दुकान का नाम) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Bagrakote Fresh Vegetables & Dairy Mart"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Owner Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Owner / Merchant Name (मालिक का नाम) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Contact Phone (फोन नंबर) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9832123456"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category & Local Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Store Primary Category (श्रेणी) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {CANONICAL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.icon} {c.name} ({c.hindiName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Local Service Area (सेवा क्षेत्र) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <select
                  required
                  value={localAreaId}
                  onChange={(e) => setLocalAreaId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="">-- Select GP Area --</option>
                  {localAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      📍 {area.name} ({area.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Street Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Shop / Stall Street Address (दुकान का पूरा पता)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Shop No. 12, Main Bazaar, Near Daily Market"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* UPI ID & Email (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Settlement UPI ID (पेमेंट यूपीआई - Optional)
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. merchant@okhdfcbank"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Merchant Email (ईमेल - Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Optional (auto-generated if empty)"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* FSSAI Number (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              FSSAI / Trade License (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={fssaiNumber}
                onChange={(e) => setFssaiNumber(e.target.value)}
                placeholder="e.g. 12821008000123"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Info notice */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              This store will be activated immediately. You and the partner will be able to add and list products for this shop right away.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Store...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Register Store (दुकान जोड़ें)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
