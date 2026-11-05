import { collection, doc, setDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, handleFirestoreListenerError, OperationType } from './firebase';
import { Dispute, DisputeStatus } from '../types';

const DISPUTES_COLLECTION = 'disputes';

export const disputeService = {
  subscribeToDisputes(callback: (disputes: Dispute[]) => void): () => void {
    const colRef = collection(db, DISPUTES_COLLECTION);
    const q = query(colRef);

    return onSnapshot(
      q,
      (snap) => {
        const disputes: Dispute[] = [];
        snap.forEach((d) => {
          disputes.push({ id: d.id, ...d.data() } as Dispute);
        });
        disputes.sort((a, b) => {
          const tA = (a.createdAt as any)?.toDate?.()?.getTime?.() || (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
          const tB = (b.createdAt as any)?.toDate?.()?.getTime?.() || (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
          return tB - tA;
        });
        callback(disputes);
      },
      (error) => {
        handleFirestoreListenerError(error, DISPUTES_COLLECTION, () => callback([]));
      }
    );
  },

  subscribeToAllDisputes(callback: (disputes: Dispute[]) => void): () => void {
    return this.subscribeToDisputes(callback);
  },

  async createDispute(dispute: Omit<Dispute, 'id'>): Promise<string> {
    const docRef = doc(collection(db, DISPUTES_COLLECTION));
    try {
      await setDoc(docRef, {
        ...dispute,
        disputeNumber: dispute.disputeNumber || `DSP-${Date.now().toString().slice(-6)}`,
        status: dispute.status || 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${DISPUTES_COLLECTION}/${docRef.id}`);
    }
  },

  async updateDisputeStatus(
    id: string,
    status: DisputeStatus,
    resolutionNotes?: string,
    compensationAmount?: number
  ): Promise<void> {
    const docRef = doc(db, DISPUTES_COLLECTION, id);
    try {
      const payload: Record<string, any> = {
        status,
        updatedAt: serverTimestamp(),
      };
      if (status === 'resolved' || status === 'rejected') {
        payload.resolvedAt = serverTimestamp();
      }
      if (resolutionNotes !== undefined) {
        payload.resolutionNotes = resolutionNotes;
      }
      if (compensationAmount !== undefined) {
        payload.compensationAmount = compensationAmount;
      }
      await updateDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${DISPUTES_COLLECTION}/${id}`);
    }
  },

  async deleteDispute(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, DISPUTES_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${DISPUTES_COLLECTION}/${id}`);
    }
  },
};
