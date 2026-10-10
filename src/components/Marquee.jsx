import ScrollReveal from './ScrollReveal.jsx';

const STACK = [
  'React',
  'Tailwind CSS',
  'Firebase',
  'Meta Ads',
  'TikTok Ads',
  'WhatsApp API',
  'Vercel',
];

function Track({ hidden = false }) {
  return (
    <ul
      aria-hidden={hidden ? 'true' : undefined}
      className="flex shrink-0 items-center gap-14 pr-14"
    >
      {STACK.map((name) => (
        <li
          key={name}
          className="flex items-center gap-14 whitespace-nowrap text-lg font-semibold tracking-tight text-slate-600 opacity-50 grayscale transition-opacity duration-300 hover:opacity-100"
        >
          {name}
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />
        </li>
      ))}
    </ul>
  );
}

/** Cinta infinita (marquee) con el stack tecnológico y las plataformas clave. */
export default function Marquee() {
  return (
    <section
      aria-label="Stack tecnológico y plataformas"
      className="border-y border-slate-100 bg-white py-10"
    >
      <ScrollReveal>
        <p className="mb-7 text-center text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
          Stack y plataformas con las que operamos
        </p>
        <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            <Track />
            <Track hidden />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
