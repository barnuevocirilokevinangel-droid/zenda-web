import { useEffect, useRef } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';

/**
 * Contador numérico que sube de `from` a `to` al entrar en pantalla (easeOut, 1 s por defecto).
 * `prefix`/`suffix` añaden unidades (p. ej. "%" o " s"); `pad` rellena con ceros (01, 02…).
 */
export default function AnimatedCounter({
  to,
  from = 0,
  duration = 1,
  prefix = '',
  suffix = '',
  decimals = 0,
  pad = 0,
  className = '',
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduceMotion = useReducedMotion();

  const format = (value) => {
    const raw = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
    return `${prefix}${raw.padStart(pad, '0')}${suffix}`;
  };

  const value = useMotionValue(reduceMotion ? to : from);
  const text = useTransform(value, format);

  useEffect(() => {
    if (!inView || reduceMotion) return undefined;
    const controls = animate(value, to, { duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [inView, reduceMotion, to, duration, value]);

  return (
    <span role="img" aria-label={format(to)} className={className}>
      <motion.span ref={ref} aria-hidden="true" className="tabular-nums">
        {text}
      </motion.span>
    </span>
  );
}
