import { collection, doc, getDocs, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, handleFirestoreListenerError, OperationType } from './firebase';
import { GroceryShippingOption } from '../types/shipping';

const SHIPPING_COLLECTION = 'shippingOptions';

export const shippingService = {
  subscribeToShippingOptions(callback: (options: GroceryShippingOption[]) => void): () => void {
    const unsub = onSnapshot(
      collection(db, SHIPPING_COLLECTION),
      (snap) => {
        const options: GroceryShippingOption[] = [];
        snap.forEach((d) => {
          options.push({ id: d.id, ...d.data() } as GroceryShippingOption);
        });
        callback(options);
      },
      (error) => {
        handleFirestoreListenerError(error, SHIPPING_COLLECTION, () => callback([]));
      }
    );
    return unsub;
  },

  async saveShippingOption(option: Omit<GroceryShippingOption, 'id'>, id?: string): Promise<string> {
    const docRef = id ? doc(db, SHIPPING_COLLECTION, id) : doc(collection(db, SHIPPING_COLLECTION));
    try {
      await setDoc(docRef, {
        ...option,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${SHIPPING_COLLECTION}/${docRef.id}`);
    }
  },
};
