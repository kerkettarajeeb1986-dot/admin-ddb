import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, handleFirestoreError, handleFirestoreListenerError, OperationType } from './firebase';
import { GroceryProduct } from '../types';

const PRODUCTS_COLLECTION = 'products';
const DEFAULT_PAGE_SIZE = 30;

export interface PaginatedProductsResult {
  products: GroceryProduct[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// Sample Dooars Grocery Catalog list (Kept empty - products will be added by Market Partners and Admin)
export const SAMPLE_DOOARS_PRODUCTS: Omit<GroceryProduct, 'id'>[] = [];


// Helper to strip undefined values so Firestore never throws invalid data error
function cleanProductPayload(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export const productService = {
  /**
   * Realtime Subscription to all products
   */
  subscribeToProducts(
    partnerId?: string,
    callback?: (products: GroceryProduct[]) => void,
    maxLimit = 100
  ): () => void {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const constraints: QueryConstraint[] = [];

    if (partnerId && partnerId !== 'all') {
      constraints.push(where('partnerId', '==', partnerId));
    }
    constraints.push(limit(maxLimit));

    const q = query(colRef, ...constraints);

    return onSnapshot(
      q,
      (snap) => {
        const products: GroceryProduct[] = [];
        snap.forEach((d) => products.push({ id: d.id, ...d.data() } as GroceryProduct));

        // Realtime updates: pass live products directly to the subscriber
        if (callback) callback(products);
      },
      (error) => {
        handleFirestoreListenerError(error, PRODUCTS_COLLECTION, () => callback && callback([]));
      }
    );
  },

  /**
   * Paginated Catalog Loader
   */
  async getProductsPaginated(params?: {
    partnerId?: string;
    category?: string;
    isAvailableOnly?: boolean;
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  }): Promise<PaginatedProductsResult> {
    try {
      const colRef = collection(db, PRODUCTS_COLLECTION);
      const pageSize = params?.pageSize || DEFAULT_PAGE_SIZE;
      const constraints: QueryConstraint[] = [];

      if (params?.partnerId && params.partnerId !== 'all') {
        constraints.push(where('partnerId', '==', params.partnerId));
      }

      if (params?.category && params.category !== 'All' && params.category !== 'all') {
        constraints.push(where('category', '==', params.category));
      }

      if (params?.isAvailableOnly) {
        constraints.push(where('isAvailable', '==', true));
      }

      if (params?.lastDoc) {
        constraints.push(startAfter(params.lastDoc));
      }

      constraints.push(limit(pageSize));

      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);

      const products: GroceryProduct[] = [];
      snap.forEach((d) => products.push({ id: d.id, ...d.data() } as GroceryProduct));

      const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      const hasMore = snap.docs.length === pageSize;

      return { products, lastVisible, hasMore };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
    }
  },

  /**
   * Add a new Grocery Product
   */
  async addProduct(product: Omit<GroceryProduct, 'id'>): Promise<string> {
    const docRef = doc(collection(db, PRODUCTS_COLLECTION));
    try {
      const payload = cleanProductPayload({
        name: (product.name || '').trim(),
        category: product.category || 'Vegetable',
        price: Number(product.price) || 0,
        mrp: product.mrp !== undefined ? Number(product.mrp) : undefined,
        unit: (product.unit || '1 kg').trim(),
        stock: Number(product.stock) || 10,
        imageUrl: product.imageUrl || '',
        description: (product.description || '').trim(),
        partnerId: product.partnerId || 'central_hub',
        partnerName: product.partnerName || 'Dooars Central Basket',
        localAreaId: product.localAreaId || 'all',
        localAreaName: product.localAreaName || (product.localAreaId === 'all' || !product.localAreaId ? 'All Service Areas (संपूर्ण डुआर्स)' : 'Local Service Area'),
        isAvailable: product.isAvailable !== false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(docRef, payload);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${docRef.id}`);
    }
  },

  /**
   * Update an existing Grocery Product (Edit, Replace Details)
   */
  async updateProduct(id: string, updates: Partial<GroceryProduct>): Promise<void> {
    try {
      const payload = cleanProductPayload({
        ...updates,
        price: updates.price !== undefined ? Number(updates.price) : undefined,
        mrp: updates.mrp !== undefined ? Number(updates.mrp) : undefined,
        stock: updates.stock !== undefined ? Number(updates.stock) : undefined,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, PRODUCTS_COLLECTION, id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
    }
  },

  /**
   * Replace Product Image / Photo
   */
  async replaceProductImage(id: string, newImageUrl: string): Promise<void> {
    return this.updateProduct(id, { imageUrl: newImageUrl.trim() });
  },

  /**
   * Toggle Product Availability / In-Stock status
   */
  async toggleAvailability(id: string, isAvailable: boolean): Promise<void> {
    return this.updateProduct(id, { isAvailable });
  },

  /**
   * Permanently Delete a Product from Firebase
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
    }
  },
};

