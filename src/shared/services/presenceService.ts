import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface PartnerPresence {
  partnerId: string;
  role: 'market_partner' | 'delivery_partner';
  isOnline: boolean;
  lastSeenMs: number;
  lastSeen: any;
  isStale?: boolean;
}

const PRESENCE_COLLECTION = 'partner_presence';
const HEARTBEAT_INTERVAL_MS = 60000; // 60 seconds heartbeat interval (never every second!)
const STALE_THRESHOLD_MS = 180000; // 3 minutes without heartbeat = stale/offline

export const presenceService = {
  heartbeatTimer: null as any,

  /**
   * Sets up an authenticated partner's presence heartbeat
   */
  startHeartbeat(partnerId: string, role: 'market_partner' | 'delivery_partner', isOnline: boolean): () => void {
    this.stopHeartbeat();

    if (!partnerId) return () => {};

    const sendHeartbeat = async (onlineStatus: boolean) => {
      try {
        const presenceRef = doc(db, PRESENCE_COLLECTION, partnerId);
        await setDoc(
          presenceRef,
          {
            partnerId,
            role,
            isOnline: onlineStatus,
            lastSeenMs: Date.now(),
            lastSeen: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Presence heartbeat non-blocking notice:', e);
      }
    };

    // Initial broadcast
    sendHeartbeat(isOnline);

    if (isOnline) {
      this.heartbeatTimer = setInterval(() => {
        sendHeartbeat(true);
      }, HEARTBEAT_INTERVAL_MS);
    }

    return () => {
      this.stopHeartbeat();
      sendHeartbeat(false);
    };
  },

  /**
   * Stops ongoing heartbeat timer
   */
  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  },

  /**
   * Subscribes to a partner's presence with stale-session detection
   */
  subscribeToPresence(
    partnerId: string,
    callback: (presence: PartnerPresence | null) => void
  ): () => void {
    if (!partnerId) {
      callback(null);
      return () => {};
    }

    const docRef = doc(db, PRESENCE_COLLECTION, partnerId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
          return;
        }

        const data = snap.data();
        const now = Date.now();
        const lastMs = data.lastSeenMs || 0;
        const isStale = now - lastMs > STALE_THRESHOLD_MS;
        const effectiveOnline = Boolean(data.isOnline) && !isStale;

        callback({
          partnerId: data.partnerId || partnerId,
          role: data.role || 'market_partner',
          isOnline: effectiveOnline,
          lastSeenMs: lastMs,
          lastSeen: data.lastSeen,
          isStale,
        });
      },
      () => {
        callback(null);
      }
    );
  },
};
