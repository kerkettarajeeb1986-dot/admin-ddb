import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from '../types';

export const partnerService = {
  async getMarketPartnersByArea(localAreaId: string): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'market_partner'),
        where('localAreaId', '==', localAreaId),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);
      const partners: UserProfile[] = [];
      snap.forEach((d) => partners.push(d.data() as UserProfile));
      return partners;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    }
  },

  async updatePartnerStatus(uid: string, status: 'active' | 'pending' | 'suspended'): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },
};
