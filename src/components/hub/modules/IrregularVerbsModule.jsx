import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Volume2, VolumeX, RefreshCw, Heart, Sparkles } from 'lucide-react';
import HandButton from '../HandButton';
import LifeLostOverlay from '../LifeLostOverlay';
import GameInstruction from '../GameInstruction';
import { addLocalLog } from '../../../services/sync';

const VERBS = [
  { base: 'GO',      past: 'WENT',    participle: 'GONE',       translation: 'Ir',        distractors: ['GOED', 'WENTED', 'GOING', 'GONES'] },
  { base: 'BUY',     past: 'BOUGHT',  participle: 'BOUGHT',     translation: 'Comprar',   distractors: ['BUYED', 'BOUGHTEN', 'BUYS', 'BUYING'] },
  { base: 'EAT',     past: 'ATE',     participle: 'EATEN',      translation: 'Comer',     distractors: ['EATED', 'ATEEN', 'EATS', 'EATING'] },
  { base: 'SING',    past: 'SANG',    participle: 'SUNG',       translation: 'Cantar',    distractors: ['SINGED', 'SONG', 'SINGS', 'SUNGED'] },
  { base: 'RUN',     past: 'RAN',     participle: 'RUN',        translation: 'Correr',    distractors: ['RUNNED', 'RUNS', 'RANNED', 'RUNNING'] },
  { base: 'WRITE',   past: 'WROTE',   participle: 'WRITTEN',    translation: 'Escribir',  distractors: ['WRITED', 'WRITTED', 'WRITES', 'WRITING'] },
  { base: 'SEE',     past: 'SAW',     participle: 'SEEN',       translation: 'Ver',       distractors: ['SEED', 'SAWED', 'SEES', 'SEEING'] },
  { base: 'TAKE',    past: 'TOOK',    participle: 'TAKEN',      translation: 'Tomar/Llevar', distractors: ['TAKED', 'TOOKEN', 'TAKES', 'TAKING'] },
  { base: 'SPEAK',   past: 'SPOKE',   participle: 'SPOKEN',     translation: 'Hablar',    distractors: ['SPEAKED', 'SPOKENED', 'SPOKES', 'SPEAKING'] },
  { base: 'DO',      past: 'DID',     participle: 'DONE',       translation: 'Hacer',     distractors: ['DOED', 'DONEED', 'DOES', 'DOING'] }
];

const isCloseToSlot = (bubblePx, bubblePy, el) => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const targetPx = rect.left + rect.width / 2;
  const targetPy = rect.top + rect.height / 2;
  const dist = Math.hypot(bubblePx - targetPx, bubblePy - targetPy);
  if (dist < 110) return true;
  
  const pad = 20;
  if (
    bubblePx >= rect.left - pad &&
    bubblePx <= rect.right + pad &&
    bubblePy >= rect.top - pad &&
    bubblePy <= rect.bottom + pad
  ) {
    return true;
  }
  return false;
};

const IrregularVerbsModule = memo(({ addPoints, lang = 'es' }) => {
  const [gameState, setGameState] = useState('PLAYING'); // PLAYING, GAMEOVER, WON
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [verbIndex, setVerbIndex] = useState(0);
  
  // Estado de las cajas destino en React
  const [pastSlot, setPastSlot] = useState(null);
  const [participleSlot, setParticipleSlot] = useState(null);

  const [bubbles, setBubbles] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lifeFlash, setLifeFlash] = useState(0);
  const [showWonEffect, setShowWonEffect] = useState(false);

  const audioCtxRef = useRef(null);
  const frameRef = useRef(null);
  const bubbleIdCounter = useRef(0);
  const gameStartTimeRef = useRef(Date.now());

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  const currentVerb = VERBS[verbIndex];

  // ── 1. Referencia de estado de físicas ──
  const stateRef = useRef({
    bubbles: [],
    dragging: {}, // { handIdx: bubbleId }
    pastSlot: null,
    participleSlot: null,
    lives: 3,
    score: 0,
    verbIdx: 0,
    gameState: 'PLAYING',
    isLevelCompleting: false,
    particles: []
  });

  const particleCanvasRef = useRef(null);
  const lastScore = useRef(-1);
  const lastLives = useRef(-1);
  const lastGameState = useRef('');
  const lastPastSlot = useRef(undefined);
  const lastParticipleSlot = useRef(undefined);
  const lastBubblesLengthRef = useRef(-1);

  // Sincronizar estados locales de React con los de físicas
  const syncReactStates = useCallback(() => {
    const s = stateRef.current;
    setBubbles([...s.bubbles]);
    if (s.pastSlot !== lastPastSlot.current) {
      setPastSlot(s.pastSlot);
      lastPastSlot.current = s.pastSlot;
    }
    if (s.participleSlot !== lastParticipleSlot.current) {
      setParticipleSlot(s.participleSlot);
      lastParticipleSlot.current = s.participleSlot;
    }
    if (s.lives !== lastLives.current) {
      setLives(s.lives);
      lastLives.current = s.lives;
    }
    if (s.score !== lastScore.current) {
      setScore(s.score);
      lastScore.current = s.score;
    }
    if (s.gameState !== lastGameState.current) {
      setGameState(s.gameState);
      lastGameState.current = s.gameState;
    }
  }, []);

  // ── 2. Síntesis de Voz (Pronunciación forzada en inglés) ──
  const speakVerb = useCallback((base, past, participle) => {
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return;
    try {
      window.speechSynthesis.cancel();

      const doSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        // Buscar voz en inglés (preferir en-US, luego en-GB, luego cualquier en-*)
        const enVoice =
          voices.find(v => v.lang === 'en-US') ||
          voices.find(v => v.lang === 'en-GB') ||
          voices.find(v => v && typeof v.lang === 'string' && v.lang.startsWith('en'));

        const text = `${base}... ${past}... ${participle}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.82; // Un poco lento para fines didácticos
        if (enVoice) utterance.voice = enVoice;
        window.speechSynthesis.speak(utterance);
      };

      // Las voces pueden no estar cargadas aun al inicio
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeak();
      } else {
        // Esperar a que carguen las voces (ocurre en Chrome/Electron al arrancar)
        window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
        // Fallback si el evento no llega en 1s
        setTimeout(doSpeak, 1000);
      }
    } catch (err) {
      console.warn('SpeechSynthesis failed:', err.message);
    }
  }, []);

  // ── 3. Efectos de Sonido Sintetizados ──
  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'snap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.27);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc.start(); osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn('Audio failed', e);
    }
  }, [soundEnabled]);

  // ── 4. Partículas al clasificar ──
  const spawnParticles = (x, y, color) => {
    const s = stateRef.current;
    const newParticles = Array.from({ length: 15 }, () => ({
      id: Math.random(),
      x: x, y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: -3 - Math.random() * 6,
      gravity: 0.12,
      decay: 0.03,
      alpha: 1.0,
      color: color
    }));
    s.particles.push(...newParticles);
  };

  // ── 5. Velocidad incremental según dificultad ──
  const getBubbleSpeed = () => {
    // Aumenta 0.05% de velocidad por cada nivel completado
    return Math.min(0.28 + stateRef.current.verbIdx * 0.04, 0.65);
  };

  // ── 6. Cargar Verbo e inicializar burbujas ──
  const initLevel = useCallback((idx) => {
    const s = stateRef.current;
    s.verbIdx = idx;
    s.pastSlot = null;
    s.participleSlot = null;
    s.isLevelCompleting = false;
    s.dragging = {};
    
    setVerbIndex(idx);
    setPastSlot(null);
    setParticipleSlot(null);
    setShowWonEffect(false);

    // Generar opciones: pasado, participio, y 3 distractores
    const verb = VERBS[idx];
    const correctAnswers = [verb.past, verb.participle];
    
    // distractores aleatorios
    const dists = [...verb.distractors]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const pool = [...correctAnswers, ...dists].sort(() => 0.5 - Math.random());
    
    // Crear burbujas en pantalla flotando y rebotando en todas direcciones
    bubbleIdCounter.current = 0;
    s.bubbles = pool.map((text, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speedScale = 0.05 + Math.random() * 0.08;
      return {
        id: ++bubbleIdCounter.current,
        text: text,
        x: 15 + (i * 15) + Math.random() * 5, // distribuir horizontalmente
        y: 20 + Math.random() * 45,           // iniciar en cualquier parte de la pantalla (20% a 65%)
        vy: Math.sin(angle) * speedScale,
        vx: Math.cos(angle) * speedScale,
        speed: getBubbleSpeed(),
        isGrabbed: false,
        grabbedBy: null,
        pulse: 1.0
      };
    });

    setBubbles([...s.bubbles]);
    addLocalLog('GAME_LEVEL_START', `Nivel de verbo irregular: ${verb.base} (${verb.translation})`);
  }, []);

  useEffect(() => {
    initLevel(0);
  }, [initLevel]);

  // ── 7. Loop de físicas y gestos (requestAnimationFrame) ──
  useEffect(() => {
    const updateLoop = () => {
      const s = stateRef.current;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      // Animación de partículas
      s.particles = s.particles
        .map(p => ({
          ...p,
          x: p.x + (p.vx / screenW) * 100,
          y: p.y + (p.vy / screenH) * 100,
          vy: p.vy + p.gravity,
          alpha: p.alpha - p.decay
        }))
        .filter(p => p.alpha > 0);

      // Dibujar partículas en el Canvas
      const canvas = particleCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (canvas.width !== screenW || canvas.height !== screenH) {
          canvas.width = screenW;
          canvas.height = screenH;
        }
        ctx.clearRect(0, 0, screenW, screenH);
        s.particles.forEach(p => {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          const px = (p.x / 100) * screenW;
          const py = (p.y / 100) * screenH;
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }


      if (s.gameState !== 'PLAYING' || s.isLevelCompleting) {
        frameRef.current = requestAnimationFrame(updateLoop);
        return;
      }

      const handData = window.latestHandData || { cursors: [], gestures: [] };
      const cursors = handData.cursors || [];
      const gestures = handData.gestures || [];

      const mappedCursors = cursors.map(c => ({
        x: (c.x / screenW) * 100,
        y: (c.y / screenH) * 100,
        isVisible: c.isVisible
      }));

      const verb = VERBS[s.verbIdx];

      // A. Mover y verificar snap de burbujas
      const nextBubbles = s.bubbles.map(b => {
        const bCopy = { ...b };

        if (bCopy.isGrabbed && bCopy.grabbedBy !== null) {
          const cursor = mappedCursors[bCopy.grabbedBy];
          if (cursor && cursor.isVisible) {
            bCopy.x = cursor.x;
            bCopy.y = cursor.y;
            bCopy.pulse = 1.15;

            // Snap while dragging (snap-on-hover)
            const pastEl = document.getElementById('verbs-slot-past');
            const participleEl = document.getElementById('verbs-slot-participle');
            const bubblePx = (bCopy.x / 100) * screenW;
            const bubblePy = (bCopy.y / 100) * screenH;
            
            const isCorrectForPast = (bCopy.text === verb.past);
            const isCorrectForParticiple = (bCopy.text === verb.participle);
            
            const touchPast = pastEl && isCloseToSlot(bubblePx, bubblePy, pastEl);
            const touchPart = participleEl && isCloseToSlot(bubblePx, bubblePy, participleEl);

            let snapped = false;

            // 1. Check Past Slot
            if (touchPast) {
              if (!isCorrectForPast) {
                // Touched incorrect slot
                if (!bCopy.touchingPastState) {
                  bCopy.touchingPastState = true;
                  triggerErrorPenalty(bCopy);
                }
              } else {
                // Correct for Past, but can only snap if NOT touching the incorrect slot (Participle)
                if (s.pastSlot === null && !touchPart) {
                  s.pastSlot = bCopy.text;
                  playSound('snap');
                  spawnParticles(bCopy.x, bCopy.y, '#10B981');
                  addPointsRef.current(10);
                  s.score += 10;
                  bCopy.shouldRemove = true;
                  delete s.dragging[bCopy.grabbedBy];
                  snapped = true;
                }
              }
            } else {
              bCopy.touchingPastState = false;
            }

            // 2. Check Participle Slot
            if (!snapped && touchPart) {
              if (!isCorrectForParticiple) {
                // Touched incorrect slot
                if (!bCopy.touchingParticipleState) {
                  bCopy.touchingParticipleState = true;
                  triggerErrorPenalty(bCopy);
                }
              } else {
                // Correct for Participle, but can only snap if NOT touching the incorrect slot (Past)
                if (s.participleSlot === null && !touchPast) {
                  s.participleSlot = bCopy.text;
                  playSound('snap');
                  spawnParticles(bCopy.x, bCopy.y, '#10B981');
                  addPointsRef.current(10);
                  s.score += 10;
                  bCopy.shouldRemove = true;
                  delete s.dragging[bCopy.grabbedBy];
                  snapped = true;
                }
              }
            } else {
              bCopy.touchingParticipleState = false;
            }
          } else {
            // Soltado forzado por pérdida de tracking
            bCopy.isGrabbed = false;
            bCopy.grabbedBy = null;
            bCopy.pulse = 1.0;
            delete s.dragging[bCopy.grabbedBy];
          }
        } else {
          // Flotar y derivar en ambas direcciones
          bCopy.y += bCopy.vy * bCopy.speed * 4;
          bCopy.x += bCopy.vx * bCopy.speed * 4;
          bCopy.pulse = 1.0;

          // Rebotar en los bordes laterales (10% - 90%)
          if (bCopy.x < 10) { bCopy.x = 10; bCopy.vx *= -1; }
          if (bCopy.x > 90) { bCopy.x = 90; bCopy.vx *= -1; }

          // Rebotar en los bordes vertical (10% - 82% para no chocar con header/footer)
          if (bCopy.y < 10) { bCopy.y = 10; bCopy.vy *= -1; }
          if (bCopy.y > 82) { bCopy.y = 82; bCopy.vy *= -1; }
        }
        return bCopy;
      });

      s.bubbles = nextBubbles;

      // B. Procesar gestos de Arrastrar (Pinch) y Soltar (Drop)
      mappedCursors.forEach((cursor, handIdx) => {
        if (!cursor.isVisible) return;

        const isPinching = gestures[handIdx]?.isPinching;
        const grabbedId = s.dragging[handIdx];

        if (isPinching) {
          // Si no está arrastrando nada, buscar la burbuja más cercana
          if (grabbedId === undefined) {
            let closest = null;
            let minDist = 8; // rango de detección
            s.bubbles.forEach(b => {
              if (b.isGrabbed) return;
              const dist = Math.hypot(b.x - cursor.x, b.y - cursor.y);
              if (dist < minDist) {
                minDist = dist;
                closest = b;
              }
            });

            if (closest) {
              closest.isGrabbed = true;
              closest.grabbedBy = handIdx;
              s.dragging[handIdx] = closest.id;
            }
          }
        } else {
          // Soltar la burbuja arrastrada y verificar SNAP
          if (grabbedId !== undefined) {
            const bIdx = s.bubbles.findIndex(b => b.id === grabbedId);
            if (bIdx !== -1) {
              const bubble = s.bubbles[bIdx];
              bubble.isGrabbed = false;
              bubble.grabbedBy = null;
              bubble.pulse = 1.0;
              
              // Reset standard hover touch flags
              bubble.touchingPastState = false;
              bubble.touchingParticipleState = false;

              let actionResolved = false;

              // Obtener elementos de los slots para hit test
              const pastEl = document.getElementById('verbs-slot-past');
              const participleEl = document.getElementById('verbs-slot-participle');

              const screenW = window.innerWidth;
              const screenH = window.innerHeight;
              const bubblePx = (bubble.x / 100) * screenW;
              const bubblePy = (bubble.y / 100) * screenH;

              const touchPast = pastEl && isCloseToSlot(bubblePx, bubblePy, pastEl);
              const touchPart = participleEl && isCloseToSlot(bubblePx, bubblePy, participleEl);

              // 1. Verificar colisión con Past Slot
              if (touchPast) {
                if (bubble.text === verb.past) {
                  // Correcto, can only snap if NOT touching Participle slot
                  if (s.pastSlot === null && !touchPart) {
                    actionResolved = true;
                    s.pastSlot = bubble.text;
                    playSound('snap');
                    spawnParticles(bubble.x, bubble.y, '#10B981');
                    addPointsRef.current(10);
                    s.score += 10;
                    bubble.shouldRemove = true;
                  }
                }
              }

              // 2. Verificar colisión con Participle Slot (si no se resolvió en Past)
              if (!actionResolved && touchPart) {
                if (bubble.text === verb.participle) {
                  // Correcto, can only snap if NOT touching Past slot
                  if (s.participleSlot === null && !touchPast) {
                    actionResolved = true;
                    s.participleSlot = bubble.text;
                    playSound('snap');
                    spawnParticles(bubble.x, bubble.y, '#10B981');
                    addPointsRef.current(10);
                    s.score += 10;
                    bubble.shouldRemove = true;
                  }
                }
              }
            }
            delete s.dragging[handIdx];
          }
        }
      });

      // Filtrar burbujas resueltas
      s.bubbles = s.bubbles.filter(b => !b.shouldRemove);

      // C. Verificar si se completó el nivel
      if (s.pastSlot !== null && s.participleSlot !== null && !s.isLevelCompleting) {
        s.isLevelCompleting = true;
        
        // Pronunciar verbos al completar
        speakVerb(verb.base, verb.past, verb.participle);

        // Disparar efecto visual de éxito
        setShowWonEffect(true);
        playSound('win');

        setTimeout(() => {
          setShowWonEffect(false);
          const nextIdx = s.verbIdx + 1;
          if (nextIdx < VERBS.length) {
            initLevel(nextIdx);
          } else {
            // Juego completado
            s.gameState = 'WON';
          }
          syncReactStates();
        }, 3200); // Dar tiempo a que termine de hablar y mostrar la animación
      }

      syncReactStates();
      frameRef.current = requestAnimationFrame(updateLoop);
    };

    // Función auxiliar para aplicar la penalización ante errores
    const triggerErrorPenalty = (bubble) => {
      const s = stateRef.current;
      playSound('error');
      spawnParticles(bubble.x, bubble.y, '#EF4444');
      
      // Rebota de vuelta si no está agarrada
      if (!bubble.isGrabbed) {
        bubble.vx *= -1.5;
        bubble.vy *= -1.5;
      }

      // Penalizar puntos (-10)
      s.score = Math.max(0, s.score - 10);
      addPointsRef.current(-10);

      // Restar vida
      s.lives = Math.max(0, s.lives - 1);
      setLifeFlash(f => f + 1);

      if (s.lives <= 0) {
        s.gameState = 'GAMEOVER';
      }
    };

    frameRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [initLevel, playSound, speakVerb, syncReactStates, soundEnabled]);

  const resetGame = () => {
    const s = stateRef.current;
    s.score = 0;
    s.lives = 3;
    s.gameState = 'PLAYING';
    s.verbIdx = 0;
    s.pastSlot = null;
    s.participleSlot = null;
    s.isLevelCompleting = false;
    
    setLifeFlash(0);
    initLevel(0);
    syncReactStates();
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col items-center justify-center">
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(prev => !prev)}
        className="absolute top-4 right-12 z-50 p-4 glass rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all hover:scale-105"
      >
        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {/* Vidas y Score en cabecera */}
      <div className="absolute top-[12%] left-0 right-0 px-12 flex justify-between items-center z-10">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              size={24}
              fill={i < lives ? '#EF4444' : 'transparent'}
              className={`transition-colors duration-300 ${i < lives ? 'text-red-500 animate-pulse' : 'text-white/20'}`}
            />
          ))}
        </div>
        <div className="glass px-6 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2 bg-black/30">
          <Trophy size={18} className="text-amber-400" />
          <span className="font-display font-black text-amber-400 italic">{score} <span className="text-[10px] text-white/40 not-italic ml-1">PTS</span></span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'PLAYING' && (
          <motion.div
            key={verbIndex}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-2xl px-6 flex flex-col items-center gap-10"
          >
            {/* Panel Principal del Verbo */}
            <div className="glass-dark w-full p-8 rounded-[40px] border border-white/10 shadow-2xl flex flex-col items-center gap-6 bg-black/60 relative overflow-hidden">
              {showWonEffect && (
                <div className="absolute inset-0 bg-green-500/15 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30">
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: [0.5, 1.2, 1] }} className="flex flex-col items-center gap-3 text-green-400 font-display font-black italic text-4xl">
                    <Sparkles size={54} className="animate-spin-slow" />
                    <span>{currentVerb.base}</span>
                    <span className="text-2xl text-white">{currentVerb.past} · {currentVerb.participle}</span>
                  </motion.div>
                </div>
              )}

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] italic">
                  {lang === 'es' ? 'Verbos Irregulares' : 'Irregular Verbs'}
                </span>
                <span className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">
                  {verbIndex + 1} / {VERBS.length}
                </span>
              </div>

              {/* Verbo en infinitivo y traducción */}
              <div className="text-center space-y-2 mt-2">
                <h2 className="text-5xl md:text-6xl font-display font-black italic uppercase tracking-wider text-gradient">
                  {currentVerb.base}
                </h2>
                <p className="text-white/40 font-black uppercase tracking-[0.2em] text-xs">
                  {lang === 'es' ? 'Significado:' : 'Meaning:'} <span className="text-white/60">{currentVerb.translation}</span>
                </p>
              </div>

              {/* Bloques de respuesta / Slots de arrastre */}
              <div className="grid grid-cols-2 gap-6 w-full mt-4">
                {/* Slot Past */}
                <div 
                  id="verbs-slot-past" 
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 min-h-24 ${
                    pastSlot 
                      ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                      : 'bg-white/5 border-dashed border-white/20'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Past Simple</span>
                  <span className={`text-xl font-display font-black italic tracking-wide ${pastSlot ? 'text-green-400' : 'text-white/10'}`}>
                    {pastSlot ? pastSlot : (lang === 'es' ? '[ COLOCAR AQUÍ ]' : '[ DROP HERE ]')}
                  </span>
                </div>
                {/* Slot Participle */}
                <div 
                  id="verbs-slot-participle" 
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 min-h-24 ${
                    participleSlot 
                      ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                      : 'bg-white/5 border-dashed border-white/20'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Past Participle</span>
                  <span className={`text-xl font-display font-black italic tracking-wide ${participleSlot ? 'text-green-400' : 'text-white/10'}`}>
                    {participleSlot ? participleSlot : (lang === 'es' ? '[ COLOCAR AQUÍ ]' : '[ DROP HERE ]')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PANTALLA GAME OVER */}
        {gameState === 'GAMEOVER' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="mb-6 text-6xl animate-bounce">📚💀</div>
            <h2 className="text-5xl font-display font-black text-gradient uppercase italic tracking-tighter mb-2">
              {lang === 'es' ? 'Fin de Partida' : 'Game Over'}
            </h2>
            <p className="text-white/60 font-black uppercase tracking-[0.2em] text-xs mb-8">
              {lang === 'es' ? `Tu puntaje final es: ${score} Puntos` : `Your final score is: ${score} Points`}
            </p>
            <HandButton onClick={resetGame} className="px-12 py-5 text-xs max-w-xs w-full" variant="emerald" dwellMs={800}>
              <RefreshCw size={14} className="mr-2" /> {lang === 'es' ? 'VOLVER A INTENTAR' : 'TRY AGAIN'}
            </HandButton>
          </motion.div>
        )}

        {/* PANTALLA JUEGO GANADO */}
        {gameState === 'WON' && (
          <motion.div
            key="won"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="mb-6 text-7xl animate-pulse">🏆🎓</div>
            <h2 className="text-5xl font-display font-black text-gradient uppercase italic tracking-tighter mb-2">
              {lang === 'es' ? '¡Increíble!' : 'Well Done!'}
            </h2>
            <p className="text-white/60 font-black uppercase tracking-[0.2em] text-xs mb-8">
              {lang === 'es' ? `Has completado todos los verbos irregulares con ${score} puntos.` : `You completed all irregular verbs with ${score} points.`}
            </p>
            <HandButton onClick={resetGame} className="px-12 py-5 text-xs max-w-xs w-full" variant="emerald" dwellMs={800}>
              <RefreshCw size={14} className="mr-2" /> {lang === 'es' ? 'JUGAR DE NUEVO' : 'PLAY AGAIN'}
            </HandButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Renderizado de las burbujas flotantes */}
      {gameState === 'PLAYING' && !showWonEffect && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {bubbles.map(b => (
            <div
              id={`verb-bubble-${b.id}`}
              key={b.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-shadow"
              style={{ 
                left: `${b.x}%`, 
                top: `${b.y}%`, 
                scale: b.pulse,
                pointerEvents: 'none'
              }}
            >
              <div 
                className={`bubble-inner w-28 h-20 rounded-[28px] border-2 flex items-center justify-center shadow-xl transition-all duration-200 bg-black/75 ${
                  b.isGrabbed 
                    ? 'border-white bg-white/10 shadow-[0_0_35px_rgba(255,255,255,0.4)] ring-4 ring-white/10'
                    : 'border-cyan-500/40 text-cyan-200'
                }`}
              >
                <span className="font-display text-base font-black italic tracking-wider uppercase">
                  {b.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Renderizado de partículas de éxito/error */}
      <canvas ref={particleCanvasRef} className="absolute inset-0 pointer-events-none z-30" />

      {/* Instrucciones flotantes neón */}
      {gameState === 'PLAYING' && (
        <GameInstruction
          lang={lang}
          messageEs="Pellizca el verbo correcto, arrástralo y suéltalo sobre su caja correspondiente"
          messageEn="Pinch the correct verb, drag and drop it into its matching box"
          icon="🤏"
        />
      )}

      {/* Feedback visual de pérdida de vidas */}
      <LifeLostOverlay trigger={lifeFlash} />
    </div>
  );
});

export default IrregularVerbsModule;
