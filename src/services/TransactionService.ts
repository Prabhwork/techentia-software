import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../Firebase/Config";

const transactionCollection = collection(db, "transactions");

export const addTransaction = async (transactionData: any) => {
  await addDoc(transactionCollection, {
    ...transactionData,
    createdAt: serverTimestamp(),
  });
};

export const getTransactions = async () => {
  const snapshot = await getDocs(transactionCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
