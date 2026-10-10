import AnimatedCounter from './AnimatedCounter.jsx';
import { StaggerGroup, StaggerItem } from './Stagger.jsx';
import SpotlightCard from './SpotlightCard.jsx';
import TextReveal from './TextReveal.jsx';

const METRICS = [
  {
    id: 'tiempo',
    tag: 'Eficiencia',
    value: <AnimatedCounter to={70} prefix="+" suffix="%" />,
    label: 'Reducción de tiempo operativo y fricción en la toma de pedidos.',
    dark: true,
    span: 'md:col-span-2',
  },
  {
    id: 'diagnostico',
    tag: 'Velocidad',
    value: <AnimatedCounter to={60} suffix="s" />,
    label: 'Tiempo de diagnóstico y precalificación de prospectos.',
  },
  {
    id: 'integracion',
    tag: 'Integridad',
    value: <AnimatedCounter to={100} suffix="%" />,
    label: 'Integración directa sin pérdida de leads (Firestore + WhatsApp).',
  },
  {
    id: 'disponibilidad',
    tag: 'Disponibilidad',
    value: (
      <>
        <AnimatedCounter to={24} />
        <span aria-hidden="true">/</span>
        <AnimatedCounter to={7} />
      </>
    ),
    label: 'Infraestructura y captación automatizada continua.',
    dark: true,
    span: 'md:col-span-2',
  },
];

function MetricTile({ metric }) {
  const { tag, value, label, dark } = metric;

  return (
    <SpotlightCard
      className={`flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-[4px] sm:p-10 ${
        dark
          ? 'border-white/10 bg-zenda-dark text-white hover:border-zenda-cyan/40 hover:shadow-[0_18px_40px_-12px_rgba(11,15,25,0.35)]'
          : 'border-slate-200 bg-white text-zenda-dark hover:border-zenda-blue/40 hover:shadow-elevated'
      }`}
    >
      <span
        className={`font-mono text-[11px] font-semibold uppercase tracking-[0.2em] ${
          dark ? 'text-zenda-cyan' : 'text-zenda-blue'
        }`}
      >
        {tag}
      </span>

      <div className="mt-10">
        <p className="text-6xl font-bold leading-none tracking-tighter sm:text-7xl">{value}</p>
        <p
          className={`mt-5 max-w-sm text-base leading-relaxed ${
            dark ? 'text-neutral-300' : 'text-neutral-600'
          }`}
        >
          {label}
        </p>
      </div>
    </SpotlightCard>
  );
}

export default function Metrics() {
  return (
    <section id="metricas" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <TextReveal
            as="p"
            className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500"
          >
            Métricas clave
          </TextReveal>
          <TextReveal
            as="h2"
            delay={0.08}
            className="text-4xl font-bold tracking-tight text-zenda-dark sm:text-5xl"
          >
            Un sistema que se mide en operación.
          </TextReveal>
        </div>

        <StaggerGroup className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {METRICS.map((metric) => (
            <StaggerItem key={metric.id} className={metric.span || ''}>
              <MetricTile metric={metric} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
