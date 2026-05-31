import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Planet definitions ────────────────────────────────────────────────────────
// orbitFraction: fraction of the "solar radius" (half the shorter screen side)
const PLANETS = [
  {
    name: 'Mercurio', color: '#9CA3AF', size: 5,  orbitFraction: 0.14, period: 4.1,
    moon: false, ring: false,
    fact: 'El planeta más pequeño y más cercano al Sol. ¡Un año dura solo 88 días terrestres!',
  },
  {
    name: 'Venus',    color: '#FDE68A', size: 9,  orbitFraction: 0.21, period: 10.5,
    moon: false, ring: false,
    fact: 'El planeta más caliente (462 °C). Su densa atmósfera de CO₂ atrapa el calor como un invernadero gigante.',
  },
  {
    name: 'Tierra',   color: '#3B82F6', size: 10, orbitFraction: 0.29, period: 17.0,
    moon: true,  ring: false,
    fact: 'Nuestro hogar. El único planeta conocido con agua líquida en la superficie y vida.',
  },
  {
    name: 'Marte',    color: '#EF4444', size: 7,  orbitFraction: 0.37, period: 32.0,
    moon: false, ring: false,
    fact: 'El planeta rojo. Tiene el volcán más alto del sistema solar: Monte Olimpo, 3× más alto que el Everest.',
  },
  {
    name: 'Júpiter',  color: '#D97706', size: 22, orbitFraction: 0.48, period: 84.0,
    moon: true,  ring: false,
    fact: 'El más grande del sistema solar: ¡cabría la Tierra más de 1 300 veces! Su Gran Mancha Roja lleva 350 años de tormenta.',
  },
  {
    name: 'Saturno',  color: '#F59E0B', size: 17, orbitFraction: 0.59, period: 214.0,
    moon: false, ring: true,
    fact: 'Famoso por sus magníficos anillos de hielo y roca. Es tan poco denso que flotaría en el agua.',
  },
  {
    name: 'Urano',    color: '#67E8F9', size: 12, orbitFraction: 0.70, period: 608.0,
    moon: false, ring: false,
    fact: 'Gira de lado (98° inclinado). Tiene la temperatura más baja del sistema solar: −224 °C.',
  },
  {
    name: 'Neptuno',  color: '#1D4ED8', size: 11, orbitFraction: 0.80, period: 1188.0,
    moon: false, ring: false,
    fact: 'El más lejano del Sol. Sus vientos alcanzan 2 100 km/h, los más rápidos del sistema solar.',
  },
];

const SolarSystemModule = memo(({ addPoints }) => {
  const canvasRef  = useRef(null);
  const [info, setInfo]         = useState(null);   // { name, fact, color, x, y }
  const [paused, setPaused]     = useState(false);
  const [visited, setVisited]   = useState(new Set()); // planet names seen

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  const stateRef = useRef({
    time:         0,          // seconds of simulation
    paused:       false,
    hoveredPlanet: null,      // name or null
    selectedPlanet: null,     // name of pinch-selected planet
    pinchHandled:  true,
    wasPinching:   false,
    visited:       new Set(),
    // Computed planet positions this frame (for hit-testing)
    positions:    [],         // [{ name, px, py, screenR }]
  });

  // ── Main render loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let animId;
    let lastTs = performance.now();

    const loop = (ts) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      const s = stateRef.current;
      if (!s.paused) s.time += dt;

      const ctx = canvas.getContext('2d');
      const W   = canvas.width;
      const H   = canvas.height;

      // Solar radius: scale orbit fractions to fit screen
      const solarR = Math.min(W, H) * 0.46;
      const cx     = W / 2;
      const cy     = H / 2;

      ctx.clearRect(0, 0, W, H);

      // ── Background starfield ──────────────────────────────────────────────
      // (paint once on first call, then skip — stars don't move)
      if (!loop.starsBuf) {
        loop.starsBuf = Array.from({ length: 220 }, () => ({
          x: Math.random(), y: Math.random(),
          r: 0.5 + Math.random() * 1.2,
          a: 0.3 + Math.random() * 0.7,
        }));
      }
      loop.starsBuf.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x * W, star.y * H, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.a})`;
        ctx.fill();
      });

      // ── Orbit circles ─────────────────────────────────────────────────────
      PLANETS.forEach(p => {
        const orbitR = p.orbitFraction * solarR;
        ctx.beginPath();
        ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth   = 1;
        ctx.stroke();
      });

      // ── Sun ───────────────────────────────────────────────────────────────
      const sunR = Math.max(22, solarR * 0.06);
      // Glow
      const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 3);
      sunGlow.addColorStop(0,   'rgba(253,224,71,0.5)');
      sunGlow.addColorStop(0.4, 'rgba(251,146,60,0.15)');
      sunGlow.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, sunR * 3, 0, Math.PI * 2);
      ctx.fillStyle = sunGlow;
      ctx.fill();
      // Body
      const sunGrad = ctx.createRadialGradient(cx - sunR * 0.3, cy - sunR * 0.3, 0, cx, cy, sunR);
      sunGrad.addColorStop(0, '#FEF08A');
      sunGrad.addColorStop(0.5, '#FBBF24');
      sunGrad.addColorStop(1, '#F97316');
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
      ctx.fillStyle = sunGrad;
      ctx.shadowBlur  = 40;
      ctx.shadowColor = '#FCD34D';
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── Planets ───────────────────────────────────────────────────────────
      const positions = [];

      PLANETS.forEach(p => {
        const orbitR  = p.orbitFraction * solarR;
        const angle   = (s.time / p.period) * Math.PI * 2;
        const px      = cx + Math.cos(angle) * orbitR;
        const py      = cy + Math.sin(angle) * orbitR;
        const screenR = Math.max(p.size, solarR * 0.015);
        const isHover = s.hoveredPlanet === p.name;
        const isSel   = s.selectedPlanet === p.name;

        positions.push({ name: p.name, px, py, screenR });

        // ── Saturn's rings ──────────────────────────────────────────────────
        if (p.ring) {
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(1, 0.35);
          const ringInner = screenR * 1.4;
          const ringOuter = screenR * 2.4;
          const rGrad = ctx.createRadialGradient(0, 0, ringInner, 0, 0, ringOuter);
          rGrad.addColorStop(0,   'rgba(245,200,100,0.6)');
          rGrad.addColorStop(0.5, 'rgba(245,200,100,0.3)');
          rGrad.addColorStop(1,   'rgba(245,200,100,0)');
          ctx.beginPath();
          ctx.arc(0, 0, ringOuter, 0, Math.PI * 2);
          ctx.arc(0, 0, ringInner, 0, Math.PI * 2, true);
          ctx.fillStyle = rGrad;
          ctx.fill();
          ctx.restore();
        }

        // ── Hover glow ──────────────────────────────────────────────────────
        if (isHover || isSel) {
          const hGlow = ctx.createRadialGradient(px, py, 0, px, py, screenR * 3);
          hGlow.addColorStop(0,   `${p.color}55`);
          hGlow.addColorStop(0.5, `${p.color}22`);
          hGlow.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.beginPath();
          ctx.arc(px, py, screenR * 3, 0, Math.PI * 2);
          ctx.fillStyle = hGlow;
          ctx.fill();
        }

        // ── Planet body ─────────────────────────────────────────────────────
        const pGrad = ctx.createRadialGradient(
          px - screenR * 0.3, py - screenR * 0.3, screenR * 0.05,
          px, py, screenR
        );
        pGrad.addColorStop(0, lightenColor(p.color, 40));
        pGrad.addColorStop(1, p.color);

        ctx.beginPath();
        ctx.arc(px, py, screenR, 0, Math.PI * 2);
        ctx.shadowBlur  = isHover || isSel ? 25 : 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle   = pGrad;
        ctx.fill();
        ctx.shadowBlur  = 0;

        // Earth cloud band
        if (p.name === 'Tierra') {
          ctx.beginPath();
          ctx.arc(px, py - screenR * 0.1, screenR * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth   = screenR * 0.3;
          ctx.stroke();
        }

        // ── Moon ────────────────────────────────────────────────────────────
        if (p.moon) {
          const moonAngle = s.time * (p.name === 'Tierra' ? 6 : 2.5);
          const moonDist  = screenR * 2.2;
          const mx = px + Math.cos(moonAngle) * moonDist;
          const my = py + Math.sin(moonAngle) * moonDist;
          ctx.beginPath();
          ctx.arc(mx, my, Math.max(3, screenR * 0.28), 0, Math.PI * 2);
          ctx.fillStyle   = '#CBD5E1';
          ctx.shadowBlur  = 4;
          ctx.shadowColor = '#94A3B8';
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // ── Planet name label ────────────────────────────────────────────────
        if (isHover || isSel) {
          ctx.font      = `bold ${Math.max(11, screenR * 1.1)}px system-ui`;
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.shadowBlur  = 12;
          ctx.shadowColor = p.color;
          ctx.fillText(p.name, px, py - screenR - 8);
          ctx.shadowBlur  = 0;
        }
      });

      s.positions = positions;

      // ── Hand cursor & interaction ─────────────────────────────────────────
      const { cursors = [], gestures = [] } = window.latestHandData || {};
      const cursor  = cursors[0];
      const gesture = gestures[0];

      if (cursor?.isVisible) {
        const { x: cPx, y: cPy } = cursor;
        const isPinching = !!gesture?.isPinching;

        // Hover detection — find nearest planet
        let hover = null, hoverDist = Infinity;
        positions.forEach(pos => {
          const d = Math.hypot(cPx - pos.px, cPy - pos.py);
          if (d < pos.screenR * 2.5 && d < hoverDist) {
            hoverDist = d; hover = pos.name;
          }
        });

        if (hover !== s.hoveredPlanet) {
          s.hoveredPlanet = hover;
          // Don't trigger React re-render here (canvas redraws each frame)
        }

        // Pinch — select planet to show info card
        if (isPinching && !s.wasPinching) s.pinchHandled = false;
        if (!isPinching)                   s.pinchHandled = true;
        s.wasPinching = isPinching;

        if (isPinching && !s.pinchHandled && hover) {
          s.pinchHandled = true;
          const planet = PLANETS.find(p => p.name === hover);
          if (planet) {
            const pos    = positions.find(p => p.name === hover);
            const isNew  = !s.visited.has(hover);
            if (isNew) {
              s.visited.add(hover);
              addPointsRef.current(80);
            }
            // Toggle info card
            if (s.selectedPlanet === hover) {
              s.selectedPlanet = null;
              setInfo(null);
            } else {
              s.selectedPlanet = hover;
              setInfo({
                name:  planet.name,
                fact:  planet.fact,
                color: planet.color,
                x:     pos.px,
                y:     pos.py,
              });
            }
            setVisited(new Set(s.visited));
          }
        }

        // Draw cursor ring
        ctx.beginPath();
        ctx.arc(cPx, cPy, isPinching ? 10 : 14, 0, Math.PI * 2);
        ctx.strokeStyle = isPinching ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth   = isPinching ? 3 : 1.5;
        ctx.setLineDash(isPinching ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (hover) {
          ctx.beginPath();
          ctx.arc(cPx, cPy, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
        }
      } else {
        s.hoveredPlanet = null;
      }

      // ── Pause badge ───────────────────────────────────────────────────────
      if (s.paused) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font      = 'bold 13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('⏸ PAUSADO', W / 2, 40);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ── Pause / resume ────────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    const s = stateRef.current;
    s.paused = !s.paused;
    setPaused(s.paused);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative overflow-hidden select-none bg-black">

      {/* Canvas fills everything */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <span className="text-lg">🪐</span>
        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/60">Sistema Solar</span>
        {visited.size > 0 && (
          <>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
              {visited.size}/{PLANETS.length} planetas
            </span>
          </>
        )}
      </div>

      {/* ── Pause button ─────────────────────────────────────────────────── */}
      <button
        onClick={togglePause}
        className="absolute top-4 right-12 z-20 p-3 glass rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all"
      >
        {paused ? '▶' : '⏸'}
      </button>

      {/* ── Info card ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {info && (
          <motion.div
            key={info.name}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.85, y: 20  }}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-30 w-72 glass-dark rounded-[28px] border border-white/10 shadow-2xl p-6 flex flex-col gap-3"
            style={{ boxShadow: `0 0 50px ${info.color}40` }}
          >
            {/* Close */}
            <button
              onClick={() => { setInfo(null); stateRef.current.selectedPlanet = null; }}
              className="absolute top-3 right-4 text-white/30 hover:text-white text-lg font-black"
            >✕</button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full shadow-lg" style={{ background: info.color, boxShadow: `0 0 15px ${info.color}` }} />
              <h3 className="text-2xl font-display font-black italic uppercase tracking-tight text-white">
                {info.name}
              </h3>
            </div>

            <p className="text-[11px] text-white/70 leading-relaxed font-medium">
              {info.fact}
            </p>

            <div className="mt-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 text-center">
              Pellizca otro planeta para explorar
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All planets visited celebration ──────────────────────────────── */}
      <AnimatePresence>
        {visited.size === PLANETS.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 glass px-8 py-4 rounded-2xl border border-amber-500/30 bg-amber-500/10"
          >
            <p className="text-amber-400 font-black uppercase tracking-widest text-xs text-center">
              🏆 ¡Exploraste todo el sistema solar!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Instruction ──────────────────────────────────────────────────── */}
      {!info && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 glass px-7 py-3 rounded-2xl border border-white/10 animate-pulse">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 italic text-center">
            Señala un planeta con el dedo · Pellizca 🤏 para ver información
          </p>
        </div>
      )}
    </div>
  );
});

// ── Utility: lighten a hex color ──────────────────────────────────────────────
function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r   = Math.min(255, (num >> 16) + amount);
  const g   = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b   = Math.min(255, (num & 0xFF) + amount);
  return `rgb(${r},${g},${b})`;
}

export default SolarSystemModule;
