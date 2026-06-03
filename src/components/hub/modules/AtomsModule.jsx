import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Atom, Info, X, ChevronRight } from 'lucide-react';
import HandButton from '../HandButton';

const SUBSTANCES = [
  { id: 'water',   label: 'Agua (H₂O)',    color: '#00aaff', count: 40, mass: 1.0 },
  { id: 'iron',    label: 'Hierro (Fe)',   color: '#cc8844', count: 30, mass: 2.5 },
  { id: 'oxygen',  label: 'Oxígeno (O₂)', color: '#44ffcc', count: 50, mass: 0.6 },
];

const STATES = [
  { id: 'solid',  label: 'Sólido',    emoji: '🧊', tempRange: [0, 30],   desc: 'Los átomos vibran en su lugar. Estructura rígida y ordenada. Volumen y forma fijos.' },
  { id: 'liquid', label: 'Líquido',   emoji: '💧', tempRange: [31, 65],  desc: 'Los átomos se mueven libremente pero siguen juntos. Volumen fijo, forma variable.' },
  { id: 'gas',    label: 'Gas',       emoji: '💨', tempRange: [66, 100], desc: 'Los átomos se mueven a gran velocidad y se separan. Volumen y forma variables.' },
];

const INFO_CARDS = [
  { title: 'Átomo', text: 'El átomo es la unidad más pequeña de la materia. Tiene un núcleo (protones + neutrones) rodeado de electrones en órbita.', emoji: '⚛️' },
  { title: 'Temperatura', text: 'La temperatura mide la energía cinética media de los átomos. A mayor temperatura, más rápido se mueven.', emoji: '🌡️' },
  { title: 'Cambio de Estado', text: 'Al calentar o enfriar una sustancia, sus átomos cambian de comportamiento: sólido → líquido → gas (fusión y evaporación).', emoji: '🔄' },
  { title: 'Energía', text: 'El calor es energía que se transfiere entre sustancias. Al absorber calor los átomos se mueven más rápido y el estado puede cambiar.', emoji: '🔥' },
];

// Initialize atoms for a substance
function initAtoms(sub, W, H) {
  return Array.from({ length: sub.count }, (_, i) => ({
    id: i,
    x: 60 + Math.random() * (W - 120),
    y: 60 + Math.random() * (H - 180),
    vx: (Math.random() - 0.5) * 1,
    vy: (Math.random() - 0.5) * 1,
    r: 6 + Math.random() * 3,
  }));
}

const AtomsModule = memo(({ addPoints }) => {
  const [temperature, setTemperature] = useState(15); // 0-100
  const [substanceIdx, setSubstanceIdx] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [infoIdx, setInfoIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [earnedStates, setEarnedStates] = useState(new Set());

  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const atomsRef = useRef([]);
  const tempRef = useRef(temperature);
  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  const substance = SUBSTANCES[substanceIdx];
  const currentState = STATES.find(s => temperature >= s.tempRange[0] && temperature <= s.tempRange[1]) || STATES[2];

  // Track state changes for points
  useEffect(() => {
    if (!earnedStates.has(currentState.id)) {
      setEarnedStates(prev => { const ns = new Set(prev); ns.add(currentState.id); return ns; });
      addPointsRef.current(30);
    }
  }, [currentState.id]);

  // Re-init atoms when substance changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    atomsRef.current = initAtoms(substance, canvas.offsetWidth || 800, canvas.offsetHeight || 500);
  }, [substanceIdx]);

  // Hand-based temperature control (hand Y position controls temperature)
  useEffect(() => {
    let frameId;
    const loop = () => {
      const hand = window.latestHandData;
      if (hand?.cursors?.[0]?.isVisible) {
        const normY = hand.cursors[0].y / window.innerHeight;
        // Map Y: top of screen (0) = 100°C hot, bottom (1) = 0°C cold
        const targetTemp = Math.round((1 - normY) * 100);
        setTemperature(prev => {
          const diff = targetTemp - prev;
          return Math.max(0, Math.min(100, prev + diff * 0.04));
        });
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => { tempRef.current = temperature; }, [temperature]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const animate = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
        if (!atomsRef.current.length) atomsRef.current = initAtoms(substance, W, H);
      }

      ctx.clearRect(0, 0, W, H);

      const temp = tempRef.current;
      const speedFactor = 0.2 + (temp / 100) * 5;
      const state = STATES.find(s => temp >= s.tempRange[0] && temp <= s.tempRange[1]) || STATES[2];
      const isSolid = state.id === 'solid';
      const isLiquid = state.id === 'liquid';
      const isGas = state.id === 'gas';

      // Grid positions for solid state
      const cols = Math.ceil(Math.sqrt(atomsRef.current.length));
      const gridSpacing = Math.min(W, H - 150) / (cols + 1);

      atomsRef.current.forEach((atom, i) => {
        if (isSolid) {
          // Vibrate around grid position
          const col = i % cols;
          const row = Math.floor(i / cols);
          const gx = (W / 2) - (cols / 2) * gridSpacing + col * gridSpacing;
          const gy = 60 + row * gridSpacing;
          const vibAmp = 1 + temp * 0.08;
          atom.x += (gx - atom.x) * 0.15 + (Math.random() - 0.5) * vibAmp;
          atom.y += (gy - atom.y) * 0.15 + (Math.random() - 0.5) * vibAmp;
        } else {
          // Free movement
          atom.x += atom.vx * speedFactor;
          atom.y += atom.vy * speedFactor;

          if (isGas) {
            // Full bounce
            if (atom.x < atom.r || atom.x > W - atom.r) atom.vx *= -1;
            if (atom.y < atom.r || atom.y > H - 130 - atom.r) atom.vy *= -1;
          } else {
            // Liquid: looser but gravity-ish
            if (atom.x < atom.r || atom.x > W - atom.r) atom.vx *= -1;
            if (atom.y < 40 || atom.y > H - 130) atom.vy *= -1;
            atom.vy += 0.02; // weak gravity
            atom.vx *= 0.995;
          }
          atom.x = Math.max(atom.r, Math.min(W - atom.r, atom.x));
          atom.y = Math.max(atom.r, Math.min(H - 130, atom.y));
        }

        // Draw atom
        const grd = ctx.createRadialGradient(atom.x - 2, atom.y - 2, 1, atom.x, atom.y, atom.r + 2);
        grd.addColorStop(0, substance.color + 'ff');
        grd.addColorStop(0.6, substance.color + 'aa');
        grd.addColorStop(1, substance.color + '22');
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, atom.r, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Draw bonds in solid/liquid
        if (!isGas) {
          atomsRef.current.forEach((other, j) => {
            if (j <= i) return;
            const dx = other.x - atom.x, dy = other.y - atom.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = isSolid ? gridSpacing * 1.2 : 40;
            if (dist < maxDist) {
              const alpha = 1 - dist / maxDist;
              ctx.strokeStyle = substance.color + Math.floor(alpha * (isLiquid ? 80 : 160)).toString(16).padStart(2, '0');
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(atom.x, atom.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          });
        }
      });

      // Temperature gradient background hint
      const bgGrd = ctx.createLinearGradient(0, 0, 0, H);
      if (temp > 66) {
        bgGrd.addColorStop(0, `rgba(255,80,0,${(temp - 66) / 100})`);
        bgGrd.addColorStop(1, 'transparent');
      } else if (temp < 20) {
        bgGrd.addColorStop(0, `rgba(0,100,255,${(20 - temp) / 60})`);
        bgGrd.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = bgGrd;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [substance]);

  const tempPercent = Math.round(temperature);
  const stateColor = currentState.id === 'solid' ? '#00aaff' : currentState.id === 'liquid' ? '#44bbff' : '#ff6644';

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <Atom size={16} className="text-cyan-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Movimiento de Átomos</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: stateColor }}>
          {currentState.emoji} {currentState.label}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">{tempPercent}°C</span>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Temperature bar (left) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2">
        <span className="text-[8px] font-black uppercase tracking-widest text-red-400">Calor</span>
        <div className="w-4 h-48 rounded-full bg-white/10 border border-white/20 relative overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-100"
            style={{
              height: `${tempPercent}%`,
              background: `linear-gradient(to top, #0088ff, ${tempPercent > 65 ? '#ff4400' : tempPercent > 30 ? '#44bbff' : '#0055ff'})`,
            }}
          />
          <div className="absolute left-1/2 -translate-x-1/2 text-white/80 text-[7px] font-black" style={{ bottom: `${tempPercent}%`, marginBottom: 2 }}>
            {tempPercent}°
          </div>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Frío</span>
        <p className="text-[7px] text-white/30 font-black uppercase tracking-wider mt-1 text-center w-16">Mueve<br/>la mano<br/>↑↓</p>
      </div>

      {/* State info (bottom center) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-center w-80">
        <motion.div
          key={currentState.id}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-dark px-5 py-3 rounded-2xl border border-white/10"
        >
          <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: stateColor }}>
            {currentState.emoji} Estado {currentState.label}
          </p>
          <p className="text-[10px] text-white/50 leading-relaxed">{currentState.desc}</p>
        </motion.div>
      </div>

      {/* Right controls */}
      <div className="absolute top-20 right-6 z-30 flex flex-col gap-3 w-36">
        <div className="text-[8px] font-black uppercase tracking-widest text-white/40 text-center">Sustancia</div>
        {SUBSTANCES.map((sub, i) => (
          <HandButton key={sub.id} onClick={() => setSubstanceIdx(i)} dwellMs={800}
            variant={i === substanceIdx ? 'cyan' : 'default'}
            className={`px-3 py-2 text-[9px] ${i !== substanceIdx ? '!bg-white/5 !border-white/10' : ''}`}>
            {sub.label}
          </HandButton>
        ))}
        <div className="w-full h-px bg-white/10 my-1" />
        <HandButton onClick={() => setShowInfo(true)} dwellMs={800} variant="purple" className="px-4 py-2.5 text-[10px]">
          <Info size={13} /> Aprender
        </HandButton>
      </div>

      {/* Info overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-[32px] border border-cyan-500/30 bg-[#0a0a18]/95 shadow-2xl p-7 flex flex-col items-center gap-4 text-center">
              <div className="text-5xl">{INFO_CARDS[infoIdx].emoji}</div>
              <h3 className="text-xl font-display font-black italic uppercase text-cyan-400">{INFO_CARDS[infoIdx].title}</h3>
              <p className="text-[12px] text-white/70 leading-relaxed">{INFO_CARDS[infoIdx].text}</p>
              <div className="flex gap-3 mt-2">
                <HandButton onClick={() => setInfoIdx(i => (i - 1 + INFO_CARDS.length) % INFO_CARDS.length)} dwellMs={700} variant="default" className="px-5 py-2.5 text-[10px] !bg-white/5">← Anterior</HandButton>
                <HandButton onClick={() => setInfoIdx(i => (i + 1) % INFO_CARDS.length)} dwellMs={700} variant="cyan" className="px-5 py-2.5 text-[10px]">Siguiente →</HandButton>
              </div>
              <HandButton onClick={() => setShowInfo(false)} dwellMs={800} graceMs={600} variant="default" className="px-8 py-3 text-[10px] !bg-white/5">
                <X size={12} /> Cerrar
              </HandButton>
              <div className="flex gap-1.5">
                {INFO_CARDS.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === infoIdx ? 'bg-cyan-400' : 'bg-white/20'}`} />
                ))}
              </div>
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
              <div className="text-7xl">⚛️</div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">Movimiento de Átomos</h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                Mueve tu mano <span className="text-cyan-400 font-black">↑ arriba</span> para calentar y <span className="text-blue-400 font-black">↓ abajo</span> para enfriar.
                Observa cómo los átomos cambian entre <span className="text-white font-black">sólido → líquido → gas</span>.
              </p>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="cyan" className="px-10 py-4 text-sm">
                <Atom size={16} /> ¡Explorar!
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AtomsModule;
