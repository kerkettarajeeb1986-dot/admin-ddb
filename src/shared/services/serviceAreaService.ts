import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, handleFirestoreListenerError, OperationType } from './firebase';
import { LocalArea, LocalAreaFormData, LocalAreaStatus, ServiceabilityCheckResult } from '../types/serviceArea';

const COLLECTION_NAME = 'localAreas';

export const serviceAreaService = {
  /**
   * Real-time subscription to local areas from Firebase Firestore.
   * Can optionally include or exclude archived areas.
   */
  subscribeToLocalAreas(
    callback: (areas: LocalArea[]) => void,
    includeArchived: boolean = true
  ): () => void {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const areas: LocalArea[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          areas.push({
            id: docSnap.id,
            name: data.name || '',
            pinCodes: Array.isArray(data.pinCodes) ? data.pinCodes : [],
            district: data.district || '',
            state: data.state || 'West Bengal',
            deliveryAvailable: data.deliveryAvailable !== false,
            status: (data.status as LocalAreaStatus) || 'active',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            createdBy: data.createdBy,
            notes: data.notes || '',
          });
        });

        // In-memory sort by name asc
        areas.sort((a, b) => a.name.localeCompare(b.name));

        // Filter client-side
        const filtered = includeArchived ? areas : areas.filter((a) => a.status !== 'archived');
        callback(filtered);
      },
      (error) => {
        handleFirestoreListenerError(error, COLLECTION_NAME, () => callback([]));
      }
    );

    return unsubscribe;
  },

  /**
   * Get all active local areas from Firebase.
   * Used dynamically for Market Partner registration & Customer serviceability.
   */
  async getActiveLocalAreas(): Promise<LocalArea[]> {
    const colRef = collection(db, COLLECTION_NAME);
    try {
      const q = query(colRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      const activeAreas: LocalArea[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        activeAreas.push({
          id: docSnap.id,
          name: data.name || '',
          pinCodes: Array.isArray(data.pinCodes) ? data.pinCodes : [],
          district: data.district || '',
          state: data.state || 'West Bengal',
          deliveryAvailable: data.deliveryAvailable !== false,
          status: 'active',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy,
          notes: data.notes || '',
        });
      });
      // Sort alphabetically by name
      return activeAreas.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.warn('Could not fetch active local areas from Firestore:', error);
      return [];
    }
  },

  /**
   * Add a new Local Area to Firebase.
   * Only Super Admin can perform this action.
   */
  async addLocalArea(formData: LocalAreaFormData, adminUid?: string): Promise<string> {
    const colRef = collection(db, COLLECTION_NAME);
    const newDocRef = doc(colRef);

    // Clean and normalize PIN codes
    const pinCodesArray = formData.pinCodes
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter((p) => /^\d{6}$/.test(p));

    const payload: Record<string, any> = {
      name: formData.name.trim(),
      pinCodes: Array.from(new Set(pinCodesArray)),
      district: formData.district.trim(),
      state: formData.state.trim() || 'West Bengal',
      deliveryAvailable: Boolean(formData.deliveryAvailable),
      status: formData.status || 'active',
      notes: (formData.notes || '').trim(),
      createdBy: adminUid || 'super_admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(newDocRef, payload);
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${newDocRef.id}`);
    }
  },

  /**
   * Edit an existing Local Area in Firebase.
   * Only Super Admin can perform this action.
   */
  async updateLocalArea(id: string, formData: Partial<LocalAreaFormData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updatePayload: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (formData.name !== undefined) updatePayload.name = formData.name.trim();
    if (formData.district !== undefined) updatePayload.district = formData.district.trim();
    if (formData.state !== undefined) updatePayload.state = formData.state.trim();
    if (formData.deliveryAvailable !== undefined) updatePayload.deliveryAvailable = Boolean(formData.deliveryAvailable);
    if (formData.status !== undefined) updatePayload.status = formData.status;
    if (formData.notes !== undefined) updatePayload.notes = formData.notes.trim();

    if (formData.pinCodes !== undefined) {
      const pinCodesArray = formData.pinCodes
        .split(/[,;\s]+/)
        .map((p) => p.trim())
        .filter((p) => /^\d{6}$/.test(p));
      updatePayload.pinCodes = Array.from(new Set(pinCodesArray));
    }

    try {
      await updateDoc(docRef, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Set Status of a Local Area (active, inactive, archived) in Firebase.
   * When activated, automatically ensures deliveryAvailable is true so it is immediately operable.
   */
  async setStatus(id: string, newStatus: LocalAreaStatus): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    try {
      const updates: Record<string, any> = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };
      if (newStatus === 'active') {
        updates.deliveryAvailable = true;
      } else if (newStatus === 'archived') {
        updates.deliveryAvailable = false;
      }
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Enable / Disable a Local Area in Firebase.
   */
  async toggleStatus(id: string, newStatus: 'active' | 'inactive'): Promise<void> {
    return this.setStatus(id, newStatus);
  },

  /**
   * Archive a Local Area in Firebase.
   */
  async archiveLocalArea(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    try {
      await updateDoc(docRef, {
        status: 'archived',
        deliveryAvailable: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Permanently delete a Local Area from Firebase.
   */
  async deleteLocalArea(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Customer serviceability check using active admin-managed areas from Firebase.
   */
  async checkCustomerServiceability(
    pinCode: string
  ): Promise<ServiceabilityCheckResult> {
    const cleanPin = pinCode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return {
        isServiceable: false,
        message: 'Please enter a valid 6-digit PIN code.',
      };
    }

    const activeAreas = await this.getActiveLocalAreas();
    if (!activeAreas || activeAreas.length === 0) {
      return {
        isServiceable: false,
        message: 'No active delivery areas are currently operational. Please check back soon.',
      };
    }

    // Match by PIN code
    const matchedArea = activeAreas.find(
      (area) => area.deliveryAvailable && area.pinCodes.includes(cleanPin)
    );

    if (matchedArea) {
      return {
        isServiceable: true,
        area: matchedArea,
        message: `Delivery is available in ${matchedArea.name}, ${matchedArea.district} (PIN: ${cleanPin})!`,
      };
    }

    return {
      isServiceable: false,
      message: `Sorry, delivery is not available yet for PIN code ${cleanPin}. We are expanding our coverage!`,
    };
  },
};
