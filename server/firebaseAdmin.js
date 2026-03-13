import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_ADMIN_EMAILS = 'bjmodasocial@gmail.com,admin@bjmodas.com';

function getManualServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return JSON.parse(serviceAccountJson);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

export function getAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp();
  }

  const serviceAccount = getManualServiceAccount();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  throw new Error(
    'Configure FIREBASE_SERVICE_ACCOUNT_JSON, ou FIREBASE_ADMIN_PROJECT_ID/FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY, ou GOOGLE_APPLICATION_CREDENTIALS.'
  );
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

function getAdminEmails() {
  return new Set(
    String(process.env.VITE_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function assertAdminByBearerToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new Error('Token de autorizacao ausente.');
  }

  const idToken = authorizationHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    throw new Error('Token de autorizacao invalido.');
  }

  const decodedToken = await getAdminAuth().verifyIdToken(idToken);
  const firestore = getAdminFirestore();
  const userSnapshot = await firestore.collection('users').doc(decodedToken.uid).get();
  const email = String(decodedToken.email || '').toLowerCase();

  if (userSnapshot.exists && userSnapshot.data()?.role === 'admin') {
    return {
      uid: decodedToken.uid,
      email,
      firestore,
    };
  }

  if (getAdminEmails().has(email)) {
    return {
      uid: decodedToken.uid,
      email,
      firestore,
    };
  }

  throw new Error('Acesso restrito ao administrador.');
}
