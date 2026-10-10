import { motion, useReducedMotion } from 'framer-motion';

/**
 * Fade-in hacia arriba al entrar en el viewport (opacity 0→1, translateY 15px→0, 0.5s).
 * Se dispara una sola vez y respeta `prefers-reduced-motion`.
 */
export default function Reveal({ as = 'div', delay = 0, className = '', children, ...rest }) {
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
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      {...rest}
    >
      {children}
    </Component>
  );
}
