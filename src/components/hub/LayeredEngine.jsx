import React, { useRef, useEffect } from 'react';

// Hand skeleton connections (21 MediaPipe landmarks)
const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],          // thumb
  [0,5],[5,6],[6,7],[7,8],          // index
  [5,9],[9,10],[10,11],[11,12],     // middle
  [9,13],[13,14],[14,15],[15,16],   // ring
  [13,17],[17,18],[18,19],[19,20],  // pinky
  [0,17],[0,5]                       // palm base
];

// Draw one hand's skeleton directly on the canvas — no CDN deps needed.
// X is flipped (1 - lm.x) to match the CSS-mirrored video feed.
const drawHand = (ctx, landmarks, color, w, h) => {
  const px = (lm) => (1 - lm.x) * w;
  const py = (lm) => lm.y * h;

  // Connections
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;
  CONNECTIONS.forEach(([a, b]) => {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (!la || !lb) return;
    ctx.beginPath();
    ctx.moveTo(px(la), py(la));
    ctx.lineTo(px(lb), py(lb));
    ctx.stroke();
  });
  // Dots
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#06B6D4';
  landmarks.forEach((lm, idx) => {
    const isKnuckle = [0, 5, 9, 13, 17].includes(idx);
    ctx.fillStyle = isKnuckle ? '#ffffff' : '#06B6D4';
    ctx.beginPath();
    ctx.arc(px(lm), py(lm), isKnuckle ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
};

// transparent=true  → bright camera feed, barely-visible overlay (all modules except Pizarra)
// transparent=false → dark/greyscale camera, heavier overlay (Pizarra drawing mode)
const LayeredEngine = ({ children, videoRef, isLoaded, error, transparent = false, lang = 'es' }) => {
  const canvasRef = useRef(null);

  // Block ALL mouse and keyboard input — only hand gestures drive this system
  useEffect(() => {
    const block = (e) => {
      // Permitir eventos si el target es un campo de entrada (login input)
      if (
        e.target && 
        (e.target.tagName === 'INPUT' || 
         e.target.tagName === 'TEXTAREA' || 
         e.target.closest('input') || 
         e.target.closest('textarea'))
      ) {
        return;
      }
      e.preventDefault(); 
      e.stopImmediatePropagation(); 
    };
    const blocked = ['mousedown','mouseup','click','dblclick','contextmenu','wheel','keydown','keyup','keypress'];
    blocked.forEach(ev => document.addEventListener(ev, block, { capture: true, passive: false }));
    document.body.style.cursor = 'none';
    return () => {
      blocked.forEach(ev => document.removeEventListener(ev, block, { capture: true }));
      document.body.style.cursor = '';
    };
  }, []);

  useEffect(() => {
    let animId;

    // Cache elements for cursors
    const cursorElements = [null, null];
    const getCursorElements = (index) => {
      if (!cursorElements[index]) {
        cursorElements[index] = {
          container: document.getElementById(`virtual-cursor-container-${index}`),
          trail: document.getElementById(`virtual-cursor-trail-${index}`),
          dot: document.getElementById(`virtual-cursor-dot-${index}`),
          ping: document.getElementById(`virtual-cursor-ping-${index}`),
          label: document.getElementById(`virtual-cursor-label-${index}`),
          tooltip: document.getElementById(`virtual-cursor-tooltip-${index}`)
        };
      }
      return cursorElements[index];
    };

    // Cache for DOM states to prevent layout thrashing
    const domStates = [
      { label: '', display: 'none', trailDisplay: 'none', dotPinch: null, tooltip: '', tooltipDisplay: 'none' },
      { label: '', display: 'none', trailDisplay: 'none', dotPinch: null, tooltip: '', tooltipDisplay: 'none' }
    ];

    // Trail position storage for smoothing
    const trails = [
      { x: 0, y: 0, initialized: false },
      { x: 0, y: 0, initialized: false }
    ];

    const updateLoop = () => {
      const data = window.latestHandData || { landmarks: [], cursors: [], gestures: [] };
      const cursors = data.cursors || [];
      const gestures = data.gestures || [];
      const landmarks = data.landmarks || [];

      // A. DIBUJAR LANDMARKS EN CANVAS NATIVO
      const canvas = canvasRef.current;
      if (canvas && isLoaded) {
        // Match canvas to screen size so landmark coords (normalised 0-1) map correctly
        const sw = window.innerWidth;
        const sh = window.innerHeight;
        if (canvas.width !== sw || canvas.height !== sh) {
          canvas.width  = sw;
          canvas.height = sh;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, sw, sh);

        if (landmarks.length > 0) {
          landmarks.forEach((handLandmarks, i) => {
            const color = i === 0 ? '#7C3AED' : '#EC4899';
            drawHand(ctx, handLandmarks, color, sw, sh);
          });
        }
      }

      // B. ACTUALIZAR CURSORES VIRTUALES DIRECTAMENTE EN EL DOM (Butter smooth, zero React lag)
      for (let i = 0; i < 2; i++) {
        const cursor = cursors[i];
        const gesture = gestures[i];
        const els = getCursorElements(i);
        const state = domStates[i];

        if (cursor && cursor.isVisible) {
          // Posición del contenedor principal
          if (els.container) {
            els.container.style.left = `${cursor.x}px`;
            els.container.style.top = `${cursor.y}px`;
            if (state.display !== 'block') {
              els.container.style.display = 'block';
              state.display = 'block';
            }
          }

          // Posición de la estela con filtro de suavizado LERP
          const trail = trails[i];
          if (!trail.initialized) {
            trail.x = cursor.x;
            trail.y = cursor.y;
            trail.initialized = true;
          } else {
            trail.x += (cursor.x - trail.x) * 0.75;
            trail.y += (cursor.y - trail.y) * 0.75;
          }

          if (els.trail) {
            els.trail.style.left = `${trail.x}px`;
            els.trail.style.top = `${trail.y}px`;
            if (state.trailDisplay !== 'block') {
              els.trail.style.display = 'block';
              state.trailDisplay = 'block';
            }
          }

          // Estilos dinámicos del cursor en base a la pinza
          if (els.dot) {
            const isPinching = !!gesture?.isPinching;
            if (state.dotPinch !== isPinching) {
              state.dotPinch = isPinching;
              if (isPinching) {
                els.dot.style.transform = 'scale(0.85)';
                els.dot.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                els.dot.style.borderColor = '#ffffff';
                els.dot.style.boxShadow = '0 0 35px white';
                if (els.ping) els.ping.style.display = 'block';
              } else {
                els.dot.style.transform = 'scale(1)';
                els.dot.style.backgroundColor = i === 0 ? 'rgba(124, 58, 237, 0.25)' : 'rgba(236, 72, 153, 0.25)';
                els.dot.style.borderColor = i === 0 ? '#7C3AED' : '#EC4899';
                els.dot.style.boxShadow = i === 0 ? '0 0 20px rgba(124, 58, 237, 0.5)' : '0 0 20px rgba(236, 72, 153, 0.5)';
                if (els.ping) els.ping.style.display = 'none';
              }
            }
          }

          // Texto descriptivo del gesto actual
          if (els.label) {
            const txt = gesture?.isIndexUp 
              ? '☝️ Dibujando' 
              : gesture?.isOpenHand 
              ? '✋ Pausa' 
              : gesture?.isPinching 
              ? '🤏 Agarrar' 
              : `🖐️ Mano ${i + 1}`;
            
            if (state.label !== txt) {
              els.label.textContent = txt;
              state.label = txt;
            }
          }

          // --- LOGICA DE TOOLTIP Y METRICAS DE UX EN TIEMPO REAL ---
          if (window.currentSessionUX) {
            const ux = window.currentSessionUX;
            const game = ux.gameName;
            
            // Medimos métricas sobre el cursor principal (i === 0)
            if (i === 0) {
              ux.totalGestureFrames = (ux.totalGestureFrames || 0) + 1;

              let gestureActive = false;
              if (game === 'PIZARRA') {
                gestureActive = !!gesture?.isIndexUp;
              } else if (game === 'PIANO') {
                gestureActive = !!(gesture?.isOpenHand || gesture?.isIndexUp || gesture?.isPinching);
              } else {
                gestureActive = !!gesture?.isPinching;
              }

              if (gestureActive) {
                ux.successGestureFrames = (ux.successGestureFrames || 0) + 1;

                // Transición del gesto de inactivo a activo
                if (!ux.wasGestureActive) {
                  ux.wasGestureActive = true;
                  ux.interactionCount = (ux.interactionCount || 0) + 1;
                  ux.consecutiveSuccessCount = (ux.consecutiveSuccessCount || 0) + 1;
                  ux.lastInteractionTime = Date.now();
                }

                // Si logramos 3 interacciones sin disparar la ayuda, registramos autonomía
                if (ux.autonomyTime === null && ux.consecutiveSuccessCount >= 3) {
                  ux.autonomyTime = (Date.now() - ux.startTime) / 1000;
                }
              } else {
                ux.wasGestureActive = false;
              }

              // Detectar falsos positivos (gestos < 120ms sin click)
              if (gestureActive) {
                if (!ux.gestureStartTime) ux.gestureStartTime = Date.now();
              } else if (ux.gestureStartTime) {
                const gestureDuration = Date.now() - ux.gestureStartTime;
                ux.gestureStartTime = null;
                const timeSinceLastClick = Date.now() - (ux.lastInteractionTime || 0);
                if (gestureDuration < 120 && timeSinceLastClick > 200) {
                  ux.falsePositives = (ux.falsePositives || 0) + 1;
                }
              }

              // Alerta de ayuda (Struggling): mano visible por > 6s sin interacción
              const lastInteract = ux.lastInteractionTime || ux.startTime;
              const elapsedNoInteract = Date.now() - lastInteract;

              if (elapsedNoInteract > 6000) {
                let text = '';
                if (game === 'PIZARRA') {
                  text = lang === 'es' ? '¡Levanta el índice ☝️ para pintar!' : '¡Lift your index ☝️ to paint!';
                } else if (game === 'PIANO') {
                  text = lang === 'es' ? '¡Acerca tus dedos a las teclas 🎹!' : '¡Bring fingers close to keys 🎹!';
                } else if (game === 'BRICKS') {
                  text = lang === 'es' ? '¡Desliza y pellizca 🤏 para lanzar!' : '¡Slide & pinch 🤏 to launch!';
                } else {
                  text = lang === 'es' ? '¡Pellizca 🤏 para interactuar!' : '¡Pinch 🤏 to interact!';
                }

                if (els.tooltip) {
                  if (state.tooltip !== text) {
                    els.tooltip.textContent = text;
                    state.tooltip = text;
                  }
                  if (state.tooltipDisplay !== 'block') {
                    els.tooltip.style.display = 'block';
                    state.tooltipDisplay = 'block';
                  }
                }

                if (!ux.tooltipActiveThisTime) {
                  ux.tooltipActiveThisTime = true;
                  ux.tooltipTriggered = true;
                  ux.falseNegatives = (ux.falseNegatives || 0) + 1;
                  ux.consecutiveSuccessCount = 0; // resetear racha de autonomía
                }
              } else {
                if (els.tooltip && state.tooltipDisplay !== 'none') {
                  els.tooltip.style.display = 'none';
                  state.tooltipDisplay = 'none';
                }
                ux.tooltipActiveThisTime = false;
              }
            }
          } else {
            if (els.tooltip && state.tooltipDisplay !== 'none') {
              els.tooltip.style.display = 'none';
              state.tooltipDisplay = 'none';
            }
          }

        } else {
          // Ocultar elementos si no se detecta la mano
          if (els.container && state.display !== 'none') {
            els.container.style.display = 'none';
            state.display = 'none';
          }
          if (els.trail && state.trailDisplay !== 'none') {
            els.trail.style.display = 'none';
            state.trailDisplay = 'none';
          }
          if (els.tooltip && state.tooltipDisplay !== 'none') {
            els.tooltip.style.display = 'none';
            state.tooltipDisplay = 'none';
          }
          trails[i].initialized = false;
        }
      }

      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isLoaded, videoRef]);

  return (
    <div className="fixed inset-0 bg-[#03030b] overflow-hidden">
      {/* 1. Video Layer (Mirrored) */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover scale-x-[-1] ${
            transparent
              ? 'opacity-90'
              : 'opacity-60 grayscale brightness-90'
          }`}
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* 2. Overlay Layer — near-invisible in transparent mode, dark in Pizarra mode */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: transparent ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.20)', backdropFilter: transparent ? 'none' : 'blur(2px)' }}
      />

      {/* 3. Landmarks Layer (Neon) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none opacity-70"
      />

      {/* 4. UI Layer (Transparent Content) */}
      <div className="absolute inset-0 z-30 flex flex-col">
        {children}
      </div>

      {/* 5. Virtual Cursors Layer (DOM absolute placeholders) */}
      {/* Mano 1 (Violeta) */}
      <div id="virtual-cursor-trail-0" className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 hidden w-8 h-8 rounded-full bg-white/5 border border-white/10" />
      <div id="virtual-cursor-container-0" className="fixed z-[10000] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 hidden">
        <div id="virtual-cursor-dot-0" className="w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center bg-purple-500/25 border-purple-500 shadow-[0_0_20px_rgba(124,58,237,0.5)]">
          <div id="virtual-cursor-ping-0" className="w-2 h-2 bg-purple-600 rounded-full animate-ping hidden" />
        </div>
        <div id="virtual-cursor-label-0" className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white italic drop-shadow-xl bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">🖐️ Mano 1</div>
        <div id="virtual-cursor-tooltip-0" className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white bg-red-600/90 px-4 py-2.5 rounded-2xl border border-red-500/30 shadow-[0_0_25px_rgba(220,38,38,0.55)] animate-bounce hidden z-[10002]">¡Pellizca 🤏!</div>
      </div>

      {/* Mano 2 (Rosa) */}
      <div id="virtual-cursor-trail-1" className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 hidden w-8 h-8 rounded-full bg-white/5 border border-white/10" />
      <div id="virtual-cursor-container-1" className="fixed z-[10000] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 hidden">
        <div id="virtual-cursor-dot-1" className="w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center bg-pink-500/25 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]">
          <div id="virtual-cursor-ping-1" className="w-2 h-2 bg-pink-600 rounded-full animate-ping hidden" />
        </div>
        <div id="virtual-cursor-label-1" className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white italic drop-shadow-xl bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">🖐️ Mano 2</div>
        <div id="virtual-cursor-tooltip-1" className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white bg-red-600/90 px-4 py-2.5 rounded-2xl border border-red-500/30 shadow-[0_0_25px_rgba(220,38,38,0.55)] animate-bounce hidden z-[10002]">¡Pellizca 🤏!</div>
      </div>

      {/* Loading & Error Screen */}
      {(!isLoaded || error) && (
        <div className="absolute inset-0 z-[100] bg-[#03030b] flex flex-col items-center justify-center p-12 text-center">
          {error ? (
            <div className="space-y-6 max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-display font-black text-red-500 uppercase italic">Error de Inicialización</h2>
              <p className="text-white/40 text-xs font-bold leading-relaxed">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-8" />
              <p className="text-purple-400 font-black uppercase tracking-[0.4em] text-[10px] italic">Iniciando Sensor IA...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LayeredEngine;
