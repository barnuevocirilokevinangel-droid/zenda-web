import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Servicios', to: '/#verticales' },
  { label: 'Método', to: '/#metodo' },
  { label: 'Casos', to: '/#casos' },
  { label: 'Diagnóstico 60s', to: '/#contacto' },
  { label: 'Portal Clientes', to: '/onboarding' },
];

const LEGAL_LINKS = [
  { label: 'Términos y Condiciones', to: '/terminos' },
  { label: 'Política de Privacidad', to: '/privacidad' },
  { label: 'Libro de Reclamaciones', to: '/reclamaciones', icon: BookOpen },
];

const linkClasses =
  'inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white';

export default function Footer() {
  return (
    <footer className="bg-zenda-dark print:hidden">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="md:col-span-1">
            <Link to="/" aria-label="Zenda — inicio" className="inline-flex items-center gap-2.5">
              <img src="/isotipo-zenda.png" alt="" aria-hidden="true" className="h-7 w-auto object-contain" />
              <span className="text-xl font-bold tracking-tight text-white">zenda</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-neutral-400">
              Agencia de marketing digital, desarrollo de software e ingeniería de operaciones. Dominio oficial wearezenda.com
            </p>
          </div>

          <nav aria-label="Enlaces rápidos">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Navegación
            </h2>
            <ul className="mt-5 space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className={linkClasses}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Legal
            </h2>
            <ul className="mt-5 space-y-3">
              {LEGAL_LINKS.map(({ label, to, icon: Icon }) => (
                <li key={label}>
                  <Link to={to} className={linkClasses}>
                    {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Zenda. Todos los derechos reservados.</p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zenda-cyan" aria-hidden="true" />
            Chimbote, Perú · Operaciones globales
          </p>
        </div>
      </div>
    </footer>
  );
}
