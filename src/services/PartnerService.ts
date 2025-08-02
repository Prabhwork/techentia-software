import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../Firebase/Config";

const partnerCollection = collection(db, "partners");

export const addPartner = async (partnerData: { name: string; percentage: number }) => {
  await addDoc(partnerCollection, partnerData);
};

export const getPartners = async () => {
  const snapshot = await getDocs(partnerCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
