import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { MasterSettings } from '../types/settings';

const SETTINGS_DOC = 'settings/master';

export const defaultSettings: MasterSettings = {
  appName: 'Dooars Daily Basket',
  supportPhone: '+91 98000 12345',
  supportEmail: 'support@dooarsdailybasket.com',
  deliveryBaseFee: 40,
  deliveryPerKmFee: 15,
  packagingFee: 10,
  freeDeliveryThreshold: 0,
  platformFeePercent: 5,
  marketPartnerCommissionPercent: 10,
  deliveryPartnerSharePercent: 80,
  autoApproveOrders: false,
  upiId: 'dooarsbasket@upi',
  upiPayeeName: 'Dooars Daily Basket Pvt Ltd',
  upiQrMode: 'static_customer_fills',
  currencySymbol: '₹',
};

function cleanPayload(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export const settingsService = {
  async getSettings(): Promise<MasterSettings> {
    try {
      const snap = await getDoc(doc(db, SETTINGS_DOC));
      if (snap.exists()) {
        return { ...defaultSettings, ...snap.data() } as MasterSettings;
      }
      return defaultSettings;
    } catch (error) {
      console.warn('Failed to load settings from Firestore, using defaults:', error);
      return defaultSettings;
    }
  },

  subscribeToSettings(callback: (settings: MasterSettings) => void): () => void {
    const unsub = onSnapshot(
      doc(db, SETTINGS_DOC),
      (snap) => {
        if (snap.exists()) {
          callback({ ...defaultSettings, ...snap.data() } as MasterSettings);
        } else {
          callback(defaultSettings);
        }
      },
      (error) => {
        console.warn('Settings subscription error:', error);
        callback(defaultSettings);
      }
    );
    return unsub;
  },

  async updateSettings(settings: Partial<MasterSettings>): Promise<void> {
    try {
      await setDoc(
        doc(db, SETTINGS_DOC),
        {
          ...cleanPayload(settings),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Harmonize with settings/business for seamless consistency
      const businessSync: Record<string, any> = {};
      if (settings.appName) businessSync.businessName = settings.appName;
      if (settings.supportPhone) businessSync.supportWhatsApp = settings.supportPhone;
      if (settings.supportEmail) businessSync.supportEmail = settings.supportEmail;
      if (Object.keys(businessSync).length > 0) {
        try {
          await setDoc(doc(db, 'settings/business'), businessSync, { merge: true });
        } catch (syncErr) {
          console.warn('Sync to settings/business non-blocking:', syncErr);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC);
    }
  },
};
