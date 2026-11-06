import { createContext, useContext, useEffect, useState } from 'react';
import { auth, isFirebaseConfigured } from '../firebase.js';

const AuthContext = createContext(null);

const DEV_STORAGE_KEY = 'zenda_admin_dev_session';

function getInitialUser() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(DEV_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem(DEV_STORAGE_KEY);
      }
    }
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(isFirebaseConfigured && Boolean(auth));

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      let unsubscribe;
      import('firebase/auth')
        .then(({ onAuthStateChanged }) => {
          unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
          });
        })
        .catch((err) => {
          console.warn('[Zenda Auth] Error al inicializar listener:', err);
          setLoading(false);
        });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const login = async (email, password) => {
    if (isFirebaseConfigured && auth) {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(cred.user);
      return cred.user;
    } else {
      // Fallback para pruebas en desarrollo sin credenciales Firebase configuradas en .env
      if (!email || !password) {
        throw new Error('Ingresa correo y contraseña.');
      }
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }
      const mockUser = {
        email: email.trim(),
        uid: 'dev-founder-uid',
        displayName: email.split('@')[0],
        isDevSession: true,
      };
      localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    }
    localStorage.removeItem(DEV_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
}
