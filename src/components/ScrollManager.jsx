import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Gestiona el scroll en la navegación del cliente:
 * - Ruta con #hash → desplaza suavemente hasta ese elemento (tras renderizar la página destino).
 * - Ruta sin hash → vuelve al inicio.
 */
export default function ScrollManager() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const id = decodeURIComponent(hash.slice(1));
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => clearTimeout(timer);
  }, [pathname, hash, key]);

  return null;
}
