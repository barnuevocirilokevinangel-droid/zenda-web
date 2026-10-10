import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  CatalogMockup,
  FunnelMockup,
  LandingMockup,
  ReelMockup,
  RealtimeMockup,
  WhatsAppFlowMockup,
} from './CaseMockups.jsx';

const FALLBACKS = {
  reel: ReelMockup,
  catalog: CatalogMockup,
  whatsapp: WhatsAppFlowMockup,
  landing: LandingMockup,
  funnel: FunnelMockup,
  realtime: RealtimeMockup,
};

/**
 * Minigalería de un caso: escenario 16:10 con pestañas. Muestra la captura real
 * (/public/cases/*) cuando existe y, mientras tanto, un mockup de respaldo.
 *
 * slides: [{ id, tab, title, src, fit: 'cover' | 'contain', fallback }]
 */
export default function CaseGallery({ name, slides }) {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState({});
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const tabRefs = useRef([]);

  const slide = slides[active];
  const Fallback = FALLBACKS[slide.fallback];
  const hasImage = loaded[slide.id];

  const focusTab = (index) => {
    const next = (index + slides.length) % slides.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTab(active + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTab(active - 1);
    }
  };

  return (
    <div>
      {/* Precarga silenciosa: solo se muestra la captura si realmente existe. */}
      {slides.map((s) => (
        <img
          key={s.id}
          src={s.src}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          onLoad={() => setLoaded((prev) => ({ ...prev, [s.id]: true }))}
          onError={() => setLoaded((prev) => ({ ...prev, [s.id]: false }))}
        />
      ))}

      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${active}`}
        className="relative aspect-[16/10] overflow-hidden bg-zenda-dark"
      >
        {/* Fondo técnico: retícula de puntos + resplandor de marca */}
        <div
          aria-hidden="true"
          className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:18px_18px]"
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-zenda-blue/40 blur-3xl"
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}
          >
            {hasImage ? (
              <img
                src={slide.src}
                alt={`${name}: ${slide.title}`}
                className={`absolute inset-0 h-full w-full ${
                  slide.fit === 'contain' ? 'object-contain py-4' : 'object-cover object-top'
                }`}
              />
            ) : (
              <div aria-hidden="true" className="absolute inset-0">
                <Fallback />
              </div>
            )}

            <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
              <span className="font-mono text-zenda-cyan">0{active + 1}</span>
              {slide.title}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pestañas / indicadores */}
      <div
        role="tablist"
        aria-label={`Vistas de ${name}`}
        onKeyDown={onKeyDown}
        className="flex items-center gap-1 overflow-x-auto border-b border-neutral-100 bg-neutral-50/70 px-4 py-2.5"
      >
        {slides.map((s, i) => {
          const selected = i === active;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-zenda-cyan ${
                selected
                  ? 'bg-white text-zenda-dark shadow-subtle ring-1 ring-neutral-200'
                  : 'text-neutral-500 hover:bg-white/70 hover:text-zenda-dark'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  selected ? 'bg-zenda-cyan' : 'bg-neutral-300'
                }`}
              />
              {s.tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
