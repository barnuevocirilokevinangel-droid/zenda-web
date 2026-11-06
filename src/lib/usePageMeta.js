import { useEffect } from 'react';

/**
 * Ajusta el <title> y, opcionalmente, marca la página como `noindex` mientras está montada.
 * Al desmontar restaura el título y elimina la etiqueta robots que añadió.
 */
export default function usePageMeta({ title, noindex = false }) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    let meta = null;
    if (noindex) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }

    return () => {
      document.title = previousTitle;
      if (meta) meta.remove();
    };
  }, [title, noindex]);
}
