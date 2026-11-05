import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface DeliveryLocation {
  riderId: string;
  riderName: string;
  orderId?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  lastUpdatedAt: any;
  isStale?: boolean;
}

const LOCATION_COLLECTION = 'delivery_locations';
const MIN_UPDATE_INTERVAL_MS = 20000; // 20 seconds throttle to prevent write exhaustion
const MIN_DISTANCE_CHANGE_METERS = 25; // 25 meters threshold

/**
 * Calculates distance between two coordinates in meters (Haversine formula)
 */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const locationTrackingService = {
  activeWatchId: null as number | null,
  lastBroadcastTime: 0,
  lastPosition: null as { lat: number; lng: number } | null,

  /**
   * Starts high-efficiency, throttled GPS location broadcasting for an active Delivery Partner
   */
  startRiderTracking(riderId: string, riderName: string, activeOrderId?: string): () => void {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      console.warn('Geolocation is not supported by this device.');
      return () => {};
    }

    this.stopRiderTracking();

    const updateLocation = async (pos: GeolocationPosition) => {
      const now = Date.now();
      const currentLat = pos.coords.latitude;
      const currentLng = pos.coords.longitude;

      // Distance check
      let hasMovedSignificantly = true;
      if (this.lastPosition) {
        const movedMeters = getDistanceMeters(
          this.lastPosition.lat,
          this.lastPosition.lng,
          currentLat,
          currentLng
        );
        hasMovedSignificantly = movedMeters >= MIN_DISTANCE_CHANGE_METERS;
      }

      // Time throttle check (max once per 20 seconds unless moved significantly)
      const timeElapsed = now - this.lastBroadcastTime;
      const shouldBroadcast = timeElapsed >= MIN_UPDATE_INTERVAL_MS || (hasMovedSignificantly && timeElapsed > 10000);

      if (!shouldBroadcast) {
        return;
      }

      this.lastBroadcastTime = now;
      this.lastPosition = { lat: currentLat, lng: currentLng };

      try {
        const locationRef = doc(db, LOCATION_COLLECTION, riderId);
        await setDoc(
          locationRef,
          {
            riderId,
            riderName,
            orderId: activeOrderId || '',
            latitude: currentLat,
            longitude: currentLng,
            heading: pos.coords.heading || null,
            speed: pos.coords.speed || null,
            accuracy: pos.coords.accuracy || null,
            lastUpdatedAt: serverTimestamp(),
            timestampMs: now,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Location broadcast non-blocking notice:', err);
      }
    };

    try {
      this.activeWatchId = navigator.geolocation.watchPosition(
        updateLocation,
        (error) => console.warn('GPS watcher notice:', error.message),
        {
          enableHighAccuracy: true,
          maximumAge: 15000,
          timeout: 15000,
        }
      );
    } catch (e) {
      console.warn('Could not initialize GPS watcher:', e);
    }

    return () => this.stopRiderTracking();
  },

  /**
   * Stops active GPS location broadcasting
   */
  stopRiderTracking(): void {
    if (this.activeWatchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.activeWatchId);
      this.activeWatchId = null;
    }
    this.lastPosition = null;
    this.lastBroadcastTime = 0;
  },

  /**
   * Subscribes to an active rider's GPS location with stale location detection (> 3 mins)
   */
  subscribeToRiderLocation(
    riderId: string,
    callback: (location: DeliveryLocation | null) => void
  ): () => void {
    if (!riderId) {
      callback(null);
      return () => {};
    }

    const docRef = doc(db, LOCATION_COLLECTION, riderId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
          return;
        }

        const data = snap.data();
        const now = Date.now();
        const lastMs = data.timestampMs || 0;
        const isStale = now - lastMs > 180000; // 3 minutes stale threshold

        callback({
          riderId: data.riderId || riderId,
          riderName: data.riderName || 'Delivery Partner',
          orderId: data.orderId,
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading,
          speed: data.speed,
          lastUpdatedAt: data.lastUpdatedAt,
          isStale,
        });
      },
      () => {
        callback(null);
      }
    );
  },
};
