import { motion, useReducedMotion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

/** Contenedor que escalona (staggerChildren) la entrada de sus `StaggerItem` al hacer scroll. */
export function StaggerGroup({ children, className = '', ...rest }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Elemento hijo de un `StaggerGroup` (hereda su secuencia de animación). */
export function StaggerItem({ children, className = '', ...rest }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div className={className} variants={item} {...rest}>
      {children}
    </motion.div>
  );
}
