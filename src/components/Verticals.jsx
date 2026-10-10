import { ArrowUpRight, Megaphone, Workflow, LayoutDashboard } from 'lucide-react';
import { StaggerGroup, StaggerItem } from './Stagger.jsx';
import TextReveal from './TextReveal.jsx';

const VERTICALS = [
  {
    id: '01',
    name: 'ZENDA MARKETING',
    badge: 'Atracción',
    icon: Megaphone,
    description:
      'Atracción de alto impacto, contenido audiovisual para conversión y gestión de pauta.',
    tags: ['Contenido', 'Paid media', 'Conversión'],
    href: '#marketing',
  },
  {
    id: '02',
    name: 'ZENDA AUTOMATION',
    badge: 'Eficiencia',
    icon: Workflow,
    description:
      'Conexión de CRM, calificación de prospectos y flujos automáticos sin intervención manual.',
    tags: ['CRM', 'Lead scoring', 'Flujos'],
    href: '#automation',
  },
  {
    id: '03',
    name: 'ZENDA CORE APPS',
    badge: 'Software',
    icon: LayoutDashboard,
    description:
      'Software y web apps a medida: paneles de gestión, inventarios y control operativo.',
    tags: ['Paneles', 'Inventarios', 'Web apps'],
    href: '#core-apps',
  },
];

function VerticalCard({ vertical }) {
  const { id, name, badge, icon: Icon, description, tags, href } = vertical;

  return (
    <a
      href={href}
      className="group relative flex w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-[4px] hover:border-zenda-blue/30 hover:shadow-elevated"
    >
      {/* Cabecera visual */}
      <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-slate-100 bg-neutral-50/70">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60 transition-transform duration-700 ease-out [background-image:radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:18px_18px] group-hover:scale-105"
        />
        <div className="relative transition-transform duration-700 ease-out group-hover:scale-105">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-zenda-blue shadow-subtle ring-1 ring-slate-200 transition-colors duration-300 group-hover:bg-zenda-dark group-hover:text-zenda-cyan">
            <Icon className="h-7 w-7" strokeWidth={1.75} />
          </div>
        </div>

        <span className="absolute left-5 top-5 text-xs font-medium tracking-widest text-neutral-400">
          {id}
        </span>
        <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-zenda-cyan/40 bg-zenda-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zenda-blue">
          <span className="h-1.5 w-1.5 rounded-full bg-zenda-cyan" />
          {badge}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-8">
        <h3 className="text-sm font-bold tracking-[0.2em] text-zenda-dark">{name}</h3>
        <p className="mt-4 flex-1 text-base leading-relaxed text-neutral-600">{description}</p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-5">
          <span className="text-xs font-semibold tracking-widest text-zenda-dark">EXPLORAR</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-zenda-dark transition-all duration-300 group-hover:border-zenda-dark group-hover:bg-zenda-dark group-hover:text-zenda-cyan">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </a>
  );
}

export default function Verticals() {
  return (
    <section id="verticales" className="border-t border-neutral-100 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <TextReveal
            as="p"
            className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500"
          >
            Soluciones integradas
          </TextReveal>
          <TextReveal
            as="h2"
            delay={0.08}
            className="text-4xl font-bold tracking-tight text-zenda-dark sm:text-5xl"
          >
            Nuestras verticales
          </TextReveal>
          <TextReveal
            as="p"
            delay={0.16}
            className="mt-6 text-base leading-relaxed text-neutral-600 sm:text-lg"
          >
            Tres áreas que trabajan como un solo sistema: atraemos, automatizamos y
            construimos la infraestructura para que tu operación crezca.
          </TextReveal>
        </div>

        <StaggerGroup className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {VERTICALS.map((vertical) => (
            <StaggerItem key={vertical.id} className="flex">
              <VerticalCard vertical={vertical} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
