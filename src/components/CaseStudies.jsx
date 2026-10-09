import { ArrowUpRight, AlertCircle, Sparkles } from 'lucide-react';

const CASES = [
  {
    id: 'caso-gastronomico',
    sector: 'Sector gastronómico · Pastelería comercial',
    tag: 'Marketing + Operaciones',
    challenge:
      'Alta demanda generada por contenido que colapsaba la toma de pedidos y el stock en tienda.',
    solution:
      'Producción audiovisual de alta retención + implementación de panel web de inventario y pedidos en tiempo real.',
    metrics: [
      { value: '+180%', label: 'alcance orgánico' },
      { value: '0', label: 'pérdidas de stock' },
      { value: '<2 min', label: 'tiempo de respuesta' },
    ],
    href: '#caso-gastronomico',
  },
  {
    id: 'caso-comercio',
    sector: 'Comercio · Marcas locales en expansión',
    tag: 'Automatización + Adquisición',
    challenge:
      'Fuga masiva de prospectos en WhatsApp y falta de seguimiento estructurado.',
    solution:
      'Campañas de conversión directa integradas a CRM automatizado y flujo de calificación inmediata.',
    metrics: [
      { value: '3.4x', label: 'retorno de inversión' },
      { value: '100%', label: 'leads atendidos automáticamente' },
    ],
    href: '#caso-comercio',
  },
];

function CaseCard({ item }) {
  const { id, sector, tag, challenge, solution, metrics, href } = item;

  return (
    <article
      id={id}
      className="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-all duration-300 hover:border-neutral-300 hover:shadow-elevated"
    >
      <div className="flex flex-1 flex-col p-8 sm:p-10">
        {/* Cabecera */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zenda-cyan/40 bg-zenda-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zenda-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-zenda-cyan" />
            {tag}
          </span>
          <span className="text-xs font-medium text-neutral-500">{sector}</span>
        </div>

        {/* Desafío / Solución */}
        <div className="mt-8 space-y-6">
          <div className="flex gap-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                Desafío
              </h3>
              <p className="mt-2 text-base leading-relaxed text-neutral-700">{challenge}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zenda-dark text-zenda-cyan">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zenda-dark">
                Solución Zenda
              </h3>
              <p className="mt-2 text-base leading-relaxed text-neutral-700">{solution}</p>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <dl
          className={`mt-10 grid gap-6 border-t border-neutral-100 pt-8 ${
            metrics.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {metrics.map((m) => (
            <div key={m.label}>
              <dd className="text-4xl font-bold tracking-tight text-zenda-dark">{m.value}</dd>
              <dt className="mt-1 text-sm text-neutral-500">{m.label}</dt>
            </div>
          ))}
        </dl>

        {/* CTA sutil */}
        <div className="mt-auto pt-10">
          <a
            href={href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-zenda-dark underline-offset-4 transition-colors hover:text-zenda-blue hover:underline"
          >
            Explorar caso completo
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function CaseStudies() {
  return (
    <section id="casos" className="border-t border-neutral-100 bg-gray-50/50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
            Resultados comprobados
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-zenda-dark sm:text-5xl">
            Impacto medible en ventas y operaciones.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-neutral-600 sm:text-lg">
            Casos donde combinamos producción estratégica con infraestructura digital para
            destrabar el crecimiento.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {CASES.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
