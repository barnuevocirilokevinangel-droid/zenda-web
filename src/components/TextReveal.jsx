import { motion, useReducedMotion } from 'framer-motion';

/**
 * Aparición de texto (títulos, eyebrows, subtítulos y párrafos) al entrar en el viewport.
 * Renderiza directamente la etiqueta indicada en `as` (h1, h2, p, span…), por lo que
 * no añade nodos extra al DOM. Se dispara una sola vez y respeta `prefers-reduced-motion`.
 */
export default function TextReveal({ children, as = 'div', delay, className = '', ...rest }) {
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
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: delay || 0 }}
      {...rest}
    >
      {children}
    </Component>
  );
}
