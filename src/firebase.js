import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** true solo si las credenciales mínimas están definidas en .env */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

/**
 * Instancia de Firestore, o `null` si Firebase no está configurado.
 * Los consumidores deben comprobar `db` antes de usarla: así la app no se
 * rompe en desarrollo mientras las credenciales no estén en .env.
 */
let db = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.warn('[Zenda] No se pudo inicializar Firebase:', error);
  }
} else if (import.meta.env.DEV) {
  console.info(
    '[Zenda] Firebase no configurado: los envíos del formulario se simularán en desarrollo. ' +
      'Copia .env.example a .env y completa las variables VITE_FIREBASE_*.',
  );
}

export { db };
