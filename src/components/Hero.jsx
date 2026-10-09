import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Resplandor muy sutil de marca */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[900px] -translate-x-1/2 bg-gradient-to-b from-cyan-50/60 via-neutral-50/40 to-transparent blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-6 pb-28 pt-24 md:pb-36 md:pt-32">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="mb-8 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
            Crecimiento e infraestructura operativa
          </p>

          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-zenda-dark sm:text-6xl lg:text-7xl">
            Sistemas y marketing para escalar sin fricción.
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Diseñamos estrategias de contenido y captación respaldadas por software y
            automatizaciones a medida para eliminar cuellos de botella en tu negocio.
          </p>

          <div className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <a
              href="#contacto"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-zenda-dark px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-zenda-blue hover:shadow-lg hover:shadow-zenda-blue/20 sm:w-auto"
            >
              Agendar diagnóstico
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zenda-cyan" />
            </a>

            <a
              href="#verticales"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 px-8 py-4 text-sm font-semibold text-zenda-dark transition-all duration-300 hover:border-zenda-dark hover:bg-neutral-50 sm:w-auto"
            >
              Ver verticales
              <ArrowDownRight className="h-4 w-4 text-neutral-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:text-zenda-dark" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
