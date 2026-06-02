import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, CheckCircle, Star } from 'lucide-react';
import HandButton from '../HandButton';

const FOOTER_H = 64;
const GRID_VW   = 44;   // CSS width of the target grid as % of viewport
const GRID_GAP  = 8;    // px gap between grid cells

// ── Tile pixel size for the current viewport + grid ────────────────────────────
const computeTilePx = (gridSize) => {
  const gridPx = window.innerWidth * GRID_VW / 100;
  return (gridPx - GRID_GAP * (gridSize - 1)) / gridSize;
};

const gridSizeForLevel = (lvl) => (lvl >= 3 ? 4 : lvl >= 2 ? 3 : 2);

// ── User-supplied images from src/assets/puzzle/ ─────────────────────────────
// Drop any PNG/JPG/WEBP into that folder; Vite picks them up at build time.
// Recommended: square images, 400 × 400 px or larger.
const _userImgModules = import.meta.glob(
  '../../../assets/puzzle/*.{png,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
);

const _userImages = Object.entries(_userImgModules).map(([path, url]) => {
  // Use filename (without extension) as label
  const name = path.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  return { url, label: `🖼️ ${name}` };
});

// ── Generate puzzle images locally with Canvas — zero network dependency ────────
// Each image is a 400×400 canvas drawing encoded as a PNG data URI.
// Runs once; result is module-level cached so re-renders don't redraw.
let _puzzleImages = null;

function buildPuzzleImages() {
  if (_puzzleImages) return _puzzleImages;
  if (typeof document === 'undefined') return [];

  const S = 400; // canvas size
  const make = (drawFn, label) => {
    try {
      const cv  = document.createElement('canvas');
      cv.width  = cv.height = S;
      const ctx = cv.getContext('2d');
      drawFn(ctx, S);
      return { url: cv.toDataURL('image/png'), label };
    } catch { return null; }
  };

  _puzzleImages = [
    // ① Sol ──────────────────────────────────────────────────────────────────
    make((ctx, S) => {
      const bg = ctx.createRadialGradient(S/2,S/2,0, S/2,S/2,S*0.72);
      bg.addColorStop(0,'#FEF9C3'); bg.addColorStop(1,'#F97316');
      ctx.fillStyle = bg; ctx.fillRect(0,0,S,S);
      // Rays
      ctx.save(); ctx.translate(S/2,S/2);
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI/6);
        ctx.fillStyle = 'rgba(255,220,80,0.45)';
        ctx.beginPath();
        ctx.moveTo(-10,-S*0.18); ctx.lineTo(10,-S*0.18); ctx.lineTo(0,-S*0.46);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // Circle
      ctx.beginPath(); ctx.arc(S/2,S/2,S*0.22,0,Math.PI*2);
      ctx.fillStyle='#FCD34D'; ctx.fill();
      ctx.strokeStyle='#FBBF24'; ctx.lineWidth=8; ctx.stroke();
      // Eyes
      ctx.fillStyle='#92400E';
      [[S*0.43,S*0.46],[S*0.57,S*0.46]].forEach(([x,y])=>{
        ctx.beginPath(); ctx.arc(x,y,S*0.025,0,Math.PI*2); ctx.fill();
      });
      // Smile
      ctx.beginPath(); ctx.arc(S/2,S/2+S*0.04,S*0.09,0,Math.PI);
      ctx.strokeStyle='#92400E'; ctx.lineWidth=5; ctx.stroke();
    }, '☀️ Sol'),

    // ② Océano ────────────────────────────────────────────────────────────────
    make((ctx, S) => {
      const sky = ctx.createLinearGradient(0,0,0,S*0.55);
      sky.addColorStop(0,'#BAE6FD'); sky.addColorStop(1,'#38BDF8');
      ctx.fillStyle = sky; ctx.fillRect(0,0,S,S*0.55);
      // Sun in sky
      ctx.beginPath(); ctx.arc(S*0.78,S*0.16,S*0.09,0,Math.PI*2);
      ctx.fillStyle='#FEF08A'; ctx.fill();
      // Sea
      const sea = ctx.createLinearGradient(0,S*0.55,0,S);
      sea.addColorStop(0,'#38BDF8'); sea.addColorStop(1,'#0C4A6E');
      ctx.fillStyle = sea; ctx.fillRect(0,S*0.55,S,S*0.45);
      // Waves
      for (let w = 0; w < 4; w++) {
        const yb = S*(0.57+w*0.11);
        ctx.beginPath(); ctx.moveTo(0, yb);
        for (let x = 0; x <= S; x += 40) {
          ctx.quadraticCurveTo(x+20, yb-S*0.025, x+40, yb);
        }
        ctx.lineTo(S,S); ctx.lineTo(0,S); ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${0.10+w*0.06})`; ctx.fill();
      }
      // Cloud
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      [[S*0.26,S*0.2,S*0.07],[S*0.35,S*0.16,S*0.10],[S*0.46,S*0.2,S*0.07]].forEach(([x,y,r])=>{
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      });
    }, '🌊 Mar'),

    // ③ Bosque ────────────────────────────────────────────────────────────────
    make((ctx, S) => {
      const bg = ctx.createLinearGradient(0,0,0,S);
      bg.addColorStop(0,'#A7F3D0'); bg.addColorStop(1,'#065F46');
      ctx.fillStyle = bg; ctx.fillRect(0,0,S,S);
      // Sun
      ctx.beginPath(); ctx.arc(S*0.82,S*0.14,S*0.08,0,Math.PI*2);
      ctx.fillStyle='#FEF08A'; ctx.fill();
      // Trees
      const trees = [[S*0.12,S*0.78,S*0.24],[S*0.38,S*0.68,S*0.30],[S*0.65,S*0.74,S*0.26],[S*0.88,S*0.82,S*0.20]];
      trees.forEach(([x,y,sz]) => {
        // trunk
        ctx.fillStyle='#7C2D12';
        ctx.fillRect(x-sz*0.1,y, sz*0.2,sz*0.35);
        // canopy layers
        [[0,sz],[sz*0.18,sz*0.75],[sz*0.3,sz*0.55]].forEach(([off,w])=>{
          ctx.fillStyle='#166534';
          ctx.beginPath();
          ctx.moveTo(x,y-sz+off); ctx.lineTo(x-w*0.5,y-sz*0.35+off); ctx.lineTo(x+w*0.5,y-sz*0.35+off);
          ctx.closePath(); ctx.fill();
        });
      });
      // Ground
      ctx.fillStyle='#4ADE80'; ctx.fillRect(0,S*0.88,S,S*0.12);
    }, '🌲 Bosque'),

    // ④ Montaña ───────────────────────────────────────────────────────────────
    make((ctx, S) => {
      // Sky
      const sky = ctx.createLinearGradient(0,0,0,S*0.65);
      sky.addColorStop(0,'#C7D2FE'); sky.addColorStop(1,'#818CF8');
      ctx.fillStyle = sky; ctx.fillRect(0,0,S,S*0.65);
      // Ground
      ctx.fillStyle='#86EFAC'; ctx.fillRect(0,S*0.65,S,S*0.35);
      // Back mountain
      ctx.fillStyle='#A78BFA';
      ctx.beginPath(); ctx.moveTo(S*0.05,S*0.68); ctx.lineTo(S*0.52,S*0.10); ctx.lineTo(S*0.95,S*0.68); ctx.closePath(); ctx.fill();
      // Snow back
      ctx.fillStyle='rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.moveTo(S*0.38,S*0.27); ctx.lineTo(S*0.52,S*0.10); ctx.lineTo(S*0.65,S*0.27); ctx.closePath(); ctx.fill();
      // Front mountain
      ctx.fillStyle='#7C3AED';
      ctx.beginPath(); ctx.moveTo(S*0.15,S*0.78); ctx.lineTo(S*0.42,S*0.28); ctx.lineTo(S*0.70,S*0.78); ctx.closePath(); ctx.fill();
      // Snow front
      ctx.fillStyle='white';
      ctx.beginPath(); ctx.moveTo(S*0.30,S*0.43); ctx.lineTo(S*0.42,S*0.28); ctx.lineTo(S*0.54,S*0.43); ctx.closePath(); ctx.fill();
      // Stars
      ctx.fillStyle='rgba(255,255,255,0.8)';
      [[S*0.15,S*0.12],[S*0.72,S*0.08],[S*0.88,S*0.2]].forEach(([x,y])=>{
        ctx.beginPath(); ctx.arc(x,y,S*0.015,0,Math.PI*2); ctx.fill();
      });
    }, '🏔️ Montaña'),

    // ⑤ Flores ────────────────────────────────────────────────────────────────
    make((ctx, S) => {
      const bg = ctx.createLinearGradient(0,0,S,S);
      bg.addColorStop(0,'#FDF2F8'); bg.addColorStop(1,'#FBCFE8');
      ctx.fillStyle = bg; ctx.fillRect(0,0,S,S);
      // Ground
      ctx.fillStyle='#86EFAC'; ctx.fillRect(0,S*0.82,S,S*0.18);
      // Flowers
      const flowers = [
        [S*0.18,S*0.52,'#F472B6'],
        [S*0.50,S*0.40,'#A78BFA'],
        [S*0.82,S*0.50,'#FB923C'],
        [S*0.34,S*0.65,'#FCD34D'],
        [S*0.66,S*0.63,'#34D399'],
      ];
      flowers.forEach(([fx,fy,color]) => {
        // Stem
        ctx.strokeStyle='#4ADE80'; ctx.lineWidth=5;
        ctx.beginPath(); ctx.moveTo(fx,S*0.82); ctx.lineTo(fx,fy+S*0.06); ctx.stroke();
        // Petals
        for (let p = 0; p < 6; p++) {
          const a = p * Math.PI/3;
          const px = fx + Math.cos(a)*S*0.065;
          const py = fy + Math.sin(a)*S*0.065;
          ctx.beginPath(); ctx.ellipse(px,py,S*0.048,S*0.026,a,0,Math.PI*2);
          ctx.fillStyle = color; ctx.fill();
        }
        // Centre
        ctx.beginPath(); ctx.arc(fx,fy,S*0.038,0,Math.PI*2);
        ctx.fillStyle='#FEF08A'; ctx.fill();
      });
    }, '🌸 Flores'),

    // ⑥ Espacio ───────────────────────────────────────────────────────────────
    make((ctx, S) => {
      // Deep space background
      const bg = ctx.createRadialGradient(S*0.4,S*0.4,0, S/2,S/2,S*0.8);
      bg.addColorStop(0,'#1E1B4B'); bg.addColorStop(1,'#0F0A2E');
      ctx.fillStyle = bg; ctx.fillRect(0,0,S,S);
      // Stars — deterministic positions via golden-angle Fibonacci spiral
      for (let i = 0; i < 70; i++) {
        const angle  = i * 2.39996; // golden angle
        const radius = Math.sqrt(i/70) * S * 0.5;
        const x = S/2 + Math.cos(angle) * radius;
        const y = S/2 + Math.sin(angle) * radius;
        const r = 0.7 + (i%4) * 0.4;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${0.35+((i%3)/3)*0.55})`; ctx.fill();
      }
      // Planet
      const pg = ctx.createRadialGradient(S*0.55,S*0.38,0, S*0.62,S*0.44,S*0.22);
      pg.addColorStop(0,'#A5B4FC'); pg.addColorStop(0.5,'#6366F1'); pg.addColorStop(1,'#312E81');
      ctx.beginPath(); ctx.arc(S*0.62,S*0.44,S*0.22,0,Math.PI*2);
      ctx.fillStyle = pg; ctx.fill();
      // Ring
      ctx.save(); ctx.translate(S*0.62,S*0.44); ctx.scale(1,0.28);
      ctx.beginPath(); ctx.arc(0,0,S*0.34,0,Math.PI*2);
      ctx.strokeStyle='rgba(165,180,252,0.6)'; ctx.lineWidth=S*0.065; ctx.stroke();
      ctx.restore();
      // Rocket
      ctx.fillStyle='#F9A8D4';
      ctx.beginPath();
      ctx.moveTo(S*0.20,S*0.80); ctx.lineTo(S*0.235,S*0.52); ctx.lineTo(S*0.27,S*0.80);
      ctx.closePath(); ctx.fill();
      // Nose cone
      ctx.fillStyle='#EC4899';
      ctx.beginPath();
      ctx.moveTo(S*0.20,S*0.52); ctx.lineTo(S*0.235,S*0.40); ctx.lineTo(S*0.27,S*0.52);
      ctx.closePath(); ctx.fill();
      // Window
      ctx.beginPath(); ctx.arc(S*0.235,S*0.63,S*0.025,0,Math.PI*2);
      ctx.fillStyle='#BAE6FD'; ctx.fill();
      // Flame
      const flame = ctx.createLinearGradient(0,S*0.80,0,S*0.92);
      flame.addColorStop(0,'#FB923C'); flame.addColorStop(1,'#FEF08A');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(S*0.21,S*0.80); ctx.lineTo(S*0.235,S*0.92); ctx.lineTo(S*0.26,S*0.80);
      ctx.closePath(); ctx.fill();
    }, '🚀 Espacio'),
  ].filter(Boolean);

  // Merge: user images first (they appear before the canvas drawings)
  _puzzleImages = [..._userImages, ..._puzzleImages];

  return _puzzleImages;
}

// ── Scatter tile initial positions ─────────────────────────────────────────────
const initTiles = (gridSize) => {
  const count  = gridSize * gridSize;
  const sw     = window.innerWidth;
  const gh     = window.innerHeight - FOOTER_H;
  const tilePx = computeTilePx(gridSize);
  const half   = tilePx / 2;
  const placed = [];
  const tiles  = [];

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
    } while (attempts < 60 && placed.some(p => Math.hypot(p.x - x, p.y - y) < tilePx + 10));
    placed.push({ x, y });
    tiles.push({ id: i, correctRow: row, correctCol: col, x, y });
  }
  return tiles;
};

// ══════════════════════════════════════════════════════════════════════════════
const PuzzleModule = memo(({ addPoints }) => {
  const [level,     setLevel]     = useState(1);
  const [imageIdx,  setImageIdx]  = useState(0);
  const [isWon,     setIsWon]     = useState(false);
  const [placedIds, setPlacedIds] = useState(new Set());
  // Images are generated locally — always available, never fail
  const [images, setImages] = useState([]);

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

  const tileElsRef      = useRef({});   // { tileId → DOM element }
  const slotCentersRef  = useRef([]);   // pixel centres of ghost slots
  const gridRef         = useRef(null);

  // ── Generate images once on mount ──────────────────────────────────────────
  useEffect(() => { setImages(buildPuzzleImages()); }, []);

  // ── Slot pixel centres ─────────────────────────────────────────────────────
  const updateSlotCenters = useCallback(() => {
    if (!gridRef.current) return;
    slotCentersRef.current = Array.from(gridRef.current.querySelectorAll('[data-slot]'))
      .map(el => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
  }, []);

  // ── Start / reset ──────────────────────────────────────────────────────────
  const startPuzzle = useCallback((lvl, imgIdx) => {
    const s       = stateRef.current;
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
    setTimeout(updateSlotCenters, 120);
  }, [updateSlotCenters]);

  useEffect(() => { startPuzzle(1, 0); }, [startPuzzle]);
  useEffect(() => {
    const t = setTimeout(updateSlotCenters, 120);
    return () => clearTimeout(t);
  }, [level, updateSlotCenters]);
  useEffect(() => {
    window.addEventListener('resize', updateSlotCenters);
    return () => window.removeEventListener('resize', updateSlotCenters);
  }, [updateSlotCenters]);

  // ── RAF loop — direct DOM writes during drag ───────────────────────────────
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
        const cx = cursor.x, cy = cursor.y;
        const isPinching = !!gestures[handIdx]?.isPinching;
        const draggedId  = s.dragging[handIdx];

        if (isPinching) {
          if (draggedId === undefined) {
            // GRAB
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
            // DRAG
            const idx = s.tiles.findIndex(t => t.id === draggedId);
            if (idx !== -1) {
              s.tiles[idx].x = cx;
              s.tiles[idx].y = cy;
              const el = tileElsRef.current[draggedId];
              if (el) { el.style.left = `${cx}px`; el.style.top = `${cy}px`; }
            }
          }
        } else if (draggedId !== undefined) {
          // RELEASE
          const idx  = s.tiles.findIndex(t => t.id === draggedId);
          if (idx !== -1) {
            const tile   = s.tiles[idx];
            const center = slotCentersRef.current[tile.id];
            const dist   = center ? Math.hypot(tile.x - center.x, tile.y - center.y) : Infinity;
            const snap   = tilePx * 0.65;
            const el     = tileElsRef.current[draggedId];

            if (dist < snap && center) {
              s.tiles[idx].x = center.x;
              s.tiles[idx].y = center.y;
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
              if (el) {
                el.style.zIndex     = '20';
                el.style.boxShadow  = '0 8px 32px rgba(0,0,0,0.4)';
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
  }, []);

  const handleNextPuzzle = useCallback(() => {
    const s = stateRef.current;
    startPuzzle(Math.min(s.level + 1, 3), (s.imageIdx + 1) % Math.max(images.length, 1));
  }, [startPuzzle, images.length]);

  const handleReset = useCallback(() => {
    const s = stateRef.current;
    startPuzzle(s.level, (s.imageIdx + 1) % Math.max(images.length, 1));
  }, [startPuzzle, images.length]);

  // ── Derived render values ──────────────────────────────────────────────────
  const gridSize = gridSizeForLevel(level);
  const tileCount  = gridSize * gridSize;
  const tilePx     = computeTilePx(gridSize);
  const image      = images[imageIdx] || null;
  // Hint visibility per level:
  //   lvl 1 (2×2) → full hint (18 % opacity)
  //   lvl 2 (3×3) → faint hint (8 % opacity)
  //   lvl 3 (4×4) → no hint at all
  const hintOpacity = level >= 3 ? 0 : level >= 2 ? 0.08 : 0.18;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative overflow-hidden select-none">

      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 glass-dark px-5 py-2 rounded-2xl border border-white/10">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400">Nivel {level}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">{image?.label ?? '…'}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">{gridSize}×{gridSize}</span>
        <div className="w-px h-4 bg-white/20" />
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
          level >= 3 ? 'text-red-400' : level >= 2 ? 'text-amber-400' : 'text-green-400'
        }`}>
          {level >= 3 ? '🚫 Sin pistas' : level >= 2 ? '👁 Pista mínima' : '👁 Con pistas'}
        </span>
      </div>

      {/* Ghost target grid */}
      <div
        ref={gridRef}
        style={{
          position:            'absolute',
          width:               `${GRID_VW}vw`,
          left:                '50%',
          top:                 '7vh',
          transform:           'translateX(-50%)',
          display:             'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap:                 `${GRID_GAP}px`,
          zIndex:              5,
        }}
      >
        {Array.from({ length: tileCount }, (_, i) => {
          const row    = Math.floor(i / gridSize);
          const col    = i % gridSize;
          const placed = placedIds.has(i);
          const hBgPosX = gridSize > 1 ? (col / (gridSize - 1)) * 100 : 0;
          const hBgPosY = gridSize > 1 ? (row / (gridSize - 1)) * 100 : 0;
          return (
            <div
              key={i}
              data-slot={i}
              className={`rounded-xl border-2 transition-colors duration-200 ${
                placed ? 'border-green-500/60' : 'border-white/20'
              }`}
              style={{
                position:           'relative',
                aspectRatio:        '1',
                backgroundColor:    placed ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                // Show hint image only when hintOpacity > 0 and slot not yet filled
                backgroundImage:    image && !placed && hintOpacity > 0 ? `url("${image.url}")` : 'none',
                backgroundSize:     `${gridSize * 100}% ${gridSize * 100}%`,
                backgroundPosition: `${hBgPosX}% ${hBgPosY}%`,
                backgroundRepeat:   'no-repeat',
              }}
            >
              {/* Dark overlay — controls how much of the hint shows through */}
              {image && !placed && hintOpacity > 0 && (
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: `rgba(3,3,11,${1 - hintOpacity})` }}
                />
              )}
              {placed && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <CheckCircle size={gridSize === 2 ? 30 : 20} className="text-green-400/80" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Spinner while canvas images are being generated */}
      {images.length === 0 && (
        <div className="absolute top-[34%] left-1/2 -translate-x-1/2 z-40 glass px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Preparando imágenes…</span>
        </div>
      )}

      {/* Draggable tile pieces */}
      {stateRef.current.tiles.map(t => {
        const placed   = placedIds.has(t.id);
        // CSS background-image crop — far more reliable than overflow:hidden + negative-left img
        // background-size: N*100% scales the image to N tiles wide/tall
        // background-position: col/(N-1)*100% row/(N-1)*100% reveals the correct cell
        const bgPosX = gridSize > 1 ? (t.correctCol / (gridSize - 1)) * 100 : 0;
        const bgPosY = gridSize > 1 ? (t.correctRow / (gridSize - 1)) * 100 : 0;
        return (
          <div
            key={t.id}
            ref={el => { if (el) tileElsRef.current[t.id] = el; }}
            className={`absolute rounded-xl border-2 shadow-2xl ${placed ? 'border-green-400' : 'border-white/35'}`}
            style={{
              left:               `${t.x}px`,
              top:                `${t.y}px`,
              transform:          'translate(-50%, -50%)',
              width:              `${tilePx}px`,
              height:             `${tilePx}px`,
              zIndex:             20,
              willChange:         'left, top',
              backgroundImage:    image ? `url("${image.url}")` : 'none',
              backgroundSize:     `${gridSize * 100}% ${gridSize * 100}%`,
              backgroundPosition: `${bgPosX}% ${bgPosY}%`,
              backgroundRepeat:   'no-repeat',
              backgroundColor:    image ? 'transparent' : 'rgba(255,255,255,0.05)',
            }}
          >
            {placed && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-10 rounded-xl">
                <CheckCircle size={gridSize === 2 ? 30 : 20} className="text-white/80" />
              </div>
            )}
          </div>
        );
      })}

      {/* Win overlay */}
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
              {level < 2 ? 'Siguiente nivel: cuadrícula 3×3'
               : level < 3 ? 'Siguiente nivel: cuadrícula 4×4'
               : '¡Maestro del puzzle!'}
            </p>
            <HandButton onClick={handleNextPuzzle} className="px-12 py-5 text-sm" variant="purple" dwellMs={800}>
              <Star size={16} fill="white" />
              {level < 3 ? 'Subir nivel' : 'Otro puzzle'}
            </HandButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset */}
      {!isWon && (
        <button
          onClick={handleReset}
          className="absolute top-4 right-12 z-30 p-3 glass rounded-2xl border border-white/10 text-white/40 hover:text-white transition-all"
        >
          <RefreshCw size={18} />
        </button>
      )}

      {/* Instruction */}
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
