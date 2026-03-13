import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB2a55W5d9kEMlJae5i7fg37tEU-xULhXs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bj-moda-masculina.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bj-moda-masculina',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bj-moda-masculina.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '114442557139',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:114442557139:web:316af2a663ec74f5eba626',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
