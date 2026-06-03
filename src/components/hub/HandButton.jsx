import React, { useState, useEffect, useRef } from 'react';

/**
 * HandButton — botón activado por permanencia (dwell) del cursor de mano.
 *
 * Props:
 *   dwellMs   : ms que el cursor debe permanecer encima para activar (def. 1000)
 *   cooldownMs: ms de bloqueo tras dispararse (def. 800)
 *   graceMs   : ms iniciales tras montarse en los que ignora la entrada (def. 0)
 *               Úsalo en botones que aparecen bajo el cursor (tarjetas, overlays)
 *               para evitar que se disparen solos.
 *   hitMargin : px de margen alrededor del botón para el área sensible (def. 32)
 *
 * Rendimiento: el loop corre a ~30fps (no 60) y cachea getBoundingClientRect,
 * evitando forzar "layout" en cada frame — clave cuando hay muchos botones.
 *
 * Anti-doble-disparo: tras activarse exige que el cursor SALGA del área antes
 * de poder volver a llenarse (mustLeave), así pasar el dedo no dispara dos veces.
 */
const HandButton = ({
  children, onClick,
  dwellMs = 1000, cooldownMs = 800, graceMs = 0, hitMargin = 32,
  className = "", variant = "purple",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress]   = useState(0);
  const buttonRef = useRef(null);
  const rafRef    = useRef(null);

  // Estado interno en refs → el efecto usa deps [] y nunca se reinicia.
  const isHoveredRef = useRef(false);
  const progressRef  = useRef(0);
  const lastRunRef   = useRef(0);
  const cooldownRef  = useRef(false);
  const mustLeaveRef = useRef(false);     // exige re-entrada tras disparar
  const rectRef      = useRef(null);      // rect cacheado
  const rectStampRef = useRef(0);

  const onClickRef   = useRef(onClick);   onClickRef.current   = onClick;
  const dwellMsRef   = useRef(dwellMs);   dwellMsRef.current   = dwellMs;
  const cooldownRefMs= useRef(cooldownMs);cooldownRefMs.current= cooldownMs;
  const graceMsRef   = useRef(graceMs);   graceMsRef.current   = graceMs;
  const hitMarginRef = useRef(hitMargin); hitMarginRef.current = hitMargin;

  useEffect(() => {
    let mounted = true;
    const mountTime = performance.now();
    const FRAME_MS = 33;  // ~30fps — la mitad de carga que correr a 60fps

    const fire = () => {
      onClickRef.current?.();
      progressRef.current  = 0;
      isHoveredRef.current = false;
      setProgress(0);
      setIsHovered(false);
      cooldownRef.current  = true;
      mustLeaveRef.current = true;  // hay que salir antes de volver a llenar
      setTimeout(() => { cooldownRef.current = false; }, cooldownRefMs.current);
    };

    const tick = (now) => {
      if (!mounted) return;
      rafRef.current = requestAnimationFrame(tick);

      // Throttle a ~30fps
      if (now - lastRunRef.current < FRAME_MS) return;
      const dt = now - lastRunRef.current;
      lastRunRef.current = now;

      if (cooldownRef.current) return;
      const btn = buttonRef.current;
      if (!btn) return;

      // Periodo de gracia tras montarse (evita auto-disparo en tarjetas nuevas)
      if (now - mountTime < graceMsRef.current) return;

      // Rect cacheado: se recalcula cada 500ms (los botones no se mueven en juego)
      if (!rectRef.current || now - rectStampRef.current > 500) {
        rectRef.current = btn.getBoundingClientRect();
        rectStampRef.current = now;
      }
      const r = rectRef.current;
      const m = hitMarginRef.current;

      let over = false, pinchOver = false;
      const { cursors = [], gestures = [] } = window.latestHandData || {};
      for (let i = 0; i < cursors.length; i++) {
        const c = cursors[i];
        if (!c?.isVisible) continue;
        if (c.x >= r.left - m && c.x <= r.right + m && c.y >= r.top - m && c.y <= r.bottom + m) {
          over = true;
          if (gestures[i]?.isPinching) pinchOver = true;
        }
      }

      // Exigir re-entrada tras disparar: hay que salir del área primero
      if (mustLeaveRef.current) {
        if (!over) { mustLeaveRef.current = false; }
        else {
          if (isHoveredRef.current) { isHoveredRef.current = false; setIsHovered(false); }
          if (progressRef.current !== 0) { progressRef.current = 0; setProgress(0); }
          return;
        }
      }

      if (over) {
        const speed = pinchOver ? 2 : 1;   // pinza llena 2× más rápido
        if (!isHoveredRef.current) {
          isHoveredRef.current = true;
          setIsHovered(true);
          progressRef.current = 0;
        } else {
          progressRef.current = Math.min(progressRef.current + (dt / dwellMsRef.current) * speed, 1);
          setProgress(progressRef.current);
          if (progressRef.current >= 1) { fire(); return; }
        }
      } else if (isHoveredRef.current) {
        // Decaimiento al salir
        progressRef.current = Math.max(progressRef.current - (dt / dwellMsRef.current) * 1.5, 0);
        setProgress(progressRef.current);
        if (progressRef.current <= 0) { isHoveredRef.current = false; setIsHovered(false); }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { mounted = false; cancelAnimationFrame(rafRef.current); };
  }, []); // Loop estable — nunca se reinicia; todo lo vivo está en refs

  const variants = {
    purple:  'from-purple-600 to-indigo-600',
    cyan:    'from-cyan-500 to-teal-500',
    orange:  'from-orange-500 to-amber-500',
    red:     'from-red-600 to-rose-600',
    emerald: 'from-emerald-500 to-teal-600',
    default: 'from-slate-600 to-slate-700',
  };

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden transition-all duration-300 ${isHovered ? 'scale-110 shadow-[0_0_40px_rgba(124,58,237,0.4)]' : ''} ${className} bg-gradient-to-br ${variants[variant] || variants.purple} text-white font-black uppercase tracking-widest rounded-2xl shadow-xl border border-white/10`}
    >
      <div className="relative z-10 flex items-center justify-center gap-3">{children}</div>
      {isHovered && (
        <div
          className="absolute inset-0 bg-white/20 origin-left"
          style={{ transform: `scaleX(${progress})` }}
        />
      )}
    </button>
  );
};

export default HandButton;
