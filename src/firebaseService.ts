// firebaseService.ts
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './Firebase/Config';
import type { Partner, Transaction } from './types';

export class FirebaseService {
  // Partner operations
  static setupPartnersListener(callback: (partners: Partner[]) => void): () => void {
    const q = query(collection(db, 'partners'), orderBy('name'));
    return onSnapshot(q, (querySnapshot) => {
      const partnersData: Partner[] = [];
      querySnapshot.forEach((doc) => {
        partnersData.push({
          id: doc.id,
          ...doc.data()
        } as Partner);
      });
      callback(partnersData);
    }, (error) => {
      console.error('Error fetching partners:', error);
    });
  }

  static async addPartner(partnerData: Omit<Partner, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'partners'), {
      ...partnerData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async updatePartner(id: string, data: Partial<Partner>): Promise<void> {
    await updateDoc(doc(db, 'partners', id), data);
  }

  static async deletePartner(id: string): Promise<void> {
    await deleteDoc(doc(db, 'partners', id));
  }

  // Transaction operations
  static setupTransactionsListener(callback: (transactions: Transaction[]) => void): () => void {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const transactionsData: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });
      callback(transactionsData);
    }, (error) => {
      console.error('Error fetching transactions:', error);
    });
  }

  static async addTransaction(transactionData: Omit<Transaction, 'id'>): Promise<void> {
    await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  }

  static async updateTransaction(id: string, field: string, value: any): Promise<void> {
    await updateDoc(doc(db, 'transactions', id), {
      [field]: value
    });
  }

  static async deleteTransaction(id: string): Promise<void> {
    await deleteDoc(doc(db, 'transactions', id));
  }
}