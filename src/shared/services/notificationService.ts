import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, handleFirestoreListenerError, OperationType } from './firebase';
import { AdminNotification, NotificationType } from '../types';

const NOTIFICATIONS_COLLECTION = 'admin_notifications';

// In-memory set to prevent duplicate chime triggers
const seenNotificationIds = new Set<string>();

/**
 * Play gentle, production-grade notification chime using Web Audio API (Zero external assets needed)
 */
function playAudioChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

export const notificationService = {
  /**
   * Subscribes to recent notifications with a strictly bounded limit (prevents millions-read crash)
   */
  subscribeToAdminNotifications(
    callback: (notifications: AdminNotification[]) => void,
    maxLimit = 30,
    enableChime = true
  ): () => void {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    // Bounded query with limit(maxLimit)
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxLimit));

    return onSnapshot(
      q,
      (snap) => {
        const notifications: AdminNotification[] = [];
        let hasNewUnread = false;

        snap.forEach((d) => {
          const item = { id: d.id, ...d.data() } as AdminNotification;
          notifications.push(item);

          if (!item.read && !item.isRead && !seenNotificationIds.has(d.id)) {
            seenNotificationIds.add(d.id);
            hasNewUnread = true;
          }
        });

        notifications.sort((a, b) => {
          const tA = (a.createdAt as any)?.toDate?.()?.getTime?.() || (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
          const tB = (b.createdAt as any)?.toDate?.()?.getTime?.() || (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
          return tB - tA;
        });

        if (hasNewUnread && enableChime) {
          playAudioChime();
        }

        callback(notifications);
      },
      (error) => {
        handleFirestoreListenerError(error, NOTIFICATIONS_COLLECTION, () => callback([]));
      }
    );
  },

  async sendNotification(
    type: NotificationType,
    title: string,
    message: string,
    linkTab?: string,
    entityId?: string
  ): Promise<string> {
    const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
    try {
      await setDoc(docRef, {
        type,
        title,
        message,
        linkTab: linkTab || 'notifications',
        entityId: entityId || '',
        read: false,
        isRead: false,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.warn('Could not post admin notification:', error);
      return '';
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true, isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${NOTIFICATIONS_COLLECTION}/${id}`);
    }
  },

  async markAllAsRead(notifications?: AdminNotification[]): Promise<void> {
    try {
      if (notifications && notifications.length > 0) {
        const unread = notifications.filter((n) => !n.read && !n.isRead);
        if (unread.length === 0) return;
        const batch = writeBatch(db);
        unread.forEach((n) => {
          batch.update(doc(db, NOTIFICATIONS_COLLECTION, n.id), { read: true, isRead: true });
        });
        await batch.commit();
      } else {
        const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('read', '==', false), limit(50));
        const snap = await getDocs(q);
        if (snap.empty) return;
        const batch = writeBatch(db);
        snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
          batch.update(d.ref, { read: true, isRead: true });
        });
        await batch.commit();
      }
    } catch (error) {
      console.warn('Failed to mark all as read:', error);
    }
  },

  async deleteNotification(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${NOTIFICATIONS_COLLECTION}/${id}`);
    }
  },

  playChime(): void {
    playAudioChime();
  },
};
