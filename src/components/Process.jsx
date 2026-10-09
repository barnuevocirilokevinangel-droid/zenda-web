const STEPS = [
  {
    number: '01',
    title: 'Diagnóstico y Cuellos de Botella',
    description:
      'Analizamos dónde se pierden clientes y dónde se traba la operación interna.',
  },
  {
    number: '02',
    title: 'Diseño del Ecosistema',
    description:
      'Estructuramos la estrategia de contenido, pauta publicitaria y el software/automatización requerida.',
  },
  {
    number: '03',
    title: 'Implementación y Escala',
    description:
      'Despliegue rápido, capacitación del equipo y optimización continua sobre métricas reales.',
  },
];

export default function Process() {
  return (
    <section id="metodo" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
            Cómo trabajamos
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-zenda-dark sm:text-5xl">
            De la auditoría a la ejecución sin fricción.
          </h2>
        </div>

        <ol className="relative mt-20 grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-10">
          {/* Línea conectora (solo escritorio) */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-neutral-200 via-zenda-cyan/50 to-neutral-200 md:block"
          />

          {STEPS.map((step) => (
            <li key={step.number} className="relative">
              <span className="block text-7xl font-bold leading-none tracking-tighter text-neutral-200 sm:text-8xl">
                {step.number}
              </span>
              {/* Nodo sobre la línea */}
              <span
                aria-hidden="true"
                className="relative mt-6 block h-3 w-3 rounded-full border-2 border-zenda-cyan bg-white"
              />
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-zenda-dark">
                {step.title}
              </h3>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-neutral-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
