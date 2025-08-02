// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDyANW-_d-TL-NmZcZkWBMv8tI9AbGceh8",
  authDomain: "financial-management123.firebaseapp.com",
  projectId: "financial-management123",
  storageBucket: "financial-management123.firebasestorage.app",
  messagingSenderId: "674441777161",
  appId: "1:674441777161:web:3c82713a039b12585f28d8",
  measurementId: "G-S9XP1FCQKJ"
};



const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);


export const auth = getAuth(app);

export default app;