import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import HandButton from '../HandButton';

// ── Level data ─────────────────────────────────────────────────────────────────
// answers: array — Level 1-2 have 1 blank, Level 3 has 2 blanks per sentence
const LEVELS = [
  {
    level: 1, label: 'Básico', color: 'text-emerald-400',
    description: '1 blank · simple verbs & adjectives',
    sentences: [
      { template: 'I ___ a cat',            answers: ['HAVE'],   hint: 'tener',            translation: 'Yo tengo un gato' },
      { template: 'She ___ fast',            answers: ['RUNS'],   hint: 'correr',           translation: 'Ella corre rápido' },
      { template: 'He ___ soccer',           answers: ['PLAYS'],  hint: 'jugar',            translation: 'Él juega fútbol' },
      { template: 'The dog is ___',          answers: ['BIG'],    hint: 'grande',           translation: 'El perro es grande' },
      { template: 'I ___ water',             answers: ['DRINK'],  hint: 'beber',            translation: 'Yo bebo agua' },
      { template: 'The sky is ___',          answers: ['BLUE'],   hint: 'azul',             translation: 'El cielo es azul' },
      { template: 'They ___ to school',      answers: ['GO'],     hint: 'ir',               translation: 'Ellos van a la escuela' },
      { template: 'I ___ happy',             answers: ['AM'],     hint: 'ser/estar',        translation: 'Yo estoy feliz' },
      { template: 'She ___ a red apple',     answers: ['EATS'],   hint: 'comer',            translation: 'Ella come una manzana roja' },
      { template: 'The bird can ___',        answers: ['FLY'],    hint: 'volar',            translation: 'El pájaro puede volar' },
      { template: 'We ___ friends',          answers: ['ARE'],    hint: 'ser/estar',        translation: 'Somos amigos' },
      { template: 'He ___ a book',           answers: ['READS'],  hint: 'leer',             translation: 'Él lee un libro' },
    ],
  },
  {
    level: 2, label: 'Intermedio', color: 'text-amber-400',
    description: '1 blank · past tense & longer sentences',
    sentences: [
      { template: 'She ___ a book every day',        answers: ['READS'],   hint: 'leer (presente)',   translation: 'Ella lee un libro cada día' },
      { template: 'He is ___ at math',               answers: ['GOOD'],    hint: 'bueno',             translation: 'Él es bueno en matemáticas' },
      { template: 'We ___ pizza for dinner',         answers: ['ATE'],     hint: 'comer (pasado)',    translation: 'Comimos pizza para cenar' },
      { template: 'The cat ___ on the sofa',         answers: ['SLEEPS'],  hint: 'dormir',            translation: 'El gato duerme en el sofá' },
      { template: 'I ___ swimming in summer',        answers: ['ENJOY'],   hint: 'disfrutar',         translation: 'Disfruto nadar en verano' },
      { template: 'She ___ her bike to school',      answers: ['RIDES'],   hint: 'montar',            translation: 'Ella va a la escuela en bici' },
      { template: 'They ___ basketball on weekends', answers: ['PLAY'],    hint: 'jugar',             translation: 'Juegan baloncesto los fines de semana' },
      { template: 'He ___ very hard for the exam',   answers: ['STUDIED'], hint: 'estudiar (pasado)', translation: 'Estudió mucho para el examen' },
      { template: 'The flowers ___ beautiful',       answers: ['ARE'],     hint: 'ser',               translation: 'Las flores son hermosas' },
      { template: 'I ___ my homework yesterday',     answers: ['DID'],     hint: 'hacer (pasado)',    translation: 'Hice mi tarea ayer' },
      { template: 'She ___ to the park',             answers: ['WALKED'],  hint: 'caminar (pasado)',  translation: 'Ella caminó al parque' },
      { template: 'We ___ a movie last night',       answers: ['WATCHED'], hint: 'ver (pasado)',      translation: 'Vimos una película anoche' },
    ],
  },
  {
    level: 3, label: 'Avanzado', color: 'text-red-400',
    description: '2 blanks · perfect tenses, passive & conditionals',
    sentences: [
      { template: 'She ___ been ___ for hours',          answers: ['HAS',   'STUDYING'], hint: 'present perfect continuous', translation: 'Ella ha estado estudiando por horas' },
      { template: 'The book ___ written ___ year',       answers: ['WAS',   'LAST'],     hint: 'passive voice + time',        translation: 'El libro fue escrito el año pasado' },
      { template: 'They ___ playing ___ I arrived',      answers: ['WERE',  'WHEN'],     hint: 'past continuous + join',      translation: 'Estaban jugando cuando llegué' },
      { template: 'I ___ visit my ___ tomorrow',         answers: ['WILL',  'GRANDMA'],  hint: 'future + family noun',        translation: 'Visitaré a mi abuela mañana' },
      { template: 'She ___ learned ___ languages',       answers: ['HAS',   'THREE'],    hint: 'perfect tense + number',      translation: 'Ella ha aprendido tres idiomas' },
      { template: 'If I ___ you, I ___ rest',            answers: ['WERE',  'WOULD'],    hint: '2nd conditional',             translation: 'Si fuera tú, descansaría' },
      { template: 'He ___ already ___ the project',      answers: ['HAS',   'FINISHED'], hint: 'perfect + past participle',   translation: 'Él ya ha terminado el proyecto' },
      { template: 'The problem ___ solved ___ the team', answers: ['WAS',   'BY'],       hint: 'passive + agent marker',      translation: 'El problema fue resuelto por el equipo' },
      { template: 'I wish I ___ fly ___ a bird',         answers: ['COULD', 'LIKE'],     hint: 'wish + comparison',           translation: 'Ojalá pudiera volar como un pájaro' },
      { template: 'She ___ been living ___ five years',  answers: ['HAS',   'FOR'],      hint: 'perfect continuous + time',   translation: 'Ha estado viviendo aquí por cinco años' },
      { template: 'The letter ___ sent ___ morning',     answers: ['WAS',   'THIS'],     hint: 'passive + time expression',   translation: 'La carta fue enviada esta mañana' },
      { template: 'By ___ year, I ___ graduated',        answers: ['NEXT',  'WILL'],     hint: 'future perfect + time',       translation: 'Para el próximo año, me habré graduado' },
    ],
  },
];

// Distractor pools per level (correct answers are filtered out before showing)
const DISTRACTORS = [
  ['RUN', 'RUNS', 'EAT', 'EATS', 'BIG', 'SMALL', 'RED', 'SEE', 'IS', 'ARE', 'GO', 'LIKE'],
  ['ATE', 'PLAYS', 'STUDIED', 'WALKED', 'GOOD', 'BAD', 'RAN', 'SEES', 'MAKE', 'MADE', 'WENT', 'DID'],
  ['WAS', 'WERE', 'HAS', 'HAVE', 'HAD', 'WILL', 'COULD', 'SHOULD', 'WOULD', 'FOR', 'BY',
   'THIS', 'NEXT', 'HERE', 'WHEN', 'LIKE', 'THREE', 'MY', 'LAST', 'DONE', 'SEEN', 'DID', 'AM'],
];

const SpeechSynth = (text) => {
  if (!window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(text.toLowerCase());
    u.lang = 'en-US'; u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
};

// ── Component ──────────────────────────────────────────────────────────────────
const EnglishModule = memo(({ addPoints }) => {
  const [levelIdx,     setLevelIdx]     = useState(0);
  const [sentenceIdx,  setSentenceIdx]  = useState(0);
  const [filledSlots,  setFilledSlots]  = useState([null]);
  const [isCorrect,    setIsCorrect]    = useState(false);
  const [wrongFlash,   setWrongFlash]   = useState(false);
  const [streak,       setStreak]       = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [bubbles,      setBubbles]      = useState([]);
  const [particles,    setParticles]    = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedbackMsg,  setFeedbackMsg]  = useState(null);

  const addPointsRef = useRef(addPoints); addPointsRef.current = addPoints;
  const soundRef     = useRef(soundEnabled); soundRef.current = soundEnabled;

  const feedbackTimerRef = useRef(null);
  const showFeedback = useCallback((text, type = 'ok') => {
    clearTimeout(feedbackTimerRef.current);
    setFeedbackMsg({ text, type });
    feedbackTimerRef.current = setTimeout(() => setFeedbackMsg(null), 2400);
  }, []);
  const showFeedbackRef = useRef(showFeedback);
  showFeedbackRef.current = showFeedback;

  const stateRef = useRef({
    levelIdx: 0, sentenceIdx: 0, usedIndices: new Set(),
    isCorrect: false, dragging: {}, bubbles: [],
    filledSlots: [null],
  });
  const bubbleIdRef = useRef(0);
  const frameRef    = useRef(null);
  const spawnRef    = useRef(null);

  const currentLevel    = LEVELS[levelIdx];
  const currentSentence = currentLevel.sentences[sentenceIdx];

  // ── Audio ──────────────────────────────────────────────────────────────────
  const playSound = useCallback((type) => {
    if (!soundRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      if (type === 'correct') {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
          const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
          o2.type = 'sine'; o2.frequency.value = f;
          o2.connect(g2); g2.connect(ctx.destination);
          g2.gain.setValueAtTime(0, ctx.currentTime + i * 0.09);
          g2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.09 + 0.02);
          g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.09 + 0.28);
          o2.start(ctx.currentTime + i * 0.09);
          o2.stop(ctx.currentTime + i * 0.09 + 0.3);
        });
      } else if (type === 'snap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.18, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'triangle'; osc.frequency.value = 150;
        g.gain.setValueAtTime(0.25, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start(); osc.stop(ctx.currentTime + 0.22);
      }
    } catch { /* ignore */ }
  }, []);

  const spawnParticles = useCallback(() => {
    const colors = ['#34D399', '#A78BFA', '#60A5FA', '#FBBF24', '#F472B6'];
    setParticles(Array.from({ length: 36 }, () => ({
      id: Math.random(), x: 50 + (Math.random() - 0.5) * 30, y: 40 + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 12 + Math.random() * 18, rotation: Math.random() * 360, spin: (Math.random() - 0.5) * 18,
    })));
  }, []);

  // ── Pick next sentence ─────────────────────────────────────────────────────
  const nextSentence = useCallback((lvlIdx) => {
    const s    = stateRef.current;
    const bank = LEVELS[lvlIdx].sentences;
    if (s.usedIndices.size >= bank.length) s.usedIndices = new Set();
    let idx = 0;
    for (let i = 0; i < bank.length; i++) {
      if (!s.usedIndices.has(i)) { idx = i; break; }
    }
    const fresh = LEVELS[lvlIdx].sentences[idx].answers.map(() => null);
    s.usedIndices.add(idx);
    s.sentenceIdx = idx;
    s.isCorrect   = false;
    s.dragging    = {};
    s.bubbles     = [];
    s.filledSlots = fresh;
    setSentenceIdx(idx);
    setIsCorrect(false);
    setFilledSlots([...fresh]);
    setBubbles([]);
    setParticles([]);
  }, []);

  // ── Spawn bubble ───────────────────────────────────────────────────────────
  const spawnBubble = useCallback(() => {
    const s = stateRef.current;
    if (s.isCorrect) return;
    const sentData = LEVELS[s.levelIdx].sentences[s.sentenceIdx];
    const answers  = sentData.answers;
    const dist     = DISTRACTORS[s.levelIdx];
    const unfilled = answers.filter((_, i) => s.filledSlots[i] === null);
    const isRight  = Math.random() < 0.55 && unfilled.length > 0;
    let text;
    if (isRight) {
      text = unfilled[Math.floor(Math.random() * unfilled.length)];
    } else {
      const pool = dist.filter(w => !answers.includes(w));
      text = pool[Math.floor(Math.random() * pool.length)] ?? dist[0];
    }
    bubbleIdRef.current += 1;
    const b = {
      id: bubbleIdRef.current, text,
      x: 12 + Math.random() * 76, y: -8,
      speed: 0.28 + Math.random() * 0.12,
      isGrabbed: false, grabbedBy: null,
    };
    s.bubbles.push(b);
    setBubbles([...s.bubbles]);
  }, []);

  useEffect(() => {
    stateRef.current.levelIdx = levelIdx;
    stateRef.current.usedIndices = new Set();
    nextSentence(levelIdx);
  }, [levelIdx, nextSentence]);

  useEffect(() => {
    spawnRef.current = setInterval(() => {
      const s = stateRef.current;
      if (s.bubbles.length < 7 && !s.isCorrect) spawnBubble();
    }, 1800);
    return () => clearInterval(spawnRef.current);
  }, [spawnBubble]);

  // ── RAF loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      frameRef.current = requestAnimationFrame(loop);
      const sw = window.innerWidth, sh = window.innerHeight;
      const s  = stateRef.current;

      // Particles
      setParticles(prev => {
        if (!prev.length) return prev;
        const nx = prev
          .map(p => ({ ...p, x: p.x + (p.vx / sw) * 100, y: p.y + (p.vy / sh) * 100, vy: p.vy + 0.28, rotation: p.rotation + p.spin }))
          .filter(p => p.y < 108);
        return nx.length === prev.length ? prev : nx;
      });

      if (s.isCorrect) return;

      const { cursors = [], gestures = [] } = window.latestHandData || {};
      const mapped   = cursors.map(c => ({ x: (c.x / sw) * 100, y: (c.y / sh) * 100, isVisible: c.isVisible }));
      const sentData = LEVELS[s.levelIdx].sentences[s.sentenceIdx];
      const answers  = sentData.answers;

      // ── 1. Move bubbles + snap-while-dragging ────────────────────────────
      const next = s.bubbles
        .map(b => {
          const bc = { ...b };
          if (bc.isGrabbed && bc.grabbedBy !== null) {
            const cur = mapped[bc.grabbedBy];
            if (cur?.isVisible) {
              bc.x = cur.x; bc.y = cur.y;

              // Check proximity to each unfilled slot (correct word only)
              if (!s.isCorrect) {
                for (let si = 0; si < answers.length; si++) {
                  if (s.filledSlots[si] !== null) continue;     // slot already full
                  if (bc.text !== answers[si]) continue;         // wrong word for this slot
                  const slotEl = document.getElementById(`english-slot-${si}`);
                  if (!slotEl) continue;
                  const r   = slotEl.getBoundingClientRect();
                  const bpx = (bc.x / 100) * sw;
                  const bpy = (bc.y / 100) * sh;
                  if (Math.hypot(bpx - (r.left + r.width / 2), bpy - (r.top + r.height / 2)) < 80) {
                    // ✅ Snap!
                    const fresh = [...s.filledSlots];
                    fresh[si]     = bc.text;
                    s.filledSlots = fresh;
                    setFilledSlots([...fresh]);
                    playSound('snap');
                    bc.shouldRemove = true;

                    if (fresh.every(v => v !== null)) {
                      // All blanks filled — sentence complete
                      s.isCorrect = true;
                      s.bubbles   = [];
                      setIsCorrect(true);
                      setBubbles([]);
                      playSound('correct');
                      spawnParticles();
                      if (soundRef.current) {
                        let spoken = sentData.template;
                        answers.forEach(a => { spoken = spoken.replace('___', a); });
                        SpeechSynth(spoken);
                      }
                      const base = s.levelIdx === 0 ? 60 : s.levelIdx === 1 ? 100 : 150;
                      addPointsRef.current(base * answers.length);
                      setTotalCorrect(t => t + 1);
                      setStreak(k => k + 1);
                      setTimeout(() => nextSentence(s.levelIdx), 2800);
                    }
                    break;
                  }
                }
              }
            } else {
              bc.isGrabbed = false; bc.grabbedBy = null;
            }
          } else {
            bc.y += bc.speed;
          }
          return bc;
        })
        .filter(b => b.y < 110 && !b.shouldRemove);

      // ── 2. Grab / release gestures ─────────────────────────────────────────
      mapped.forEach((cur, hi) => {
        if (!cur.isVisible) return;
        const isPinch   = gestures[hi]?.isPinching;
        const draggedId = s.dragging[hi];

        if (isPinch) {
          if (draggedId === undefined) {
            // Grab nearest visible bubble
            let best = null, bestD = 9;
            next.forEach(b => {
              if (b.isGrabbed) return;
              const d = Math.hypot(b.x - cur.x, b.y - cur.y);
              if (d < bestD) { bestD = d; best = b; }
            });
            if (best) { best.isGrabbed = true; best.grabbedBy = hi; s.dragging[hi] = best.id; }
          }
        } else if (draggedId !== undefined) {
          // Released
          const bi = next.findIndex(b => b.id === draggedId);
          if (bi === -1) {
            // Bubble was already consumed by snap-while-dragging — just clean up
            delete s.dragging[hi];
            return;
          }
          const b = next[bi];
          let handled = false;

          for (let si = 0; si < answers.length; si++) {
            if (s.filledSlots[si] !== null) continue;
            const slotEl = document.getElementById(`english-slot-${si}`);
            if (!slotEl) continue;
            const r  = slotEl.getBoundingClientRect();
            const sx = ((r.left + r.width  / 2) / sw) * 100;
            const sy = ((r.top  + r.height / 2) / sh) * 100;
            if (Math.hypot(b.x - sx, b.y - sy) < 18) {
              handled = true;
              if (b.text === answers[si]) {
                // Correct — fallback snap on release
                const fresh = [...s.filledSlots];
                fresh[si]     = b.text;
                s.filledSlots = fresh;
                setFilledSlots([...fresh]);
                playSound('snap');
                next.splice(bi, 1);
                if (fresh.every(v => v !== null)) {
                  s.isCorrect = true; s.bubbles = [];
                  setIsCorrect(true); setBubbles([]);
                  playSound('correct'); spawnParticles();
                  if (soundRef.current) {
                    let spoken = sentData.template;
                    answers.forEach(a => { spoken = spoken.replace('___', a); });
                    SpeechSynth(spoken);
                  }
                  const base = s.levelIdx === 0 ? 60 : s.levelIdx === 1 ? 100 : 150;
                  addPointsRef.current(base * answers.length);
                  setTotalCorrect(t => t + 1); setStreak(k => k + 1);
                  setTimeout(() => nextSentence(s.levelIdx), 2800);
                }
              } else {
                // Wrong word for this slot
                setWrongFlash(true); setStreak(0);
                setTimeout(() => setWrongFlash(false), 600);
                next[bi].isGrabbed = false; next[bi].grabbedBy = null;
                playSound('wrong');
                showFeedbackRef.current(`"${sentData.hint}" → ${answers[si]}`, 'hint');
              }
              break;
            }
          }

          if (!handled && next[bi]) {
            next[bi].isGrabbed = false; next[bi].grabbedBy = null;
          }
          delete s.dragging[hi];
        }
      });

      s.bubbles = next;
      setBubbles([...next]);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [nextSentence, playSound, spawnParticles]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const parts = currentSentence.template.split('___');

  // Build the completed sentence string for win overlay
  const completedSentence = (() => {
    let s = currentSentence.template;
    currentSentence.answers.forEach(a => { s = s.replace('___', a); });
    return s;
  })();

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col items-center">

      {/* Sound toggle */}
      <button onClick={() => setSoundEnabled(p => !p)}
        className="absolute top-4 right-12 z-50 p-3 glass rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all">
        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 glass-dark px-5 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400">🇺🇸 English</span>
        <div className="w-px h-4 bg-white/20" />
        <span className={`text-[9px] font-black uppercase tracking-widest ${currentLevel.color}`}>{currentLevel.label}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black text-white/40">{totalCorrect} correctas</span>
      </div>

      {/* Level buttons */}
      <div className="absolute top-20 right-6 z-30">
        <HandButton
          onClick={() => setLevelIdx(p => Math.min(p + 1, LEVELS.length - 1))}
          dwellMs={1000} hitMargin={4} variant={levelIdx < LEVELS.length - 1 ? 'purple' : 'default'}
          className="px-4 py-3 text-[10px]"
        >
          <ChevronUp size={14} /> Subir nivel
        </HandButton>
        {levelIdx > 0 && (
          <HandButton
            onClick={() => setLevelIdx(p => Math.max(p - 1, 0))}
            dwellMs={1000} hitMargin={4} variant="default"
            className="mt-4 px-4 py-3 text-[10px] !bg-white/5 !border-white/10 w-full"
          >
            ↓ Bajar nivel
          </HandButton>
        )}
      </div>

      {/* Sentence display */}
      <div className="absolute top-[26%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-8 flex flex-col items-center gap-5 z-10">
        <motion.div key={`${levelIdx}-${sentenceIdx}`}
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-dark px-8 py-6 rounded-[36px] border border-white/10 shadow-2xl w-full">

          <p className="text-[8.5px] font-black uppercase tracking-[0.4em] text-white/30 mb-3 text-center">
            {currentLevel.description}
          </p>

          {/* Sentence with N blank slots */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-2xl md:text-3xl font-display font-black italic text-white leading-tight">
            {parts.map((part, pi) => (
              <React.Fragment key={pi}>
                {part && <span>{part}</span>}
                {pi < currentSentence.answers.length && (
                  <motion.div
                    id={`english-slot-${pi}`}
                    animate={{
                      borderColor: filledSlots[pi]
                        ? '#22C55E'
                        : (wrongFlash && filledSlots[pi] === null) ? '#EF4444' : '#A78BFA',
                      boxShadow: filledSlots[pi]
                        ? '0 0 30px rgba(34,197,94,0.5)'
                        : wrongFlash ? '0 0 20px rgba(239,68,68,0.4)' : '0 0 15px rgba(167,139,250,0.2)',
                    }}
                    className={`inline-flex items-center justify-center min-w-[100px] h-12 px-4 rounded-2xl border-2 border-dashed font-display font-black italic text-xl transition-colors
                      ${filledSlots[pi]
                        ? 'bg-emerald-500/15 text-emerald-400 border-solid'
                        : wrongFlash ? 'bg-red-500/15 text-red-300' : 'bg-black/30 text-purple-300'
                      }`}
                  >
                    {filledSlots[pi] || '???'}
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="text-[9px] text-white/30 font-black uppercase tracking-wider text-center mt-3">
            {currentSentence.translation}
          </p>
          <p className="text-[8px] text-amber-400/60 font-black uppercase tracking-widest text-center mt-1">
            pista: {currentSentence.hint}
          </p>
        </motion.div>

        {streak > 1 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
            <Star size={12} fill="currentColor" /> Racha x{streak}
          </motion.div>
        )}
      </div>

      {/* Falling word bubbles */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {bubbles.map(b => (
          <div key={b.id} className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}>
            <motion.div
              animate={{ scale: b.isGrabbed ? 1.15 : 1, rotate: b.isGrabbed ? [0, -4, 4, 0] : 0 }}
              transition={b.isGrabbed ? { repeat: Infinity, duration: 0.5 } : {}}
              className={`px-5 py-3 rounded-2xl border-2 font-display text-lg font-black italic shadow-2xl transition-all ${
                b.isGrabbed
                  ? 'bg-white/90 border-white text-purple-700 shadow-[0_0_40px_white]'
                  : 'bg-gradient-to-br from-cyan-600/30 to-blue-600/20 border-cyan-400/40 text-white'
              }`}
            >
              {b.text}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {isCorrect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/55 flex flex-col items-center justify-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}>
              <Trophy size={72} className="text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.6)]" />
            </motion.div>
            <h2 className="text-4xl font-display font-black text-gradient italic uppercase tracking-tighter">
              {currentSentence.answers.length > 1 ? 'Perfect!' : 'Correct!'}
            </h2>
            <div className="glass-dark px-8 py-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2 max-w-lg text-center">
              <p className="text-white font-black text-lg italic">{completedSentence}</p>
              <p className="text-cyan-400 font-black text-[11px] uppercase tracking-widest">
                🇪🇸 {currentSentence.translation}
              </p>
              <p className="text-amber-400/70 font-black text-[9px] uppercase tracking-widest">
                {currentSentence.hint} — {currentSentence.answers.join(' · ')}
              </p>
            </div>
            <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[9px]">Next sentence coming up…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} className="absolute pointer-events-none font-black"
          style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: `${p.size}px`, color: p.color,
            transform: `translate(-50%,-50%) rotate(${p.rotation}deg)`, textShadow: `0 0 8px ${p.color}` }}>★</div>
      ))}

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
              feedbackMsg.type === 'error'  ? 'bg-red-500/20 border-red-400/30 text-red-300' :
              feedbackMsg.type === 'hint'   ? 'bg-amber-500/20 border-amber-400/30 text-amber-300' :
                                             'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
            }`}
          >
            {feedbackMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction */}
      {!isCorrect && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 glass px-7 py-3 rounded-2xl border border-white/10 animate-pulse">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 italic text-center">
            🤏 Pinch a word · bring it close to the blank slot · it will snap in
          </p>
        </div>
      )}
    </div>
  );
});

export default EnglishModule;
