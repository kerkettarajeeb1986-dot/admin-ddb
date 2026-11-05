import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, handleFirestoreError, handleFirestoreListenerError, OperationType } from './firebase';
import { BusinessSettings, BusinessSettingsAuditLog, initialBusinessSettings } from '../types/businessSettings';

// Firestore collection 'settings' is fully permitted with read/write permissions in Firestore security rules
const BUSINESS_SETTINGS_DOC = 'settings/business';
const AUDIT_LOGS_DOC = 'settings/audit_logs';

function cleanPayload(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export const businessSettingsService = {
  /**
   * Fetch current business settings once
   */
  async getBusinessSettings(): Promise<BusinessSettings> {
    try {
      const snap = await getDoc(doc(db, BUSINESS_SETTINGS_DOC));
      if (snap.exists()) {
        const data = snap.data();
        // If address is outdated or missing, merge with initialBusinessSettings
        const officeAddress =
          data.officeAddress && !data.officeAddress.includes('West Liberty')
            ? data.officeAddress
            : initialBusinessSettings.officeAddress;

        return { ...initialBusinessSettings, ...data, officeAddress } as BusinessSettings;
      } else {
        // Automatically seed with official business info in settings/business
        await this.seedInitialSettings();
        return initialBusinessSettings;
      }
    } catch (error) {
      console.warn('Failed to load business settings from Firestore, fallback to initial:', error);
      return initialBusinessSettings;
    }
  },

  /**
   * Realtime subscription to Business Settings
   */
  subscribeToBusinessSettings(callback: (settings: BusinessSettings) => void): () => void {
    const unsub = onSnapshot(
      doc(db, BUSINESS_SETTINGS_DOC),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const officeAddress =
            data.officeAddress && !data.officeAddress.includes('West Liberty')
              ? data.officeAddress
              : initialBusinessSettings.officeAddress;

          callback({ ...initialBusinessSettings, ...data, officeAddress } as BusinessSettings);
        } else {
          // If first boot, attempt seed or pass defaults
          callback(initialBusinessSettings);
          this.seedInitialSettings().catch(() => {});
        }
      },
      (error) => {
        handleFirestoreListenerError(error, BUSINESS_SETTINGS_DOC, () => {
          callback(initialBusinessSettings);
        });
      }
    );
    return unsub;
  },

  /**
   * Internal bootstrap seed if document does not exist yet.
   * Creates settings/business automatically with Dooars Daily Basket business information.
   */
  async seedInitialSettings(adminIdentifier: string = 'Super Admin Bootstrapper'): Promise<boolean> {
    try {
      const docRef = doc(db, BUSINESS_SETTINGS_DOC);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, {
          ...initialBusinessSettings,
          updatedAt: serverTimestamp(),
          updatedBy: adminIdentifier,
        });
        return true;
      } else {
        const existingData = snap.data();
        if (!existingData.officeAddress || existingData.officeAddress.includes('West Liberty')) {
          await setDoc(
            docRef,
            {
              officeAddress: initialBusinessSettings.officeAddress,
              businessDescription: initialBusinessSettings.businessDescription,
              updatedAt: serverTimestamp(),
              updatedBy: adminIdentifier,
            },
            { merge: true }
          );
          return true;
        }
      }
      return false;
    } catch (e) {
      console.info('Initial settings seed skipped:', e);
      return false;
    }
  },

  /**
   * Update Business Settings and record Admin Audit Trail
   */
  async updateBusinessSettings(
    updates: Partial<BusinessSettings>,
    adminUserEmailOrUid: string = 'Super Admin',
    actionSummary?: string
  ): Promise<void> {
    try {
      const cleanedUpdates = cleanPayload(updates);

      // 1. Fetch current settings safely to compare changed fields for Audit Log
      let prevData: Partial<BusinessSettings> = initialBusinessSettings;
      let isFirstCreation = false;
      try {
        const prevDoc = await getDoc(doc(db, BUSINESS_SETTINGS_DOC));
        if (prevDoc.exists()) {
          prevData = prevDoc.data() as Partial<BusinessSettings>;
        } else {
          isFirstCreation = true;
        }
      } catch (e) {
        console.warn('Could not read existing business settings, will merge directly:', e);
      }

      const changedFields: string[] = [];
      const previousValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      for (const key of Object.keys(cleanedUpdates) as (keyof BusinessSettings)[]) {
        if (cleanedUpdates[key] !== undefined && cleanedUpdates[key] !== prevData[key]) {
          changedFields.push(key);
          previousValues[key] = prevData[key] ?? null;
          newValues[key] = cleanedUpdates[key];
        }
      }

      // 2. Commit update to Firestore settings/business
      const settingsRef = doc(db, BUSINESS_SETTINGS_DOC);
      const basePayload = isFirstCreation ? initialBusinessSettings : {};

      await setDoc(
        settingsRef,
        {
          ...basePayload,
          ...cleanedUpdates,
          updatedAt: serverTimestamp(),
          updatedBy: adminUserEmailOrUid || auth.currentUser?.email || auth.currentUser?.uid || 'Super Admin',
        },
        { merge: true }
      );

      // Also sync appName/supportPhone/supportEmail into settings/master so both stay unified
      try {
        const masterSync: Record<string, any> = {};
        if (cleanedUpdates.businessName) masterSync.appName = cleanedUpdates.businessName;
        if (cleanedUpdates.supportWhatsApp) masterSync.supportPhone = cleanedUpdates.supportWhatsApp;
        if (cleanedUpdates.supportEmail) masterSync.supportEmail = cleanedUpdates.supportEmail;
        if (Object.keys(masterSync).length > 0) {
          await setDoc(doc(db, 'settings/master'), masterSync, { merge: true });
        }
      } catch (syncErr) {
        console.warn('Master settings sync notice (non-blocking):', syncErr);
      }

      // 3. Record Audit Log entry safely in settings/audit_logs
      if (changedFields.length > 0) {
        try {
          const auditDocRef = doc(db, AUDIT_LOGS_DOC);
          const currentAuditSnap = await getDoc(auditDocRef);
          const existingLogs: BusinessSettingsAuditLog[] = currentAuditSnap.exists()
            ? currentAuditSnap.data()?.logs || []
            : [];

          const newLogEntry: BusinessSettingsAuditLog = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            action: cleanedUpdates.logoUrl && changedFields.includes('logoUrl') ? 'replace_logo' : 'update_business_settings',
            changedFields,
            previousValues,
            newValues,
            updatedBy: adminUserEmailOrUid || auth.currentUser?.email || auth.currentUser?.uid || 'Super Admin',
            updatedAt: new Date().toISOString(),
            summary:
              actionSummary ||
              `Updated business info: ${changedFields.join(', ')} by ${
                adminUserEmailOrUid || auth.currentUser?.email || 'Super Admin'
              }`,
          };

          const updatedLogs = [newLogEntry, ...existingLogs].slice(0, 50);

          await setDoc(
            auditDocRef,
            {
              logs: updatedLogs,
              lastUpdated: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (auditError) {
          console.warn('Audit logging non-blocking notice:', auditError);
        }
      }
    } catch (error) {
      console.error('Error saving business settings to Firebase:', error);
      handleFirestoreError(error, OperationType.WRITE, BUSINESS_SETTINGS_DOC);
    }
  },

  /**
   * Realtime subscription to Admin Audit Trail
   */
  subscribeToAuditLogs(callback: (logs: BusinessSettingsAuditLog[]) => void): () => void {
    const unsub = onSnapshot(
      doc(db, AUDIT_LOGS_DOC),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          callback(data.logs || []);
        } else {
          callback([]);
        }
      },
      (error) => {
        handleFirestoreListenerError(error, AUDIT_LOGS_DOC, () => callback([]));
      }
    );
    return unsub;
  },

  /**
   * Upload logo to Firebase Storage with automatic fallback to high-fidelity Base64 image
   */
  async uploadBusinessLogo(file: File): Promise<string> {
    try {
      // 1. Try Firebase Storage if initialized and connected
      const filename = `business_logos/logo_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { getStorage } = await import('firebase/storage');
      const storage = getStorage();
      const storageRef = ref(storage, filename);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (storageErr) {
      console.warn('Firebase Storage upload failed or not enabled, converting to optimized data URL:', storageErr);
      
      // 2. High-fidelity canvas/data-url fallback
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 600;
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/png', 0.95));
            } else {
              resolve(e.target?.result as string);
            }
          };
          img.onerror = () => resolve(e.target?.result as string);
          img.src = e.target?.result as string;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }
  },
};
