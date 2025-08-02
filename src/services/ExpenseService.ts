import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../Firebase/Config";

const expenseCollection = collection(db, "expenses");

export const addExpense = async (expenseData: { name: string; percentage: number }) => {
  await addDoc(expenseCollection, {
    ...expenseData,
    createdAt: serverTimestamp(),
  });
};

export const getExpenses = async () => {
  const snapshot = await getDocs(expenseCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
