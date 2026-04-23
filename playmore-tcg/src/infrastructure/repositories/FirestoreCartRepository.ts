/**
 * [LAYER: INFRASTRUCTURE]
 */
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { getDB } from '../FirebaseInitializer';
import { COLLECTIONS } from '@utils/constants';
import type { ICartRepository } from '@domain/repositories';
import type { Cart } from '@domain/models';

function docToCart(docSnap: QueryDocumentSnapshot): Cart {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    items: data.items ?? [],
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  };
}

class FirestoreCartRepository implements ICartRepository {
  private db: ReturnType<typeof getDB> | null = null;
  private coll: any | null = null;

  /**
   * Get or create the Firestore instance
   */
  private async getDBInstance() {
    if (!this.db) {
      this.db = await getDB();
    }
    return this.db;
  }

  /**
   * Get or create the collection reference
   */
  private async getCollection() {
    if (!this.coll) {
      const db = await this.getDBInstance();
      this.coll = collection(db, COLLECTIONS.CARTS);
    }
    return this.coll;
  }

  async getByUserId(userId: string): Promise<Cart | null> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.CARTS);
    const ref = doc(coll, userId);
    const docSnap = await getDoc(ref);
    if (!docSnap.exists()) return null;
    return docToCart(docSnap);
  }

  async save(cart: Cart): Promise<void> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.CARTS);
    const ref = doc(coll, cart.userId);
    await setDoc(ref, {
      userId: cart.userId,
      items: cart.items,
      updatedAt: serverTimestamp(),
    });
  }

  async clear(userId: string): Promise<void> {
    const db = await this.getDBInstance();
    const coll = this.coll || collection(db, COLLECTIONS.CARTS);
    const ref = doc(coll, userId);
    await setDoc(ref, {
      userId,
      items: [],
      updatedAt: serverTimestamp(),
    });
  }
}