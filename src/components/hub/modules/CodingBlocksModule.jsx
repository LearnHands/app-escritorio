import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Play, RotateCcw, Trash2, ChevronRight, X, Lightbulb } from 'lucide-react';
import HandButton from '../HandButton';
import GameInstruction from '../GameInstruction';

const GRID_COLS = 10;
const GRID_ROWS = 7;

const COMMANDS = [
  { id: 'right',  label: '→ Derecha', emoji: '➡️', color: 'cyan',    action: (pos) => ({ ...pos, x: pos.x + 1 }) },
  { id: 'left',   label: '← Izquierda', emoji: '⬅️', color: 'cyan',  action: (pos) => ({ ...pos, x: pos.x - 1 }) },
  { id: 'up',     label: '↑ Arriba',   emoji: '⬆️', color: 'purple', action: (pos) => ({ ...pos, y: pos.y - 1 }) },
  { id: 'down',   label: '↓ Abajo',    emoji: '⬇️', color: 'purple', action: (pos) => ({ ...pos, y: pos.y + 1 }) },
  { id: 'jump',   label: '↑↑ Saltar',  emoji: '🦘', color: 'orange', action: (pos) => ({ ...pos, y: Math.max(0, pos.y - 2) }) },
  { id: 'repeat', label: '🔁 Repetir', emoji: '🔁', color: 'emerald', special: 'repeat' },
];

const COMMANDS_EN = [
  { id: 'right',  label: '→ Right', emoji: '➡️', color: 'cyan',    action: (pos) => ({ ...pos, x: pos.x + 1 }) },
  { id: 'left',   label: '← Left', emoji: '⬅️', color: 'cyan',  action: (pos) => ({ ...pos, x: pos.x - 1 }) },
  { id: 'up',     label: '↑ Up',   emoji: '⬆️', color: 'purple', action: (pos) => ({ ...pos, y: pos.y - 1 }) },
  { id: 'down',   label: '↓ Down',    emoji: '⬇️', color: 'purple', action: (pos) => ({ ...pos, y: pos.y + 1 }) },
  { id: 'jump',   label: '↑↑ Jump',  emoji: '🦘', color: 'orange', action: (pos) => ({ ...pos, y: Math.max(0, pos.y - 2) }) },
  { id: 'repeat', label: '🔁 Repeat', emoji: '🔁', color: 'emerald', special: 'repeat' },
];

const LEVELS = [
  {
    id: 1, title: 'Primer Paso',
    desc: 'Mueve el robot hasta la estrella.',
    start: { x: 0, y: 3 }, goal: { x: 4, y: 3 },
    obstacles: [],
    minSteps: 4,
    hint: 'Usa "→ Derecha" 4 veces',
    reward: 50,
  },
  {
    id: 2, title: 'Esquina',
    desc: 'La estrella está arriba a la derecha.',
    start: { x: 0, y: 5 }, goal: { x: 5, y: 1 },
    obstacles: [],
    minSteps: 9,
    hint: 'Combina "→ Derecha" y "↑ Arriba"',
    reward: 70,
  },
  {
    id: 3, title: 'Obstáculos',
    desc: 'Evita las paredes y llega a la estrella.',
    start: { x: 0, y: 3 }, goal: { x: 8, y: 3 },
    obstacles: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }],
    minSteps: 6,
    hint: 'Sube, avanza y baja para rodear el obstáculo',
    reward: 90,
  },
  {
    id: 4, title: 'Bucle',
    desc: 'Usa Repetir para hacer el robot más eficiente.',
    start: { x: 0, y: 2 }, goal: { x: 7, y: 6 },
    obstacles: [],
    minSteps: 5,
    hint: 'Agrega "→ Derecha" y "↓ Abajo", luego usa Repetir',
    reward: 100,
  },
  {
    id: 5, title: 'Laberinto',
    desc: 'El camino no es recto. ¡Encuentra la ruta!',
    start: { x: 0, y: 0 }, goal: { x: 9, y: 6 },
    obstacles: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
      { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 },
      { x: 7, y: 0 }, { x: 7, y: 1 }, { x: 7, y: 2 },
    ],
    minSteps: 8,
    hint: 'Hay varias rutas. Experimenta.',
    reward: 120,
  },
];

const LEVELS_EN = [
  {
    id: 1, title: 'First Step',
    desc: 'Move the robot to the star.',
    start: { x: 0, y: 3 }, goal: { x: 4, y: 3 },
    obstacles: [],
    minSteps: 4,
    hint: 'Use "→ Right" 4 times',
    reward: 50,
  },
  {
    id: 2, title: 'Corner',
    desc: 'The star is at the top right.',
    start: { x: 0, y: 5 }, goal: { x: 5, y: 1 },
    obstacles: [],
    minSteps: 9,
    hint: 'Combine "→ Right" and "↑ Up"',
    reward: 70,
  },
  {
    id: 3, title: 'Obstacles',
    desc: 'Avoid the walls and reach the star.',
    start: { x: 0, y: 3 }, goal: { x: 8, y: 3 },
    obstacles: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }],
    minSteps: 6,
    hint: 'Go up, forward, and down to bypass the obstacle',
    reward: 90,
  },
  {
    id: 4, title: 'Loop',
    desc: 'Use Repeat to make the robot more efficient.',
    start: { x: 0, y: 2 }, goal: { x: 7, y: 6 },
    obstacles: [],
    minSteps: 5,
    hint: 'Add "→ Right" and "↓ Down", then use Repeat',
    reward: 100,
  },
  {
    id: 5, title: 'Maze',
    desc: 'The path is not straight. Find the way!',
    start: { x: 0, y: 0 }, goal: { x: 9, y: 6 },
    obstacles: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
      { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 },
      { x: 7, y: 0 }, { x: 7, y: 1 }, { x: 7, y: 2 },
    ],
    minSteps: 8,
    hint: 'There are several paths. Experiment.',
    reward: 120,
  },
];

const CodingBlocksModule = memo(({ addPoints, lang = 'es' }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [robotPos, setRobotPos] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [success, setSuccess] = useState(false);
  const [fail, setFail] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [allDone, setAllDone] = useState(false);
  const [solvedLevels, setSolvedLevels] = useState(new Set());
  const [repeatCount, setRepeatCount] = useState(1);
  const overlayOpen = showIntro || showHint;

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;
  const runRef = useRef(null);

  const commands = lang === 'es' ? COMMANDS : COMMANDS_EN;
  const levels = lang === 'es' ? LEVELS : LEVELS_EN;
  const level = levels[levelIdx];

  useEffect(() => {
    setRobotPos({ ...level.start });
    setSequence([]);
    setIsRunning(false);
    setStepIdx(-1);
    setSuccess(false);
    setFail(false);
    clearTimeout(runRef.current);
  }, [levelIdx, level]);

  const addCommand = useCallback((cmd) => {
    if (isRunning || sequence.length >= 12) return;
    if (cmd.special === 'repeat') {
      setRepeatCount(r => (r % 3) + 1);
      return;
    }
    setSequence(prev => [...prev, cmd]);
  }, [isRunning, sequence.length]);

  const removeLastCommand = useCallback(() => {
    if (isRunning) return;
    setSequence(prev => prev.slice(0, -1));
  }, [isRunning]);

  const resetLevel = useCallback(() => {
    setRobotPos({ ...level.start });
    setSequence([]);
    setIsRunning(false);
    setStepIdx(-1);
    setSuccess(false);
    setFail(false);
    clearTimeout(runRef.current);
  }, [level]);

  const runSequence = useCallback(() => {
    if (!sequence.length || isRunning) return;
    setIsRunning(true);
    setFail(false);
    setSuccess(false);

    // Expand repeat
    const expanded = [];
    sequence.forEach(cmd => {
      for (let r = 0; r < repeatCount; r++) expanded.push(cmd);
    });

    let pos = { ...level.start };
    let step = 0;

    const executeStep = () => {
      if (step >= expanded.length) {
        // Check if reached goal
        if (pos.x === level.goal.x && pos.y === level.goal.y) {
          setSuccess(true);
          if (!solvedLevels.has(levelIdx)) {
            addPointsRef.current(level.reward);
            setSolvedLevels(s => { const ns = new Set(s); ns.add(levelIdx); return ns; });
          }
          // Auto-advance after 2 seconds
          setTimeout(() => {
            if (levelIdx + 1 < levels.length) {
              setLevelIdx(l => l + 1);
            } else {
              setAllDone(true);
            }
          }, 2000);
        } else {
          setFail(true);
        }
        setIsRunning(false);
        setStepIdx(-1);
        return;
      }
      setStepIdx(step);
      const nextPos = expanded[step].action(pos);
      const oob = nextPos.x < 0 || nextPos.x >= GRID_COLS || nextPos.y < 0 || nextPos.y >= GRID_ROWS;
      const blocked = level.obstacles.some(o => o.x === nextPos.x && o.y === nextPos.y);

      if (oob || blocked) {
        setFail(true);
        setIsRunning(false);
        setStepIdx(-1);
        return;
      }

      pos = nextPos;
      setRobotPos({ ...pos });
      step++;
      runRef.current = setTimeout(executeStep, 420);
    };
    runRef.current = setTimeout(executeStep, 200);
  }, [sequence, isRunning, level, repeatCount, levelIdx, solvedLevels]);

  const nextLevel = useCallback(() => {
    if (levelIdx + 1 >= levels.length) { setAllDone(true); return; }
    setLevelIdx(l => l + 1);
  }, [levelIdx, levels.length]);

  const cellSize = 52;
  const gridW = GRID_COLS * cellSize;
  const gridH = GRID_ROWS * cellSize;

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <Code2 size={16} className="text-emerald-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
          {lang === 'es' ? 'Programación Gestual' : 'Gesture Coding'}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
          {lang === 'es' ? `Nivel ${levelIdx + 1}/${levels.length} — ${level.title}` : `Level ${levelIdx + 1}/${levels.length} — ${level.title}`}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{level.desc}</span>
      </div>

      {/* Level dots */}
      <div className="absolute top-4 right-6 z-30 flex items-center gap-2">
        {levels.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${solvedLevels.has(i) ? 'bg-emerald-400' : i === levelIdx ? 'bg-cyan-400' : 'bg-white/20'}`} />
        ))}
      </div>

      {/* Main layout */}
      <div className={`flex-1 flex items-center justify-center gap-8 pt-16 pb-2 px-6 ${overlayOpen ? 'pointer-events-none' : ''}`}>

        {/* Grid */}
        <div className="flex-shrink-0 relative" style={{ width: gridW, height: gridH }}>
          {/* Grid cells */}
          {Array.from({ length: GRID_ROWS }, (_, row) =>
            Array.from({ length: GRID_COLS }, (_, col) => {
              const isObstacle = level.obstacles.some(o => o.x === col && o.y === row);
              const isGoal = level.goal.x === col && level.goal.y === row;
              const isStart = level.start.x === col && level.start.y === row;
              return (
                <div key={`${col}-${row}`} className={`absolute border border-white/8 flex items-center justify-center text-lg
                  ${isObstacle ? 'bg-red-900/40' : isGoal ? 'bg-emerald-900/30' : isStart ? 'bg-purple-900/20' : 'bg-white/3'}`}
                  style={{ left: col * cellSize, top: row * cellSize, width: cellSize, height: cellSize }}>
                  {isObstacle && '🧱'}
                  {isGoal && !isObstacle && '⭐'}
                </div>
              );
            })
          )}
          {/* Robot */}
          {robotPos && (
            <motion.div
              className="absolute flex items-center justify-center text-2xl z-10"
              style={{ width: cellSize, height: cellSize }}
              animate={{ left: robotPos.x * cellSize, top: robotPos.y * cellSize }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              🤖
            </motion.div>
          )}
        </div>

        {/* Right panel: sequence + controls */}
        <div className="flex flex-col gap-3 w-52 flex-shrink-0">
          {/* Sequence display */}
          <div className="glass-dark rounded-2xl border border-white/10 p-3 min-h-[120px]">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">
              {lang === 'es' ? `Secuencia (${sequence.length}/12)` : `Sequence (${sequence.length}/12)`}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sequence.map((cmd, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black border ${i === stepIdx ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/15 bg-white/8'}`}>
                  {cmd.emoji}
                </motion.div>
              ))}
              {!sequence.length && <p className="text-[9px] text-white/25 italic">{lang === 'es' ? 'Sin comandos' : 'No commands'}</p>}
            </div>
          </div>

          {/* Repeat indicator */}
          <div className="glass-dark rounded-xl border border-emerald-500/20 px-3 py-2 flex items-center gap-2">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">
              {lang === 'es' ? '🔁 Repetir:' : '🔁 Repeat:'}
            </span>
            <span className="text-[13px] font-black text-white">{repeatCount}×</span>
          </div>

          {/* Run/Reset in a spacious 2x2 grid */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <HandButton
              onClick={runSequence}
              disabled={overlayOpen || isRunning}
              dwellMs={900}
              variant="emerald"
              className={`px-3 py-4 text-[10px] flex-col gap-1.5 h-auto justify-center ${overlayOpen ? 'opacity-20' : ''}`}
            >
              <Play size={14} />
              <span>{lang === 'es' ? 'Ejecutar' : 'Run'}</span>
            </HandButton>
            
            <HandButton
              onClick={removeLastCommand}
              disabled={overlayOpen || isRunning || !sequence.length}
              dwellMs={850}
              variant="orange"
              className={`px-3 py-4 text-[10px] flex-col gap-1.5 h-auto justify-center ${overlayOpen || !sequence.length ? 'opacity-20' : ''}`}
            >
              <Trash2 size={14} />
              <span>{lang === 'es' ? 'Borrar' : 'Delete'}</span>
            </HandButton>
            
            <HandButton
              onClick={resetLevel}
              disabled={overlayOpen || isRunning}
              dwellMs={900}
              variant="red"
              className={`px-3 py-4 text-[10px] flex-col gap-1.5 h-auto justify-center ${overlayOpen ? 'opacity-20' : ''}`}
            >
              <RotateCcw size={14} />
              <span>{lang === 'es' ? 'Reiniciar' : 'Reset'}</span>
            </HandButton>
            
            <HandButton
              onClick={() => setShowHint(true)}
              disabled={overlayOpen || isRunning}
              dwellMs={950}
              variant="default"
              className={`px-3 py-4 text-[10px] flex-col gap-1.5 h-auto justify-center !bg-white/5 !border-white/10 ${overlayOpen ? 'opacity-20' : ''}`}
            >
              <Lightbulb size={14} />
              <span>{lang === 'es' ? 'Pista' : 'Hint'}</span>
            </HandButton>
          </div>
          {success && (
            <HandButton onClick={nextLevel} disabled={overlayOpen} dwellMs={800} variant="cyan" className="px-4 py-3 text-[11px] w-full mt-1">
              <ChevronRight size={14} /> {levelIdx + 1 < levels.length ? (lang === 'es' ? 'Siguiente' : 'Next') : (lang === 'es' ? 'Terminar' : 'Finish')}
            </HandButton>
          )}
        </div>
      </div>

      {/* Command palette (bottom) */}
      <div className={`relative z-20 pb-4 px-6 ${overlayOpen ? 'pointer-events-none' : ''}`}>
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 text-center mb-2">
          {lang === 'es' ? 'Toca un bloque para añadirlo a la secuencia' : 'Touch a block to add it to the sequence'}
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {commands.map(cmd => (
            <HandButton key={cmd.id} onClick={() => addCommand(cmd)} disabled={overlayOpen || isRunning} dwellMs={650} cooldownMs={400}
              variant={cmd.color} className={`px-4 py-3 text-[10px] rounded-xl min-w-[90px] ${overlayOpen || isRunning ? 'opacity-20' : ''}`}>
              <span className="text-base">{cmd.emoji}</span> {cmd.label}
              {cmd.special === 'repeat' && <span className="ml-1 text-white/70">({repeatCount}×)</span>}
            </HandButton>
          ))}
        </div>
      </div>

      {/* Success/Fail feedback */}
      <AnimatePresence>
        {(success || fail) && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
            <div className={`px-6 py-3 rounded-2xl border shadow-xl text-center ${success ? 'border-emerald-500/50 bg-emerald-900/40' : 'border-red-500/50 bg-red-900/40'}`}>
              <p className="text-sm font-black uppercase tracking-widest">
                {success 
                  ? (lang === 'es' ? '⭐ ¡Llegaste a la meta!' : '⭐ You reached the goal!') 
                  : (lang === 'es' ? '❌ El robot se bloqueó' : '❌ The robot crashed')}
              </p>
              {!success && (
                <p className="text-[10px] text-white/50 mt-1">
                  {lang === 'es' ? 'Modifica la secuencia e intenta de nuevo' : 'Modify the sequence and try again'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint overlay */}
      <AnimatePresence>
        {showHint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-[28px] border border-yellow-500/30 bg-[#0a0a18]/95 shadow-2xl p-7 flex flex-col items-center gap-4 text-center">
              <div className="text-5xl">💡</div>
              <h3 className="text-lg font-display font-black italic uppercase text-yellow-400">
                {lang === 'es' ? 'Pista' : 'Hint'}
              </h3>
              <p className="text-[13px] text-white/70 leading-relaxed">{level.hint}</p>
              <HandButton onClick={() => setShowHint(false)} dwellMs={800} graceMs={500} variant="default" className="px-8 py-3 text-[10px] !bg-white/5">
                <X size={12} /> {lang === 'es' ? 'Cerrar' : 'Close'}
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro */}
      <AnimatePresence>
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-lg rounded-[36px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="text-7xl">🤖</div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">
                {lang === 'es' ? 'Programación Gestual' : 'Gesture Coding'}
              </h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                {lang === 'es' 
                  ? <>Activa los <span className="text-emerald-400 font-black">bloques de comandos</span> con tu mano para construir una secuencia. Luego pulsa <span className="text-cyan-400 font-black">Ejecutar</span> para que el robot 🤖 siga tus instrucciones y llegue a la ⭐ estrella.</>
                  : <>Activate the <span className="text-emerald-400 font-black">command blocks</span> with your hand to build a sequence. Then press <span className="text-cyan-400 font-black">Run</span> to make the robot 🤖 follow your instructions and reach the ⭐ star.</>}
              </p>
              <p className="text-[11px] text-white/40 leading-relaxed">
                {lang === 'es' 
                  ? <>Usa <span className="text-emerald-400 font-black">🔁 Repetir</span> para ejecutar toda la secuencia múltiples veces — ¡como un bucle de programación!</>
                  : <>Use <span className="text-emerald-400 font-black">🔁 Repeat</span> to execute the entire sequence multiple times — just like a programming loop!</>}
              </p>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="emerald" className="px-10 py-4 text-sm">
                <Code2 size={16} /> {lang === 'es' ? '¡Programar!' : 'Code!'}
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All done */}
      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-[36px] border border-emerald-500/40 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="text-7xl">🏆</div>
              <h2 className="text-3xl font-display font-black italic uppercase text-emerald-400">
                {lang === 'es' ? '¡Programador Experto!' : 'Expert Coder!'}
              </h2>
              <p className="text-[13px] text-white/60 leading-relaxed">
                {lang === 'es' 
                  ? 'Completaste todos los niveles. Ya entiendes secuencias, condiciones y bucles — ¡los pilares de la programación!'
                  : 'You completed all levels. You now understand sequences, conditions, and loops — the pillars of programming!'}
              </p>
              <HandButton onClick={() => { setLevelIdx(0); setAllDone(false); }} dwellMs={900} graceMs={600} variant="emerald" className="px-10 py-4 text-sm">
                <RotateCcw size={16} /> {lang === 'es' ? 'Jugar de nuevo' : 'Play Again'}
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GameInstruction
        messageEs="Toca los bloques de comandos con tu mano para programar al robot"
        messageEn="Touch the command blocks with your hand to program the robot"
        lang={lang}
        icon="🤖"
        position="top"
      />
    </div>
  );
});

export default CodingBlocksModule;
