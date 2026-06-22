import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import GameInstruction from '../GameInstruction';

const OCTAVES = 2;
const WHITE_NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
const BLACK_NOTES  = { Do: 'Do#', Re: 'Re#', Fa: 'Fa#', Sol: 'Sol#', La: 'La#' };

const FREQS = {
  'Do':   261.6, 'Do#': 277.2, 'Re':   293.7, 'Re#': 311.1,
  'Mi':   329.6, 'Fa':  349.2, 'Fa#':  370.0, 'Sol': 392.0,
  'Sol#': 415.3, 'La':  440.0, 'La#':  466.2, 'Si':  493.9,
  'Do2':  523.3, 'Do#2':554.4, 'Re2':  587.3, 'Re#2':622.3,
  'Mi2':  659.3, 'Fa2': 698.5, 'Fa#2': 740.0, 'Sol2':784.0,
  'Sol#2':830.6, 'La2': 880.0, 'La#2': 932.3, 'Si2': 987.8,
};

// Fingertip landmark indices (thumb=4, index=8, middle=12, ring=16, pinky=20)
const FINGERTIPS = [4, 8, 12, 16, 20];

const PianoModule = memo(({ addPoints, videoRef, lang = 'es' }) => {
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef     = useRef(null);
  const activeOscsRef   = useRef({});   // { note → { osc, gainNode } }
  const releasingRef    = useRef(new Set()); // notes in release phase
  const keyRectsRef     = useRef([]);   // [{ note, rect, isBlack }]
  const lastTriggeredRef = useRef({}); // { note: timestamp }
  const lastStoppedRef  = useRef({});   // { note: timestamp }
  const addPointsRef    = useRef(addPoints);
  addPointsRef.current  = addPoints;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const whiteKeys = useMemo(() => {
    const keys = [];
    for (let o = 0; o < OCTAVES; o++)
      WHITE_NOTES.forEach(n => keys.push(o === 0 ? n : n + '2'));
    return keys;
  }, []);

  // ── Audio helpers ─────────────────────────────────────────────────────────
  const getAudioCtx = () => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const startNote = (note) => {
    if (!soundEnabledRef.current) return;
    if (activeOscsRef.current[note] || releasingRef.current.has(note)) return;

    // Calibración de retardos: evitar reiniciar notas demasiado rápido (cooldown de 200ms)
    const nowTime = Date.now();
    if (nowTime - (lastStoppedRef.current[note] || 0) < 200) return;
    lastTriggeredRef.current[note] = nowTime;

    try {
      const ctx  = getAudioCtx();
      const freq = FREQS[note] || 440;

      // Oscillator 1 — fundamental (triangle for warmth)
      const osc1 = ctx.createOscillator();
      osc1.type  = 'triangle';
      osc1.frequency.value = freq;

      // Oscillator 2 — slight detuned copy (fuller sound)
      const osc2 = ctx.createOscillator();
      osc2.type  = 'sine';
      osc2.frequency.value = freq * 2.001; // slight octave + detune

      const gainNode = ctx.createGain();
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      // ADSR: fast attack → partial decay → sustain
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.22, now + 0.015);   // attack 15ms
      gainNode.gain.linearRampToValueAtTime(0.16, now + 0.08);    // decay → sustain level

      osc1.start(now);
      osc2.start(now);

      activeOscsRef.current[note] = { osc1, osc2, gainNode };
      addPointsRef.current(1);
    } catch (e) { console.warn('Piano start note failed', e); }
  };

  const stopNote = (note) => {
    const entry = activeOscsRef.current[note];
    if (!entry) return;
    if (releasingRef.current.has(note)) return;

    // Calibración de retardos: mantener la nota activa al menos 150ms antes de apagar
    const nowTime = Date.now();
    if (nowTime - (lastTriggeredRef.current[note] || 0) < 150) return;
    lastStoppedRef.current[note] = nowTime;

    releasingRef.current.add(note);
    delete activeOscsRef.current[note];

    try {
      const ctx = getAudioCtx();
      const { osc1, osc2, gainNode } = entry;
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25); // release 250ms
      setTimeout(() => {
        try { osc1.stop(); osc2.stop(); } catch (_) {}
        releasingRef.current.delete(note);
      }, 280);
    } catch (_) {}
  };

  // ── Cache key rects after layout ─────────────────────────────────────────
  useEffect(() => {
    const updateRects = () => {
      const blacks = Array.from(document.querySelectorAll('.piano-black-key')).map(el => ({
        note: el.dataset.note, rect: el.getBoundingClientRect(), isBlack: true,
      }));
      const whites = Array.from(document.querySelectorAll('.piano-white-key')).map(el => ({
        note: el.dataset.note, rect: el.getBoundingClientRect(), isBlack: false,
      }));
      keyRectsRef.current = [...blacks, ...whites];
    };
    const t = setTimeout(updateRects, 600);
    window.addEventListener('resize', updateRects);
    return () => { clearTimeout(t); window.removeEventListener('resize', updateRects); };
  }, []);

  // ── Main detection loop ───────────────────────────────────────────────────
  // Strategy:
  //   Each frame → compute which notes are CURRENTLY under a fingertip.
  //   Start any note that wasn't active before, stop any that left.
  //   This gives true sustained notes: as long as the finger stays on the key,
  //   the note keeps playing.
  useEffect(() => {
    let animId;
    const prevNotesRef = new Set(); // notes active last frame

    const loop = () => {
      const data     = window.latestHandData || {};
      const gestures = data.gestures || [];
      const rects    = keyRectsRef.current;

      if (rects.length > 0 && gestures.length > 0) {
        const videoEl = videoRef?.current;
        const vw = videoEl?.videoWidth  || 1280;
        const vh = videoEl?.videoHeight || 720;
        const sw = window.innerWidth;
        const sh = window.innerHeight;

        const scale   = Math.max(sw / vw, sh / vh);
        const scaledW = vw * scale;
        const scaledH = vh * scale;
        const offX    = (scaledW - sw) / 2;
        const offY    = (scaledH - sh) / 2;

        const frameNotes = new Set();

        gestures.forEach(gesture => {
          const landmarks = gesture.landmarks || [];
          if (!landmarks.length) return;

          // Only check the 5 fingertip landmarks (not all 21 hand points)
          FINGERTIPS.forEach(tipIdx => {
            const lm = landmarks[tipIdx];
            if (!lm) return;

            // Mirror X (video is CSS-mirrored) and map to screen pixels
            const px = (1 - lm.x) * scaledW - offX;
            const py = lm.y * scaledH - offY;

            // Hit-test: black keys first (they sit on top of white keys)
            let hit = false;
            for (const key of rects) {
              if (!key.isBlack) continue;
              const r = key.rect;
              
              // Optimización de área: reducir ancho un 15% por cada lado
              const w = r.right - r.left;
              const pad = w * 0.15;
              const left = r.left + pad;
              const right = r.right - pad;

              if (px >= left && px <= right && py >= r.top && py <= r.bottom) {
                frameNotes.add(key.note);
                hit = true;
                break;
              }
            }
            if (hit) return;
            for (const key of rects) {
              if (key.isBlack) continue;
              const r = key.rect;

              // Optimización de área: reducir ancho un 15% por cada lado
              const w = r.right - r.left;
              const pad = w * 0.15;
              const left = r.left + pad;
              const right = r.right - pad;

              if (px >= left && px <= right && py >= r.top && py <= r.bottom) {
                frameNotes.add(key.note);
                break;
              }
            }
          });
        });

        // Start new notes (entered this frame)
        for (const note of frameNotes) {
          if (!prevNotesRef.has(note)) startNote(note);
        }

        // Stop released notes (left this frame)
        for (const note of prevNotesRef) {
          if (!frameNotes.has(note)) stopNote(note);
        }

        // Sync React state for visual highlights (only if changed)
        const changed =
          frameNotes.size !== prevNotesRef.size ||
          [...frameNotes].some(n => !prevNotesRef.has(n));
        if (changed) setActiveNotes(new Set(frameNotes));

        // Update prev
        prevNotesRef.clear();
        frameNotes.forEach(n => prevNotesRef.add(n));

      } else if (prevNotesRef.size > 0) {
        // All fingers left — stop all
        prevNotesRef.forEach(n => stopNote(n));
        prevNotesRef.clear();
        setActiveNotes(new Set());
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      // Stop all notes on unmount
      Object.keys(activeOscsRef.current).forEach(n => stopNote(n));
    };
  }, [videoRef]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col select-none">

      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(p => !p)}
        className="absolute top-4 right-12 z-50 p-3 glass rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all"
      >
        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* ── Piano keyboard (top portion) ─────────────────────────────── */}
      <div className="w-full h-[38vh] bg-black/70 border-b border-white/10 backdrop-blur-xl relative flex p-3 gap-px">
        {whiteKeys.map((n) => {
          const blackNote = BLACK_NOTES[n.replace('2', '')]
            ? (n.includes('2') ? BLACK_NOTES[n.replace('2', '')] + '2' : BLACK_NOTES[n])
            : null;
          const isActive    = activeNotes.has(n);
          const blackActive = blackNote && activeNotes.has(blackNote);

          return (
            <div key={n} className="flex-1 relative">
              {/* White key */}
              <div
                data-note={n}
                className={`piano-white-key h-full rounded-b-2xl border border-black/30 flex items-end justify-center pb-4 transition-all duration-75 ${
                  isActive
                    ? 'bg-gradient-to-b from-cyan-400 to-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.7)]'
                    : 'bg-gradient-to-b from-white to-gray-100 hover:from-gray-50'
                }`}
              >
                {/* Target guide area */}
                <div className={`absolute inset-x-[15%] top-4 bottom-12 rounded-lg border border-dashed transition-all ${isActive ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-black/5 bg-transparent'} flex items-center justify-center pointer-events-none`}>
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-cyan-500/50' : 'bg-black/5'}`} />
                </div>

                <span className={`text-[9px] font-black uppercase ${isActive ? 'text-cyan-800' : 'text-black/30'} z-10`}>
                  {n}
                </span>
              </div>

              {/* Black key */}
              {blackNote && (
                <div
                  data-note={blackNote}
                  className={`piano-black-key absolute right-[-22%] top-0 w-[44%] h-[62%] z-20 rounded-b-xl border border-white/10 flex items-end justify-center pb-1 transition-all duration-75 ${
                    blackActive
                      ? 'bg-gradient-to-b from-purple-500 to-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.8)]'
                      : 'bg-gradient-to-b from-gray-900 to-gray-800'
                  }`}
                >
                  {/* Target guide area */}
                  <div className={`absolute inset-x-[15%] top-2 bottom-8 rounded-md border border-dashed transition-all ${blackActive ? 'border-purple-300/40 bg-purple-300/15' : 'border-white/10 bg-transparent'} flex items-center justify-center pointer-events-none`}>
                    <div className={`w-1 h-1 rounded-full transition-colors ${blackActive ? 'bg-purple-300/50' : 'bg-white/10'}`} />
                  </div>

                  <span className={`text-[7px] font-black ${blackActive ? 'text-white' : 'text-white/20'} z-10`}>
                    {blackNote.replace('2', '')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Visual feedback area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden pointer-events-none">
        <AnimatePresence mode="popLayout">
          {activeNotes.size > 0 ? (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="flex flex-wrap justify-center gap-6 px-8"
            >
              {[...activeNotes].map(n => (
                <motion.div
                  key={n}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.5 }}
                  className="text-[80px] md:text-[100px] font-display font-black text-white italic tracking-tighter drop-shadow-[0_0_24px_rgba(6,182,212,0.8)]"
                >
                  {n}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="text-7xl animate-bounce-slow">🎹</div>
              <p className="text-2xl font-display font-black text-white/40 italic tracking-[0.2em] uppercase text-center px-4">
                {lang === 'es' ? 'Acerca los dedos a las teclas' : 'Bring your fingers close to the keys'}
              </p>
              <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.3em] text-center px-4">
                {lang === 'es' ? 'Cada dedo toca una nota · mantén pulsado para sostenerla' : 'Each finger plays a note · hold to sustain'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <GameInstruction
        messageEs="Acerca los dedos a las teclas para tocar el piano"
        messageEn="Move your fingers close to the keys to play the piano"
        lang={lang}
        icon="🎹"
      />
    </div>
  );
});

export default PianoModule;
