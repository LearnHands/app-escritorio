import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, CheckCircle, Star } from 'lucide-react';
import HandButton from '../HandButton';

const FOOTER_H = 64;

// Kid-friendly images — Unsplash stable IDs
const IMAGES = [
  { url: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=800&q=80', label: '🐱 Gato',    emoji: '🐱' },
  { url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80', label: '🐶 Perro',   emoji: '🐶' },
  { url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef3?w=800&q=80', label: '🐼 Panda',   emoji: '🐼' },
  { url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&q=80', label: '🦊 Zorro',   emoji: '🦊' },
  { url: 'https://images.unsplash.com/photo-1490750967868-88df5691cc1e?w=800&q=80', label: '🌸 Flores',  emoji: '🌸' },
  { url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80', label: '🌌 Espacio', emoji: '🌌' },
];

// Grid width (must match CSS width: GRID_VW vw)
const GRID_VW  = 44;
const GRID_GAP = 8; // px between grid cells

const gridSizeForLevel = (lvl) => (lvl >= 2 ? 3 : 2);

/** Pixel size of each tile given the current viewport */
const computeTilePx = (gridSize) => {
  const gridPx = window.innerWidth * GRID_VW / 100;
  return (gridPx - GRID_GAP * (gridSize - 1)) / gridSize;
};

/** Scatter tiles in the lower portion of the game area — non-overlapping */
const initTiles = (gridSize) => {
  const count   = gridSize * gridSize;
  const sw      = window.innerWidth;
  const gh      = window.innerHeight - FOOTER_H;
  const tilePx  = computeTilePx(gridSize);
  const half    = tilePx / 2;
  const placed  = [];
  const tiles   = [];

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;

    let x, y, attempts = 0;
    const yMin = gh * 0.60;
    const yMax = gh * 0.93 - half;

    do {
      x = half + 16 + Math.random() * (sw - tilePx - 32);
      y = yMin  + Math.random() * Math.max(0, yMax - yMin);
      attempts++;
    } while (
      attempts < 60 &&
      placed.some(p => Math.hypot(p.x - x, p.y - y) < tilePx + 10)
    );

    placed.push({ x, y });
    tiles.push({ id: i, correctRow: row, correctCol: col, x, y });
  }
  return tiles;
};

// ─────────────────────────────────────────────────────────────────────────────
const PuzzleModule = memo(({ addPoints }) => {
  const [level,    setLevel]    = useState(1);
  const [imageIdx, setImageIdx] = useState(0);
  const [isWon,    setIsWon]    = useState(false);
  const [placedIds, setPlacedIds] = useState(new Set());
  // 'loading' | 'ok' | 'error'
  const [imgStatus, setImgStatus] = useState('loading');

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  const stateRef = useRef({
    dragging:  {},
    tiles:     [],
    placedIds: new Set(),
    isWon:     false,
    level:     1,
    imageIdx:  0,
  });

  /** Direct DOM refs for each draggable tile — zero React overhead during drag */
  const tileElsRef = useRef({});

  /** Pixel-space centre of each ghost slot (indexed by tile id = slot index) */
  const slotCentersRef = useRef([]);

  /** The CSS-grid container holding the ghost slots */
  const gridRef = useRef(null);

  // ── Compute slot pixel centres from the DOM ─────────────────────────────────
  const updateSlotCenters = useCallback(() => {
    if (!gridRef.current) return;
    const els = gridRef.current.querySelectorAll('[data-slot]');
    slotCentersRef.current = Array.from(els).map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  }, []);

  // ── Image preloading ────────────────────────────────────────────────────────
  useEffect(() => {
    setImgStatus('loading');
    const img = new window.Image();
    img.onload  = () => setImgStatus('ok');
    img.onerror = () => setImgStatus('error');
    img.src = IMAGES[imageIdx].url;
  }, [imageIdx]);

  // ── Start / reset puzzle ────────────────────────────────────────────────────
  const startPuzzle = useCallback((lvl, imgIdx) => {
    const s = stateRef.current;
    const gridSize = gridSizeForLevel(lvl);

    s.level    = lvl;
    s.imageIdx = imgIdx;
    s.tiles    = initTiles(gridSize);
    s.placedIds = new Set();
    s.dragging  = {};
    s.isWon     = false;
    tileElsRef.current = {};

    setLevel(lvl);
    setImageIdx(imgIdx);
    setPlacedIds(new Set());
    setIsWon(false);

    // Re-read slot positions after the DOM updates
    setTimeout(updateSlotCenters, 120);
  }, [updateSlotCenters]);

  // Mount
  useEffect(() => { startPuzzle(1, 0); }, [startPuzzle]);

  // Recompute slot centres when level changes (grid re-renders)
  useEffect(() => {
    const t = setTimeout(updateSlotCenters, 120);
    return () => clearTimeout(t);
  }, [level, updateSlotCenters]);

  // Recompute on resize
  useEffect(() => {
    window.addEventListener('resize', updateSlotCenters);
    return () => window.removeEventListener('resize', updateSlotCenters);
  }, [updateSlotCenters]);

  // ── Main RAF loop — direct DOM writes during drag ───────────────────────────
  useEffect(() => {
    let animId;

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;
      if (s.isWon) return;

      const gridSize = gridSizeForLevel(s.level);
      const tilePx   = computeTilePx(gridSize);
      const { cursors = [], gestures = [] } = window.latestHandData || {};

      cursors.forEach((cursor, handIdx) => {
        if (!cursor?.isVisible) return;

        // cursor.x / cursor.y are already in screen pixels
        const cx = cursor.x;
        const cy = cursor.y;
        const isPinching = !!gestures[handIdx]?.isPinching;
        const draggedId  = s.dragging[handIdx];

        if (isPinching) {
          if (draggedId === undefined) {
            // ── GRAB: find nearest free unplaced tile ──────────────────────
            let best = null, bestDist = tilePx * 1.3;
            s.tiles.forEach(t => {
              if (s.placedIds.has(t.id)) return;
              if (Object.values(s.dragging).includes(t.id)) return;
              const d = Math.hypot(t.x - cx, t.y - cy);
              if (d < bestDist) { bestDist = d; best = t; }
            });
            if (best) {
              s.dragging[handIdx] = best.id;
              const el = tileElsRef.current[best.id];
              if (el) {
                el.style.zIndex     = '50';
                el.style.boxShadow  = '0 0 40px rgba(139,92,246,0.8), 0 20px 60px rgba(0,0,0,0.6)';
                el.style.transition = 'none';
              }
            }
          } else {
            // ── DRAG: move the tile directly in the DOM ────────────────────
            const tileIdx = s.tiles.findIndex(t => t.id === draggedId);
            if (tileIdx !== -1) {
              s.tiles[tileIdx].x = cx;
              s.tiles[tileIdx].y = cy;
              const el = tileElsRef.current[draggedId];
              if (el) { el.style.left = `${cx}px`; el.style.top = `${cy}px`; }
            }
          }
        } else if (draggedId !== undefined) {
          // ── RELEASE: try to snap to correct slot ──────────────────────────
          const tileIdx = s.tiles.findIndex(t => t.id === draggedId);
          if (tileIdx !== -1) {
            const tile   = s.tiles[tileIdx];
            const center = slotCentersRef.current[tile.id];
            const dist   = center ? Math.hypot(tile.x - center.x, tile.y - center.y) : Infinity;
            const snap   = tilePx * 0.65;
            const el     = tileElsRef.current[draggedId];

            if (dist < snap && center) {
              // ── SNAPPED ──
              s.tiles[tileIdx].x = center.x;
              s.tiles[tileIdx].y = center.y;
              s.placedIds.add(draggedId);
              if (el) {
                el.style.transition = 'left 0.12s ease, top 0.12s ease';
                el.style.left       = `${center.x}px`;
                el.style.top        = `${center.y}px`;
                el.style.zIndex     = '20';
                el.style.boxShadow  = '0 0 24px rgba(34,197,94,0.65)';
              }
              addPointsRef.current(100);
              setPlacedIds(new Set(s.placedIds));

              if (s.placedIds.size === gridSize * gridSize) {
                s.isWon = true;
                addPointsRef.current(300 + s.level * 100);
                setIsWon(true);
              }
            } else {
              // Drop in current position
              if (el) {
                el.style.zIndex    = '20';
                el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                el.style.transition = '';
              }
            }
          }
          delete s.dragging[handIdx];
        }
      });
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []); // Stable — everything via refs

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleNextPuzzle = useCallback(() => {
    const s = stateRef.current;
    startPuzzle(Math.min(s.level + 1, 2), (s.imageIdx + 1) % IMAGES.length);
  }, [startPuzzle]);

  const handleReset = useCallback(() => {
    const s = stateRef.current;
    startPuzzle(s.level, (s.imageIdx + 1) % IMAGES.length);
  }, [startPuzzle]);

  // ── Derived render values ────────────────────────────────────────────────────
  const gridSize = gridSizeForLevel(level);
  const tileCount = gridSize * gridSize;
  const image     = IMAGES[imageIdx];
  // Tile pixel size (computed at render — used for initial inline style on tile divs)
  const tilePx    = computeTilePx(gridSize);

  return (
    <div className="w-full h-full relative overflow-hidden select-none">

      {/* ── Header badge ───────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 glass-dark px-5 py-2 rounded-2xl border border-white/10">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">Nivel {level}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">{image.label}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">{gridSize}×{gridSize}</span>
      </div>

      {/* ── Ghost target grid (CSS Grid → browser handles layout, no math) ── */}
      {/* z-index: 5 so dragged tiles (z:20/50) always appear above slots    */}
      <div
        ref={gridRef}
        style={{
          position:              'absolute',
          width:                 `${GRID_VW}vw`,
          left:                  '50%',
          top:                   '7vh',
          transform:             'translateX(-50%)',
          display:               'grid',
          gridTemplateColumns:   `repeat(${gridSize}, 1fr)`,
          gap:                   `${GRID_GAP}px`,
          zIndex:                5,
        }}
      >
        {Array.from({ length: tileCount }, (_, i) => {
          const row    = Math.floor(i / gridSize);
          const col    = i % gridSize;
          const placed = placedIds.has(i);
          return (
            <div
              key={i}
              data-slot={i}
              className={`relative rounded-xl border-2 overflow-hidden transition-colors duration-200 ${
                placed ? 'border-green-500/60' : 'border-white/20'
              }`}
              style={{ aspectRatio: '1', background: placed ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)' }}
            >
              {/* Faint image hint so children know where each piece belongs */}
              {imgStatus !== 'error' && (
                <img
                  src={image.url}
                  alt=""
                  draggable={false}
                  style={{
                    position:       'absolute',
                    width:          `${gridSize * 100}%`,
                    height:         `${gridSize * 100}%`,
                    left:           `${-col * 100}%`,
                    top:            `${-row * 100}%`,
                    objectFit:      'cover',
                    opacity:        placed ? 0 : 0.18,
                    pointerEvents:  'none',
                    transition:     'opacity 0.3s',
                  }}
                />
              )}
              {placed && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <CheckCircle
                    size={gridSize === 2 ? 30 : 20}
                    className="text-green-400/80 drop-shadow"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Image loading indicator ─────────────────────────────────────────── */}
      {imgStatus === 'loading' && (
        <div className="absolute top-[32%] left-1/2 -translate-x-1/2 z-40 glass px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Cargando imagen…</span>
        </div>
      )}

      {/* ── Draggable tile pieces ───────────────────────────────────────────── */}
      {/* Positioned in pixel space; the RAF loop updates left/top directly.   */}
      {stateRef.current.tiles.map(t => {
        const placed = placedIds.has(t.id);
        return (
          <div
            key={t.id}
            ref={el => { if (el) tileElsRef.current[t.id] = el; }}
            className={`absolute rounded-xl overflow-hidden border-2 shadow-2xl ${
              placed ? 'border-green-400' : 'border-white/35'
            }`}
            style={{
              left:      `${t.x}px`,
              top:       `${t.y}px`,
              transform: 'translate(-50%, -50%)',
              width:     `${tilePx}px`,
              height:    `${tilePx}px`,
              zIndex:    20,
              willChange:'left, top',
            }}
          >
            {/* Image portion — overflow+absolute img avoids background-position bugs */}
            {imgStatus !== 'error' ? (
              <img
                src={image.url}
                alt=""
                draggable={false}
                style={{
                  position:     'absolute',
                  width:        `${gridSize * 100}%`,
                  height:       `${gridSize * 100}%`,
                  left:         `${-t.correctCol * 100}%`,
                  top:          `${-t.correctRow * 100}%`,
                  objectFit:    'cover',
                  pointerEvents:'none',
                  userSelect:   'none',
                }}
              />
            ) : (
              /* Fallback emoji when image fails to load */
              <div className="w-full h-full flex items-center justify-center bg-white/5 text-5xl">
                {image.emoji}
              </div>
            )}
            {placed && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-10">
                <CheckCircle size={gridSize === 2 ? 30 : 20} className="text-white/80" />
              </div>
            )}
          </div>
        );
      })}

      {/* ── Win overlay ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/65 backdrop-blur-md"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mb-6 text-[100px]"
            >🏆</motion.div>
            <h2 className="text-5xl font-display font-black text-gradient italic uppercase tracking-tighter mb-3">
              ¡Lo lograste!
            </h2>
            <p className="text-white/50 font-black uppercase tracking-[0.3em] text-[10px] mb-8">
              {level < 2 ? 'Siguiente nivel: cuadrícula 3×3' : '¡Maestro del puzzle!'}
            </p>
            <HandButton onClick={handleNextPuzzle} className="px-12 py-5 text-sm" variant="purple" dwellMs={800}>
              <Star size={16} fill="white" />
              {level < 2 ? 'Subir nivel' : 'Otro puzzle'}
            </HandButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reset button ────────────────────────────────────────────────────── */}
      {!isWon && (
        <button
          onClick={handleReset}
          className="absolute top-4 right-12 z-30 p-3 glass rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all"
        >
          <RefreshCw size={18} />
        </button>
      )}

      {/* ── Instruction bar ─────────────────────────────────────────────────── */}
      {!isWon && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 glass px-7 py-3 rounded-2xl border border-white/10 animate-pulse">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 italic text-center">
            🤏 Pellizca una pieza · suéltala sobre su sombra para colocarla
          </p>
        </div>
      )}
    </div>
  );
});

export default PuzzleModule;
