import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RotateCcw, Info, X, CheckCircle2, ChevronRight } from 'lucide-react';
import HandButton from '../HandButton';

// Historical events for Latin American / World history
const ALL_EVENTS = [
  { id: 'e1',  year: 1492, label: 'Llegada de Colón a América', emoji: '⛵', category: 'América', desc: 'Cristóbal Colón llega a las Américas el 12 de octubre de 1492, iniciando la era de exploración europea.' },
  { id: 'e2',  year: 1532, label: 'Conquista del Imperio Inca', emoji: '🏔️', category: 'América', desc: 'Francisco Pizarro captura al Inca Atahualpa en Cajamarca, marcando el fin del Imperio Inca.' },
  { id: 'e3',  year: 1776, label: 'Independencia de EE.UU.', emoji: '🦅', category: 'Mundo', desc: 'Las 13 colonias americanas declaran su independencia de Gran Bretaña el 4 de julio de 1776.' },
  { id: 'e4',  year: 1789, label: 'Revolución Francesa', emoji: '🗼', category: 'Mundo', desc: 'La Revolución Francesa derroca a la monarquía y proclama los principios de Libertad, Igualdad y Fraternidad.' },
  { id: 'e5',  year: 1822, label: 'Independencia de Ecuador', emoji: '🇪🇨', category: 'Ecuador', desc: 'El 24 de mayo de 1822, la Batalla de Pichincha libera a Quito del dominio español.' },
  { id: 'e6',  year: 1869, label: 'Apertura del Canal de Suez', emoji: '🚢', category: 'Mundo', desc: 'El Canal de Suez conecta el Mar Mediterráneo con el Mar Rojo, revolucionando el comercio marítimo.' },
  { id: 'e7',  year: 1903, label: 'Primer vuelo de los Wright', emoji: '✈️', category: 'Mundo', desc: 'Los hermanos Wright realizan el primer vuelo motorizado en Kitty Hawk, Carolina del Norte.' },
  { id: 'e8',  year: 1945, label: 'Fin de la Segunda Guerra Mundial', emoji: '🕊️', category: 'Mundo', desc: 'La rendición de Alemania (mayo) y Japón (agosto) de 1945 pone fin a la Segunda Guerra Mundial.' },
  { id: 'e9',  year: 1969, label: 'El hombre llega a la Luna', emoji: '🌙', category: 'Mundo', desc: 'Neil Armstrong y Buzz Aldrin se convierten en los primeros humanos en pisar la Luna el 20 de julio de 1969.' },
  { id: 'e10', year: 1991, label: 'Fin de la Guerra Fría', emoji: '🌍', category: 'Mundo', desc: 'La disolución de la Unión Soviética en 1991 pone fin a la Guerra Fría entre EE.UU. y la URSS.' },
  { id: 'e11', year: 1830, label: 'Separación de la Gran Colombia', emoji: '🗺️', category: 'América', desc: 'Ecuador, Venezuela y Colombia se separan de la Gran Colombia, formando naciones independientes.' },
  { id: 'e12', year: 1960, label: 'Ecuador en la ONU', emoji: '🌐', category: 'Ecuador', desc: 'Ecuador refuerza su participación en la Organización de Naciones Unidas en los años 60.' },
];

const ROUNDS = [
  { ids: ['e5','e1','e9','e3'],  label: 'América y Mundo', desc: 'Ordena estos 4 eventos del más antiguo al más reciente.' },
  { ids: ['e2','e4','e7','e8'],  label: 'Conquistas y Guerras', desc: 'Cronología de eventos históricos clave.' },
  { ids: ['e1','e5','e10','e6'], label: 'Siglos XV–XX', desc: '4 eventos que abarcan 5 siglos de historia.' },
  { ids: ['e3','e4','e11','e9'], label: 'Independencias y Exploración', desc: 'Desde independencias hasta la conquista espacial.' },
];

const TimelineModule = memo(({ addPoints }) => {
  const [roundIdx, setRoundIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [placed, setPlaced] = useState({}); // slotIdx → eventId
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState(null);
  const [showInfo, setShowInfo] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [score, setScore] = useState(0);
  const [roundResults, setRoundResults] = useState([]);

  const addPointsRef = React.useRef(addPoints);
  addPointsRef.current = addPoints;

  const round = ROUNDS[roundIdx];
  const events = round.ids.map(id => ALL_EVENTS.find(e => e.id === id));
  const sortedByYear = [...events].sort((a, b) => a.year - b.year);

  const shuffled = React.useMemo(() => {
    const arr = [...events];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [roundIdx]);

  const selectCard = useCallback((event) => {
    if (checked) return;
    setSelected(prev => prev?.id === event.id ? null : event);
  }, [checked]);

  const placeInSlot = useCallback((slotIdx) => {
    if (!selected || checked) return;
    setPlaced(prev => {
      const next = { ...prev };
      // Remove this event from any other slot
      Object.keys(next).forEach(k => { if (next[k] === selected.id) delete next[k]; });
      // If slot was taken by another event, deplace it
      next[slotIdx] = selected.id;
      return next;
    });
    setSelected(null);
  }, [selected, checked]);

  const checkAnswer = useCallback(() => {
    if (Object.keys(placed).length < 4) return;
    let correct = 0;
    sortedByYear.forEach((ev, i) => {
      if (placed[i] === ev.id) correct++;
    });
    const pts = correct * 25;
    addPointsRef.current(pts);
    setScore(s => s + pts);
    setRoundResults(r => [...r, { round: roundIdx + 1, correct, total: 4, pts }]);
    setChecked(true);
    setResult({ correct, total: 4, pts });
  }, [placed, sortedByYear, roundIdx]);

  const nextRound = useCallback(() => {
    if (roundIdx + 1 >= ROUNDS.length) {
      setResult({ allDone: true });
      return;
    }
    setRoundIdx(r => r + 1);
    setPlaced({});
    setSelected(null);
    setChecked(false);
    setResult(null);
  }, [roundIdx]);

  const reset = useCallback(() => {
    setRoundIdx(0);
    setPlaced({});
    setSelected(null);
    setChecked(false);
    setResult(null);
    setScore(0);
    setRoundResults([]);
  }, []);

  const unplaced = shuffled.filter(ev => !Object.values(placed).includes(ev.id));
  const allPlaced = Object.keys(placed).length === 4;

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <Clock size={16} className="text-amber-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Líneas de Tiempo</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Ronda {roundIdx + 1}/{ROUNDS.length} — {round.label}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Puntos: {score}</span>
      </div>

      {/* Round dots */}
      <div className="absolute top-4 right-6 z-30 flex items-center gap-2">
        {ROUNDS.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${roundResults[i]?.correct === 4 ? 'bg-emerald-400' : i === roundIdx ? 'bg-amber-400' : 'bg-white/20'}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center gap-5 pt-16 pb-2 px-8">

        {/* Instruction */}
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{round.desc}</p>
        {selected && <p className="text-[10px] font-black text-cyan-400 animate-pulse">Seleccionado: {selected.emoji} {selected.label} — Ahora toca una casilla de la línea de tiempo</p>}

        {/* Timeline slots */}
        <div className="w-full max-w-4xl">
          <div className="relative flex items-center gap-0">
            {/* Timeline line */}
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-amber-500/50 rounded-full" style={{ transform: 'translateY(-50%)', zIndex: 0 }} />

            {sortedByYear.map((correctEv, slotIdx) => {
              const placedId = placed[slotIdx];
              const placedEv = placedId ? ALL_EVENTS.find(e => e.id === placedId) : null;
              const isCorrect = checked && placedId === correctEv.id;
              const isWrong = checked && placedId && placedId !== correctEv.id;

              return (
                <div key={slotIdx} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                  {/* Year hint (only after check) */}
                  {checked && (
                    <div className="text-[8px] font-black text-amber-400 -mb-1">{correctEv.year}</div>
                  )}
                  {!checked && (
                    <div className="text-[8px] font-black text-white/20">Posición {slotIdx + 1}</div>
                  )}

                  {/* Slot */}
                  <HandButton
                    onClick={() => placeInSlot(slotIdx)}
                    dwellMs={selected ? 600 : 99999}
                    variant={isCorrect ? 'emerald' : isWrong ? 'red' : selected ? 'cyan' : 'default'}
                    className={`w-full min-h-[90px] !rounded-2xl flex-col gap-1 !p-2 text-[9px] leading-tight text-center relative
                      ${!checked && selected ? '!border-cyan-400 !border-2 !shadow-[0_0_15px_rgba(0,200,255,0.3)]' : ''}
                      ${!checked && !selected ? '!bg-white/5 !border-white/10' : ''}`}
                  >
                    {placedEv ? (
                      <>
                        <span className="text-xl">{placedEv.emoji}</span>
                        <span className="font-black text-center">{placedEv.label}</span>
                        {checked && (
                          <span className={`text-[8px] font-black ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                            {isCorrect ? '✓ Correcto!' : `✗ Era ${correctEv.year}`}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-white/25 text-[9px] italic">{slotIdx + 1}°</span>
                    )}
                  </HandButton>

                  {/* Dot on timeline */}
                  <div className={`w-3 h-3 rounded-full border-2 -mt-1 ${isCorrect ? 'bg-emerald-400 border-emerald-400' : isWrong ? 'bg-red-400 border-red-400' : placedEv ? 'bg-cyan-400 border-cyan-400' : 'bg-white/20 border-white/20'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Event cards (unplaced) */}
        <div className="w-full max-w-4xl">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 text-center">
            {checked ? 'Eventos del período' : 'Toca un evento para seleccionarlo'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {(checked ? events : unplaced).map(ev => {
              const isSelected = selected?.id === ev.id;
              return (
                <div key={ev.id} className="flex flex-col items-center gap-1">
                  <HandButton
                    onClick={() => checked ? setShowInfo(ev) : selectCard(ev)}
                    dwellMs={700}
                    variant={isSelected ? 'cyan' : 'default'}
                    className={`px-4 py-3 !rounded-2xl flex-col gap-1 min-w-[130px] text-[10px] text-center
                      ${isSelected ? '' : '!bg-white/5 !border-white/10'}
                      ${checked ? 'opacity-80' : ''}`}
                  >
                    <span className="text-2xl">{ev.emoji}</span>
                    <span className="font-black leading-tight">{ev.label}</span>
                    {checked && <span className="text-amber-400 font-black">{ev.year}</span>}
                  </HandButton>
                  {checked && (
                    <HandButton onClick={() => setShowInfo(ev)} dwellMs={700} variant="default" className="px-3 py-1 text-[8px] !bg-white/5 !border-white/10 !rounded-lg">
                      <Info size={10} /> Info
                    </HandButton>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {!checked && allPlaced && (
            <HandButton onClick={checkAnswer} dwellMs={700} variant="emerald" className="px-8 py-3 text-[11px]">
              <CheckCircle2 size={14} /> Verificar orden
            </HandButton>
          )}
          {checked && result && !result.allDone && (
            <HandButton onClick={nextRound} dwellMs={700} variant="cyan" className="px-8 py-3 text-[11px]">
              <ChevronRight size={14} /> {roundIdx + 1 < ROUNDS.length ? 'Siguiente ronda' : 'Ver resultados'}
            </HandButton>
          )}
          <HandButton onClick={() => { setPlaced({}); setSelected(null); setChecked(false); setResult(null); }} dwellMs={800} variant="red" className="px-5 py-3 text-[10px]">
            <RotateCcw size={12} /> Reiniciar ronda
          </HandButton>
        </div>
      </div>

      {/* Result feedback */}
      <AnimatePresence>
        {result && !result.allDone && checked && (
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
            <div className={`px-6 py-3 rounded-2xl border shadow-xl text-center ${result.correct === 4 ? 'border-emerald-500/50 bg-emerald-900/40' : result.correct >= 2 ? 'border-amber-500/50 bg-amber-900/30' : 'border-red-500/50 bg-red-900/30'}`}>
              <p className="text-sm font-black uppercase tracking-widest">
                {result.correct}/4 correctos — +{result.pts} pts {result.correct === 4 ? '🏆' : result.correct >= 2 ? '👍' : '📚'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-[32px] border border-amber-500/30 bg-[#0a0a18]/95 shadow-2xl p-7 flex flex-col items-center gap-4 text-center">
              <span className="text-6xl">{showInfo.emoji}</span>
              <div>
                <h3 className="text-xl font-display font-black italic uppercase text-amber-400">{showInfo.label}</h3>
                <p className="text-2xl font-black text-white/40 mt-1">{showInfo.year}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">{showInfo.category}</span>
              <p className="text-[12px] text-white/70 leading-relaxed">{showInfo.desc}</p>
              <HandButton onClick={() => setShowInfo(null)} dwellMs={800} graceMs={500} variant="default" className="px-8 py-3 text-[10px] !bg-white/5">
                <X size={12} /> Cerrar
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
              className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="text-7xl">📜</div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">Líneas de Tiempo</h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                Selecciona un evento histórico con tu mano y colócalo en el orden correcto de la línea de tiempo —
                del <span className="text-amber-400 font-black">más antiguo</span> al <span className="text-orange-400 font-black">más reciente</span>.
                Aprende historia de América y el mundo.
              </p>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="orange" className="px-10 py-4 text-sm">
                <Clock size={16} /> ¡Explorar la historia!
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All done */}
      <AnimatePresence>
        {result?.allDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-[36px] border border-amber-500/40 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="text-7xl">🏛️</div>
              <h2 className="text-3xl font-display font-black italic uppercase text-amber-400">¡Historiador Experto!</h2>
              <p className="text-[13px] text-white/60">Puntuación total: <span className="text-amber-400 font-black">{score} pts</span></p>
              <div className="w-full space-y-2">
                {roundResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-black text-white/60">Ronda {r.round}</span>
                    <span className="text-[10px] font-black text-amber-400">{r.correct}/4 ✓ — +{r.pts} pts</span>
                  </div>
                ))}
              </div>
              <HandButton onClick={reset} dwellMs={900} graceMs={600} variant="orange" className="px-10 py-4 text-sm">
                <RotateCcw size={16} /> Jugar de nuevo
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TimelineModule;
