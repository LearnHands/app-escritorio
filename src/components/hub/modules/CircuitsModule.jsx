import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, ChevronRight, Info, X, CheckCircle2 } from 'lucide-react';
import HandButton from '../HandButton';

const LEVELS = [
  {
    id: 1, title: 'Circuito Simple',
    desc: 'Cierra el interruptor para encender el LED.',
    switches: [{ id: 'S1', label: 'Interruptor', pos: { x: 0.42, y: 0.5 } }],
    check: (s) => !!s.S1,
    info: 'En un circuito cerrado la corriente fluye desde el polo + de la batería, pasa por los componentes y regresa al polo −. Si el interruptor está abierto, el circuito se interrumpe.',
    reward: 50, type: 'series',
  },
  {
    id: 2, title: 'Serie: Dos Interruptores',
    desc: 'En serie: AMBOS deben cerrarse para que fluya corriente.',
    switches: [
      { id: 'S1', label: 'Inter. 1', pos: { x: 0.32, y: 0.5 } },
      { id: 'S2', label: 'Inter. 2', pos: { x: 0.58, y: 0.5 } },
    ],
    check: (s) => !!s.S1 && !!s.S2,
    info: 'En serie los componentes van uno tras otro. Si cualquiera está abierto, la corriente no puede pasar. Así funcionan las luces navideñas clásicas.',
    reward: 70, type: 'series2',
  },
  {
    id: 3, title: 'Paralelo: Dos Rutas',
    desc: 'En paralelo: CUALQUIERA de los dos interruptores completa el circuito.',
    switches: [
      { id: 'S1', label: 'Ruta A', pos: { x: 0.45, y: 0.28 } },
      { id: 'S2', label: 'Ruta B', pos: { x: 0.45, y: 0.72 } },
    ],
    check: (s) => !!s.S1 || !!s.S2,
    info: 'En paralelo la corriente elige el camino disponible. Si una ruta falla, la otra sigue funcionando. Así están conectados los enchufes de tu casa.',
    reward: 80, type: 'parallel',
  },
  {
    id: 4, title: 'Circuito con Resistencia',
    desc: 'La resistencia limita la corriente. Cierra ambos interruptores.',
    switches: [
      { id: 'S1', label: 'Entrada', pos: { x: 0.30, y: 0.5 } },
      { id: 'S2', label: 'Salida', pos: { x: 0.62, y: 0.5 } },
    ],
    check: (s) => !!s.S1 && !!s.S2,
    info: 'Una resistencia (medida en Ohmios Ω) limita el flujo de corriente. Sin ella el LED se quemaría. La Ley de Ohm dice: V = I × R.',
    reward: 90, type: 'resistor',
  },
  {
    id: 5, title: 'Circuito Maestro',
    desc: 'S1 siempre activo + S2 o S3 para completar el circuito.',
    switches: [
      { id: 'S1', label: 'Principal', pos: { x: 0.25, y: 0.5 } },
      { id: 'S2', label: 'Ruta A', pos: { x: 0.52, y: 0.28 } },
      { id: 'S3', label: 'Ruta B', pos: { x: 0.52, y: 0.72 } },
    ],
    check: (s) => !!s.S1 && (!!s.S2 || !!s.S3),
    info: '¡Los circuitos reales combinan serie y paralelo! Un interruptor principal (serie) y rutas alternativas (paralelo) dan control y redundancia.',
    reward: 120, type: 'mixed',
  },
];

// ── Canvas circuit drawing ────────────────────────────────────────────────────
function drawCircuit(ctx, W, H, level, switchStates, completed, t) {
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) * 0.36;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const glow = completed ? `rgba(0,255,180,${0.6 + 0.3 * Math.sin(t * 2)})` : 'rgba(100,120,200,0.5)';
  const wireColor = completed ? '#00ffb4' : '#4466cc';
  const wireW = completed ? 3 : 2;

  // Helper: draw wire segment
  const wire = (x1, y1, x2, y2, active = completed) => {
    ctx.strokeStyle = active ? glow : 'rgba(100,130,200,0.4)';
    ctx.lineWidth = active ? wireW + 1 : wireW - 0.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  // Helper: draw battery
  const drawBattery = (x, y) => {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      const lw = i % 2 === 0 ? 18 : 10;
      const lx = x + i * 10 - 10;
      ctx.beginPath(); ctx.moveTo(lx, y - lw / 2); ctx.lineTo(lx, y + lw / 2); ctx.stroke();
    }
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.floor(H * 0.025)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('+', x + 18, y - 12);
    ctx.fillText('−', x - 18, y + 14);
    ctx.fillStyle = 'rgba(255,215,0,0.15)';
    ctx.fillRect(x - 22, y - 22, 44, 44);
  };

  // Helper: draw LED
  const drawLED = (x, y) => {
    const on = completed;
    ctx.save();
    ctx.translate(x, y);
    // Triangle body
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(-10, 10); ctx.lineTo(10, 0);
    ctx.closePath();
    ctx.fillStyle = on ? `rgba(0,255,100,${0.7 + 0.3 * Math.sin(t * 3)})` : 'rgba(0,200,80,0.2)';
    ctx.strokeStyle = on ? '#00ff64' : '#00aa44';
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    // Cathode line
    ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(10, 10);
    ctx.strokeStyle = on ? '#00ff64' : '#00aa44'; ctx.stroke();
    // Glow
    if (on) {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
      g.addColorStop(0, `rgba(0,255,100,${0.4 * Math.sin(t * 2) + 0.3})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  // Helper: draw resistor (zigzag)
  const drawResistor = (x, y, horiz = true) => {
    ctx.save();
    ctx.translate(x, y);
    if (!horiz) ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    const zz = [-14, -8, -2, 4, 10, 16, 20];
    const zy = [0, -8, 8, -8, 8, -8, 0];
    zz.forEach((xp, i) => { if (i === 0) ctx.lineTo(xp, zy[i]); else ctx.lineTo(xp, zy[i]); });
    ctx.lineTo(20, 0);
    ctx.stroke();
    // Label
    ctx.fillStyle = '#ff8844';
    ctx.font = `bold ${Math.floor(H * 0.018)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('R', 0, horiz ? 18 : -12);
    ctx.restore();
  };

  // Helper: draw switch
  const drawSwitch = (x, y, on, label) => {
    ctx.save();
    ctx.translate(x, y);
    // Base
    ctx.strokeStyle = on ? '#00d4ff' : '#446688';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-8, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(16, 0); ctx.stroke();
    // Moving arm
    ctx.beginPath(); ctx.moveTo(-8, 0);
    ctx.lineTo(on ? 8 : 6, on ? 0 : -10);
    ctx.stroke();
    // Dots
    ctx.fillStyle = on ? '#00d4ff' : '#446688';
    ctx.beginPath(); ctx.arc(-8, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 0, 3, 0, Math.PI * 2); ctx.fill();
    // Label
    ctx.fillStyle = on ? '#00d4ff' : '#7799bb';
    ctx.font = `bold ${Math.floor(H * 0.02)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 22);
    ctx.restore();
  };

  const lx = cx - r * 0.85, rx = cx + r * 0.85;
  const ty = cy - r * 0.55, by = cy + r * 0.55;

  if (level.type === 'series') {
    wire(lx, cy, cx - 60, cy);
    wire(cx - 60, cy, cx + 60, cy, !!switchStates.S1);
    wire(cx + 60, cy, rx, cy, !!switchStates.S1);
    wire(lx, cy, lx, ty); wire(lx, ty, rx, ty);
    wire(rx, ty, rx, cy, !!switchStates.S1);
    drawBattery(lx, cy);
    drawSwitch(cx, cy, !!switchStates.S1, 'S1');
    drawLED(rx, cy);
  } else if (level.type === 'series2') {
    wire(lx, cy, cx - 90, cy); wire(cx - 90, cy, cx - 20, cy, !!switchStates.S1);
    wire(cx - 20, cy, cx + 20, cy, !!switchStates.S1 && !!switchStates.S2);
    wire(cx + 20, cy, rx, cy, !!switchStates.S1 && !!switchStates.S2);
    wire(lx, cy, lx, ty); wire(lx, ty, rx, ty); wire(rx, ty, rx, cy, !!switchStates.S1 && !!switchStates.S2);
    drawBattery(lx, cy);
    drawSwitch(cx - 55, cy, !!switchStates.S1, 'S1');
    drawSwitch(cx + 45, cy, !!switchStates.S2, 'S2');
    drawLED(rx, cy);
  } else if (level.type === 'parallel') {
    const routeA = !!switchStates.S1, routeB = !!switchStates.S2;
    const anyOn = routeA || routeB;
    wire(lx, cy, lx, ty); wire(lx, ty, rx, ty); wire(rx, ty, rx, cy, anyOn);
    wire(lx, cy, cx - 40, cy); wire(cx + 40, cy, rx, cy, anyOn);
    wire(cx - 40, cy, cx - 40, ty + 30); wire(cx + 40, ty + 30, cx + 40, cy, routeA);
    wire(cx - 40, ty + 30, cx + 40, ty + 30, routeA);
    wire(cx - 40, cy, cx - 40, by - 30); wire(cx + 40, by - 30, cx + 40, cy, routeB);
    wire(cx - 40, by - 30, cx + 40, by - 30, routeB);
    drawBattery(lx, cy);
    drawSwitch(cx, ty + 30, routeA, 'S1');
    drawSwitch(cx, by - 30, routeB, 'S2');
    drawLED(rx, cy);
  } else if (level.type === 'resistor') {
    const bothOn = !!switchStates.S1 && !!switchStates.S2;
    wire(lx, cy, cx - 80, cy); wire(cx - 80, cy, cx - 35, cy, !!switchStates.S1);
    wire(cx - 35, cy, cx + 35, cy, bothOn);
    wire(cx + 35, cy, cx + 80, cy, bothOn);
    wire(cx + 80, cy, rx, cy, bothOn);
    wire(lx, cy, lx, ty); wire(lx, ty, rx, ty); wire(rx, ty, rx, cy, bothOn);
    drawBattery(lx, cy);
    drawSwitch(cx - 60, cy, !!switchStates.S1, 'S1');
    drawResistor(cx, cy);
    drawSwitch(cx + 60, cy, !!switchStates.S2, 'S2');
    drawLED(rx, cy);
  } else if (level.type === 'mixed') {
    const mainOn = !!switchStates.S1;
    const routeA = mainOn && !!switchStates.S2;
    const routeB = mainOn && !!switchStates.S3;
    const anyRoute = routeA || routeB;
    wire(lx, cy, cx - 80, cy); wire(cx - 80, cy, cx - 40, cy, mainOn);
    wire(cx + 50, cy, rx, cy, anyRoute);
    wire(lx, cy, lx, ty); wire(lx, ty, rx, ty); wire(rx, ty, rx, cy, anyRoute);
    wire(cx - 40, cy, cx - 40, ty + 30); wire(cx + 50, ty + 30, cx + 50, cy, routeA);
    wire(cx - 40, ty + 30, cx + 50, ty + 30, routeA);
    wire(cx - 40, cy, cx - 40, by - 30); wire(cx + 50, by - 30, cx + 50, cy, routeB);
    wire(cx - 40, by - 30, cx + 50, by - 30, routeB);
    drawBattery(lx, cy);
    drawSwitch(cx - 60, cy, mainOn, 'S1');
    drawSwitch(cx + 5, ty + 30, !!switchStates.S2, 'S2');
    drawSwitch(cx + 5, by - 30, !!switchStates.S3, 'S3');
    drawLED(rx, cy);
  }

  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────────
const CircuitsModule = memo(({ addPoints }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const [switchStates, setSwitchStates] = useState({});
  const [completed, setCompleted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [allDone, setAllDone] = useState(false);
  const [solvedLevels, setSolvedLevels] = useState(new Set());

  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  const level = LEVELS[levelIdx];

  const toggleSwitch = useCallback((id) => {
    if (completed) return;
    setSwitchStates(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (level.check(next)) {
        setCompleted(true);
        if (!solvedLevels.has(levelIdx)) {
          addPointsRef.current(level.reward);
          setSolvedLevels(s => { const ns = new Set(s); ns.add(levelIdx); return ns; });
        }
      }
      return next;
    });
  }, [completed, level, levelIdx, solvedLevels]);

  const nextLevel = useCallback(() => {
    if (levelIdx + 1 >= LEVELS.length) { setAllDone(true); return; }
    setLevelIdx(l => l + 1);
    setSwitchStates({});
    setCompleted(false);
    setShowInfo(false);
  }, [levelIdx]);

  const resetLevel = useCallback(() => {
    setSwitchStates({});
    setCompleted(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawCircuit(ctx, canvas.width, canvas.height, level, switchStates, completed, t);
      t += 0.04;
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [level, switchStates, completed]);

  const overlayOpen = showInfo || showIntro || allDone;

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <Zap size={16} className="text-yellow-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Circuitos Eléctricos</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Nivel {levelIdx + 1}/{LEVELS.length}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className={`text-[9px] font-black uppercase tracking-widest ${completed ? 'text-emerald-400' : 'text-white/40'}`}>
          {completed ? '⚡ Circuito completo!' : '○ Circuito abierto'}
        </span>
      </div>

      {/* Level progress dots */}
      <div className="absolute top-4 right-6 z-30 flex items-center gap-2">
        {LEVELS.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${solvedLevels.has(i) ? 'bg-emerald-400' : i === levelIdx ? 'bg-cyan-400' : 'bg-white/20'}`} />
        ))}
      </div>

      {/* Canvas circuit */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Instruction */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">{level.desc}</p>
      </div>

      {/* Switch buttons - positioned based on level definition */}
      {!overlayOpen && level.switches.map(sw => (
        <div
          key={sw.id}
          className="absolute z-20"
          style={{ left: `${sw.pos.x * 100}%`, top: `${sw.pos.y * 100}%`, transform: 'translate(-50%, -50%)' }}
        >
          <HandButton
            onClick={() => toggleSwitch(sw.id)}
            dwellMs={700}
            variant={switchStates[sw.id] ? 'cyan' : 'default'}
            className={`px-5 py-3 text-[10px] !rounded-xl ${switchStates[sw.id] ? '' : '!bg-white/5 !border-white/10'}`}
          >
            <Zap size={12} />
            {sw.label}: {switchStates[sw.id] ? 'ON' : 'OFF'}
          </HandButton>
        </div>
      ))}

      {/* Right buttons */}
      <div className="absolute top-20 right-6 z-30 flex flex-col gap-3 w-36">
        {completed && (
          <HandButton onClick={nextLevel} dwellMs={700} variant="emerald" className="px-4 py-3 text-[10px]">
            <ChevronRight size={14} /> {levelIdx + 1 < LEVELS.length ? 'Siguiente' : 'Terminar'}
          </HandButton>
        )}
        <HandButton onClick={() => setShowInfo(true)} dwellMs={800} variant="orange" className="px-4 py-2.5 text-[10px]">
          <Info size={13} /> Aprender
        </HandButton>
        <HandButton onClick={resetLevel} dwellMs={700} variant="red" className="px-4 py-2.5 text-[10px]">
          <RotateCcw size={13} /> Reiniciar
        </HandButton>
      </div>

      {/* Info overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-[32px] border border-cyan-500/30 bg-[#0a0a18]/95 shadow-2xl p-7 flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-xl">
                <Zap size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-display font-black italic uppercase text-yellow-400">{level.title}</h3>
              <p className="text-[12px] text-white/70 leading-relaxed">{level.info}</p>
              <HandButton onClick={() => setShowInfo(false)} dwellMs={800} graceMs={600} variant="cyan" className="px-10 py-3 text-xs">
                <X size={14} /> Cerrar
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl text-5xl">⚡</div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">Circuitos Eléctricos</h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                Activa los <span className="text-cyan-400 font-black">interruptores</span> con tu mano para completar el circuito y encender el LED.
                Aprende la diferencia entre circuitos en <span className="text-yellow-400 font-black">serie</span> y en <span className="text-emerald-400 font-black">paralelo</span>.
              </p>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="cyan" className="px-10 py-4 text-sm">
                <Zap size={16} /> ¡Comenzar!
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All done overlay */}
      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-[36px] border border-emerald-500/40 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="text-7xl">🏆</div>
              <h2 className="text-3xl font-display font-black italic uppercase text-emerald-400">¡Maestro de Circuitos!</h2>
              <p className="text-[13px] text-white/60 leading-relaxed">Completaste todos los niveles. ¡Ya entiendes series, paralelos y resistencias!</p>
              <HandButton onClick={() => { setLevelIdx(0); setSwitchStates({}); setCompleted(false); setAllDone(false); }} dwellMs={900} graceMs={600} variant="emerald" className="px-10 py-4 text-sm">
                <RotateCcw size={16} /> Jugar de nuevo
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CircuitsModule;
