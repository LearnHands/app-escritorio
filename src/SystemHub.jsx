import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Palette, Music, Puzzle, Play, ArrowLeft, Trophy, LogOut, BookOpen,
  Gamepad2, Compass, Shield, Award, Lock, FlaskConical, GraduationCap, Joystick,
  Zap, Atom, Code2, DollarSign, Clock, Heart,
} from 'lucide-react';

// Hooks
import { useMediaPipe } from './hooks/useMediaPipe';

// Components — always needed
import LayeredEngine from './components/hub/LayeredEngine';
import HandButton    from './components/hub/HandButton';

// ── Game modules — lazy-loaded so each becomes its own JS chunk ───────────────
// V8 only parses the active module's code; startup bundle stays small.
const PianoModule       = lazy(() => import('./components/hub/modules/PianoModule'));
const DrawingModule     = lazy(() => import('./components/hub/modules/DrawingModule'));
const PuzzleModule      = lazy(() => import('./components/hub/modules/PuzzleModule'));
const SolarModule       = lazy(() => import('./components/hub/modules/SolarModule'));
const BricksModule      = lazy(() => import('./components/hub/modules/BricksModule'));
const SyllablesModule   = lazy(() => import('./components/hub/modules/SyllablesModule'));
const EcoGuardianModule = lazy(() => import('./components/hub/modules/EcoGuardianModule'));
const MathAbacusModule  = lazy(() => import('./components/hub/modules/MathAbacusModule'));
const SolarSystemModule = lazy(() => import('./components/hub/modules/SolarSystemModule'));
const LabModule         = lazy(() => import('./components/hub/modules/LabModule'));
const CircuitsModule    = lazy(() => import('./components/hub/modules/CircuitsModule'));
const AtomsModule       = lazy(() => import('./components/hub/modules/AtomsModule'));
const CodingBlocksModule= lazy(() => import('./components/hub/modules/CodingBlocksModule'));
const AccountingModule  = lazy(() => import('./components/hub/modules/AccountingModule'));
const TimelineModule    = lazy(() => import('./components/hub/modules/TimelineModule'));
const AnatomyModule     = lazy(() => import('./components/hub/modules/AnatomyModule'));

import puceLogo from './assets/puce.png';

const SCORE_KEY = 'learnhands_score';
// Time (ms) the menu cards stay locked after entering the menu
const MENU_LOCK_MS = 2000;

const SystemHub = ({ onExit }) => {
  const [view, setView] = useState('HOME'); // HOME, MENU, GAME
  const [currentGame, setCurrentGame] = useState(null);
  const [score, setScore] = useState(() => parseInt(localStorage.getItem(SCORE_KEY) || '0', 10));
  const [menuLocked, setMenuLocked] = useState(false);
  const menuLockTimerRef = useRef(null);

  const videoRef = useRef(null);
  const { isLoaded, initMediaPipe, error } = useMediaPipe();

  useEffect(() => {
    initMediaPipe(videoRef.current);
  }, [initMediaPipe]);

  // Enable 2-hand detection only for the Solar System module
  useEffect(() => {
    window.activeHandCount = currentGame === 'SOLAR_SYS' ? 2 : 1;
  }, [currentGame]);

  const level = useMemo(() => Math.floor(score / 100) + 1, [score]);

  const addPoints = (p) => {
    setScore(prev => {
      const newScore = prev + p;
      localStorage.setItem(SCORE_KEY, newScore.toString());
      return newScore;
    });
  };

  const goToMenu = () => {
    setView('MENU');
    setMenuLocked(true);
    clearTimeout(menuLockTimerRef.current);
    menuLockTimerRef.current = setTimeout(() => setMenuLocked(false), MENU_LOCK_MS);
  };

  return (
    <LayeredEngine videoRef={videoRef} isLoaded={isLoaded} error={error} transparent={!(view === 'GAME' && currentGame === 'PIZARRA')}>
      <AnimatePresence mode="wait">
        {view === 'HOME' && (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col items-center justify-center p-20">
            {/* Logo PUCE */}
            <div className="absolute top-12 left-12 flex items-center gap-6">
              <img src={puceLogo} alt="PUCE Logo" className="h-20 w-auto drop-shadow-lg" />
              <div className="h-12 w-[1px] bg-white/20" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Sede Quito</span>
            </div>

            <div className="glass p-16 rounded-[80px] border border-white/10 flex flex-col items-center gap-12 text-center max-w-2xl w-full shadow-2xl relative bg-black/40 backdrop-blur-md">
              <div className="absolute -top-12 w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl animate-bounce-slow border border-white/20">🖐️</div>
              <div className="space-y-4">
                <h2 className="text-6xl font-display font-black tracking-tighter italic uppercase text-gradient">LearnHands Hub</h2>
                <p className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px] italic">Plataforma Educativa de Movimiento Natural</p>
              </div>

              <div className="flex flex-col items-center gap-6 w-full">
                <HandButton onClick={goToMenu} className="px-20 py-10 text-2xl w-full max-w-md h-32 animate-pulse" dwellMs={800}>
                  <Play fill="white" size={32} /> COMENZAR
                </HandButton>
                <div className="flex gap-4">
                  <HandButton onClick={onExit} className="px-12 py-3.5 text-[10px]" variant="red" dwellMs={600}>
                    <LogOut size={12} /> Salir
                  </HandButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'MENU' && (
          <motion.div key="menu" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="absolute top-12 left-12 flex items-center gap-8">
              <HandButton onClick={() => setView('HOME')} className="p-4" variant="red" dwellMs={600}><ArrowLeft /></HandButton>
              <img src={puceLogo} alt="PUCE Logo" className="h-16 w-auto drop-shadow-2xl" />
            </div>

            {/* Lock countdown badge */}
            <AnimatePresence>
              {menuLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-12 right-12 flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl"
                >
                  <Lock size={12} className="text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Preparando…</span>
                </motion.div>
              )}
            </AnimatePresence>

            <h2 className="text-4xl md:text-5xl font-display font-black mb-10 italic text-gradient tracking-tighter uppercase underline decoration-purple-500/30 decoration-8 underline-offset-[16px]">Módulos</h2>

            <div className="w-full max-w-6xl flex flex-col gap-10 overflow-y-auto px-2">
              {/* ── Sección: Aprende (educativos) ── */}
              <div>
                <SectionHeader icon={<GraduationCap size={16} />} title="Aprende" subtitle="Módulos educativos" color="emerald" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
                  <MenuCard icon={<FlaskConical />} title="Laboratorio"     color="cyan"    locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('LAB'); }} />
                  <MenuCard icon={<span className="text-4xl">🪐</span>} title="Sistema Solar" color="cyan" locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('SOLAR_SYS'); }} />
                  <MenuCard icon={<BookOpen />}   title="Sílabas"        color="purple"  locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('SILABAS'); }} />
                  <MenuCard icon={<Award />}      title="Ábaco"          color="orange"  locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('ABACUS'); }} />
                  <MenuCard icon={<Shield />}     title="Reciclaje"      color="emerald" locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('ECO'); }} />
                  <MenuCard icon={<Zap />}        title="Circuitos"      color="orange"  locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('CIRCUITS'); }} />
                  <MenuCard icon={<Atom />}       title="Átomos"         color="cyan"    locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('ATOMS'); }} />
                  <MenuCard icon={<Code2 />}      title="Programación"   color="emerald" locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('CODING'); }} />
                  <MenuCard icon={<DollarSign />} title="Contabilidad"   color="purple"  locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('ACCOUNTING'); }} />
                  <MenuCard icon={<Clock />}      title="Historia"       color="orange"  locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('TIMELINE'); }} />
                  <MenuCard icon={<Heart />}      title="Anatomía"       color="cyan"    locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('ANATOMY'); }} />
                </div>
              </div>

              {/* ── Sección: Diversión (juegos) ── */}
              <div>
                <SectionHeader icon={<Joystick size={16} />} title="Diversión" subtitle="Juegos interactivos" color="orange" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
                  <MenuCard icon={<Palette />}    title="Pizarra"        color="purple"  locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('PIZARRA'); }} />
                  <MenuCard icon={<Music />}      title="Piano"          color="cyan"    locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('PIANO'); }} />
                  <MenuCard icon={<Puzzle />}     title="Puzzle"         color="orange"  locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('PUZZLE'); }} />
                  <MenuCard icon={<Compass />}    title="Constelación"   color="cyan"    locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('SOLAR'); }} />
                  <MenuCard icon={<Gamepad2 />}   title="Balls Crush"    color="orange"  locked={menuLocked} onSelect={() => { setView('GAME'); setCurrentGame('BRICKS'); }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'GAME' && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            {/* Game Content — Suspense shows a spinner while the lazy chunk loads */}
            <div className="flex-1 relative">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Cargando módulo…</span>
                  </div>
                </div>
              }>
                {currentGame === 'PIZARRA'   && <DrawingModule     addPoints={addPoints} />}
                {currentGame === 'PIANO'     && <PianoModule       addPoints={addPoints} videoRef={videoRef} />}
                {currentGame === 'PUZZLE'    && <PuzzleModule      addPoints={addPoints} />}
                {currentGame === 'SOLAR'     && <SolarModule       addPoints={addPoints} />}
                {currentGame === 'BRICKS'    && <BricksModule      addPoints={addPoints} />}
                {currentGame === 'SILABAS'   && <SyllablesModule   addPoints={addPoints} />}
                {currentGame === 'ECO'       && <EcoGuardianModule addPoints={addPoints} />}
                {currentGame === 'ABACUS'    && <MathAbacusModule  addPoints={addPoints} />}
                {currentGame === 'SOLAR_SYS' && <SolarSystemModule addPoints={addPoints} />}
                {currentGame === 'LAB'        && <LabModule          addPoints={addPoints} />}
                {currentGame === 'CIRCUITS'  && <CircuitsModule     addPoints={addPoints} />}
                {currentGame === 'ATOMS'     && <AtomsModule        addPoints={addPoints} />}
                {currentGame === 'CODING'    && <CodingBlocksModule addPoints={addPoints} />}
                {currentGame === 'ACCOUNTING'&& <AccountingModule   addPoints={addPoints} />}
                {currentGame === 'TIMELINE'  && <TimelineModule     addPoints={addPoints} />}
                {currentGame === 'ANATOMY'   && <AnatomyModule      addPoints={addPoints} />}
              </Suspense>
            </div>

            {/* Game Footer Bar */}
            <div className="h-16 glass-dark border-t border-white/10 flex items-center justify-between px-8 z-[100] bg-black/50 backdrop-blur-md">
              <div className="flex items-center gap-6">
                <HandButton onClick={goToMenu} className="p-3" variant="red" dwellMs={800}><ArrowLeft size={18} /></HandButton>
                <div className="flex items-center gap-3">
                  <img src={puceLogo} alt="PUCE Logo" className="h-9 w-auto" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 italic">LearnHands Hub</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Módulo: {currentGame}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-5 items-center">
                <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 bg-black/20">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50">IA Activa</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 rounded-xl border border-amber-500/30">
                  <Trophy size={14} className="text-amber-400" />
                  <span className="text-lg font-display font-black text-amber-400 italic">{score}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Score Widget — only on HOME/MENU */}
      <div className={`fixed bottom-8 right-8 z-50 pointer-events-none transition-opacity ${view === 'GAME' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="glass p-6 rounded-[32px] border border-white/10 shadow-2xl flex items-center gap-6 bg-black/40 backdrop-blur-md">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
            <Trophy className="text-amber-400" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Nivel {level}</span>
            <span className="text-2xl font-display font-black text-white italic tracking-tighter">{score} <span className="text-[10px] text-white/20 not-italic ml-1">PTS</span></span>
          </div>
        </div>
      </div>
    </LayeredEngine>
  );
};

const SectionHeader = ({ icon, title, subtitle, color }) => {
  const tint = color === 'emerald' ? 'text-emerald-400' : color === 'orange' ? 'text-orange-400' : 'text-purple-400';
  const line = color === 'emerald' ? 'from-emerald-500/40' : color === 'orange' ? 'from-orange-500/40' : 'from-purple-500/40';
  return (
    <div className="flex items-center gap-4 mb-6 px-2">
      <div className={`flex items-center gap-2 ${tint}`}>
        {icon}
        <span className="font-display text-2xl font-black italic uppercase tracking-tight">{title}</span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{subtitle}</span>
      <div className={`flex-1 h-px bg-gradient-to-r ${line} to-transparent`} />
    </div>
  );
};

const MenuCard = ({ icon, title, color, onSelect, locked }) => (
  <div className="group relative w-44 md:w-48">
    <div className={`absolute -inset-1.5 bg-gradient-to-br blur-md rounded-[38px] transition-all duration-500 pointer-events-none ${locked ? 'opacity-0' : 'opacity-20 group-hover:opacity-100'} ${
      color === 'purple'  ? 'from-purple-500 to-indigo-500'  :
      color === 'cyan'    ? 'from-cyan-400 to-teal-500'      :
      color === 'orange'  ? 'from-orange-500 to-amber-500'   :
      color === 'emerald' ? 'from-emerald-500 to-teal-600'   :
      'from-purple-500 to-indigo-500'
    }`} />

    <HandButton
      onClick={locked ? undefined : onSelect}
      className={`w-full aspect-[4/3] rounded-[36px] flex flex-col items-center justify-center gap-4 border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl transition-all ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
      variant={locked ? 'default' : color}
      dwellMs={locked ? 99999 : 900}
    >
      <div className={`p-4 bg-white/10 rounded-2xl ring-1 ring-white/15 transition-transform duration-500 ${locked ? '' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon, { size: 36 })}
      </div>
      <div className="flex flex-col items-center gap-1 w-full px-2">
        <span className="font-display text-base md:text-lg font-black italic tracking-tight uppercase text-white drop-shadow-md text-center leading-tight break-words w-full">{title}</span>
        <div className={`h-1 bg-white/30 rounded-full transition-all duration-500 ${locked ? 'w-6' : 'w-10 group-hover:w-16'}`} />
      </div>
    </HandButton>
  </div>
);

export default SystemHub;
