import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAGkH5ib1fkO66397DhkZmspCKpAW2oXYU",
  authDomain: "zenda-db5d0.firebaseapp.com",
  projectId: "zenda-db5d0",
  storageBucket: "zenda-db5d0.firebasestorage.app",
  messagingSenderId: "394491844020",
  appId: "1:394491844020:web:d81819ddab62d2d3fb4ee1",
  measurementId: "G-1N2HV3PZ8T"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const isFirebaseConfigured = true;
export default app;
