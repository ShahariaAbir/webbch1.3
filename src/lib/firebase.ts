import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBrOLRbgEJXailwr66AmNr_W73o8OVsNlA",
  authDomain: "webchat-2da0b.firebaseapp.com",
  projectId: "webchat-2da0b",
  storageBucket: "webchat-2da0b.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "985138349762",
  appId: "1:985138349762:web:32b3494ef8612bb1315d5b",
  measurementId: "G-PJ7HY6LWNG"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);