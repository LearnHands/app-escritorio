import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, AlertTriangle, Sparkles, RotateCcw, GraduationCap, Beaker, CheckCircle2 } from 'lucide-react';
import HandButton from '../HandButton';

// ── Elementos y compuestos disponibles ──────────────────────────────────────
// Subconjunto curado de la tabla periódica + compuestos caseros para enseñar
// reacciones reales (seguras) y mezclas peligrosas que NUNCA deben hacerse.
const ELEMENTS = [
  { sym: 'H',       label: 'H',     name: 'Hidrógeno',   num: 1,  color: 'cyan'    },
  { sym: 'O',       label: 'O',     name: 'Oxígeno',     num: 8,  color: 'cyan'    },
  { sym: 'N',       label: 'N',     name: 'Nitrógeno',   num: 7,  color: 'cyan'    },
  { sym: 'C',       label: 'C',     name: 'Carbono',     num: 6,  color: 'purple'  },
  { sym: 'Na',      label: 'Na',    name: 'Sodio',       num: 11, color: 'orange'  },
  { sym: 'Cl',      label: 'Cl',    name: 'Cloro',       num: 17, color: 'emerald' },
  { sym: 'Fe',      label: 'Fe',    name: 'Hierro',      num: 26, color: 'orange'  },
  { sym: 'Cu',      label: 'Cu',    name: 'Cobre',       num: 29, color: 'orange'  },
  // Compuestos / productos caseros
  { sym: 'H2O',     label: 'H₂O',     name: 'Agua',        compound: true, color: 'cyan'    },
  { sym: 'NaHCO3',  label: 'NaHCO₃',  name: 'Bicarbonato', compound: true, color: 'purple'  },
  { sym: 'CH3COOH', label: 'CH₃COOH', name: 'Vinagre',     compound: true, color: 'emerald' },
  { sym: 'NH3',     label: 'NH₃',     name: 'Amoníaco',    compound: true, color: 'emerald' },
];

const ELEMENT_BY_SYM = Object.fromEntries(ELEMENTS.map(e => [e.sym, e]));

// Clave de reacción: símbolos ordenados → siempre la misma combinación
const rkey = (a, b) => [a, b].sort().join('+');

// ── Base de reacciones ──────────────────────────────────────────────────────
// type: 'safe' (segura) · 'cool' (curiosa/divertida) · 'danger' (peligrosa)
const REACTIONS = {
  [rkey('H', 'O')]:   { res: 'H₂O',  name: 'Agua',                emoji: '💧', type: 'safe',
    text: 'El hidrógeno y el oxígeno se combinan para formar agua, ¡la molécula esencial para toda forma de vida!' },
  [rkey('H', 'H')]:   { res: 'H₂',   name: 'Gas hidrógeno',       emoji: '🎈', type: 'cool',
    text: 'Dos átomos de hidrógeno forman H₂, el gas más ligero del universo. Por eso flota.' },
  [rkey('O', 'O')]:   { res: 'O₂',   name: 'Oxígeno',             emoji: '🫁', type: 'safe',
    text: 'Dos átomos de oxígeno forman O₂, el gas que respiramos en cada bocanada de aire.' },
  [rkey('Na', 'Cl')]: { res: 'NaCl', name: 'Sal común',           emoji: '🧂', type: 'cool',
    text: 'El sodio (un metal explosivo) y el cloro (un gas tóxico) juntos forman sal de mesa, ¡totalmente segura para comer!' },
  [rkey('C', 'O')]:   { res: 'CO₂',  name: 'Dióxido de carbono',  emoji: '💨', type: 'safe',
    text: 'El carbono y el oxígeno forman CO₂: lo exhalamos al respirar y las plantas lo usan para crecer.' },
  [rkey('Fe', 'O')]:  { res: 'Fe₂O₃', name: 'Óxido de hierro',    emoji: '🟤', type: 'safe',
    text: 'El hierro y el oxígeno forman herrumbre, la corrosión naranja que cubre los metales viejos.' },
  [rkey('Cu', 'O')]:  { res: 'CuO',  name: 'Óxido de cobre',      emoji: '🟢', type: 'safe',
    text: 'El cobre y el oxígeno crean una capa verde, como la que cubre la Estatua de la Libertad.' },
  [rkey('H', 'N')]:   { res: 'NH₃',  name: 'Amoníaco',            emoji: '🧪', type: 'safe',
    text: 'El hidrógeno y el nitrógeno forman amoníaco, base de los fertilizantes que alimentan al mundo.' },
  [rkey('NaHCO3', 'CH3COOH')]: { res: 'CO₂ + H₂O', name: '¡Volcán de espuma!', emoji: '🌋', type: 'cool',
    text: 'El bicarbonato y el vinagre reaccionan liberando burbujas de CO₂. ¡El experimento más divertido y seguro del laboratorio!' },

  // ── PELIGROSAS — sólo educativas, NUNCA hacer en la vida real ──
  [rkey('Na', 'H2O')]: { res: '💥', name: 'Reacción explosiva', emoji: '💥', type: 'danger',
    text: 'El sodio reacciona violentamente con el agua y puede explotar. NUNCA toques sodio con las manos mojadas.' },
  [rkey('Cl', 'NH3')]: { res: 'Cloramina', name: 'Gas tóxico', emoji: '☠️', type: 'danger',
    text: 'Mezclar cloro con amoníaco libera gas cloramina, muy venenoso. JAMÁS combines productos de limpieza en casa.' },
  [rkey('Cl', 'CH3COOH')]: { res: 'Cl₂', name: 'Gas cloro', emoji: '☠️', type: 'danger',
    text: 'La lejía (cloro) con vinagre libera gas cloro tóxico. Es un error casero peligroso: nunca los mezcles.' },
};

// Tutorial: 3 combinaciones sencillas y seguras para empezar
const TUTORIAL = [
  { key: rkey('H', 'O'),               a: 'H',  b: 'O',       goal: 'Crea agua',     emoji: '💧' },
  { key: rkey('Na', 'Cl'),             a: 'Na', b: 'Cl',      goal: 'Crea sal',      emoji: '🧂' },
  { key: rkey('NaHCO3', 'CH3COOH'),    a: 'NaHCO₃', b: 'CH₃COOH', goal: 'Haz un volcán', emoji: '🌋' },
];

const TYPE_STYLE = {
  safe:   { ring: 'border-emerald-500/50', glow: 'shadow-emerald-500/30', text: 'text-emerald-400', chip: 'bg-emerald-500/15', label: 'Reacción segura' },
  cool:   { ring: 'border-purple-500/50',  glow: 'shadow-purple-500/30',  text: 'text-purple-400',  chip: 'bg-purple-500/15',  label: '¡Reacción curiosa!' },
  danger: { ring: 'border-red-500/60',     glow: 'shadow-red-500/40',     text: 'text-red-400',     chip: 'bg-red-500/15',     label: '⚠️ Mezcla peligrosa' },
  none:   { ring: 'border-white/15',       glow: 'shadow-black/20',       text: 'text-white/40',    chip: 'bg-white/5',        label: 'Sin reacción' },
};

// ══════════════════════════════════════════════════════════════════════════════
const LabModule = memo(({ addPoints }) => {
  const [mode, setMode]       = useState('tutorial');     // 'tutorial' | 'free'
  const [slots, setSlots]     = useState({ a: null, b: null });
  const [result, setResult]   = useState(null);           // reaction object or {type:'none'}
  const [discovered, setDiscovered] = useState(new Set());
  const [tutorialDone, setTutorialDone] = useState(new Set());
  const [showIntro, setShowIntro] = useState(true);

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  // ── Añadir un elemento a la mesa de mezcla ────────────────────────────────
  const addElement = useCallback((el) => {
    setResult(r => r);  // no-op guard read
    setSlots(prev => {
      // Ignorar si ya hay un resultado en pantalla o ambos slots llenos
      if (prev.a && prev.b) return prev;
      if (!prev.a) return { a: el, b: null };
      return { a: prev.a, b: el };
    });
  }, []);

  // ── Cuando ambos slots están llenos → calcular reacción ───────────────────
  useEffect(() => {
    if (!slots.a || !slots.b || result) return;

    const key = rkey(slots.a.sym, slots.b.sym);
    const reaction = REACTIONS[key];

    if (!reaction) {
      setResult({ type: 'none', name: 'Sin reacción', emoji: '🤔', res: '—',
        text: 'Estos elementos no reaccionan entre sí. ¡Prueba con otra combinación!' });
      return;
    }

    setResult(reaction);

    // Puntaje + descubrimientos (sólo la primera vez de cada combinación)
    setDiscovered(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      const pts = reaction.type === 'danger' ? 40 : reaction.type === 'cool' ? 80 : 60;
      addPointsRef.current(pts);
      return next;
    });

    // Progreso del tutorial
    if (TUTORIAL.some(t => t.key === key)) {
      setTutorialDone(prev => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        addPointsRef.current(100);   // bonus por completar paso de tutorial
        return next;
      });
    }
  }, [slots, result]);

  // ── Limpiar mesa / continuar ──────────────────────────────────────────────
  const clearTable = useCallback(() => {
    setSlots({ a: null, b: null });
    setResult(null);
  }, []);

  const tutorialComplete = tutorialDone.size >= TUTORIAL.length;

  // Al completar el tutorial, ofrecer modo libre
  useEffect(() => {
    if (mode === 'tutorial' && tutorialComplete) {
      const t = setTimeout(() => setMode('free'), 400);
      return () => clearTimeout(t);
    }
  }, [tutorialComplete, mode]);

  const rs = result ? (TYPE_STYLE[result.type] || TYPE_STYLE.none) : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">

      {/* ── Cabecera ──────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <FlaskConical size={16} className="text-cyan-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Laboratorio de Química</span>
        <div className="w-px h-4 bg-white/20" />
        <span className={`text-[9px] font-black uppercase tracking-widest ${mode === 'tutorial' ? 'text-amber-400' : 'text-cyan-400'}`}>
          {mode === 'tutorial' ? 'Tutorial' : 'Modo Libre'}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
          {discovered.size} descubrimientos
        </span>
      </div>

      {/* ── Panel tutorial (izquierda) ────────────────────────────────────── */}
      {mode === 'tutorial' && (
        <div className="absolute top-20 left-6 z-30 w-56 glass-dark rounded-3xl border border-white/10 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={14} className="text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-400">Aprende mezclando</span>
          </div>
          <div className="space-y-3">
            {TUTORIAL.map((t, i) => {
              const done = tutorialDone.has(t.key);
              return (
                <div key={t.key} className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${done ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                  <div className="text-lg">{t.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black ${done ? 'text-emerald-400 line-through' : 'text-white/70'}`}>{t.goal}</p>
                    <p className="text-[8px] text-white/35 font-bold uppercase tracking-wider">{t.a} + {t.b}</p>
                  </div>
                  {done && <CheckCircle2 size={16} className="text-emerald-400" />}
                </div>
              );
            })}
          </div>
          {tutorialComplete && (
            <p className="mt-3 text-[8px] font-black uppercase tracking-widest text-cyan-400 text-center animate-pulse">
              ¡Tutorial completo! Modo libre activado
            </p>
          )}
        </div>
      )}

      {/* ── Botón limpiar (derecha) ───────────────────────────────────────── */}
      <div className="absolute top-20 right-6 z-30 flex flex-col gap-3">
        <HandButton onClick={clearTable} dwellMs={700} variant="red" className="px-5 py-3 text-[10px]">
          <RotateCcw size={14} /> Limpiar
        </HandButton>
        {mode === 'free' && (
          <HandButton onClick={() => { setMode('tutorial'); clearTable(); }} dwellMs={800} variant="cyan" className="px-5 py-3 text-[9px]">
            <GraduationCap size={14} /> Tutorial
          </HandButton>
        )}
      </div>

      {/* ── Mesa de mezcla (centro) ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 pt-10">
        <div className="flex items-center gap-6">
          {/* Slot A */}
          <MixSlot el={slots.a} placeholder="?" />

          <span className="text-4xl font-display font-black text-white/30 italic">+</span>

          {/* Slot B */}
          <MixSlot el={slots.b} placeholder="?" />

          <span className="text-4xl font-display font-black text-white/30 italic">=</span>

          {/* Resultado preview */}
          <div className={`w-28 h-28 rounded-[28px] border-2 border-dashed flex items-center justify-center transition-all ${result ? `${rs.ring} ${rs.chip}` : 'border-white/15 bg-white/3'}`}>
            {result
              ? <span className="text-5xl">{result.emoji}</span>
              : <Beaker size={32} className="text-white/15" />}
          </div>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 italic mt-2">
          Elige dos elementos para mezclarlos
        </p>
      </div>

      {/* ── Paleta de elementos (abajo) ───────────────────────────────────── */}
      <div className="relative z-20 pb-6 px-6">
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-5xl mx-auto">
          {ELEMENTS.map(el => (
            <HandButton
              key={el.sym}
              onClick={() => addElement(el)}
              dwellMs={1150}
              cooldownMs={900}
              hitMargin={6}
              variant={el.color}
              className="w-[88px] h-[88px] rounded-2xl flex flex-col items-center justify-center gap-0.5 !p-0"
            >
              <span className="text-[8px] font-black text-white/50 self-start ml-2 -mb-1">{el.num ?? (el.compound ? '⚗' : '')}</span>
              <span className="text-2xl font-display font-black italic leading-none">{el.label}</span>
              <span className="text-[7px] font-black uppercase tracking-wider text-white/70 leading-none mt-0.5 px-1 text-center">{el.name}</span>
            </HandButton>
          ))}
        </div>
      </div>

      {/* ── Tarjeta de resultado ──────────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.85, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className={`w-full max-w-md rounded-[34px] border-2 ${rs.ring} bg-[#0a0a18]/95 shadow-2xl ${rs.glow} overflow-hidden`}
            >
              {/* Cabecera tipo */}
              <div className={`flex items-center gap-2 px-6 py-3 ${rs.chip} border-b ${rs.ring}`}>
                {result.type === 'danger'
                  ? <AlertTriangle size={14} className="text-red-400" />
                  : <Sparkles size={14} className={rs.text} />}
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${rs.text}`}>{rs.label}</span>
              </div>

              {/* Cuerpo */}
              <div className="px-7 py-6 flex flex-col items-center text-center gap-3">
                <div className={`text-7xl ${result.type === 'danger' ? 'animate-pulse' : ''}`}>{result.emoji}</div>
                <div>
                  <h3 className={`text-3xl font-display font-black italic uppercase tracking-tight ${rs.text}`}>{result.name}</h3>
                  {result.res && result.res !== '—' && (
                    <p className="text-sm font-mono font-black text-white/50 mt-1">{result.res}</p>
                  )}
                </div>
                <p className="text-[12px] text-white/70 leading-relaxed">{result.text}</p>

                {result.type === 'danger' && (
                  <div className="mt-1 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400">
                      Nunca hagas esta mezcla en la vida real
                    </p>
                  </div>
                )}
              </div>

              {/* Acción */}
              <div className="px-6 pb-6 flex justify-center">
                <HandButton onClick={clearTable} dwellMs={900} graceMs={700} variant={result.type === 'danger' ? 'red' : 'emerald'} className="px-10 py-4 text-xs">
                  <Beaker size={14} /> Seguir experimentando
                </HandButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Intro inicial ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-lg rounded-[36px] border border-white/10 bg-[#0a0a18]/95 shadow-2xl p-8 flex flex-col items-center text-center gap-5"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-2xl">
                <FlaskConical size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">Laboratorio de Química</h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                Mezcla elementos de la tabla periódica y descubre qué reacciones ocurren en la vida real.
                Aprenderás combinaciones útiles y también <span className="text-red-400 font-black">mezclas peligrosas que nunca debes hacer</span> en casa.
              </p>
              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400">Seguras</span>
                <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-400">Curiosas</span>
                <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-400">Peligrosas</span>
              </div>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="cyan" className="px-10 py-4 text-sm mt-1">
                <Sparkles size={16} /> Empezar el tutorial
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Slot de mezcla ──────────────────────────────────────────────────────────
const MixSlot = ({ el, placeholder }) => (
  <div className={`w-28 h-28 rounded-[28px] border-2 flex flex-col items-center justify-center transition-all ${el ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/20' : 'border-white/15 border-dashed bg-white/3'}`}>
    {el ? (
      <>
        <span className="text-3xl font-display font-black italic text-white leading-none">{el.label}</span>
        <span className="text-[8px] font-black uppercase tracking-wider text-white/50 mt-1">{el.name}</span>
      </>
    ) : (
      <span className="text-4xl font-display font-black text-white/15">{placeholder}</span>
    )}
  </div>
);

export default LabModule;
