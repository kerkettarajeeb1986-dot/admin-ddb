import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, handleFirestoreListenerError, OperationType } from './firebase';
import {
  ProductCategory,
  CANONICAL_CATEGORIES,
  normalizeCategoryName,
  mapCategoryToId,
  isProductInCategory,
} from '../types/category';

const CATEGORIES_DOC_PATH = 'settings';
const CATEGORIES_DOC_ID = 'categories';
const CATEGORIES_COLLECTION = 'categories';

// In-memory cache for synchronous access
let cachedCategories: ProductCategory[] = [...CANONICAL_CATEGORIES];
let isInitialized = false;

// Merge canonical categories with any stored Firestore categories
function mergeWithCanonical(storedList: ProductCategory[]): ProductCategory[] {
  const mergedMap = new Map<string, ProductCategory>();

  // First seed all 14 canonical categories
  CANONICAL_CATEGORIES.forEach((cat) => {
    mergedMap.set(cat.id, { ...cat });
  });

  // Then overlay stored categories (preserving admin settings, custom categories, disabled status)
  storedList.forEach((stored) => {
    if (!stored || !stored.id) return;
    const existing = mergedMap.get(stored.id);
    if (existing) {
      mergedMap.set(stored.id, {
        ...existing,
        ...stored,
        // Ensure name and aliases are intact
        name: stored.name || existing.name,
        hindiName: stored.hindiName || existing.hindiName,
        aliases: Array.from(new Set([...(existing.aliases || []), ...(stored.aliases || [])])),
      });
    } else {
      // Custom category added by admin
      mergedMap.set(stored.id, {
        ...stored,
        aliases: stored.aliases || [stored.name],
      });
    }
  });

  return Array.from(mergedMap.values()).sort((a, b) => (a.order || 99) - (b.order || 99));
}

export const categoryService = {
  /**
   * Get cached categories synchronously
   */
  getCachedCategories(): ProductCategory[] {
    return cachedCategories;
  },

  /**
   * Get active enabled categories
   */
  getActiveCategories(): ProductCategory[] {
    return cachedCategories.filter((c) => c.isEnabled);
  },

  /**
   * Realtime subscription to category changes
   */
  subscribeToCategories(
    callback: (categories: ProductCategory[]) => void,
    activeOnly: boolean = false
  ): () => void {
    // Deliver cached immediately
    callback(activeOnly ? cachedCategories.filter((c) => c.isEnabled) : cachedCategories);

    const docRef = doc(db, CATEGORIES_DOC_PATH, CATEGORIES_DOC_ID);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const items: ProductCategory[] = Array.isArray(data.items) ? data.items : [];
          if (items.length > 0) {
            cachedCategories = mergeWithCanonical(items);
            callback(activeOnly ? cachedCategories.filter((c) => c.isEnabled) : cachedCategories);
            return;
          }
        }

        // If settings/categories document doesn't exist yet, bootstrap it
        if (!isInitialized) {
          isInitialized = true;
          categoryService.bootstrapCanonicalCategories().catch((err) => {
            console.warn('Auto-bootstrap categories note:', err.message);
          });
        }
        callback(activeOnly ? cachedCategories.filter((c) => c.isEnabled) : cachedCategories);
      },
      (error) => {
        handleFirestoreListenerError(error, `${CATEGORIES_DOC_PATH}/${CATEGORIES_DOC_ID}`);
        // Fallback to in-memory canonical categories
        callback(activeOnly ? cachedCategories.filter((c) => c.isEnabled) : cachedCategories);
      }
    );

    return unsubscribe;
  },

  /**
   * Bootstrap all 14 canonical categories into Firestore
   */
  async bootstrapCanonicalCategories(): Promise<void> {
    try {
      const docRef = doc(db, CATEGORIES_DOC_PATH, CATEGORIES_DOC_ID);
      const existingSnap = await getDoc(docRef);

      let categoriesToPersist = CANONICAL_CATEGORIES;
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        if (Array.isArray(data.items) && data.items.length > 0) {
          categoriesToPersist = mergeWithCanonical(data.items);
        }
      }

      await setDoc(
        docRef,
        {
          items: categoriesToPersist,
          updatedAt: serverTimestamp(),
          version: '14_categories_v1',
        },
        { merge: true }
      );

      // Also sync to /categories collection for collection-level queries
      for (const cat of categoriesToPersist) {
        try {
          await setDoc(doc(db, CATEGORIES_COLLECTION, cat.id), cat, { merge: true });
        } catch {
          // Ignore individual collection write error if rules restrict
        }
      }

      cachedCategories = categoriesToPersist;
    } catch (err: any) {
      console.error('Error bootstrapping categories:', err);
      handleFirestoreError(err, OperationType.WRITE, `${CATEGORIES_DOC_PATH}/${CATEGORIES_DOC_ID}`);
    }
  },

  /**
   * Save / Update full category list
   */
  async saveCategories(categories: ProductCategory[]): Promise<void> {
    try {
      const docRef = doc(db, CATEGORIES_DOC_PATH, CATEGORIES_DOC_ID);
      await setDoc(
        docRef,
        {
          items: categories,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      cachedCategories = categories;

      // Sync to /categories collection as well
      for (const cat of categories) {
        try {
          await setDoc(doc(db, CATEGORIES_COLLECTION, cat.id), cat, { merge: true });
        } catch {
          // silent fallback
        }
      }
    } catch (err: any) {
      console.error('Failed to save categories:', err);
      handleFirestoreError(err, OperationType.WRITE, `${CATEGORIES_DOC_PATH}/${CATEGORIES_DOC_ID}`);
    }
  },

  /**
   * Toggle a category enabled / disabled
   */
  async toggleCategory(id: string, isEnabled: boolean): Promise<void> {
    const next = cachedCategories.map((cat) => (cat.id === id ? { ...cat, isEnabled } : cat));
    await this.saveCategories(next);
  },

  /**
   * Update a single category
   */
  async updateCategory(id: string, updates: Partial<ProductCategory>): Promise<void> {
    const next = cachedCategories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat));
    await this.saveCategories(next);
  },

  /**
   * Add a new category
   */
  async addCategory(newCategory: ProductCategory): Promise<void> {
    // Check if ID or name already exists
    const exists = cachedCategories.some(
      (c) => c.id === newCategory.id || c.name.toLowerCase() === newCategory.name.toLowerCase()
    );
    if (exists) {
      throw new Error(`Category "${newCategory.name}" already exists.`);
    }

    const next = [...cachedCategories, newCategory].sort((a, b) => a.order - b.order);
    await this.saveCategories(next);
  },

  /**
   * Restore all 14 canonical categories
   */
  async resetToDefault14(): Promise<void> {
    await this.saveCategories(CANONICAL_CATEGORIES);
  },

  // Export re-usable mapping helpers
  normalizeCategoryName,
  mapCategoryToId,
  isProductInCategory,
};
