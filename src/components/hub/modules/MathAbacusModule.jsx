import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

// Progresión de metas: índice crece con streak
const TARGET_SEQUENCE = [5, 8, 10, 12, 15, 18, 20, 25, 30];
const FOOTER_H = 64; // altura de la barra inferior en px

const MathAbacusModule = memo(({ addPoints }) => {
  const [targetSum, setTargetSum]     = useState(TARGET_SEQUENCE[0]);
  const [currentSum, setCurrentSum]   = useState(0);
  const [selectedNums, setSelectedNums] = useState([]);
  const [streak, setStreak]           = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bubbles, setBubbles]         = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const audioCtxRef   = useRef(null);
  const frameRef      = useRef(null);
  const spawnTimer    = useRef(null);
  const idCounter     = useRef(0);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const addPointsRef  = useRef(addPoints);
  addPointsRef.current = addPoints;

  const feedbackTimerRef = useRef(null);
  const showFeedback = useCallback((text, type = 'ok') => {
    clearTimeout(feedbackTimerRef.current);
    setFeedbackMsg({ text, type });
    feedbackTimerRef.current = setTimeout(() => setFeedbackMsg(null), 2200);
  }, []);
  const showFeedbackRef = useRef(showFeedback);
  showFeedbackRef.current = showFeedback;

  // ── Toda la lógica mutable vive aquí ──
  const stateRef = useRef({
    targetSum:     TARGET_SEQUENCE[0],
    targetIdx:     0,
    selectedItems: [],
    bubbles:       [],
    particles:     [],
    streak:        0,
    wasPinching:   false,   // single-hand edge detection
    pinchHandled:  true,    // true = this pinch gesture already processed an action
  });

  // ── Audio ──────────────────────────────────────────────────────────────────
  const playSound = useCallback((type, value = 0) => {
    if (!soundEnabledRef.current) return;
    try {
      if (!audioCtxRef.current)
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);

      if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 + value * 50, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'deselect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'match_ok') {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0, now + i * 0.08);
          g.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
          o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.4);
        });
      } else if (type === 'overlimit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(); osc.stop(ctx.currentTime + 0.38);
      }
    } catch (e) { console.warn('Audio failed', e); }
  }, []);

  // ── Spawn de burbuja ───────────────────────────────────────────────────────
  const spawnBubble = useCallback(() => {
    const s = stateRef.current;
    if (s.bubbles.length >= 8) return;

    idCounter.current += 1;
    const maxVal = Math.min(9, s.targetSum);
    const currentTotal = s.selectedItems.reduce((a, b) => a + b.value, 0);
    const needed = s.targetSum - currentTotal;

    let val = Math.floor(Math.random() * maxVal) + 1;
    if (needed > 0 && needed <= 9 && Math.random() < 0.35) val = needed;

    const bubble = {
      id: idCounter.current,
      value: val,
      x: 15 + Math.random() * 70,
      y: 108,
      baseX: 0,
      speed: 0.25 + Math.random() * 0.15 + s.targetIdx * 0.03, // faster at higher difficulty
      amplitude: 2 + Math.random() * 3,
      frequency: 0.02 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
      isSelected: false,
      errorTimer: 0,
    };
    bubble.baseX = bubble.x;
    s.bubbles.push(bubble);
  }, []);

  useEffect(() => {
    spawnTimer.current = setInterval(spawnBubble, 2200);
    return () => clearInterval(spawnTimer.current);
  }, [spawnBubble]);

  // ── Loop principal 60 FPS ─────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      const s     = stateRef.current;
      const sw    = window.innerWidth;
      const sh    = window.innerHeight;
      const gameH = sh - FOOTER_H; // área de juego real (sin footer)

      const { cursors = [], gestures = [] } = window.latestHandData || {};
      const cursor   = cursors[0];
      const gesture  = gestures[0];
      const isPinch  = !!gesture?.isPinching;

      // ── 1. Partículas ────────────────────────────────────────────────────
      s.particles = s.particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, alpha: p.alpha - p.decay }))
        .filter(p => p.alpha > 0);

      // ── 2. Mover burbujas ────────────────────────────────────────────────
      s.bubbles = s.bubbles.map(b => {
        const nb = { ...b };
        nb.y -= nb.speed;
        const elapsed = nb.phase + (108 - nb.y) * nb.frequency;
        nb.x = nb.baseX + Math.sin(elapsed) * nb.amplitude;
        nb.x = Math.max(8, Math.min(92, nb.x));
        if (nb.errorTimer > 0) nb.errorTimer--;
        return nb;
      }).filter(b => b.y > -12);

      // ── 3. Detección de pinza ─────────────────────────────────────────────
      // When pinch starts, mark as unhandled so we keep trying each frame
      // until we find a bubble or the pinch is released. This compensates
      // for the 30fps detection lag where the cursor position on the exact
      // first pinch frame may be slightly off.
      if (isPinch && !s.wasPinching) s.pinchHandled = false;  // new pinch
      if (!isPinch)                   s.pinchHandled = true;   // released
      s.wasPinching = isPinch;

      if (isPinch && !s.pinchHandled && cursor?.isVisible) {
        // Cursor está en píxeles de pantalla completa.
        // Burbujas están en % del área de juego → convertir a píxeles iguales.
        const cPx = cursor.x;
        const cPy = cursor.y; // cursor Y en px desde arriba de la ventana

        let hit = null;
        let hitDist = Infinity;
        s.bubbles.forEach(b => {
          const bPx = (b.x / 100) * sw;
          const bPy = (b.y / 100) * gameH; // burbuja en píxeles dentro del área de juego
          const dist = Math.hypot(cPx - bPx, cPy - bPy);
          if (dist < 100 && dist < hitDist) { hit = b; hitDist = dist; } // 100px radio
        });

        if (hit) {
          s.pinchHandled = true; // don't re-fire for this same pinch gesture
          if (hit.isSelected) {
            // Deseleccionar
            hit.isSelected = false;
            s.selectedItems = s.selectedItems.filter(i => i.id !== hit.id);
            playSound('deselect');
          } else {
            // Seleccionar
            hit.isSelected = true;
            s.selectedItems.push(hit);
            playSound('select', hit.value);

            // Partículas
            for (let k = 0; k < 8; k++) {
              s.particles.push({
                x: hit.x, y: hit.y,
                vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5,
                decay: 0.035, alpha: 1, color: '#A78BFA'
              });
            }

            const total = s.selectedItems.reduce((a, b) => a + b.value, 0);

            if (total === s.targetSum) {
              // ✅ Suma correcta
              playSound('match_ok');
              addPointsRef.current(50 + s.streak * 10);
              const numsLabel = s.selectedItems.map(i => i.value).join(' + ');
              showFeedbackRef.current(`¡Correcto! ${numsLabel} = ${s.targetSum}`, 'ok');
              s.streak++;

              // Explosión de burbujas seleccionadas
              s.selectedItems.forEach(item => {
                for (let k = 0; k < 12; k++) {
                  s.particles.push({
                    x: item.x, y: item.y,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                    decay: 0.02, alpha: 1, color: '#34D399'
                  });
                }
              });

              // Quitar burbujas seleccionadas
              const ids = new Set(s.selectedItems.map(i => i.id));
              s.bubbles = s.bubbles.filter(b => !ids.has(b.id));
              s.selectedItems = [];

              // Avanzar dificultad secuencialmente
              s.targetIdx = Math.min(s.targetIdx + 1, TARGET_SEQUENCE.length - 1);
              s.targetSum = TARGET_SEQUENCE[s.targetIdx];

            } else if (total > s.targetSum) {
              // ❌ Se pasó del límite
              playSound('overlimit');
              showFeedbackRef.current(`Suma: ${total} — necesitas exactamente ${s.targetSum}`, 'error');
              s.streak = 0;
              s.selectedItems.forEach(item => {
                const b = s.bubbles.find(b => b.id === item.id);
                if (b) { b.isSelected = false; b.errorTimer = 20; }
              });
              s.selectedItems = [];
            }
          }
        }
      }

      // ── 4. Sincronizar React (batched) ───────────────────────────────────
      setBubbles([...s.bubbles]);
      setTargetSum(s.targetSum);
      setStreak(s.streak);
      setCurrentSum(s.selectedItems.reduce((a, b) => a + b.value, 0));
      setSelectedNums(s.selectedItems.map(i => i.value));

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playSound]);

  return (
    <div className="w-full h-full relative overflow-hidden select-none">

      {/* Mute */}
      <button
        onClick={() => setSoundEnabled(p => !p)}
        className="absolute top-4 right-12 z-50 p-3 glass rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all"
      >
        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* Header compacto */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em]">Objetivo</span>
        <span className="text-2xl font-display font-black text-amber-400 italic">{targetSum}</span>
        <div className="w-px h-5 bg-white/20" />
        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Suma</span>
        <span className="text-2xl font-display font-black text-white">{currentSum}</span>
        {selectedNums.length > 0 && (
          <>
            <div className="w-px h-5 bg-white/20" />
            <span className="text-xs text-white/50 font-mono">{selectedNums.join(' + ')}</span>
          </>
        )}
        <AnimatePresence>
          {streak > 1 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="flex items-center gap-1 text-amber-400 font-black text-[10px] ml-2"
            >
              <Sparkles size={11} fill="currentColor" /> ×{streak}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Burbujas */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {bubbles.map(b => (
          <div key={b.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: `translate(-50%, -50%) ${b.errorTimer > 0 ? `translateX(${Math.sin(b.errorTimer * 1.8) * 5}px)` : ''}`,
            }}
          >
            <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center font-display text-3xl font-black italic shadow-xl transition-all duration-150 ${
              b.isSelected
                ? 'bg-purple-500/80 border-white text-white shadow-[0_0_30px_#a78bfa]'
                : b.errorTimer > 0
                  ? 'bg-red-500/30 border-red-500 text-red-400'
                  : 'bg-cyan-500/15 border-cyan-500/40 text-white backdrop-blur-md'
            }`}>
              {b.value}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            key={feedbackMsg.text}
            initial={{ opacity: 0, y: 14, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={`absolute bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl border whitespace-nowrap pointer-events-none ${
              feedbackMsg.type === 'error'
                ? 'bg-red-500/20 border-red-400/30 text-red-300'
                : feedbackMsg.type === 'hint'
                ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
            }`}
          >
            {feedbackMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instrucción */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 glass px-7 py-3 rounded-2xl border border-white/10 animate-pulse">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 italic text-center">
          Pinza sobre los números para seleccionarlos — suma exactamente {targetSum}
        </p>
      </div>
    </div>
  );
});

export default MathAbacusModule;
