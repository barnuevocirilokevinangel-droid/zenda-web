import { AlertCircle, ArrowUpRight, Cpu, Gauge } from 'lucide-react';
import Reveal from './Reveal.jsx';

const CASES = [
  {
    id: 'caso-dolciangel',
    index: '01',
    name: 'Dolciangel',
    category: 'F&B / Automatización de Ventas',
    challenge:
      'Fricción en la toma de pedidos y atención manual en horas pico.',
    system: [
      'Embudo de prospección',
      'Catálogo optimizado',
      'Canalización de pedidos',
    ],
    impact:
      'Centralización comercial multisede y aceleración en la respuesta comercial.',
    bottleneck: 'ambos',
    cta: 'Solicitar un sistema similar',
  },
  {
    id: 'caso-zenda-core',
    index: '02',
    name: 'Zenda Core',
    category: 'Software & Growth Funnels',
    challenge:
      'Filtrado y calificación de prospectos B2B sin fricción.',
    system: [
      'Arquitectura de diagnóstico interactivo de 60 s',
      'Sincronización con Firestore',
      'Derivación directa a WhatsApp',
    ],
    impact:
      'Embudo de captura de prospectos con tasa de abandono mínima.',
    bottleneck: 'marketing',
    cta: 'Probar el diagnóstico de 60 s',
  },
];

/** Lleva al formulario avisando qué caso despertó el interés. */
function goToContact(item) {
  window.dispatchEvent(
    new CustomEvent('zenda:case-interest', {
      detail: { id: item.id, title: `${item.name} · ${item.category}`, bottleneck: item.bottleneck },
    }),
  );
  const target = document.getElementById('contacto');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.location.hash = '#contacto';
  }
}

const labelClasses =
  'font-mono text-[11px] font-semibold uppercase tracking-[0.2em]';

function CaseCard({ item }) {
  const { id, index, name, category, challenge, system, impact, cta } = item;

  return (
    <article
      id={id}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-[2px] hover:border-zenda-blue/30 hover:shadow-elevated"
    >
      {/* Barra superior estilo ficha técnica */}
      <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/70 px-8 py-3.5 sm:px-10">
        <span className="font-mono text-xs tracking-widest text-neutral-400">CASE / {index}</span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          <span className="h-1.5 w-1.5 rounded-full bg-zenda-cyan" aria-hidden="true" />
          En producción
        </span>
      </div>

      <div className="flex flex-1 flex-col p-8 sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zenda-blue">{category}</p>
        <h3 className="mt-3 text-3xl font-bold tracking-tight text-zenda-dark">{name}</h3>

        <div className="mt-8 space-y-7">
          {/* Desafío */}
          <div className="flex gap-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <h4 className={`${labelClasses} text-neutral-500`}>Desafío</h4>
              <p className="mt-2 text-base leading-relaxed text-neutral-700">{challenge}</p>
            </div>
          </div>

          {/* Sistema */}
          <div className="flex gap-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zenda-dark text-zenda-cyan">
              <Cpu className="h-4 w-4" />
            </span>
            <div>
              <h4 className={`${labelClasses} text-zenda-dark`}>Sistema</h4>
              <ul className="mt-2 space-y-2 text-base leading-relaxed text-neutral-700">
                {system.map((piece) => (
                  <li key={piece} className="flex gap-3">
                    <span
                      className="mt-2.5 h-px w-3 shrink-0 bg-zenda-cyan"
                      aria-hidden="true"
                    />
                    <span>{piece}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Impacto */}
        <div className="mt-10 rounded-2xl bg-zenda-dark p-6">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-zenda-cyan" aria-hidden="true" />
            <h4 className={`${labelClasses} text-zenda-cyan`}>Impacto</h4>
          </div>
          <p className="mt-3 text-base font-medium leading-relaxed text-white">{impact}</p>
        </div>

        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={() => goToContact(item)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-zenda-dark underline-offset-4 transition-colors hover:text-zenda-blue hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-zenda-cyan"
          >
            {cta}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CaseStudies() {
  return (
    <section id="casos" className="border-t border-neutral-100 bg-gray-50/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-3xl">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
            Casos de estudio
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-zenda-dark sm:text-5xl">
            Casos de Estudio e Infraestructura en Producción
          </h2>
          <p className="mt-6 text-base leading-relaxed text-neutral-600 sm:text-lg">
            Sistemas operando en negocios reales: del cuello de botella a la arquitectura que lo
            resuelve.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {CASES.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.08} className="h-full">
              <CaseCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
