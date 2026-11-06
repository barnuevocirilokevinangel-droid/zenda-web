import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { COMPANY } from '../../config/company.js';
import { formatWhatsAppNumber } from '../../lib/whatsapp.js';
import TextReveal from '../../components/TextReveal.jsx';

/** Estructura común de las páginas legales (título, fecha de actualización y contenido). */
export default function LegalLayout({ eyebrow, title, intro, children }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-zenda-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <TextReveal
          as="p"
          className="mt-10 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500"
        >
          {eyebrow}
        </TextReveal>
        <TextReveal
          as="h1"
          delay={0.08}
          className="mt-4 text-4xl font-bold tracking-tight text-zenda-dark sm:text-5xl"
        >
          {title}
        </TextReveal>
        <p className="mt-4 text-sm text-neutral-500">Última actualización: {COMPANY.lastUpdated}</p>
        {intro && <p className="mt-8 text-base leading-relaxed text-neutral-600 sm:text-lg">{intro}</p>}

        <div className="mt-12 space-y-10 border-t border-slate-100 pt-10">{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-zenda-dark">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-neutral-600">{children}</div>
    </section>
  );
}

export function LegalList({ items }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-zenda-cyan">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Identificación del proveedor (omite los datos aún no configurados en `COMPANY`). */
export function ProviderIdentity() {
  const name = COMPANY.legalName || COMPANY.brand;
  return (
    <>
      {name}
      {COMPANY.legalName && COMPANY.legalName !== COMPANY.brand ? ` (marca comercial ${COMPANY.brand})` : ''}
      {COMPANY.ruc ? `, con RUC ${COMPANY.ruc}` : ''}
      {COMPANY.address ? `, con domicilio en ${COMPANY.address}` : ''}
    </>
  );
}

/** Canales de contacto de la empresa. */
export function ContactList() {
  return (
    <ul className="space-y-1.5">
      <li>
        <span className="font-medium text-zenda-dark">WhatsApp:</span> {formatWhatsAppNumber()}
      </li>
      {COMPANY.email && (
        <li>
          <span className="font-medium text-zenda-dark">Correo:</span>{' '}
          <a className="underline underline-offset-4 hover:text-zenda-blue" href={`mailto:${COMPANY.email}`}>
            {COMPANY.email}
          </a>
        </li>
      )}
      {COMPANY.address && (
        <li>
          <span className="font-medium text-zenda-dark">Domicilio:</span> {COMPANY.address}
        </li>
      )}
    </ul>
  );
}
