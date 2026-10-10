import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * Línea de carga minimalista fija en el borde superior, visible solo al montar la página.
 * Avanza de 0 a 100 % y se desvanece. No se muestra con `prefers-reduced-motion`.
 */
export default function PageLoader() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduceMotion) setVisible(false);
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loader"
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[2px]"
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
        >
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-zenda-blue via-zenda-cyan to-zenda-cyan shadow-[0_0_10px_rgba(0,229,255,0.6)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
            onAnimationComplete={() => setVisible(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
