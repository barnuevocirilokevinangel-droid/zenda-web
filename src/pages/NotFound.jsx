import { Link } from 'react-router-dom';
import usePageMeta from '../lib/usePageMeta.js';

export default function NotFound() {
  usePageMeta({ title: 'Página no encontrada | Zenda', noindex: true });

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-28 text-center">
      <p className="font-mono text-sm font-semibold tracking-[0.2em] text-zenda-blue">404</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-zenda-dark sm:text-5xl">
        Esta página no existe.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-neutral-600">
        Es posible que el enlace haya cambiado o que la dirección esté mal escrita.
      </p>
      <Link
        to="/"
        className="mt-10 inline-flex items-center rounded-full bg-zenda-dark px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-zenda-blue active:scale-[0.98]"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
