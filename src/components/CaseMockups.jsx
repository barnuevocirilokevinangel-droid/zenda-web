import {
  Database,
  Heart,
  MessageCircle,
  Play,
  Send,
  ShoppingBag,
  Timer,
} from 'lucide-react';

/**
 * Mockups de respaldo (vector/CSS, nítidos a cualquier tamaño) que se muestran
 * mientras no existan las capturas finales en /public/cases/.
 * Todos se renderizan dentro de un contenedor oscuro de relación 16:10.
 */

const Bar = ({ className = '' }) => <span className={`block rounded-full ${className}`} />;

function BrowserFrame({ url, children }) {
  return (
    <div className="flex h-full w-full max-w-[440px] flex-col overflow-hidden rounded-xl border border-white/15 bg-white shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-neutral-200 bg-neutral-100 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span className="ml-2 flex-1 truncate rounded-full bg-white px-3 py-0.5 font-mono text-[9px] text-neutral-400">
          {url}
        </span>
      </div>
      <div className="flex-1 overflow-hidden p-3.5">{children}</div>
    </div>
  );
}

function Stage({ children }) {
  return <div className="flex h-full items-center justify-center px-5 py-6">{children}</div>;
}

const chipClasses =
  'rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/70';

/** Dolciangel · 1 — Reel vertical de alta retención. */
export function ReelMockup() {
  return (
    <div className="flex h-full items-center justify-center gap-8 px-5 py-4">
      <div className="hidden flex-col items-end gap-2 sm:flex">
        <span className={chipClasses}>Formato 9:16</span>
        <span className={chipClasses}>Gancho inicial</span>
      </div>

      <div className="relative aspect-[9/16] h-full overflow-hidden rounded-[1.5rem] border-[3px] border-white/20 bg-gradient-to-b from-zenda-blue via-[#0E2A6B] to-zenda-dark shadow-2xl">
        <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/25" />
        <span className="absolute left-3 top-5 text-[9px] font-semibold tracking-wide text-white/70">
          Reels
        </span>

        <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur">
          <Play className="h-4 w-4 translate-x-px fill-white text-white" />
        </span>

        <div className="absolute bottom-14 right-2 flex flex-col items-center gap-3 text-white/85">
          <Heart className="h-4 w-4" />
          <MessageCircle className="h-4 w-4" />
          <Send className="h-4 w-4" />
        </div>

        <div className="absolute bottom-4 left-3 right-10 space-y-1.5">
          <Bar className="h-1.5 w-3/4 bg-white/45" />
          <Bar className="h-1.5 w-1/2 bg-white/25" />
        </div>
        <span className="absolute bottom-0 left-0 h-0.5 w-2/3 bg-zenda-cyan" />
      </div>

      <div className="hidden flex-col items-start gap-2 sm:flex">
        <span className={chipClasses}>Producto en foco</span>
        <span className={chipClasses}>CTA a pedido</span>
      </div>
    </div>
  );
}

/** Dolciangel · 2 — Catálogo digital orientado a conversión. */
export function CatalogMockup() {
  const tones = [
    'from-zenda-cyan/40 to-zenda-blue/30',
    'from-zenda-blue/30 to-zenda-cyan/20',
    'from-zenda-cyan/25 to-zenda-blue/40',
  ];
  return (
    <Stage>
      <BrowserFrame url="catalogo.dolciangel · pedidos">
        <div className="flex items-center justify-between">
          <Bar className="h-2.5 w-24 bg-zenda-dark/80" />
          <span className="flex items-center gap-1 rounded-full bg-zenda-dark px-2 py-1 text-[9px] font-semibold text-white">
            <ShoppingBag className="h-2.5 w-2.5 text-zenda-cyan" /> 3
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className={`h-14 rounded-lg bg-gradient-to-br ${tones[i % 3]}`} />
              <Bar className="mt-1.5 h-1.5 w-4/5 bg-neutral-300" />
              <Bar className="mt-1 h-1.5 w-1/3 bg-neutral-200" />
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-full bg-zenda-dark py-1.5 text-center text-[10px] font-semibold text-white">
          Pedir por WhatsApp
        </div>
      </BrowserFrame>
    </Stage>
  );
}

/** Zenda Core · 1 — Landing corporativa (hero + propuesta de valor). */
export function LandingMockup() {
  return (
    <Stage>
      <BrowserFrame url="zenda.pe">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-zenda-blue" />
            <Bar className="h-2 w-10 bg-zenda-dark/80" />
          </span>
          <span className="flex gap-2">
            <Bar className="h-1.5 w-6 bg-neutral-300" />
            <Bar className="h-1.5 w-6 bg-neutral-300" />
            <Bar className="h-1.5 w-6 bg-neutral-300" />
          </span>
        </div>
        <div className="mt-5 flex flex-col items-center text-center">
          <Bar className="h-1.5 w-20 bg-zenda-cyan/60" />
          <Bar className="mt-3 h-3 w-4/5 bg-zenda-dark/85" />
          <Bar className="mt-1.5 h-3 w-3/5 bg-zenda-dark/85" />
          <Bar className="mt-3 h-1.5 w-2/3 bg-neutral-300" />
          <Bar className="mt-1.5 h-1.5 w-1/2 bg-neutral-200" />
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-zenda-dark px-3 py-1.5 text-[9px] font-semibold text-white">
              Agendar diagnóstico
            </span>
            <span className="rounded-full border border-neutral-300 px-3 py-1.5 text-[9px] font-semibold text-zenda-dark">
              Ver verticales
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-neutral-200 p-2">
              <span className="block h-3 w-3 rounded bg-zenda-cyan/50" />
              <Bar className="mt-2 h-1.5 w-4/5 bg-neutral-300" />
              <Bar className="mt-1 h-1.5 w-3/5 bg-neutral-200" />
            </div>
          ))}
        </div>
      </BrowserFrame>
    </Stage>
  );
}

/** Zenda Core · 2 — Diagnóstico interactivo de 60 s. */
export function FunnelMockup() {
  const options = ['Necesito más clientes', 'La operación colapsa', 'Ambos'];
  return (
    <Stage>
      <BrowserFrame url="zenda.pe/#contacto">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zenda-dark">
            <Timer className="h-3 w-3 text-zenda-blue" /> Diagnóstico · 60 s
          </span>
          <span className="font-mono text-[9px] text-neutral-400">Paso 2 / 3</span>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <Bar className="h-1 flex-1 bg-zenda-cyan" />
          <Bar className="h-1 flex-1 bg-zenda-cyan" />
          <Bar className="h-1 flex-1 bg-neutral-200" />
        </div>
        <p className="mt-4 text-[11px] font-semibold text-zenda-dark">
          ¿Cuál es tu principal cuello de botella?
        </p>
        <div className="mt-2.5 space-y-2">
          {options.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px] ${
                i === 1
                  ? 'border-zenda-dark bg-neutral-50 font-semibold text-zenda-dark ring-1 ring-zenda-dark'
                  : 'border-neutral-200 text-neutral-500'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full border ${
                  i === 1 ? 'border-zenda-dark bg-zenda-cyan' : 'border-neutral-300'
                }`}
              />
              {label}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-full bg-zenda-dark py-1.5 text-center text-[10px] font-semibold text-white">
          Solicitar diagnóstico
        </div>
      </BrowserFrame>
    </Stage>
  );
}

/** Diagrama de flujo horizontal (embudo WhatsApp / arquitectura en tiempo real). */
function FlowDiagram({ nodes, footer }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-7 px-6 py-6">
      <div className="flex w-full max-w-[460px] items-start">
        {nodes.map(({ icon: Icon, label, sub }, i) => (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <div className="flex w-20 flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-zenda-cyan shadow-lg">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="mt-2.5 text-[11px] font-semibold text-white">{label}</span>
              <span className="mt-0.5 text-[10px] text-white/50">{sub}</span>
            </div>
            {i < nodes.length - 1 && (
              <span
                aria-hidden="true"
                className="mt-6 h-px flex-1 bg-gradient-to-r from-white/10 via-zenda-cyan/70 to-white/10"
              />
            )}
          </div>
        ))}
      </div>
      <span className="max-w-full truncate rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 font-mono text-[10px] text-zenda-cyan/90">
        {footer}
      </span>
    </div>
  );
}

/** Dolciangel · 3 — Embudo comercial hacia WhatsApp. */
export function WhatsAppFlowMockup() {
  return (
    <FlowDiagram
      nodes={[
        { icon: ShoppingBag, label: 'Catálogo', sub: 'Selección' },
        { icon: Send, label: 'Pedido', sub: 'Mensaje listo' },
        { icon: MessageCircle, label: 'WhatsApp', sub: 'Sede / asesor' },
      ]}
      footer="pedido → mensaje prellenado → wa.me"
    />
  );
}

/** Zenda Core · 3 — Sincronización Firestore + WhatsApp. */
export function RealtimeMockup() {
  return (
    <FlowDiagram
      nodes={[
        { icon: Timer, label: 'Diagnóstico', sub: 'Formulario 60 s' },
        { icon: Database, label: 'Firestore', sub: 'leads' },
        { icon: MessageCircle, label: 'WhatsApp', sub: 'Consultor' },
      ]}
      footer="addDoc(collection(db, 'leads')) → wa.me"
    />
  );
}
