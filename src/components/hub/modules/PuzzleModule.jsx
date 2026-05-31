import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle, Star } from 'lucide-react';
import HandButton from '../HandButton';

const FOOTER_H = 64;

// Kid-friendly images — stable Unsplash photo IDs
const IMAGES = [
  { url: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=800&q=80', label: '🐱 Gato' },
  { url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80', label: '🐶 Perro' },
  { url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef3?w=800&q=80', label: '🐼 Panda' },
  { url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&q=80', label: '🦊 Zorro' },
  { url: 'https://images.unsplash.com/photo-1490750967868-88df5691cc1e?w=800&q=80', label: '🌸 Flores' },
  { url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80', label: '🌌 Espacio' },
];

// Progressive difficulty: level 1 → 2×2, level 2+ → 3×3
const gridSizeForLevel = (lvl) => (lvl >= 2 ? 3 : 2);

// Compute snap-slot centre position (% of game area) for a given tile
const getSlotPos = (correctRow, correctCol, gridSize) => {
  const gridW = 34; // % of viewport width
  const gridH = 34; // % of game-area height
  const startX = 50 - gridW / 2;
  const startY = 16;           // % from top of game area
  const cellW = gridW / gridSize;
  const cellH = gridH / gridSize;
  return {
    x: startX + correctCol * cellW + cellW / 2,
    y: startY + correctRow * cellH + cellH / 2,
  };
};

// Initial scattered positions for new tiles (below the target grid)
const initTiles = (gridSize) => {
  const count = gridSize * gridSize;
  const tiles = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    tiles.push({
      id: i,
      correctRow: row,
      correctCol: col,
      // Scatter in a wide band in the lower half
      x: 10 + Math.random() * 80,
      y: 65 + Math.random() * 18,
    });
  }
  return tiles;
};

const PuzzleModule = memo(({ addPoints }) => {
  const [level,    setLevel]    = useState(1);
  const [imageIdx, setImageIdx] = useState(0);
  const [isWon,    setIsWon]    = useState(false);
  // React state only tracks which tiles are placed (for border color / icon)
  const [placedIds, setPlacedIds] = useState(new Set());

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  // ── All mutable game state lives here ─────────────────────────────────────
  const stateRef = useRef({
    dragging: {},        // { handIdx: tileId }
    tiles: [],           // [{ id, correctRow, correctCol, x, y }]
    placedIds: new Set(),
    isWon: false,
    level: 1,
    imageIdx: 0,
  });

  // Direct DOM refs for each tile — allows instant position updates with zero
  // React overhead during drag
  const tileElsRef = useRef({});   // { tileId → div element }

  // ── Start / reset puzzle ─────────────────────────────────────────────────
  const startPuzzle = useCallback((lvl, imgIdx) => {
    const s = stateRef.current;
    const gridSize = gridSizeForLevel(lvl);
    const tiles = initTiles(gridSize);

    s.level    = lvl;
    s.imageIdx = imgIdx;
    s.tiles    = tiles;
    s.placedIds = new Set();
    s.dragging  = {};
    s.isWon     = false;
    tileElsRef.current = {};

    setLevel(lvl);
    setImageIdx(imgIdx);
    setPlacedIds(new Set());
    setIsWon(false);
  }, []);

  // Initialise on mount
  useEffect(() => { startPuzzle(1, 0); }, [startPuzzle]);

  // ── Main RAF loop — direct DOM writes during drag ─────────────────────────
  useEffect(() => {
    let animId;

    const loop = () => {
      const s = stateRef.current;
      if (s.isWon) { animId = requestAnimationFrame(loop); return; }

      const sw    = window.innerWidth;
      const gameH = window.innerHeight - FOOTER_H;
      const gridSize = gridSizeForLevel(s.level);

      const { cursors = [], gestures = [] } = window.latestHandData || {};

      cursors.forEach((cursor, handIdx) => {
        if (!cursor?.isVisible) return;

        // Convert cursor to % of game area
        const cx = (cursor.x / sw)    * 100;
        const cy = (cursor.y / gameH) * 100;

        const isPinching = gestures[handIdx]?.isPinching;
        const draggedId  = s.dragging[handIdx];

        if (isPinching) {
          if (draggedId === undefined) {
            // ── Grab: find nearest free unplaced tile ──────────────────────
            let best = null, bestDist = 14; // 14% grab radius
            s.tiles.forEach(t => {
              if (s.placedIds.has(t.id)) return;
              if (Object.values(s.dragging).includes(t.id)) return;
              const d = Math.hypot(t.x - cx, t.y - cy);
              if (d < bestDist) { bestDist = d; best = t; }
            });
            if (best) {
              s.dragging[handIdx] = best.id;
              // Visually lift
              const el = tileElsRef.current[best.id];
              if (el) {
                el.style.zIndex   = '50';
                el.style.boxShadow = '0 0 40px rgba(139,92,246,0.8), 0 20px 60px rgba(0,0,0,0.6)';
                el.style.transition = 'none'; // disable transition while dragging
              }
            }
          } else {
            // ── Drag: update tile position DIRECTLY on the DOM element ─────
            const tileIdx = s.tiles.findIndex(t => t.id === draggedId);
            if (tileIdx !== -1) {
              s.tiles[tileIdx].x = cx;
              s.tiles[tileIdx].y = cy;
              const el = tileElsRef.current[draggedId];
              if (el) {
                el.style.left = `${cx}%`;
                el.style.top  = `${cy}%`;
              }
            }
          }
        } else if (draggedId !== undefined) {
          // ── Release: check if close to correct snap slot ─────────────────
          const tileIdx = s.tiles.findIndex(t => t.id === draggedId);
          if (tileIdx !== -1) {
            const tile = s.tiles[tileIdx];
            const slot = getSlotPos(tile.correctRow, tile.correctCol, gridSize);
            const dist = Math.hypot(tile.x - slot.x, tile.y - slot.y);
            const snapRadius = 10; // generous 10% snap zone

            const el = tileElsRef.current[draggedId];

            if (dist < snapRadius) {
              // ── SNAP ──
              s.tiles[tileIdx].x = slot.x;
              s.tiles[tileIdx].y = slot.y;
              s.placedIds.add(draggedId);

              if (el) {
                el.style.transition = 'left 0.12s ease, top 0.12s ease'; // smooth snap
                el.style.left      = `${slot.x}%`;
                el.style.top       = `${slot.y}%`;
                el.style.zIndex    = '20';
                el.style.boxShadow = '0 0 20px rgba(34,197,94,0.6)';
              }
              addPointsRef.current(100);

              // Sync React state so border color / icon update
              setPlacedIds(new Set(s.placedIds));

              // Win check
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

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []); // Stable loop — everything via stateRef or stable refs

  // ── Next puzzle after win ─────────────────────────────────────────────────
  const handleNextPuzzle = useCallback(() => {
    const s = stateRef.current;
    const nextLevel    = Math.min(s.level + 1, 2);
    const nextImageIdx = (s.imageIdx + 1) % IMAGES.length;
    startPuzzle(nextLevel, nextImageIdx);
  }, [startPuzzle]);

  const handleReset = useCallback(() => {
    const s = stateRef.current;
    startPuzzle(s.level, (s.imageIdx + 1) % IMAGES.length);
  }, [startPuzzle]);

  // ── Render ────────────────────────────────────────────────────────────────
  const gridSize = gridSizeForLevel(level);
  const tileCount = gridSize * gridSize;
  const image = IMAGES[imageIdx];

  // Compute slot positions for the visible ghost grid
  const slots = Array.from({ length: tileCount }, (_, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    return getSlotPos(row, col, gridSize);
  });

  // Tile size in vw (scales with grid)
  const tileSizeVw = gridSize === 2 ? 16 : 11;

  return (
    <div className="w-full h-full relative overflow-hidden select-none">

      {/* ── Level & image badge ─────────────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 glass-dark px-5 py-2 rounded-2xl border border-white/10">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">Nivel {level}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">{image.label}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">{gridSize}×{gridSize}</span>
      </div>

      {/* ── Ghost target grid ───────────────────────────────────────────── */}
      {slots.map((slot, i) => {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const placed = placedIds.has(i);
        return (
          <div
            key={i}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-dashed transition-all duration-300 ${
              placed
                ? 'border-green-500/60 bg-green-500/10'
                : 'border-white/15 bg-white/3'
            }`}
            style={{
              left:   `${slot.x}%`,
              top:    `${slot.y}%`,
              width:  `${tileSizeVw}vw`,
              aspectRatio: '1',
            }}
          />
        );
      })}

      {/* ── Tiles ───────────────────────────────────────────────────────── */}
      {stateRef.current.tiles.map(t => {
        const placed = placedIds.has(t.id);
        return (
          <div
            key={t.id}
            ref={el => { if (el) tileElsRef.current[t.id] = el; }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden border-2 shadow-2xl ${
              placed
                ? 'border-green-500'
                : 'border-white/30'
            }`}
            style={{
              left:        `${t.x}%`,
              top:         `${t.y}%`,
              width:       `${tileSizeVw}vw`,
              aspectRatio: '1',
              backgroundImage:    `url(${image.url})`,
              backgroundSize:     `${gridSize * 100}% ${gridSize * 100}%`,
              backgroundPosition: `${(t.correctCol / Math.max(gridSize - 1, 1)) * 100}% ${(t.correctRow / Math.max(gridSize - 1, 1)) * 100}%`,
              zIndex:      20,
              willChange:  'left, top',
            }}
          >
            {placed && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={gridSize === 2 ? 36 : 24} className="text-white/70" />
              </div>
            )}
          </div>
        );
      })}

      {/* ── Win overlay ─────────────────────────────────────────────────── */}
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
            >
              🏆
            </motion.div>
            <h2 className="text-5xl font-display font-black text-gradient italic uppercase tracking-tighter mb-3">
              ¡Lo lograste!
            </h2>
            <p className="text-white/50 font-black uppercase tracking-[0.3em] text-[10px] mb-8">
              {level < 2 ? 'Siguiente nivel: cuadrícula 3×3' : '¡Maestro del puzzle!'}
            </p>
            <div className="flex gap-4">
              <HandButton onClick={handleNextPuzzle} className="px-12 py-5 text-sm" variant="purple" dwellMs={800}>
                <Star size={16} fill="white" />
                {level < 2 ? 'Subir nivel' : 'Otro puzzle'}
              </HandButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reset button ────────────────────────────────────────────────── */}
      {!isWon && (
        <button
          onClick={handleReset}
          className="absolute top-4 right-12 z-30 p-3 glass rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all"
        >
          <RefreshCw size={18} />
        </button>
      )}

      {/* ── Instruction ─────────────────────────────────────────────────── */}
      {!isWon && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 glass px-7 py-3 rounded-2xl border border-white/10 animate-pulse">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 italic text-center">
            🤏 Pinza para agarrar una pieza · suéltala cerca de su sombra para colocarla
          </p>
        </div>
      )}
    </div>
  );
});

export default PuzzleModule;
