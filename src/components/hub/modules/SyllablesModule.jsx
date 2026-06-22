import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Volume2, VolumeX, Languages } from 'lucide-react';
import HandButton from '../HandButton';
import GameInstruction from '../GameInstruction';
import { addLocalLog } from '../../../services/sync';

const WORDS_ES = [
  { word: 'GATO',    syllables: ['GA',  'TO']        },
  { word: 'PATO',    syllables: ['PA',  'TO']        },
  { word: 'MANO',    syllables: ['MA',  'NO']        },
  { word: 'LUNA',    syllables: ['LU',  'NA']        },
  { word: 'CASA',    syllables: ['CA',  'SA']        },
  { word: 'PERRO',   syllables: ['PE',  'RRO']       },
  { word: 'LÁPIZ',   syllables: ['LÁ',  'PIZ']       },
  { word: 'REGALO',  syllables: ['RE',  'GA',  'LO'] },
  { word: 'PLANETA', syllables: ['PLA', 'NE',  'TA'] },
  { word: 'PLÁTANO', syllables: ['PLÁ', 'TA',  'NO'] },
  { word: 'MANZANA', syllables: ['MAN', 'ZA',  'NA'] },
  { word: 'ESTRELLA',syllables: ['ES',  'TRE', 'LLA']},
];

const WORDS_EN = [
  { word: 'RABBIT',   syllables: ['RAB',  'BIT']        },
  { word: 'WINDOW',   syllables: ['WIN',  'DOW']        },
  { word: 'FLOWER',   syllables: ['FLOW', 'ER']         },
  { word: 'PENCIL',   syllables: ['PEN',  'CIL']        },
  { word: 'TIGER',    syllables: ['TI',   'GER']        },
  { word: 'BUTTER',   syllables: ['BUT',  'TER']        },
  { word: 'MONKEY',   syllables: ['MON',  'KEY']        },
  { word: 'MUSIC',    syllables: ['MU',   'SIC']        },
  { word: 'UMBRELLA', syllables: ['UM',   'BREL', 'LA'] },
  { word: 'TOGETHER', syllables: ['TO',   'GETH', 'ER'] },
  { word: 'REMEMBER', syllables: ['RE',   'MEM',  'BER']},
  { word: 'COMPUTER', syllables: ['COM',  'PU',   'TER']},
];

const DISTRACTORS_ES = [
  'MA', 'PA', 'LU', 'CA', 'PE', 'TA', 'BA', 'ZO',
  'LI', 'CO', 'RU', 'SA', 'TE', 'BO', 'FI', 'NO',
  'MI', 'DE', 'SU', 'JA', 'ME', 'NE', 'TI', 'PO',
];
const DISTRACTORS_EN = [
  'BIT', 'CAT', 'DOG', 'RUN', 'FUN', 'WIN', 'SUN', 'HOP',
  'DAY', 'WAY', 'PAY', 'GAP', 'HAT', 'MAT', 'FLY', 'SKY',
  'MAN', 'PAN', 'COT', 'HOT', 'FIT', 'PET', 'SET', 'CUT',
];

const SyllablesModule = memo(({ addPoints, lang = 'es' }) => {

  const WORDS       = lang === 'es' ? WORDS_ES : WORDS_EN;
  const DISTRACTORS = lang === 'es' ? DISTRACTORS_ES : DISTRACTORS_EN;

  const usedSetRef        = useRef(new Set());
  const wordCursorRef     = useRef(0);
  const wordsCompletedRef = useRef(0);

  const pickNextIndex = useCallback(() => {
    const bank = lang === 'es' ? WORDS_ES : WORDS_EN;
    if (usedSetRef.current.size >= bank.length) {
      usedSetRef.current = new Set();
    }
    for (let i = 0; i < bank.length; i++) {
      const idx = (wordCursorRef.current + i) % bank.length;
      if (!usedSetRef.current.has(idx)) {
        usedSetRef.current.add(idx);
        wordCursorRef.current = (idx + 1) % bank.length;
        return idx;
      }
    }
    return 0;
  }, [lang]);

  const [wordIndex, setWordIndex] = useState(() => {
    usedSetRef.current.add(0);
    wordCursorRef.current = 1;
    return 0;
  });

  // Reset to first word whenever language changes
  useEffect(() => {
    const s = stateRef.current;
    wordCursorRef.current = 1;
    setWordIndex(0);
    setSlots(WORDS[0].syllables.map(() => null));
    setBubbles([]);
    setIsWordWon(false);
    s.particles = [];
    s.wordIdx = 0; s.slots = WORDS[0].syllables.map(() => null);
    s.bubbles = []; s.dragging = {}; s.isWordWon = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const currentWord = WORDS[Math.min(wordIndex, WORDS.length - 1)] || WORDS[0];

  const [slots, setSlots]               = useState(() => Array(currentWord.syllables.length).fill(null));
  const [bubbles, setBubbles]           = useState([]);
  const [streak, setStreak]             = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWordWon, setIsWordWon]       = useState(false);
  const [feedbackMsg, setFeedbackMsg]   = useState(null); // { text, type: 'ok'|'hint'|'error' }

  const particleCanvasRef = useRef(null);
  const lastBubblesLengthRef = useRef(-1);

  const audioCtxRef     = useRef(null);
  const frameRef        = useRef(null);
  const spawnTimerRef   = useRef(null);
  const bubbleIdCounter = useRef(0);

  // Authoritative physics state — never read from React state inside the RAF loop.
  const stateRef = useRef({
    bubbles:   [],
    dragging:  {},
    slots:     Array(currentWord.syllables.length).fill(null),
    wordIdx:   wordIndex,
    isWordWon: false,
    particles: []
  });

  const addPointsRef    = useRef(addPoints);
  addPointsRef.current  = addPoints;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  // Always-current word bank (used inside stable [] RAF callbacks)
  const wordBankRef = useRef({ words: WORDS_ES, distractors: DISTRACTORS_ES });
  wordBankRef.current = { words: WORDS, distractors: DISTRACTORS };

  // Track current language for use inside stable RAF loop
  const langRef = useRef(lang);
  langRef.current = lang;

  // Feedback toast (safe to call from RAF via ref)
  const feedbackTimerRef = useRef(null);
  const showFeedback = useCallback((text, type = 'ok') => {
    clearTimeout(feedbackTimerRef.current);
    setFeedbackMsg({ text, type });
    feedbackTimerRef.current = setTimeout(() => setFeedbackMsg(null), 2200);
  }, []);
  const showFeedbackRef = useRef(showFeedback);
  showFeedbackRef.current = showFeedback;

  // Sync stateRef when the active word changes
  useEffect(() => {
    const s    = stateRef.current;
    const bank = wordBankRef.current.words;
    s.wordIdx   = wordIndex;
    s.slots     = Array(bank[wordIndex]?.syllables.length ?? 2).fill(null);
    s.isWordWon = false;
    s.bubbles   = [];
    s.dragging  = {};
  }, [wordIndex]);

  // ── Audio ──────────────────────────────────────────────────────────────────
  const playSound = useCallback((type) => {
    if (!soundEnabledRef.current) return;
    try {
      if (!audioCtxRef.current)
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc      = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'snap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.12);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(); osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'win') {
        const now   = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0, now + i * 0.08);
          g.gain.linearRampToValueAtTime(0.25, now + i * 0.08 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
          o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.35);
        });
      } else if (type === 'error') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(); osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) { console.warn('Sound synthesis failed', e); }
  }, []);

  // ── Win particles ─────────────────────────────────────────────────────────
  const spawnWinParticles = useCallback(() => {
    const s = stateRef.current;
    const colors = ['#A78BFA', '#06B6D4', '#EC4899', '#10B981', '#F59E0B'];
    s.particles = Array.from({ length: 40 }, () => ({
      id:       Math.random(),
      x:        50 + (Math.random() - 0.5) * 40,
      y:        80 + (Math.random() - 0.5) * 15,
      vx:       (Math.random() - 0.5) * 12,
      vy:       -5 - Math.random() * 12,
      color:    colors[Math.floor(Math.random() * colors.length)],
      size:     10 + Math.random() * 20,
      rotation: Math.random() * 360,
      spin:     (Math.random() - 0.5) * 15,
    }));
  }, []);

  // ── Load next word (sequential, no-repeat) ────────────────────────────────
  const initWord = useCallback(() => {
    const nextIdx = pickNextIndex();
    const s       = stateRef.current;
    const bank    = wordBankRef.current.words;
    s.wordIdx   = nextIdx;
    s.slots     = Array(bank[nextIdx]?.syllables.length ?? 2).fill(null);
    s.bubbles   = [];
    s.dragging  = {};
    s.isWordWon = false;

    setWordIndex(nextIdx);
    setSlots(s.slots);
    setBubbles([]);
    setIsWordWon(false);
    s.particles = [];
  }, [pickNextIndex]);

  // ── Progressive bubble speed ───────────────────────────────────────────────
  // Starts at 0.35 %/frame, gains 0.025 per word completed (capped at 0.80).
  const getBubbleSpeed = () =>
    Math.min(0.35 + wordsCompletedRef.current * 0.025, 0.80);

  // ── Spawn bubble ──────────────────────────────────────────────────────────
  const spawnBubble = useCallback(() => {
    const s    = stateRef.current;
    if (s.isWordWon) return;

    const { words, distractors } = wordBankRef.current;
    const word             = words[s.wordIdx];
    if (!word) return;
    const missingSyllables = word.syllables.filter((_, i) => s.slots[i] === null);
    if (missingSyllables.length === 0) return;

    const isTarget     = Math.random() < 0.65;
    const syllableText = isTarget
      ? missingSyllables[Math.floor(Math.random() * missingSyllables.length)]
      : distractors[Math.floor(Math.random() * distractors.length)];

    bubbleIdCounter.current += 1;
    s.bubbles.push({
      id:        bubbleIdCounter.current,
      text:      syllableText,
      x:         15 + Math.random() * 70,
      y:         -10,
      speed:     getBubbleSpeed() + Math.random() * 0.1,
      isGrabbed: false,
      grabbedBy: null,
      pulse:     1.0,
    });
    setBubbles([...s.bubbles]);
  }, []); // stable; reads stateRef & wordsCompletedRef inside

  // Periodic spawn
  useEffect(() => {
    spawnTimerRef.current = setInterval(() => {
      const s = stateRef.current;
      if (s.bubbles.length < 8 && !s.isWordWon) spawnBubble();
    }, 2200);
    return () => clearInterval(spawnTimerRef.current);
  }, [spawnBubble]);

  // Monitor unhandled runtime errors
  useEffect(() => {
    const handleError = (e) => {
      try {
        const msg = e.message || (e.error && e.error.message) || String(e);
        const stack = (e.error && e.error.stack) || '';
        addLocalLog('MODULE_CRASH_RAW', `Error de runtime en Sílabas: ${msg}\nStack: ${stack}`);
      } catch (err) {
        console.error('Error logging syllables runtime error:', err);
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // ── Main physics loop ─────────────────────────────────────────────────────
  useEffect(() => {
    const updatePhysics = () => {
      try {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const s       = stateRef.current;
        const word = wordBankRef.current.words[s.wordIdx];
        if (!word || !s.slots) {
          frameRef.current = requestAnimationFrame(updatePhysics);
          return;
        }

        // Particle animation
        s.particles = s.particles
          .map(p => ({
            ...p,
            x:        p.x + (p.vx / screenW) * 100,
            y:        p.y + (p.vy / screenH) * 100,
            vy:       p.vy + 0.3,
            rotation: p.rotation + p.spin,
          }))
          .filter(p => p.y < 105 && p.x > -5 && p.x < 105);

        // Draw particles on canvas
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
            const px = (p.x / 100) * screenW;
            const py = (p.y / 100) * screenH;
            ctx.translate(px, py);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }

        if (s.isWordWon) {
          frameRef.current = requestAnimationFrame(updatePhysics);
          return;
        }

        const handData    = window.latestHandData || { cursors: [], gestures: [] };
        const cursors     = handData.cursors  || [];
        const gestures    = handData.gestures || [];

        const mappedCursors = cursors.map(c => ({
          x: (c.x / screenW) * 100,
          y: (c.y / screenH) * 100,
          isVisible: c.isVisible,
        }));

        // 1. Move bubbles; drag grabbed ones with cursor
        const nextBubbles = s.bubbles
          .map(b => {
            const bCopy = { ...b };
            if (bCopy.isGrabbed && bCopy.grabbedBy !== null) {
              const cursor = mappedCursors[bCopy.grabbedBy];
              if (cursor && cursor.isVisible) {
                bCopy.x     = cursor.x;
                bCopy.y     = cursor.y;
                bCopy.pulse = 1.15;

                // Snap while dragging
                for (let i = 0; i < word.syllables.length; i++) {
                  if (s.slots[i] !== null) continue;
                  const slotEl = document.getElementById(`syllable-slot-${i}`);
                  if (!slotEl) continue;
                  const rect     = slotEl.getBoundingClientRect();
                  const slotPx   = rect.left + rect.width  / 2;
                  const slotPy   = rect.top  + rect.height / 2;
                  const bubblePx = (bCopy.x / 100) * screenW;
                  const bubblePy = (bCopy.y / 100) * screenH;
                  if (Math.hypot(bubblePx - slotPx, bubblePy - slotPy) < 80 && word.syllables[i] === bCopy.text) {
                    s.slots[i] = bCopy.text;
                    setSlots([...s.slots]);
                    playSound('snap');
                    addPointsRef.current(50);
                    delete s.dragging[bCopy.grabbedBy];
                    bCopy.shouldRemove = true;
                    break;
                  }
                }
              } else {
                bCopy.isGrabbed = false;
                bCopy.grabbedBy = null;
                bCopy.pulse     = 1.0;
                delete s.dragging[bCopy.grabbedBy];
              }
            } else {
              bCopy.y    += bCopy.speed;
              bCopy.pulse = 1.0;
            }
            return bCopy;
          })
          .filter(b => b.y < 108 && !b.shouldRemove);

        // 2. Grab / release gestures
        mappedCursors.forEach((cursor, handIdx) => {
          if (!cursor.isVisible) return;
          const isPinching      = gestures[handIdx]?.isPinching;
          const grabbedBubbleId = s.dragging[handIdx];

          if (isPinching) {
            if (grabbedBubbleId === undefined) {
              let closest = null, minDist = 9;
              nextBubbles.forEach(b => {
                if (b.isGrabbed) return;
                const d = Math.hypot(b.x - cursor.x, b.y - cursor.y);
                if (d < minDist) { minDist = d; closest = b; }
              });
              if (closest) {
                closest.isGrabbed = true;
                closest.grabbedBy = handIdx;
                s.dragging[handIdx] = closest.id;
              }
            }
          } else {
            if (grabbedBubbleId !== undefined) {
              const bIdx = nextBubbles.findIndex(b => b.id === grabbedBubbleId);
              if (bIdx !== -1) {
                const bubble = nextBubbles[bIdx];
                let snapped  = false;

                for (let i = 0; i < word.syllables.length; i++) {
                  if (s.slots[i] !== null) continue;
                  const slotEl = document.getElementById(`syllable-slot-${i}`);
                  if (!slotEl) continue;
                  const rect     = slotEl.getBoundingClientRect();
                  const slotPx   = rect.left + rect.width  / 2;
                  const slotPy   = rect.top  + rect.height / 2;
                  const bubblePx = (bubble.x / 100) * screenW;
                  const bubblePy = (bubble.y / 100) * screenH;
                  if (Math.hypot(bubblePx - slotPx, bubblePy - slotPy) < 80) {
                    if (word.syllables[i] === bubble.text) {
                      s.slots[i] = bubble.text;
                      setSlots([...s.slots]);
                      playSound('snap');
                      addPointsRef.current(50);
                      nextBubbles.splice(bIdx, 1);
                      snapped = true;
                    } else {
                      playSound('error');
                      // Hint: show which syllable belongs in this slot
                      const expected = word.syllables[i];
                      const langKey = wordBankRef.current.words === WORDS_EN ? 'en' : 'es';
                      showFeedbackRef.current(
                        langKey === 'es'
                          ? `"${bubble.text}" no va en esa posición — busca "${expected}"`
                          : `"${bubble.text}" doesn't fit here — look for "${expected}"`,
                        'hint'
                      );
                    }
                    break;
                  }
                }
                if (!snapped && nextBubbles[bIdx]) {
                  nextBubbles[bIdx].isGrabbed = false;
                  nextBubbles[bIdx].grabbedBy = null;
                }
              }
              delete s.dragging[handIdx];
            }
          }
        });

        s.bubbles = nextBubbles;
        setBubbles([...nextBubbles]);

        // 3. Check word completion
        if (!s.isWordWon && s.slots.length > 0 && s.slots.every(v => v !== null)) {
          s.isWordWon = true;
          setIsWordWon(true);
          playSound('win');
          spawnWinParticles();
          wordsCompletedRef.current += 1;
          addPointsRef.current(150 + wordsCompletedRef.current * 20); // bonus grows with progress
          setStreak(prev => prev + 1);

          // Pronounce the completed word after win sound finishes
          const wonWord = wordBankRef.current.words[s.wordIdx]?.word ?? '';
          if (wonWord && soundEnabledRef.current && window.speechSynthesis && window.SpeechSynthesisUtterance) {
            setTimeout(() => {
              try {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(wonWord.toLowerCase());
                u.lang  = langRef.current === 'en' ? 'en-US' : 'es-ES';
                u.rate  = 0.75;
                u.pitch = 1.0;
                window.speechSynthesis.speak(u);
              } catch (e) { /* ignore */ }
            }, 650); // wait for win jingle to finish
          }

          setTimeout(() => initWord(), 2500);
        }
      } catch (err) {
        console.error('[SyllablesModule] physics loop error:', err);
        addLocalLog('MODULE_ERROR', `Error en física de Sílabas: ${err.message}\nStack: ${err.stack}`);
      }

      frameRef.current = requestAnimationFrame(updatePhysics);
    };

    frameRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(frameRef.current);
  }, []); // Stable loop — all live values via stateRef / stable refs

  const difficultyLabel = currentWord.syllables.length === 2
    ? (lang === 'es' ? 'Básico' : 'Basic')
    : (lang === 'es' ? 'Avanzado' : 'Advanced');
  const difficultyColor = currentWord.syllables.length === 2 ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col items-center">

      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(prev => !prev)}
        className="absolute top-4 right-12 z-50 p-4 glass rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all hover:scale-105"
      >
        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {/* Target Word Panel */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-center z-10 w-full max-w-lg px-6">
        <motion.div
          key={`${lang}-${wordIndex}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-dark px-10 py-5 rounded-[32px] border border-white/10 shadow-2xl flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${difficultyColor}`}>
              {difficultyLabel}
            </span>
            <span className="text-white/20 text-[10px]">•</span>
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">
              {lang === 'es' ? 'Forma la Palabra' : 'Build the Word'}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black uppercase italic tracking-wider text-gradient">
            {currentWord.word}
          </h2>
          <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">
            {currentWord.syllables.length} {lang === 'es' ? 'sílabas' : 'syllables'}
          </span>
        </motion.div>

        {streak > 1 && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20"
          >
            <Star size={12} fill="currentColor" /> Racha x{streak}
          </motion.div>
        )}
      </div>

      {/* Falling Bubbles */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {bubbles.map(b => (
          <div
            id={`syllable-bubble-${b.id}`}
            key={b.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${b.x}%`, top: `${b.y}%`, scale: b.pulse }}
          >
            <div
              className={`bubble-inner w-20 h-20 rounded-full border-2 flex items-center justify-center font-display text-2xl font-black italic shadow-2xl transition-all duration-300 ${
                b.isGrabbed 
                  ? 'bg-white/80 border-white text-purple-600 shadow-[0_0_40px_white] ring-4 ring-white/20'
                  : 'bg-gradient-to-tr from-purple-500/30 to-indigo-500/20 border-purple-500/40 text-white shadow-purple-500/20 backdrop-blur-md'
              }`}
            >
              {b.text}
            </div>
          </div>
        ))}
      </div>

      {/* Syllable Slots */}
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-10 flex gap-6">
        {currentWord.syllables.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <motion.div
              id={`syllable-slot-${i}`}
              animate={{
                borderColor: slots?.[i] ? '#22C55E' : '#A78BFA',
                boxShadow:   slots?.[i] ? '0 0 30px rgba(34, 197, 94, 0.4)' : '0 0 15px rgba(167, 139, 250, 0.1)',
                scale:       slots?.[i] ? 1.05 : 1,
              }}
              className={`w-24 h-24 rounded-[30px] border-4 border-dashed flex items-center justify-center font-display text-3xl font-black italic transition-all duration-300 ${
                slots?.[i]
                  ? 'bg-green-500/10 border-solid text-green-400'
                  : 'bg-black/40 text-white/10'
              }`}
            >
              {slots?.[i] || '?'}
            </motion.div>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">
              {lang === 'es' ? 'Sílaba' : 'Syllable'} {i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Win Overlay */}
      <AnimatePresence>
        {isWordWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            >
              <Trophy size={80} className="text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
            </motion.div>
            <h2 className="text-5xl font-display font-black text-gradient uppercase italic tracking-tighter">
              {lang === 'es' ? '¡Genial!' : 'Great!'}
            </h2>
            {/* Syllable breakdown */}
            <div className="flex items-center gap-2 mt-1">
              {currentWord.syllables.map((syl, i) => (
                <React.Fragment key={i}>
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.12 }}
                    className="text-xl font-black text-white bg-purple-500/30 px-4 py-2 rounded-xl border border-purple-400/40"
                  >
                    {syl}
                  </motion.span>
                  {i < currentWord.syllables.length - 1 && (
                    <span className="text-white/30 text-lg font-black">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              {currentWord.syllables.length} {lang === 'es' ? 'sílabas' : 'syllables'} · {lang === 'es' ? 'siguiente en un momento…' : 'next word coming up…'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Star Particles */}
      <canvas ref={particleCanvasRef} className="absolute inset-0 pointer-events-none z-30" />

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

      {/* Instructions */}
      {!isWordWon && (
        <GameInstruction
          lang={lang}
          messageEs="Atrapa una sílaba con pinza en el aire y arrástrala a su lugar"
          messageEn="Pinch a syllable bubble and drag it to its correct slot"
          icon="🫧"
        />
      )}
    </div>
  );
});

export default SyllablesModule;
