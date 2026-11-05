import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  getDocs,
  runTransaction,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, handleFirestoreError, handleFirestoreListenerError, OperationType } from './firebase';
import { GroceryOrder, OrderStatus, PaymentStatus, DeliveryStatus } from '../types';
import { pricingService } from './pricingService';

const ORDERS_COLLECTION = 'orders';
const DEFAULT_PAGE_SIZE = 40;

export interface PaginatedOrdersResult {
  orders: GroceryOrder[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export const orderService = {
  /**
   * Bounded Realtime Subscription to Orders (prevents downloading millions of records)
   */
  subscribeToOrders(
    filter?: {
      customerId?: string;
      marketPartnerId?: string;
      deliveryPartnerId?: string;
      localAreaId?: string;
      status?: OrderStatus;
    },
    callback?: (orders: GroceryOrder[]) => void,
    maxLimit = DEFAULT_PAGE_SIZE
  ): () => void {
    const colRef = collection(db, ORDERS_COLLECTION);
    const constraints: QueryConstraint[] = [];
    const hasFilter = Boolean(
      filter?.customerId ||
      filter?.marketPartnerId ||
      filter?.deliveryPartnerId ||
      filter?.localAreaId ||
      filter?.status
    );

    if (filter?.customerId) {
      constraints.push(where('customerId', '==', filter.customerId));
    } else if (filter?.marketPartnerId) {
      constraints.push(where('marketPartnerId', '==', filter.marketPartnerId));
    } else if (filter?.deliveryPartnerId) {
      constraints.push(where('deliveryPartnerId', '==', filter.deliveryPartnerId));
    } else if (filter?.localAreaId) {
      constraints.push(where('localAreaId', '==', filter.localAreaId));
    }

    if (filter?.status) {
      constraints.push(where('status', '==', filter.status));
    }

    // Only add orderBy in query if no compound equality filter exists, avoiding Firestore composite index requirements
    if (!hasFilter) {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    constraints.push(limit(maxLimit));

    const q = query(colRef, ...constraints);

    return onSnapshot(
      q,
      (snap) => {
        const orders: GroceryOrder[] = [];
        snap.forEach((d) => orders.push({ id: d.id, ...d.data() } as GroceryOrder));
        // Sort in memory by createdAt descending safely
        orders.sort((a, b) => {
          const tA = (a.createdAt as any)?.toDate?.()?.getTime?.() || (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
          const tB = (b.createdAt as any)?.toDate?.()?.getTime?.() || (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
          return tB - tA;
        });
        if (callback) callback(orders);
      },
      (error) => {
        handleFirestoreListenerError(error, ORDERS_COLLECTION, () => callback && callback([]));
      }
    );
  },

  /**
   * Paginated Orders Fetch for Dashboards and Reports (High Volume Scalable)
   */
  async getOrdersPaginated(
    filter?: {
      customerId?: string;
      marketPartnerId?: string;
      deliveryPartnerId?: string;
      status?: OrderStatus;
      lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
      pageSize?: number;
    }
  ): Promise<PaginatedOrdersResult> {
    try {
      const colRef = collection(db, ORDERS_COLLECTION);
      const pageSize = filter?.pageSize || DEFAULT_PAGE_SIZE;
      const constraints: QueryConstraint[] = [];

      if (filter?.customerId) {
        constraints.push(where('customerId', '==', filter.customerId));
      } else if (filter?.marketPartnerId) {
        constraints.push(where('marketPartnerId', '==', filter.marketPartnerId));
      } else if (filter?.deliveryPartnerId) {
        constraints.push(where('deliveryPartnerId', '==', filter.deliveryPartnerId));
      }

      if (filter?.status) {
        constraints.push(where('status', '==', filter.status));
      }

      const hasFilter = Boolean(filter?.customerId || filter?.marketPartnerId || filter?.deliveryPartnerId || filter?.status);
      if (!hasFilter) {
        constraints.push(orderBy('createdAt', 'desc'));
      }

      if (filter?.lastDoc) {
        constraints.push(startAfter(filter.lastDoc));
      }

      constraints.push(limit(pageSize));

      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);

      const orders: GroceryOrder[] = [];
      snap.forEach((d) => orders.push({ id: d.id, ...d.data() } as GroceryOrder));

      if (hasFilter) {
        orders.sort((a, b) => {
          const tA = (a.createdAt as any)?.toDate?.()?.getTime?.() || (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
          const tB = (b.createdAt as any)?.toDate?.()?.getTime?.() || (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
          return tB - tA;
        });
      }

      const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      const hasMore = snap.docs.length === pageSize;

      return { orders, lastVisible, hasMore };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, ORDERS_COLLECTION);
    }
  },

  /**
   * Creates an order with tamper-proof mathematical integrity verification
   */
  async createOrder(order: Omit<GroceryOrder, 'id'>): Promise<string> {
    const docRef = doc(collection(db, ORDERS_COLLECTION));
    try {
      // Validate pricing integrity (prevents client-side manipulation of totals)
      const integrity = pricingService.validateOrderIntegrity({
        items: order.items,
        deliveryFee: order.deliveryFee,
        packagingFee: order.packagingFee,
        totalAmount: order.totalAmount,
      });

      const verifiedTotal = integrity.isValid ? order.totalAmount : integrity.expectedTotal;
      const orderNumber = order.orderNumber || `DDB-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();
      const initialTimeline = [
        {
          status: 'placed',
          title: 'Order Placed',
          timestamp: now,
          note: order.isCOD ? 'Cash on Delivery selected' : 'Online Payment initiated',
        },
      ];

      await setDoc(docRef, {
        ...order,
        orderNumber,
        totalAmount: verifiedTotal,
        timeline: order.timeline || initialTimeline,
        paymentStatus: order.paymentStatus || (order.isCOD ? 'pending' : 'completed'),
        deliveryStatus: order.deliveryStatus || 'unassigned',
        status: order.status || 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${ORDERS_COLLECTION}/${docRef.id}`);
    }
  },

  /**
   * ATOMIC TRANSACTION: Prevent race conditions when delivery riders claim an unassigned order
   */
  async claimDeliveryAtomic(
    orderId: string,
    riderId: string,
    riderName: string
  ): Promise<{ success: boolean; message: string }> {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);

    try {
      return await runTransaction(db, async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) {
          throw new Error('Order not found.');
        }

        const data = orderSnap.data();
        const currentDeliveryStatus = data.deliveryStatus || 'unassigned';

        // Check if already assigned to someone else
        if (currentDeliveryStatus !== 'unassigned' && data.deliveryPartnerId && data.deliveryPartnerId !== riderId) {
          return {
            success: false,
            message: `Order was already claimed by rider ${data.deliveryPartnerName || 'another partner'}.`,
          };
        }

        const now = new Date().toISOString();
        const timelineEvent = {
          status: 'assigned',
          title: 'Delivery Rider Assigned',
          timestamp: now,
          note: `Claimed by rider ${riderName}`,
        };

        const existingTimeline = data.timeline || [];

        transaction.update(orderRef, {
          deliveryPartnerId: riderId,
          deliveryPartnerName: riderName,
          deliveryStatus: 'assigned',
          timeline: [...existingTimeline, timelineEvent],
          updatedAt: serverTimestamp(),
        });

        return {
          success: true,
          message: 'Order successfully assigned to you!',
        };
      });
    } catch (error: any) {
      console.warn('Atomic delivery assignment transaction failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to claim delivery order.',
      };
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<void> {
    try {
      const timelineEvent = {
        status,
        title: `Status: ${status.replace(/_/g, ' ').toUpperCase()}`,
        timestamp: new Date().toISOString(),
        note: note || '',
      };
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        status,
        timeline: arrayUnion(timelineEvent),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    }
  },

  async assignDeliveryPartner(
    orderId: string,
    deliveryPartnerId: string,
    deliveryPartnerName: string
  ): Promise<void> {
    try {
      const timelineEvent = {
        status: 'assigned',
        title: 'Delivery Rider Assigned',
        timestamp: new Date().toISOString(),
        note: `Assigned to rider ${deliveryPartnerName}`,
      };
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        deliveryPartnerId,
        deliveryPartnerName,
        deliveryStatus: 'assigned',
        timeline: arrayUnion(timelineEvent),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    }
  },

  async updateDeliveryStatus(orderId: string, deliveryStatus: DeliveryStatus, note?: string): Promise<void> {
    try {
      const timelineEvent = {
        status: deliveryStatus,
        title: `Delivery: ${deliveryStatus.replace(/_/g, ' ').toUpperCase()}`,
        timestamp: new Date().toISOString(),
        note: note || '',
      };
      const updates: Record<string, any> = {
        deliveryStatus,
        timeline: arrayUnion(timelineEvent),
        updatedAt: serverTimestamp(),
      };
      if (deliveryStatus === 'delivered') {
        updates.status = 'delivered';
      }
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    }
  },

  /**
   * ATOMIC TRANSACTION: Confirm Delivery Payment and mark delivered atomically
   */
  async confirmDeliveryPayment(
    orderId: string,
    paymentMethod: 'upi' | 'cod',
    amount: number,
    riderName: string,
    transactionRef?: string
  ): Promise<void> {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);

    try {
      await runTransaction(db, async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error('Order document not found.');

        const data = orderSnap.data();
        const now = new Date().toISOString();
        const methodLabel = paymentMethod === 'upi' ? 'UPI QR Code' : 'Cash on Delivery (Cash)';
        const timelineEvent = {
          status: 'delivered',
          title: `Delivered & Paid (₹${amount})`,
          timestamp: now,
          note: `Payment of ₹${amount} collected via ${methodLabel} by rider ${riderName}.${
            transactionRef ? ` Ref / UTR: ${transactionRef}` : ''
          }`,
        };

        const existingTimeline = data.timeline || [];

        transaction.update(orderRef, {
          status: 'delivered',
          deliveryStatus: 'delivered',
          paymentStatus: 'completed',
          paymentMethod,
          isCOD: paymentMethod === 'cod',
          timeline: [...existingTimeline, timelineEvent],
          deliveredAt: now,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    }
  },

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<void> {
    try {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        paymentStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    }
  },

  async cancelOrder(orderId: string, reason: string): Promise<void> {
    try {
      const timelineEvent = {
        status: 'cancelled',
        title: 'Order Cancelled',
        timestamp: new Date().toISOString(),
        note: reason,
      };
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        status: 'cancelled',
        cancellationReason: reason,
        timeline: arrayUnion(timelineEvent),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    }
  },

  async updateRefundStatus(orderId: string, refundStatus: 'requested' | 'approved' | 'processed'): Promise<void> {
    try {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        refundStatus,
        paymentStatus: refundStatus === 'processed' ? 'refunded' : undefined,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    }
  },
};
