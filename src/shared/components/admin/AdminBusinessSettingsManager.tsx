import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Save,
  Edit2,
  Trash2,
  AlertTriangle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  FileText,
  Shield,
  RotateCcw,
  Eye,
  History,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { businessSettingsService } from '../../services/businessSettingsService';
import { BusinessSettings, BusinessSettingsAuditLog } from '../../types/businessSettings';

export const AdminBusinessSettingsManager: React.FC = () => {
  const { businessSettings, updateBusinessSettings } = useStore();
  const { userProfile } = useAuth();

  // Local Form state
  const [formData, setFormData] = useState<BusinessSettings>(businessSettings);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'contacts' | 'policies' | 'audit'>('general');

  const handleSelectSubTab = (tab: 'general' | 'contacts' | 'policies' | 'audit') => {
    setActiveSubTab(tab);
    setErrorMessage(null);
    setSaveSuccessMessage(null);
  };
  
  // Edit mode toggles per section
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingContacts, setIsEditingContacts] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [isEditingPolicies, setIsEditingPolicies] = useState(false);

  // Logo uploading & preview
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Action status feedback
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Safe delete / clear confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<BusinessSettingsAuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const currentAdminIdentifier = userProfile?.email || userProfile?.displayName || 'Super Admin';

  // Synchronize local form when businessSettings update in Firestore, protecting in-progress edits
  useEffect(() => {
    setFormData((prev) => ({
      ...businessSettings,
      businessName: isEditingIdentity ? prev.businessName : businessSettings.businessName,
      businessDescription: isEditingIdentity ? prev.businessDescription : businessSettings.businessDescription,
      aboutUs: isEditingIdentity ? prev.aboutUs : businessSettings.aboutUs,
      officeAddress: isEditingAddress ? prev.officeAddress : businessSettings.officeAddress,
      supportWhatsApp: isEditingContacts ? prev.supportWhatsApp : businessSettings.supportWhatsApp,
      supportEmail: isEditingContacts ? prev.supportEmail : businessSettings.supportEmail,
      website: isEditingContacts ? prev.website : businessSettings.website,
      customerSupportInfo: isEditingContacts ? prev.customerSupportInfo : businessSettings.customerSupportInfo,
      businessHours: isEditingHours ? prev.businessHours : businessSettings.businessHours,
      serviceAreaInfo: isEditingHours ? prev.serviceAreaInfo : businessSettings.serviceAreaInfo,
      termsAndConditions: isEditingPolicies ? prev.termsAndConditions : businessSettings.termsAndConditions,
      privacyPolicy: isEditingPolicies ? prev.privacyPolicy : businessSettings.privacyPolicy,
      refundPolicy: isEditingPolicies ? prev.refundPolicy : businessSettings.refundPolicy,
    }));
    if (!logoPreview) {
      setLogoPreview(businessSettings.logoUrl);
    }
  }, [
    businessSettings,
    isEditingIdentity,
    isEditingAddress,
    isEditingContacts,
    isEditingHours,
    isEditingPolicies,
  ]);

  // Ensure Firestore document settings/business exists automatically
  useEffect(() => {
    businessSettingsService.seedInitialSettings(currentAdminIdentifier).catch(() => {});
  }, [currentAdminIdentifier]);

  // Load audit logs when switching to audit tab
  useEffect(() => {
    if (activeSubTab === 'audit') {
      setIsLoadingAudit(true);
      const unsub = businessSettingsService.subscribeToAuditLogs((logs) => {
        setAuditLogs(logs);
        setIsLoadingAudit(false);
      });
      return () => unsub();
    }
  }, [activeSubTab]);

  const showSuccess = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const formatErrorMessage = (err: any, fallback: string): string => {
    const raw = err?.message || String(err || '');
    try {
      const parsed = JSON.parse(raw);
      if (parsed.error) {
        return parsed.error;
      }
    } catch {
      // raw is not JSON
    }
    return raw || fallback;
  };

  // Handle Logo File Upload
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    setErrorMessage(null);

    try {
      const uploadedUrl = await businessSettingsService.uploadBusinessLogo(file);
      setLogoPreview(uploadedUrl);
      setFormData((prev) => ({ ...prev, logoUrl: uploadedUrl, isLogoEnabled: true }));

      // Automatically persist to Firestore and record audit
      await updateBusinessSettings(
        { logoUrl: uploadedUrl, isLogoEnabled: true },
        currentAdminIdentifier,
        `Replaced business logo (${file.name})`
      );

      showSuccess('Business logo uploaded and updated live across all apps!');
    } catch (err) {
      console.error('Failed to upload logo:', err);
      setErrorMessage(formatErrorMessage(err, 'Failed to upload logo image. Please try again.'));
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Safe delete / clear logo
  const handleDeleteLogo = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Business Logo?',
      description:
        'This will clear the custom logo URL and apps will display the default company abbreviation badge. You can upload a new logo at any time.',
      onConfirm: async () => {
        setFormData((prev) => ({ ...prev, logoUrl: '', isLogoEnabled: false }));
        setLogoPreview(null);
        await updateBusinessSettings(
          { logoUrl: '', isLogoEnabled: false },
          currentAdminIdentifier,
          'Cleared custom logo URL'
        );
        showSuccess('Business logo removed successfully.');
      },
    });
  };

  // Generic Save Section Helper
  const handleSaveSection = async (
    sectionKeys: (keyof BusinessSettings)[],
    sectionName: string,
    onFinishEditing?: () => void
  ) => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Validate mandatory fields with safe optional chaining
      if (sectionKeys.includes('businessName') && !(formData.businessName || '').trim()) {
        throw new Error('Business Name cannot be empty.');
      }
      if (sectionKeys.includes('officeAddress') && !(formData.officeAddress || '').trim()) {
        throw new Error('Office Address cannot be empty.');
      }
      if (
        sectionKeys.includes('supportWhatsApp') &&
        formData.isWhatsAppEnabled &&
        !(formData.supportWhatsApp || '').trim()
      ) {
        throw new Error('Support WhatsApp number cannot be empty when WhatsApp support is enabled.');
      }
      if (
        sectionKeys.includes('supportEmail') &&
        formData.isEmailEnabled &&
        !(formData.supportEmail || '').trim()
      ) {
        throw new Error('Support Email cannot be empty when Email support is enabled.');
      }

      const updates: Partial<BusinessSettings> = {};
      sectionKeys.forEach((key) => {
        const val = formData[key];
        if (typeof val === 'string') {
          updates[key] = val.trim() as any;
        } else {
          updates[key] = (val ?? '') as any;
        }
      });

      await updateBusinessSettings(
        updates,
        currentAdminIdentifier,
        `Updated ${sectionName} information`
      );

      // Directly sync into form state
      setFormData((prev) => ({ ...prev, ...updates }));
      showSuccess(`${sectionName} saved successfully to Firebase!`);
      if (onFinishEditing) onFinishEditing();
    } catch (err: any) {
      console.error(`Error saving ${sectionName}:`, err);
      setErrorMessage(formatErrorMessage(err, `Failed to save ${sectionName}.`));
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle boolean fields (e.g. isWhatsAppEnabled, isLogoEnabled, isBusinessHoursEnabled, etc.)
  const handleToggleField = async (field: keyof BusinessSettings, label: string) => {
    const nextVal = !formData[field];
    setFormData((prev) => ({ ...prev, [field]: nextVal }));

    try {
      await updateBusinessSettings(
        { [field]: nextVal },
        currentAdminIdentifier,
        `${nextVal ? 'Enabled' : 'Disabled'} ${label}`
      );
      showSuccess(`${label} has been ${nextVal ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      console.error(`Failed to toggle ${label}:`, err);
      setErrorMessage(formatErrorMessage(err, `Failed to update ${label}`));
    }
  };

  // Safe field clear
  const handleClearField = (field: keyof BusinessSettings, label: string) => {
    setConfirmModal({
      isOpen: true,
      title: `Clear ${label}?`,
      description: `Are you sure you want to clear the content for "${label}"? This does not delete other settings and can be re-entered anytime.`,
      onConfirm: async () => {
        setFormData((prev) => ({ ...prev, [field]: '' }));
        await updateBusinessSettings(
          { [field]: '' },
          currentAdminIdentifier,
          `Cleared ${label} content`
        );
        showSuccess(`${label} content cleared.`);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Business Settings & Profile
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                Live Firebase
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Super Admin control for Business Name, Logo, Office Address, WhatsApp, Email, Policies & Hours.
            </p>
          </div>
        </div>

        {/* Global Live Status indicator */}
        <div className="flex items-center gap-2 self-start md:self-auto text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-900">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Realtime Sync to Customer, Rider & Merchant Apps</span>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-sm font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1">{saveSuccessMessage}</span>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-sm font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => handleSelectSubTab('general')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeSubTab === 'general'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Identity & Logo (पहचान व लोगो)</span>
        </button>

        <button
          onClick={() => handleSelectSubTab('contacts')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeSubTab === 'contacts'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Contacts & Address (संपर्क व पता)</span>
        </button>

        <button
          onClick={() => handleSelectSubTab('policies')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeSubTab === 'policies'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Policies & Legal (नीतियां व नियम)</span>
        </button>

        <button
          onClick={() => handleSelectSubTab('audit')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeSubTab === 'audit'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log History (ऑडिट ट्रेल)</span>
        </button>
      </div>

      {/* SUB-TAB 1: GENERAL IDENTITY & LOGO */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          {/* Logo Management Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-700" />
                  <span>Business Logo Management (लोगो प्रबंधन)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload, preview, replace, enable or disable your official brand logo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleField('isLogoEnabled', 'Business Logo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    formData.isLogoEnabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${formData.isLogoEnabled ? 'bg-emerald-600' : 'bg-gray-400'}`}
                  />
                  <span>{formData.isLogoEnabled ? 'Logo Enabled (सक्रिय)' : 'Logo Disabled (निष्क्रिय)'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Logo Preview */}
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Current Logo Preview
                </span>
                <div className="w-28 h-28 rounded-full border-2 border-emerald-400 bg-white p-1 shadow-md flex items-center justify-center overflow-hidden mb-3">
                  {formData.logoUrl && formData.isLogoEnabled ? (
                    <img
                      src={formData.logoUrl}
                      alt={formData.businessName}
                      className="w-full h-full object-contain rounded-full"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                      <span className="text-[11px] font-semibold text-gray-400">
                        {!formData.isLogoEnabled ? 'Logo Disabled' : 'No Logo'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono text-gray-500 max-w-[200px] truncate">
                  {formData.logoUrl || 'Using initial logo'}
                </span>
              </div>

              {/* Upload Controls */}
              <div className="md:col-span-2 space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploadingLogo ? 'Uploading to Firebase...' : 'Upload / Replace Logo'}</span>
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete / Reset Logo</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-1">
                  <p className="font-semibold">Logo Requirements:</p>
                  <ul className="list-disc list-inside text-[11.5px] text-emerald-900 space-y-0.5">
                    <li>Recommended size: Square format, 400×400px or 512×512px.</li>
                    <li>Supported formats: PNG (transparent background recommended), JPG, WebP.</li>
                    <li>Stored securely in Firebase Storage with immediate live sync across Header, Modals & Footers.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Business Name, Description & About Us */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                  <span>Business Identity & Description</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Official brand name displayed across Customer, Rider, Merchant, and Admin apps.
                </p>
              </div>

              {!isEditingIdentity ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingIdentity(true);
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Identity</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        businessName: businessSettings.businessName,
                        businessDescription: businessSettings.businessDescription,
                        aboutUs: businessSettings.aboutUs,
                      }));
                      setIsEditingIdentity(false);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSaveSection(
                        ['businessName', 'businessDescription', 'aboutUs'],
                        'Business Identity',
                        () => setIsEditingIdentity(false)
                      )
                    }
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Business Name (ब्रांड का नाम) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditingIdentity}
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. DOOARS DAILY BASKET"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Short Business Description (संक्षिप्त विवरण)
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditingIdentity}
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  placeholder="Appears in page headers, welcome banners, and share meta..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  About Us & Brand Story (हमारे बारे में)
                </label>
                <textarea
                  rows={4}
                  disabled={!isEditingIdentity}
                  value={formData.aboutUs}
                  onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                  placeholder="Explain your mission, regional sourcing from Dooars, farmer compensation, etc."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CONTACTS, ADDRESS & BUSINESS HOURS */}
      {activeSubTab === 'contacts' && (
        <div className="space-y-6">
          {/* Support Channels Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-700" />
                  <span>Customer Support Channels (कस्टमर सपोर्ट संपर्क)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Direct WhatsApp, Email, Website, and Helpline information.
                </p>
              </div>

              {!isEditingContacts ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingContacts(true);
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Contacts</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        supportWhatsApp: businessSettings.supportWhatsApp,
                        isWhatsAppEnabled: businessSettings.isWhatsAppEnabled,
                        supportEmail: businessSettings.supportEmail,
                        isEmailEnabled: businessSettings.isEmailEnabled,
                        website: businessSettings.website,
                        isWebsiteEnabled: businessSettings.isWebsiteEnabled,
                        customerSupportInfo: businessSettings.customerSupportInfo,
                      }));
                      setIsEditingContacts(false);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSaveSection(
                        [
                          'supportWhatsApp',
                          'isWhatsAppEnabled',
                          'supportEmail',
                          'isEmailEnabled',
                          'website',
                          'isWebsiteEnabled',
                          'customerSupportInfo',
                        ],
                        'Support Channels',
                        () => setIsEditingContacts(false)
                      )
                    }
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Contacts'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WhatsApp Number */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-700" />
                    <span>Support WhatsApp Number</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleField('isWhatsAppEnabled', 'WhatsApp Support')}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      formData.isWhatsAppEnabled
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {formData.isWhatsAppEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <input
                  type="text"
                  disabled={!isEditingContacts}
                  value={formData.supportWhatsApp}
                  onChange={(e) => setFormData({ ...formData, supportWhatsApp: e.target.value })}
                  placeholder="9609882564"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-900 disabled:bg-gray-100"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Customer one-tap WhatsApp chat link</span>
                  {formData.supportWhatsApp && (
                    <a
                      href={`https://wa.me/91${formData.supportWhatsApp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Test Chat</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Support Email */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-gray-700" />
                    <span>Support Email Address</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleField('isEmailEnabled', 'Email Support')}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      formData.isEmailEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {formData.isEmailEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <input
                  type="email"
                  disabled={!isEditingContacts}
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  placeholder="dooarsdailybasket@gmail.com"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 disabled:bg-gray-100"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Helpline email for disputes & receipts</span>
                  {formData.supportEmail && (
                    <a
                      href={`mailto:${formData.supportEmail}`}
                      className="text-gray-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Test Email</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Website */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Official Website</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleField('isWebsiteEnabled', 'Website Link')}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      formData.isWebsiteEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {formData.isWebsiteEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <input
                  type="text"
                  disabled={!isEditingContacts}
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="dooardailybasket.in"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 disabled:bg-gray-100"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Official web domain</span>
                  {formData.website && (
                    <a
                      href={`https://${formData.website.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Customer Support Info SLA Notes */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-gray-900">
                  Helpdesk SLA & Operating Notes
                </label>
                <input
                  type="text"
                  disabled={!isEditingContacts}
                  value={formData.customerSupportInfo}
                  onChange={(e) => setFormData({ ...formData, customerSupportInfo: e.target.value })}
                  placeholder="Customer Support: Mon - Sun, 7:00 AM - 9:00 PM."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-900 disabled:bg-gray-100"
                />
                <span className="text-[11px] text-gray-500 block">
                  Shown in Support Modal, customer receipts, and partner drawers.
                </span>
              </div>
            </div>
          </div>

          {/* Registered Office Address Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-600" />
                  <span>Registered Office Address (कार्यालय का पता)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Official registered corporate and regional fulfillment center address.
                </p>
              </div>

              {!isEditingAddress ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleClearField('officeAddress', 'Office Address')}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAddress(true);
                      setErrorMessage(null);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Address</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, officeAddress: businessSettings.officeAddress }));
                      setIsEditingAddress(false);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSaveSection(['officeAddress'], 'Office Address', () => setIsEditingAddress(false))
                    }
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Address'}</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <textarea
                rows={5}
                disabled={!isEditingAddress}
                value={formData.officeAddress}
                onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                placeholder={`Leesh river tg Garden,
Pattibari Division,
Post – Bagrakote,
District – Jalpaiguri,
West Bengal – 734501,
India`}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 leading-relaxed focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                This exact address appears in Customer Footer, Invoices, Delivery Partner Support, and Legal Modals.
              </span>
            </div>
          </div>

          {/* Business Hours & Service Area Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>Business Hours & Service Coverage</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Operating order delivery hours and regional coverage notes.
                </p>
              </div>

              {!isEditingHours ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingHours(true);
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Hours</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        businessHours: businessSettings.businessHours,
                        isBusinessHoursEnabled: businessSettings.isBusinessHoursEnabled,
                        serviceAreaInfo: businessSettings.serviceAreaInfo,
                        isServiceAreaInfoEnabled: businessSettings.isServiceAreaInfoEnabled,
                      }));
                      setIsEditingHours(false);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSaveSection(
                        [
                          'businessHours',
                          'isBusinessHoursEnabled',
                          'serviceAreaInfo',
                          'isServiceAreaInfoEnabled',
                        ],
                        'Business Hours & Service Coverage',
                        () => setIsEditingHours(false)
                      )
                    }
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Hours'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Operational Hours (काम के घंटे)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleField('isBusinessHoursEnabled', 'Business Hours')}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      formData.isBusinessHoursEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {formData.isBusinessHoursEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <input
                  type="text"
                  disabled={!isEditingHours}
                  value={formData.businessHours}
                  onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                  placeholder="Everyday: 6:30 AM – 9:30 PM (IST)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 disabled:bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Service Area Summary Note
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleField('isServiceAreaInfoEnabled', 'Service Coverage Note')}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      formData.isServiceAreaInfoEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {formData.isServiceAreaInfoEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <input
                  type="text"
                  disabled={!isEditingHours}
                  value={formData.serviceAreaInfo}
                  onChange={(e) => setFormData({ ...formData, serviceAreaInfo: e.target.value })}
                  placeholder="Serving Jalpaiguri, Maynaguri, Malbazar, Dhupguri..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: POLICIES & LEGAL */}
      {activeSubTab === 'policies' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-700" />
                  <span>Platform Policies & Compliance (नीतियां व नियम)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Terms & Conditions, Privacy Policy, and Refund/Cancellation Policy.
                </p>
              </div>

              {!isEditingPolicies ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPolicies(true);
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Policies</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        termsAndConditions: businessSettings.termsAndConditions,
                        privacyPolicy: businessSettings.privacyPolicy,
                        refundPolicy: businessSettings.refundPolicy,
                      }));
                      setIsEditingPolicies(false);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSaveSection(
                        ['termsAndConditions', 'privacyPolicy', 'refundPolicy'],
                        'Legal Policies',
                        () => setIsEditingPolicies(false)
                      )
                    }
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Policies'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Terms and Conditions */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Terms & Conditions (नियम और शर्तें)</span>
                </label>
                <textarea
                  rows={6}
                  disabled={!isEditingPolicies}
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  placeholder="Terms for customers, orders, merchants, and riders..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono text-gray-800 leading-relaxed focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                />
              </div>

              {/* Privacy Policy */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>Privacy Policy (गोपनीयता नीति)</span>
                </label>
                <textarea
                  rows={6}
                  disabled={!isEditingPolicies}
                  value={formData.privacyPolicy}
                  onChange={(e) => setFormData({ ...formData, privacyPolicy: e.target.value })}
                  placeholder="Customer data privacy, location handling for delivery routing..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono text-gray-800 leading-relaxed focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                />
              </div>

              {/* Refund Policy */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-emerald-700" />
                  <span>Refund & Cancellation Policy (रिफंड व रद्दीकरण नीति)</span>
                </label>
                <textarea
                  rows={6}
                  disabled={!isEditingPolicies}
                  value={formData.refundPolicy}
                  onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
                  placeholder="Fresh produce quality guarantee, damaged items replacement SLA..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono text-gray-800 leading-relaxed focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AUDIT LOG HISTORY */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-700" />
                <span>Business Settings Audit Trail (परिवर्तन इतिहास)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Every modification made by Super Admin is securely logged with timestamps and delta fields.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {auditLogs.length} Logged Events
            </span>
          </div>

          {isLoadingAudit ? (
            <div className="py-12 text-center text-xs text-gray-500">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading audit history from Firebase...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <History className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
              <p className="font-semibold text-gray-700">No modification logs yet</p>
              <p className="text-[11px] text-gray-400">
                Any changes made to Business Name, WhatsApp, Logo, or Office Address will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {auditLogs.map((log) => {
                const dateStr = log.updatedAt?.toDate
                  ? log.updatedAt.toDate().toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Just now';

                return (
                  <div key={log.id} className="py-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{log.summary}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">
                          {log.action.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-gray-400 font-mono text-[11px]">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-4 text-gray-500 text-[11px]">
                      <span>
                        Updated By: <strong className="text-gray-800">{log.updatedBy}</strong>
                      </span>
                      {log.changedFields?.length > 0 && (
                        <span>
                          Fields: <strong className="text-emerald-700">{log.changedFields.join(', ')}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Destructive / Clear Actions */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-bold text-gray-900 text-base">{confirmModal.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{confirmModal.description}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await fn();
                }}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
