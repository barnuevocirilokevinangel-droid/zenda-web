import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'SERVICIOS', href: '#verticales' },
  { label: 'MÉTODO', href: '#metodo' },
  { label: 'CASOS', href: '#casos' },
  { label: 'CONTACTO', href: '#contacto' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a href="#" aria-label="Zenda — inicio" className="inline-flex items-center gap-2.5">
          <img src="/isotipo-zenda.png" alt="" aria-hidden="true" className="h-7 w-auto object-contain" />
          <span className="text-xl font-bold tracking-tight text-zenda-dark">zenda</span>
        </a>

        {/* Links centrales */}
        <nav className="hidden items-center gap-10 md:flex" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-medium tracking-widest text-neutral-600 transition-colors hover:text-zenda-dark"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="#contacto"
          className="group hidden items-center gap-1.5 rounded-full bg-zenda-dark px-6 py-3 text-xs font-semibold tracking-widest text-white transition-all duration-300 hover:bg-zenda-blue hover:shadow-lg hover:shadow-zenda-blue/20 md:inline-flex"
        >
          ESCRÍBENOS
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zenda-cyan" />
        </a>

        {/* Toggle móvil */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menú móvil */}
      {open && (
        <div className="space-y-4 border-t border-neutral-100 bg-white px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Móvil">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium tracking-widest text-neutral-700"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="#contacto"
            onClick={() => setOpen(false)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-zenda-dark px-6 py-3 text-xs font-semibold tracking-widest text-white"
          >
            ESCRÍBENOS
            <ArrowUpRight className="h-4 w-4 text-zenda-cyan" />
          </a>
        </div>
      )}
    </header>
  );
}
