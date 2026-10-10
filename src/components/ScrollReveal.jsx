import { motion, useReducedMotion } from 'framer-motion';

const OFFSET = 25;

/** Desplazamiento inicial según la dirección de entrada. */
const DIRECTIONS = {
  up: { y: OFFSET },
  down: { y: -OFFSET },
  left: { x: -OFFSET },
  right: { x: OFFSET },
};

/**
 * Wrapper de aparición al hacer scroll: fade-in + desplazamiento de 25px hacia su
 * posición final. Se dispara una sola vez y respeta `prefers-reduced-motion`.
 *
 * Props: `delay` (s), `direction` ("up" | "down" | "left" | "right"), `className`,
 * `as` (etiqueta HTML, p. ej. "ol", "li"). El resto se pasa al elemento.
 */
export default function ScrollReveal({
  children,
  delay,
  className = '',
  direction = 'up',
  as = 'div',
  ...rest
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  if (reduceMotion) {
    return (
      <Component className={className} {...rest}>
        {children}
      </Component>
    );
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, ...(DIRECTIONS[direction] || DIRECTIONS.up) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98], delay: delay || 0 }}
      {...rest}
    >
      {children}
    </Component>
  );
}
