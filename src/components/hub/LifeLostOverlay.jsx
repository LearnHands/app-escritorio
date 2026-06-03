import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LifeLostOverlay — feedback visual contundente al perder una vida.
 *
 * Props:
 *   trigger : número que se incrementa cada vez que se pierde una vida.
 *             Cada cambio (> 0) dispara la animación una sola vez.
 *
 * Render (z-[60+], pointer-events-none — no interfiere con el juego):
 *   1. Destello rojo de viñeta que envuelve la pantalla y se desvanece.
 *   2. Corazón roto 💔 grande con "-1 VIDA" que sube y se desvanece.
 *
 * Colócalo como último hijo de un contenedor `relative` que llene la pantalla.
 */
const LifeLostOverlay = memo(({ trigger }) => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (trigger > 0) {
      setShown(trigger);
      const t = setTimeout(() => setShown(0), 950);
      return () => clearTimeout(t);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {shown > 0 && (
        <React.Fragment key={shown}>
          {/* Destello rojo de viñeta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, times: [0, 0.25, 1] }}
            className="absolute inset-0 z-[60] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(239,68,68,0.6) 100%)' }}
          />

          {/* Corazón roto + texto */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.4, 1.1, 1], y: [30, 0, -10, -60] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.95, times: [0, 0.25, 0.6, 1] }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] pointer-events-none flex flex-col items-center"
          >
            <span className="text-8xl drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]">💔</span>
            <span className="text-3xl font-display font-black italic uppercase tracking-tighter text-red-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              −1 Vida
            </span>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
});

export default LifeLostOverlay;
