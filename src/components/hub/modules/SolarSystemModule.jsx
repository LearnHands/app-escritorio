import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FOOTER_H = 64;

// ── Planet data: orbit radius (px at scale 1), sizes, multi-page info ─────────
const PLANETS = [
  {
    name: 'Mercurio', color: '#A8A8A8', glow: '#6B7280',
    r: 6, orbitPx: 68, period: 4.1, moonCount: 0, moonR: 0, ring: false,
    pages: [
      { icon: '📏', title: 'Datos',       text: 'Distancia al Sol: 58 M km\nDiámetro: 4 879 km\nDía: 59 días terrestres\nAño: 88 días terrestres' },
      { icon: '🌡️', title: 'Temperatura', text: 'Día: +430 °C\nNoche: −180 °C\n\n¡La mayor diferencia\ntérmica del sistema solar!' },
      { icon: '🤯', title: 'Curiosidad',  text: 'Aunque es el más cercano al Sol, NO es el más caliente. ¡Venus lo supera gracias a su denso efecto invernadero!' },
    ],
  },
  {
    name: 'Venus', color: '#FDE68A', glow: '#F59E0B',
    r: 9, orbitPx: 112, period: 10.5, moonCount: 0, moonR: 0, ring: false,
    pages: [
      { icon: '📏', title: 'Datos',       text: 'Distancia al Sol: 108 M km\nDiámetro: 12 104 km\nUn día en Venus\ndura más que su año' },
      { icon: '🌡️', title: 'Temperatura', text: 'Temperatura media: 462 °C\n\nSu atmósfera de CO₂ atrapa el calor como un invernadero gigante.' },
      { icon: '🔄', title: 'Rotación',    text: 'Venus gira en sentido contrario a casi todos los planetas. En Venus, el Sol sale por el Oeste.' },
    ],
  },
  {
    name: 'Tierra', color: '#3B82F6', glow: '#60A5FA',
    r: 10, orbitPx: 160, period: 17.0, moonCount: 1, moonR: 3, ring: false,
    pages: [
      { icon: '💧', title: 'Agua',        text: 'El 71% de la superficie está cubierta de agua. Es el único planeta con agua líquida en la superficie.' },
      { icon: '📏', title: 'Datos',       text: 'Distancia al Sol: 150 M km\nDiámetro: 12 742 km\n1 luna\nTemperatura media: 15 °C' },
      { icon: '🧬', title: 'Vida',        text: 'Único planeta con vida confirmada: más de 8 millones de especies. ¡Nuestro hogar en el cosmos!' },
      { icon: '🛰️', title: 'Exploración', text: 'Más de 5 000 satélites artificiales nos orbitan. La ISS viaja a 28 000 km/h.' },
    ],
  },
  {
    name: 'Marte', color: '#EF4444', glow: '#F87171',
    r: 7, orbitPx: 218, period: 32.0, moonCount: 2, moonR: 2, ring: false,
    pages: [
      { icon: '🌋', title: 'Monte Olimpo', text: 'Marte tiene el volcán más alto del sistema solar: Monte Olimpo, con 22 km de altura — 3× más alto que el Everest.' },
      { icon: '📏', title: 'Datos',        text: 'Distancia al Sol: 228 M km\nDiámetro: 6 779 km\n2 lunas: Fobos y Deimos\nAño: 687 días terrestres' },
      { icon: '🚀', title: 'Exploración',  text: 'Más de 50 misiones han ido a Marte. Curiosity y Perseverance exploran su superficie hoy buscando signos de vida.' },
      { icon: '🔴', title: 'Color',        text: 'Su color rojo se debe al óxido de hierro (herrumbre). Tiene el cañón más largo del sistema solar: Valles Marineris.' },
    ],
  },
  {
    name: 'Júpiter', color: '#D97706', glow: '#FBBF24',
    r: 24, orbitPx: 308, period: 84.0, moonCount: 4, moonR: 3, ring: false,
    pages: [
      { icon: '🌀', title: 'Gran Mancha',  text: 'La Gran Mancha Roja lleva más de 350 años activa. Es una tormenta tan grande que la Tierra entera cabe dentro.' },
      { icon: '📏', title: 'Datos',        text: 'Distancia al Sol: 778 M km\nDiámetro: 139 820 km\n95 lunas confirmadas\n1 300 Tierras cabrían en él' },
      { icon: '🌙', title: 'Lunas',        text: 'Ío, Europa, Ganimedes y Calisto (descubiertas por Galileo en 1610). Europa podría tener un océano bajo su hielo.' },
      { icon: '🛡️', title: 'El Guardián', text: 'La enorme gravedad de Júpiter atrae asteroides y cometas, protegiendo a la Tierra de muchos impactos catastróficos.' },
    ],
  },
  {
    name: 'Saturno', color: '#F59E0B', glow: '#FCD34D',
    r: 18, orbitPx: 400, period: 214.0, moonCount: 2, moonR: 4, ring: true,
    pages: [
      { icon: '💍', title: 'Anillos',  text: 'Los anillos tienen 273 000 km de diámetro pero solo 1 km de grosor. Están hechos de partículas de hielo y roca.' },
      { icon: '📏', title: 'Datos',    text: 'Distancia al Sol: 1 432 M km\nDiámetro: 116 460 km\n146 lunas\nDensidad tan baja que flotaría en el agua' },
      { icon: '🌙', title: 'Titán',    text: 'Titán tiene atmósfera densa y lagos de metano líquido. Es uno de los mejores candidatos a albergar alguna forma de vida.' },
      { icon: '⏱️', title: 'Tiempo',   text: 'Un día en Saturno dura solo 10 h 33 min, ¡pero un año equivale a 29 años terrestres!' },
    ],
  },
  {
    name: 'Urano', color: '#67E8F9', glow: '#22D3EE',
    r: 13, orbitPx: 476, period: 608.0, moonCount: 1, moonR: 2, ring: false,
    pages: [
      { icon: '↔️', title: 'Rotación',     text: 'Urano rota de lado (97° de inclinación). Sus polos pasan décadas enteras en oscuridad total o luz solar continua.' },
      { icon: '📏', title: 'Datos',         text: 'Distancia al Sol: 2 867 M km\nDiámetro: 50 724 km\n28 lunas\nTemperatura: −224 °C (la más fría)' },
      { icon: '💎', title: 'Interior',      text: 'Se cree que contiene un océano de agua, metano y amoniaco a altísima presión. ¡Podría llover diamantes en su interior!' },
      { icon: '🔭', title: 'Descubrimiento', text: 'Fue el primer planeta descubierto con telescopio, por William Herschel en 1781. Los ojos humanos no pueden verlo.' },
    ],
  },
  {
    name: 'Neptuno', color: '#1D4ED8', glow: '#3B82F6',
    r: 12, orbitPx: 538, period: 1188.0, moonCount: 1, moonR: 3, ring: false,
    pages: [
      { icon: '💨', title: 'Vientos',        text: 'Los vientos de Neptuno alcanzan 2 100 km/h — los más rápidos del sistema solar. Sus tormentas son del tamaño de la Tierra.' },
      { icon: '📏', title: 'Datos',           text: 'Distancia al Sol: 4 495 M km\nDiámetro: 49 244 km\n16 lunas\nUn año dura 165 años terrestres' },
      { icon: '🔭', title: 'Descubrimiento',  text: 'Fue predicho matemáticamente antes de observarse. Las perturbaciones en la órbita de Urano revelaron su existencia en 1846.' },
      { icon: '🌙', title: 'Tritón',          text: 'Tritón orbita en sentido contrario a Neptuno. Probablemente fue capturado del Cinturón de Kuiper hace millones de años.' },
    ],
  },
];

// Lighten a hex color by adding an offset to each channel
function lightenHex(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16)        + amt);
  const g = Math.min(255, ((n >> 8) & 0xFF)+ amt);
  const b = Math.min(255, (n & 0xFF)       + amt);
  return `rgb(${r},${g},${b})`;
}

// ── Component ──────────────────────────────────────────────────────────────────
const SolarSystemModule = memo(({ addPoints }) => {
  const canvasRef = useRef(null);

  // React state — only for DOM overlay elements
  const [selectedInfo, setSelectedInfo] = useState(null);
  // { name, color, glow, pages, currentPage }
  const [paused,   setPaused]   = useState(false);
  const [visited,  setVisited]  = useState(new Set());

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  // ── All mutable state in one ref ─────────────────────────────────────────────
  const S = useRef({
    time:         0,
    paused:       false,
    // View transform (solar system centre offset + zoom)
    viewX:        0, targetX: 0,
    viewY:        0, targetY: 0,
    viewScale:    1, targetScale: 1,
    // Interaction
    hoveredPlanet:  null,
    selectedPlanet: null,
    infoPage:       0,
    pinchMode:      null,  // 'ui' | 'planet' | 'zoom' | null
    pinchHandled:   true,
    wasPinching:    false,
    pinchStartY:    0,
    pinchStartScale:1,
    prevCursorX:    null,
    prevCursorY:    null,
    // Pre-computed statics
    stars:     null,
    asteroids: null,
    // This frame's planet positions in solar-system space (for hit testing)
    ssPositions: [],  // [{name,x,y,r}]
  }).current;        // .current — single mutable object, no boxing needed

  // Pre-compute star field & asteroid belt once
  useEffect(() => {
    S.stars = Array.from({ length: 260 }, () => ({
      nx: Math.random(), ny: Math.random(),
      r:  0.4 + Math.random() * 1.4,
      a:  0.15 + Math.random() * 0.85,
      tw: Math.random() * Math.PI * 2,
    }));
    S.asteroids = Array.from({ length: 140 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist:  265 + (Math.random() - 0.5) * 60,
      size:  0.5 + Math.random() * 1.8,
      alpha: 0.15 + Math.random() * 0.45,
      speed: 0.04 + Math.random() * 0.04,
    }));
  }, []);

  // ── Helper: process a UI button action ───────────────────────────────────────
  const doAction = useCallback((action) => {
    if (action === 'zoom-in')  { S.targetScale = Math.min(5.0, S.targetScale * 1.45); }
    if (action === 'zoom-out') { S.targetScale = Math.max(0.35, S.targetScale / 1.45); }
    if (action === 'reset')    {
      S.targetScale = 1; S.targetX = 0; S.targetY = 0;
      S.selectedPlanet = null; S.infoPage = 0;
      setSelectedInfo(null);
    }
    if (action === 'pause')    { S.paused = !S.paused; setPaused(S.paused); }
    if (action === 'prev-page') {
      S.infoPage = Math.max(0, S.infoPage - 1);
      setSelectedInfo(prev => prev ? { ...prev, currentPage: S.infoPage } : prev);
    }
    if (action === 'next-page') {
      const p = PLANETS.find(p => p.name === S.selectedPlanet);
      if (p) {
        S.infoPage = Math.min(p.pages.length - 1, S.infoPage + 1);
        setSelectedInfo(prev => prev ? { ...prev, currentPage: S.infoPage } : prev);
      }
    }
  }, []);

  // ── Main RAF loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight - FOOTER_H;
    };
    resize();
    window.addEventListener('resize', resize);

    let animId;
    let lastTs = performance.now();

    const loop = (ts) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      if (!S.paused) S.time += dt;

      // Smooth lerp for view transitions
      S.viewScale += (S.targetScale - S.viewScale) * 0.09;
      S.viewX     += (S.targetX - S.viewX) * 0.09;
      S.viewY     += (S.targetY - S.viewY) * 0.09;

      const ctx = canvas.getContext('2d');
      const W   = canvas.width;
      const H   = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // ── Deep space background ──────────────────────────────────────────────
      const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.hypot(W, H) / 2);
      bg.addColorStop(0,   '#06082A');
      bg.addColorStop(1,   '#010208');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Stars (static positions, twinkle via alpha) ────────────────────────
      if (S.stars) {
        S.stars.forEach(star => {
          const twinkle = 0.6 + 0.4 * Math.sin(S.time * 1.5 + star.tw);
          ctx.beginPath();
          ctx.arc(star.nx * W, star.ny * H, star.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${(star.a * twinkle).toFixed(2)})`;
          ctx.fill();
        });
      }

      // ── Solar system (pan + zoom transform) ───────────────────────────────
      ctx.save();
      ctx.translate(W / 2 + S.viewX, H / 2 + S.viewY);
      ctx.scale(S.viewScale, S.viewScale);

      // Orbit paths
      PLANETS.forEach(p => {
        ctx.beginPath();
        ctx.arc(0, 0, p.orbitPx, 0, Math.PI * 2);
        const isSel = S.selectedPlanet === p.name;
        ctx.strokeStyle = isSel ? `${p.glow}55` : 'rgba(255,255,255,0.06)';
        ctx.lineWidth   = (isSel ? 1.5 : 0.7) / S.viewScale;
        ctx.stroke();
      });

      // Asteroid belt (Marte↔Júpiter, ~265px)
      if (S.asteroids) {
        S.asteroids.forEach(a => {
          const ax = Math.cos(a.angle + S.time * a.speed) * a.dist;
          const ay = Math.sin(a.angle + S.time * a.speed) * a.dist;
          ctx.beginPath();
          ctx.arc(ax, ay, a.size / Math.max(1, S.viewScale * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(185,165,130,${a.alpha})`;
          ctx.fill();
        });
      }

      // ── Sun ───────────────────────────────────────────────────────────────
      const SR = 28;
      const corona = ctx.createRadialGradient(0, 0, 0, 0, 0, SR * 5);
      corona.addColorStop(0,    'rgba(254,224,71,0.65)');
      corona.addColorStop(0.25, 'rgba(251,146,60,0.30)');
      corona.addColorStop(0.6,  'rgba(251,146,60,0.08)');
      corona.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(0, 0, SR * 5, 0, Math.PI * 2);
      ctx.fillStyle = corona;
      ctx.fill();

      const sunG = ctx.createRadialGradient(-SR * 0.3, -SR * 0.3, SR * 0.05, 0, 0, SR);
      sunG.addColorStop(0,   '#FEFCE8');
      sunG.addColorStop(0.4, '#FBBF24');
      sunG.addColorStop(0.85,'#F97316');
      sunG.addColorStop(1,   '#EA580C');
      ctx.beginPath();
      ctx.arc(0, 0, SR, 0, Math.PI * 2);
      ctx.fillStyle   = sunG;
      ctx.shadowBlur  = 60 / S.viewScale;
      ctx.shadowColor = '#FBBF24';
      ctx.fill();
      ctx.shadowBlur  = 0;

      // "Sol" label (always)
      ctx.font      = `bold ${Math.max(7, 9 / S.viewScale)}px system-ui`;
      ctx.fillStyle = 'rgba(254,224,71,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('Sol', 0, SR + 12 / S.viewScale);

      // ── Planets ──────────────────────────────────────────────────────────
      const ssPositions = [];

      PLANETS.forEach(p => {
        const angle  = (S.time / p.period) * Math.PI * 2;
        const px     = Math.cos(angle) * p.orbitPx;
        const py     = Math.sin(angle) * p.orbitPx;
        const isHov  = S.hoveredPlanet  === p.name;
        const isSel  = S.selectedPlanet === p.name;

        ssPositions.push({ name: p.name, x: px, y: py, r: p.r });

        // Saturn's rings — draw behind planet
        if (p.ring) {
          ctx.save();
          ctx.translate(px, py);
          ctx.scale(1, 0.28);
          const ri = p.r * 1.55, ro = p.r * 2.7;
          const rg = ctx.createRadialGradient(0, 0, ri, 0, 0, ro);
          rg.addColorStop(0,   'rgba(250,215,110,0.75)');
          rg.addColorStop(0.5, 'rgba(240,200,80,0.45)');
          rg.addColorStop(1,   'rgba(230,180,60,0)');
          ctx.beginPath();
          ctx.arc(0, 0, ro, 0, Math.PI * 2);
          ctx.arc(0, 0, ri, 0, Math.PI * 2, true);
          ctx.fillStyle = rg;
          ctx.fill();
          ctx.restore();
        }

        // Hover / selected glow halo
        if (isHov || isSel) {
          const halo = ctx.createRadialGradient(px, py, 0, px, py, p.r * 4.5);
          halo.addColorStop(0,   `${p.glow}60`);
          halo.addColorStop(0.5, `${p.glow}20`);
          halo.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.beginPath();
          ctx.arc(px, py, p.r * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = halo;
          ctx.fill();
        }

        // Selection ring
        if (isSel) {
          ctx.beginPath();
          ctx.arc(px, py, p.r + 5 / S.viewScale, 0, Math.PI * 2);
          ctx.strokeStyle = p.glow;
          ctx.lineWidth   = 1.5 / S.viewScale;
          ctx.setLineDash([4 / S.viewScale, 4 / S.viewScale]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Planet body
        const pg = ctx.createRadialGradient(
          px - p.r * 0.32, py - p.r * 0.32, p.r * 0.05,
          px, py, p.r
        );
        pg.addColorStop(0, lightenHex(p.color, 60));
        pg.addColorStop(1, p.color);
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle   = pg;
        ctx.shadowBlur  = (isHov || isSel ? 22 : 6) / S.viewScale;
        ctx.shadowColor = p.glow;
        ctx.fill();
        ctx.shadowBlur  = 0;

        // Earth details — cloud band
        if (p.name === 'Tierra') {
          ctx.beginPath();
          ctx.ellipse(px, py + p.r * 0.1, p.r * 0.72, p.r * 0.45, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.20)';
          ctx.lineWidth   = p.r * 0.38;
          ctx.stroke();
        }

        // Jupiter cloud bands
        if (p.name === 'Júpiter') {
          [-0.35, 0, 0.35].forEach(ofs => {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(px, py + ofs * p.r, p.r, p.r * 0.15, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.fillStyle = 'rgba(160,95,30,0.22)';
            ctx.fillRect(px - p.r, py - p.r, p.r * 2, p.r * 2);
            ctx.restore();
          });
          // Great Red Spot
          ctx.beginPath();
          ctx.ellipse(px + p.r * 0.25, py + p.r * 0.2, p.r * 0.18, p.r * 0.10, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(190,80,40,0.55)';
          ctx.fill();
        }

        // Moons
        for (let mi = 0; mi < p.moonCount; mi++) {
          const mAngle = S.time * (p.name === 'Tierra' ? 5.5 : 2.5 - mi * 0.4) + mi * Math.PI / Math.max(p.moonCount, 1);
          const mDist  = p.r * (2.0 + mi * 0.9);
          const mx = px + Math.cos(mAngle) * mDist;
          const my = py + Math.sin(mAngle) * mDist;
          ctx.beginPath();
          ctx.arc(mx, my, Math.max(1.5, p.moonR), 0, Math.PI * 2);
          ctx.fillStyle   = '#CBD5E1';
          ctx.shadowBlur  = 4 / S.viewScale;
          ctx.shadowColor = '#94A3B8';
          ctx.fill();
          ctx.shadowBlur  = 0;
        }

        // Planet name label
        const showLabel = isHov || isSel || S.viewScale > 1.6;
        if (showLabel) {
          const fSize = Math.max(7, Math.min(13, 10 / S.viewScale * S.viewScale));
          ctx.font      = `bold ${Math.max(8, 10)}px system-ui`;
          ctx.fillStyle = isHov || isSel ? '#FFFFFF' : 'rgba(255,255,255,0.55)';
          ctx.textAlign = 'center';
          ctx.shadowBlur  = 10;
          ctx.shadowColor = p.glow;
          ctx.fillText(p.name, px, py - p.r - 7 / S.viewScale);
          ctx.shadowBlur  = 0;
        }
      });

      S.ssPositions = ssPositions;
      ctx.restore(); // ── end solar system transform ──────────────────────────

      // ── Read hand data ────────────────────────────────────────────────────
      const { cursors = [], gestures = [] } = window.latestHandData || {};
      const cursor  = cursors[0];
      const gesture = gestures[0];

      if (cursor?.isVisible) {
        const cPx = cursor.x;
        const cPy = cursor.y;
        const isPinching = !!gesture?.isPinching;
        const isOpenHand = !!gesture?.isOpenHand;

        // Convert cursor to solar-system space
        const ssX = (cPx - (W / 2 + S.viewX)) / S.viewScale;
        const ssY = (cPy - (H / 2 + S.viewY)) / S.viewScale;

        // ── Hover detection ──────────────────────────────────────────────
        let hover = null, hoverDist = Infinity;
        S.ssPositions.forEach(pos => {
          const d = Math.hypot(ssX - pos.x, ssY - pos.y);
          if (d < pos.r * 3.5 && d < hoverDist) { hoverDist = d; hover = pos.name; }
        });
        S.hoveredPlanet = hover;

        // ── PAN (open hand + move) ───────────────────────────────────────
        if (isOpenHand && S.prevCursorX !== null) {
          const dx = cPx - S.prevCursorX;
          const dy = cPy - S.prevCursorY;
          S.targetX = Math.max(-600, Math.min(600, S.targetX + dx * 1.1));
          S.targetY = Math.max(-600, Math.min(600, S.targetY + dy * 1.1));
        }

        // ── Pinch lifecycle ──────────────────────────────────────────────
        if (isPinching && !S.wasPinching) {
          S.pinchHandled = false;

          // Check UI buttons first (data-solar-action)
          const uiBtns = document.querySelectorAll('[data-solar-action]');
          for (const btn of uiBtns) {
            const r = btn.getBoundingClientRect();
            if (cPx >= r.left - 8 && cPx <= r.right + 8 &&
                cPy >= r.top  - 8 && cPy <= r.bottom + 8) {
              S.pinchMode    = 'ui';
              S.pinchHandled = true;
              doAction(btn.dataset.solarAction);
              break;
            }
          }

          if (!S.pinchHandled) {
            if (hover) {
              S.pinchMode = 'planet';
            } else {
              S.pinchMode       = 'zoom';
              S.pinchStartY     = cPy;
              S.pinchStartScale = S.targetScale;
            }
          }
        }

        if (!isPinching) {
          S.pinchMode    = null;
          S.pinchHandled = true;
        }
        S.wasPinching = isPinching;

        // ── Planet selection ──────────────────────────────────────────────
        if (S.pinchMode === 'planet' && !S.pinchHandled && hover) {
          S.pinchHandled = true;
          const planet = PLANETS.find(p => p.name === hover);
          if (planet) {
            const isNew = !S.visited.has(hover);
            if (isNew) { S.visited.add(hover); addPointsRef.current(80); setVisited(new Set(S.visited)); }

            if (S.selectedPlanet === hover) {
              // Toggle off
              S.selectedPlanet = null;
              S.infoPage = 0;
              setSelectedInfo(null);
            } else {
              S.selectedPlanet = hover;
              S.infoPage = 0;

              // Smooth-fly to planet: shift view so planet appears on the left half of screen
              const pos = S.ssPositions.find(p => p.name === hover);
              if (pos) {
                const screenPX = W / 2 + S.viewX + pos.x * S.viewScale;
                const screenPY = H / 2 + S.viewY + pos.y * S.viewScale;
                const targetPScreenX = W * 0.33; // show planet at 33% from left
                const targetPScreenY = H * 0.50;
                S.targetX += targetPScreenX - screenPX;
                S.targetY += targetPScreenY - screenPY;
                if (S.targetScale < 2.0) S.targetScale = 2.2;
              }

              setSelectedInfo({ name: planet.name, color: planet.color, glow: planet.glow, pages: planet.pages, currentPage: 0 });
            }
          }
        }

        // ── Zoom by pinch-drag in empty space ─────────────────────────────
        if (S.pinchMode === 'zoom' && isPinching) {
          const dy = S.pinchStartY - cPy; // positive = hand moved up = zoom in
          S.targetScale = Math.max(0.35, Math.min(5.0, S.pinchStartScale * Math.pow(1.006, dy)));
        }

        S.prevCursorX = cPx;
        S.prevCursorY = cPy;

        // ── Draw cursor ───────────────────────────────────────────────────
        const cursorColor = isPinching  ? '#A78BFA'
          : isOpenHand ? '#34D399'
          : hover      ? '#FCD34D'
          : 'rgba(255,255,255,0.45)';

        const cursorR = isPinching ? 8 : 13;
        ctx.beginPath();
        ctx.arc(cPx, cPy, cursorR, 0, Math.PI * 2);
        ctx.strokeStyle = cursorColor;
        ctx.lineWidth   = 2;
        ctx.setLineDash(isPinching ? [] : [3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Centre dot on hover/pinch
        if (hover || isPinching) {
          ctx.beginPath();
          ctx.arc(cPx, cPy, 4, 0, Math.PI * 2);
          ctx.fillStyle = cursorColor;
          ctx.fill();
        }

        // Gesture label next to cursor
        const gLabel = isPinching  ? '🤏 Seleccionar / Zoom'
          : isOpenHand ? '✋ Mover vista'
          : hover      ? `☝️ ${hover}`
          : '';
        if (gLabel) {
          ctx.fillStyle  = 'rgba(255,255,255,0.55)';
          ctx.font       = '11px system-ui';
          ctx.textAlign  = 'left';
          ctx.fillText(gLabel, cPx + 18, cPy + 4);
        }

      } else {
        S.prevCursorX = null;
        S.prevCursorY = null;
        S.hoveredPlanet = null;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [doAction]);

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <span className="text-base">🪐</span>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/55">Sistema Solar Interactivo</span>
        {visited.size > 0 && (
          <>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
              {visited.size} / {PLANETS.length} descubiertos
            </span>
          </>
        )}
      </div>

      {/* ── Controls sidebar ────────────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {[
          { action: 'zoom-in',  label: '+',  title: 'Acercar' },
          { action: 'zoom-out', label: '−',  title: 'Alejar' },
          { action: 'reset',    label: '⌂',  title: 'Restablecer vista' },
          { action: 'pause',    label: paused ? '▶' : '⏸', title: paused ? 'Reanudar' : 'Pausar' },
        ].map(btn => (
          <button
            key={btn.action}
            data-solar-action={btn.action}
            title={btn.title}
            onClick={() => doAction(btn.action)}
            className="w-10 h-10 glass rounded-xl border border-white/10 text-white/55 hover:text-white hover:border-white/30 text-base font-black flex items-center justify-center transition-all active:scale-95"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── Planet info card ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedInfo && (
          <motion.div
            key={selectedInfo.name}
            initial={{ opacity: 0, x: 50, scale: 0.92 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{   opacity: 0, x: 50,  scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="absolute right-16 top-1/2 -translate-y-1/2 z-30 w-80 rounded-[28px] border border-white/10 overflow-hidden shadow-2xl"
            style={{
              background: `linear-gradient(145deg, rgba(10,10,30,0.92), rgba(5,5,18,0.95))`,
              boxShadow:  `0 0 70px ${selectedInfo.glow}25, inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            {/* Planet header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10"
              style={{ background: `${selectedInfo.color}14` }}
            >
              <div
                className="w-9 h-9 rounded-full flex-shrink-0"
                style={{ background: selectedInfo.color, boxShadow: `0 0 18px ${selectedInfo.glow}` }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-display font-black italic uppercase tracking-tight text-white leading-tight">
                  {selectedInfo.name}
                </h3>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/35">
                  Página {selectedInfo.currentPage + 1} de {selectedInfo.pages.length}
                </p>
              </div>
              <button
                onClick={() => { setSelectedInfo(null); S.selectedPlanet = null; }}
                className="text-white/30 hover:text-white transition-colors text-base font-black leading-none"
              >✕</button>
            </div>

            {/* Page content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedInfo.currentPage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="px-5 pt-4 pb-2 min-h-[130px]"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xl">{selectedInfo.pages[selectedInfo.currentPage]?.icon}</span>
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.35em]"
                    style={{ color: selectedInfo.color }}
                  >
                    {selectedInfo.pages[selectedInfo.currentPage]?.title}
                  </span>
                </div>
                <p className="text-[11.5px] text-white/75 leading-relaxed whitespace-pre-line font-medium">
                  {selectedInfo.pages[selectedInfo.currentPage]?.text}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Page dots */}
            <div className="flex justify-center gap-1.5 py-1">
              {selectedInfo.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { S.infoPage = i; setSelectedInfo(prev => prev ? { ...prev, currentPage: i } : prev); }}
                  className={`rounded-full transition-all duration-200 ${
                    i === selectedInfo.currentPage
                      ? 'w-4 h-2 scale-110'
                      : 'w-2 h-2 opacity-40 hover:opacity-70'
                  }`}
                  style={{ background: i === selectedInfo.currentPage ? selectedInfo.color : 'white' }}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-2 px-4 pt-1 pb-4">
              <button
                data-solar-action="prev-page"
                onClick={() => doAction('prev-page')}
                disabled={selectedInfo.currentPage === 0}
                className="flex-1 py-2 glass rounded-xl border border-white/10 text-white/55 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-[11px] font-black transition-all"
              >← Anterior</button>
              <button
                data-solar-action="next-page"
                onClick={() => doAction('next-page')}
                disabled={selectedInfo.currentPage === selectedInfo.pages.length - 1}
                className="flex-1 py-2 glass rounded-xl border border-white/10 text-white/55 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-[11px] font-black transition-all"
              >Siguiente →</button>
            </div>

            <p className="text-center text-[8px] font-black uppercase tracking-[0.25em] text-white/20 pb-3">
              🤏 Pellizca las flechas · ✋ Mano abierta para mover
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All-visited celebration ──────────────────────────────────────────── */}
      <AnimatePresence>
        {visited.size === PLANETS.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 px-8 py-3 rounded-2xl border border-amber-500/40 bg-amber-500/10"
          >
            <p className="text-amber-400 font-black uppercase tracking-widest text-[10px] text-center">
              🏆 ¡Exploraste los 8 planetas del sistema solar!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gesture guide ────────────────────────────────────────────────────── */}
      {!selectedInfo && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 glass px-6 py-2.5 rounded-2xl border border-white/10 animate-pulse">
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.12em] text-white/45">
            <span>✋ Mano abierta → mover</span>
            <div className="w-px h-3 bg-white/20" />
            <span>🤏 Pellizca planeta → explorar</span>
            <div className="w-px h-3 bg-white/20" />
            <span>🤏 Espacio vacío → zoom</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default SolarSystemModule;
