import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, orderBy, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, handleFirestoreListenerError, OperationType } from './firebase';
import { UserProfile, UserRole, UserStatus } from '../types';

export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.warn('Could not fetch user profile:', error);
      return null;
    }
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.uid), {
        ...profile,
        createdAt: profile.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${profile.uid}`);
    }
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },

  async updateUserStatus(uid: string, status: UserStatus, rejectionReason?: string): Promise<void> {
    try {
      const payload: Record<string, any> = {
        status,
        updatedAt: serverTimestamp(),
      };
      if (rejectionReason !== undefined) {
        payload.rejectionReason = rejectionReason;
      }
      await updateDoc(doc(db, 'users', uid), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },

  async deleteUser(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  },

  subscribeToAllUsers(callback: (users: UserProfile[]) => void): () => void {
    const q = query(collection(db, 'users'));
    return onSnapshot(
      q,
      (snap) => {
        const users: UserProfile[] = [];
        snap.forEach((d) => {
          users.push({ uid: d.id, ...d.data() } as UserProfile);
        });
        callback(users);
      },
      (error) => {
        handleFirestoreListenerError(error, 'users', () => callback([]));
      }
    );
  },

  subscribeToPartners(role: 'market_partner' | 'delivery_partner', callback: (partners: UserProfile[]) => void): () => void {
    const q = query(collection(db, 'users'), where('role', '==', role));
    return onSnapshot(
      q,
      (snap) => {
        const partners: UserProfile[] = [];
        snap.forEach((d) => partners.push({ uid: d.id, ...d.data() } as UserProfile));
        callback(partners);
      },
      (error) => {
        handleFirestoreListenerError(error, 'users', () => callback([]));
      }
    );
  },

  subscribeToCustomers(callback: (customers: UserProfile[]) => void): () => void {
    const q = query(collection(db, 'users'), where('role', '==', 'customer'));
    return onSnapshot(
      q,
      (snap) => {
        const customers: UserProfile[] = [];
        snap.forEach((d) => customers.push({ uid: d.id, ...d.data() } as UserProfile));
        callback(customers);
      },
      (error) => {
        handleFirestoreListenerError(error, 'users', () => callback([]));
      }
    );
  },
};
