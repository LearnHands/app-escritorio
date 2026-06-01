import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FOOTER_H  = 64;
const MAX_ZOOM  = 3.5;
const MIN_ZOOM  = 0.35;
// Visual colour per hand: hand-0 = purple, hand-1 = emerald
const HAND_COLORS = ['#A78BFA', '#34D399'];

// ── Planet data ────────────────────────────────────────────────────────────────
const PLANETS = [
  { name:'Mercurio', color:'#A8A8A8', glow:'#6B7280', r:6,  orbitPx:68,  period:4.1,   moonCount:0, moonR:0, ring:false,
    pages:[
      { icon:'📏', title:'Datos',       text:'Distancia al Sol: 58 M km\nDiámetro: 4 879 km\nDía: 59 días terrestres\nAño: 88 días terrestres' },
      { icon:'🌡️', title:'Temperatura', text:'Día: +430 °C · Noche: −180 °C\n\n¡La mayor diferencia térmica del sistema solar!' },
      { icon:'🤯', title:'Curiosidad',  text:'Aunque es el más cercano al Sol, NO es el más caliente. ¡Venus lo supera gracias a su efecto invernadero!' },
    ]},
  { name:'Venus', color:'#FDE68A', glow:'#F59E0B', r:9, orbitPx:112, period:10.5, moonCount:0, moonR:0, ring:false,
    pages:[
      { icon:'📏', title:'Datos',       text:'Distancia al Sol: 108 M km\nDiámetro: 12 104 km\nUn día en Venus dura más que su año' },
      { icon:'🌡️', title:'Temperatura', text:'Temperatura media: 462 °C\n\nSu atmósfera de CO₂ atrapa el calor como un invernadero gigante.' },
      { icon:'🔄', title:'Rotación',    text:'Venus gira en sentido contrario a casi todos los planetas. ¡En Venus el Sol sale por el Oeste!' },
    ]},
  { name:'Tierra', color:'#3B82F6', glow:'#60A5FA', r:10, orbitPx:160, period:17.0, moonCount:1, moonR:3, ring:false,
    pages:[
      { icon:'💧', title:'Agua',         text:'El 71% de la superficie está cubierta de agua. Es el único planeta con agua líquida en superficie.' },
      { icon:'📏', title:'Datos',        text:'Distancia al Sol: 150 M km\nDiámetro: 12 742 km\n1 luna\nTemperatura media: 15 °C' },
      { icon:'🧬', title:'Vida',         text:'Único planeta con vida confirmada: más de 8 millones de especies. ¡Nuestro hogar en el cosmos!' },
      { icon:'🛰️', title:'Exploración', text:'Más de 5 000 satélites artificiales nos orbitan. La ISS viaja a 28 000 km/h.' },
    ]},
  { name:'Marte', color:'#EF4444', glow:'#F87171', r:7, orbitPx:218, period:32.0, moonCount:2, moonR:2, ring:false,
    pages:[
      { icon:'🌋', title:'Monte Olimpo', text:'El volcán más alto del sistema solar: 22 km de altura, ¡3× más que el Everest!' },
      { icon:'📏', title:'Datos',        text:'Distancia al Sol: 228 M km\nDiámetro: 6 779 km\n2 lunas: Fobos y Deimos\nAño: 687 días terrestres' },
      { icon:'🚀', title:'Exploración',  text:'Más de 50 misiones han ido a Marte. Curiosity y Perseverance buscan signos de vida hoy.' },
      { icon:'🔴', title:'Color',        text:'El color rojo se debe al óxido de hierro. Tiene el cañón más largo del sistema solar.' },
    ]},
  { name:'Júpiter', color:'#D97706', glow:'#FBBF24', r:24, orbitPx:308, period:84.0, moonCount:4, moonR:3, ring:false,
    pages:[
      { icon:'🌀', title:'Gran Mancha',  text:'La Gran Mancha Roja lleva más de 350 años activa. ¡La Tierra entera cabe dentro!' },
      { icon:'📏', title:'Datos',        text:'Distancia al Sol: 778 M km\nDiámetro: 139 820 km\n95 lunas\n1 300 Tierras cabrían en él' },
      { icon:'🌙', title:'Lunas',        text:'Ío, Europa, Ganimedes y Calisto (Galileo, 1610). Europa puede tener océano bajo su hielo.' },
      { icon:'🛡️', title:'Guardián',    text:'Su enorme gravedad desvía asteroides y cometas, protegiendo a la Tierra de muchos impactos.' },
    ]},
  { name:'Saturno', color:'#F59E0B', glow:'#FCD34D', r:18, orbitPx:400, period:214.0, moonCount:2, moonR:4, ring:true,
    pages:[
      { icon:'💍', title:'Anillos',  text:'Los anillos miden 273 000 km de diámetro pero solo 1 km de grosor: hielo y roca.' },
      { icon:'📏', title:'Datos',    text:'Distancia al Sol: 1 432 M km\nDiámetro: 116 460 km\n146 lunas\nFlotaría en el agua' },
      { icon:'🌙', title:'Titán',    text:'Titán tiene atmósfera densa y lagos de metano líquido. Candidato a albergar vida.' },
      { icon:'⏱️', title:'Tiempo',   text:'Un día dura 10 h 33 min, ¡pero un año equivale a 29 años terrestres!' },
    ]},
  { name:'Urano', color:'#67E8F9', glow:'#22D3EE', r:13, orbitPx:476, period:608.0, moonCount:1, moonR:2, ring:false,
    pages:[
      { icon:'↔️', title:'Rotación',      text:'Rota de lado (97° inclinado). Sus polos pasan décadas en oscuridad total.' },
      { icon:'📏', title:'Datos',          text:'Distancia al Sol: 2 867 M km\nDiámetro: 50 724 km\n28 lunas\nTemperatura: −224 °C' },
      { icon:'💎', title:'Interior',       text:'Podría llover diamantes en su interior debido a la presión extrema sobre el metano.' },
      { icon:'🔭', title:'Descubrimiento', text:'Primer planeta descubierto con telescopio, por William Herschel en 1781.' },
    ]},
  { name:'Neptuno', color:'#1D4ED8', glow:'#3B82F6', r:12, orbitPx:538, period:1188.0, moonCount:1, moonR:3, ring:false,
    pages:[
      { icon:'💨', title:'Vientos',         text:'Vientos de 2 100 km/h — los más rápidos del sistema solar.' },
      { icon:'📏', title:'Datos',            text:'Distancia al Sol: 4 495 M km\nDiámetro: 49 244 km\n16 lunas\n1 año = 165 años terrestres' },
      { icon:'🔭', title:'Descubrimiento',   text:'Predicho matemáticamente antes de observarse. Las perturbaciones de Urano lo revelaron en 1846.' },
      { icon:'🌙', title:'Tritón',           text:'Su luna más grande orbita al revés: probablemente capturada del Cinturón de Kuiper.' },
    ]},
];

function lightenHex(hex, amt) {
  const n = parseInt(hex.replace('#',''),16);
  return `rgb(${Math.min(255,(n>>16)+amt)},${Math.min(255,((n>>8)&0xFF)+amt)},${Math.min(255,(n&0xFF)+amt)})`;
}
function circleOnScreen(scx,scy,sr,W,H,margin=0){
  return (scx+sr+margin)>=0&&(scx-sr-margin)<=W&&(scy+sr+margin)>=0&&(scy-sr-margin)<=H;
}
// Hit-test a screen point against a DOM element with optional margin
function hitEl(px, py, el, margin=16) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return px >= r.left-margin && px <= r.right+margin && py >= r.top-margin && py <= r.bottom+margin;
}

// ── Component ──────────────────────────────────────────────────────────────────
const SolarSystemModule = memo(({ addPoints }) => {
  const canvasRef = useRef(null);

  const [selectedInfo, setSelectedInfo] = useState(null);
  const [paused,   setPaused]   = useState(false);
  const [visited,  setVisited]  = useState(new Set());

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  // ── All mutable state ──────────────────────────────────────────────────────
  const stateRef = useRef({
    time: 0, paused: false,
    viewX:0, viewY:0, viewScale:1,
    targetX:0, targetY:0, targetScale:1,
    selectedPlanet: null,
    cardOpenTime: 0,   // timestamp when card opened (blocks inputs during fly-in + carry-over pinch)
    infoPage: 0,
    // Role-based gesture assignment (index of hand slot that owns each role, -1 = none)
    // Role is claimed at pinch-start and released when that pinch ends.
    // This is immune to MediaPipe hand-index reordering between frames.
    movementHand:  -1,  // which hand slot is currently panning
    interactHand:  -1,  // which hand slot is currently selecting/zooming
    // Per-hand arrays
    hoveredPlanet:   [null, null],
    wasPinching:     [false, false],
    pinchHandled:    [true, true],
    pinchMode:       [null, null],   // 'pan'|'planet'|'zoom'|'card'|null
    pinchStartY:     [0, 0],
    pinchStartScale: [1, 1],
    prevCursorX:     [null, null],
    prevCursorY:     [null, null],
    ssPositions:     [],
    stars:     null,
    asteroids: null,
    visited:   new Set(),
  });

  // Pre-compute statics
  useEffect(() => {
    const s = stateRef.current;
    s.stars = Array.from({length:260},()=>({
      nx:Math.random(), ny:Math.random(),
      r:0.4+Math.random()*1.4, a:0.15+Math.random()*0.85, tw:Math.random()*Math.PI*2,
    }));
    s.asteroids = Array.from({length:150},()=>({
      angle:Math.random()*Math.PI*2, dist:258+(Math.random()-0.5)*58,
      size:0.5+Math.random()*1.8, alpha:0.15+Math.random()*0.45, spd:0.03+Math.random()*0.05,
    }));
  }, []);

  // ── Stable callbacks for view + info ──────────────────────────────────────
  const zoomIn    = useCallback(()=>{ stateRef.current.targetScale=Math.min(MAX_ZOOM,stateRef.current.targetScale*1.5); },[]);
  const zoomOut   = useCallback(()=>{ stateRef.current.targetScale=Math.max(MIN_ZOOM,stateRef.current.targetScale/1.5); },[]);
  const resetView = useCallback(()=>{
    const s=stateRef.current;
    s.targetScale=1; s.targetX=0; s.targetY=0;
    s.selectedPlanet=null; s.infoPage=0; s.paused=false;
    setSelectedInfo(null); setPaused(false);
  },[]);
  const togglePause = useCallback(()=>{
    const s=stateRef.current; s.paused=!s.paused; setPaused(s.paused);
  },[]);
  const goInfoPage = useCallback((dir)=>{
    const s=stateRef.current;
    const planet=PLANETS.find(p=>p.name===s.selectedPlanet);
    if(!planet) return;
    s.infoPage=Math.max(0,Math.min(planet.pages.length-1,s.infoPage+dir));
    setSelectedInfo(prev=>prev?{...prev,currentPage:s.infoPage}:prev);
  },[]);
  const setInfoPageFn = useCallback((i)=>{
    stateRef.current.infoPage=i;
    setSelectedInfo(prev=>prev?{...prev,currentPage:i}:prev);
  },[]);
  const closeInfo = useCallback(()=>{
    const s=stateRef.current;
    s.selectedPlanet=null; s.infoPage=0; s.paused=false;
    setSelectedInfo(null); setPaused(false);
  },[]);

  // ── RAF loop ───────────────────────────────────────────────────────────────
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    const resize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight-FOOTER_H; };
    resize();
    window.addEventListener('resize',resize);

    let animId;
    let lastTs=performance.now();

    const loop=(ts)=>{
      animId=requestAnimationFrame(loop); // always first — loop never dies

      try {
        const dt=Math.min((ts-lastTs)/1000,0.05);
        lastTs=ts;
        const s=stateRef.current;
        const ctx=canvas.getContext('2d');
        const W=canvas.width, H=canvas.height;

        if(!s.paused) s.time+=dt;

        // Smooth lerp
        const LR=0.10;
        s.viewScale+=(s.targetScale-s.viewScale)*LR;
        s.viewX+=(s.targetX-s.viewX)*LR;
        s.viewY+=(s.targetY-s.viewY)*LR;
        if(!isFinite(s.viewScale)){s.viewScale=1;s.targetScale=1;}
        if(!isFinite(s.viewX)){s.viewX=0;s.targetX=0;}
        if(!isFinite(s.viewY)){s.viewY=0;s.targetY=0;}

        const vs=s.viewScale;
        const ox=W/2+s.viewX, oy=H/2+s.viewY;

        // Background
        ctx.clearRect(0,0,W,H);
        const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.hypot(W,H)/2);
        bg.addColorStop(0,'#06082A'); bg.addColorStop(1,'#010208');
        ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

        // Stars
        if(s.stars){
          s.stars.forEach(star=>{
            const a=star.a*(0.6+0.4*Math.sin(s.time*1.4+star.tw));
            ctx.beginPath(); ctx.arc(star.nx*W,star.ny*H,star.r,0,Math.PI*2);
            ctx.fillStyle=`rgba(255,255,255,${a.toFixed(2)})`; ctx.fill();
          });
        }

        // Solar system transform
        ctx.save();
        ctx.translate(ox,oy);
        ctx.scale(vs,vs);

        // Orbits
        PLANETS.forEach(p=>{
          if(!circleOnScreen(ox,oy,p.orbitPx*vs,W,H,10)) return;
          ctx.beginPath(); ctx.arc(0,0,p.orbitPx,0,Math.PI*2);
          ctx.strokeStyle=s.selectedPlanet===p.name?`${p.glow}50`:'rgba(255,255,255,0.055)';
          ctx.lineWidth=(s.selectedPlanet===p.name?1.5:0.6)/vs;
          ctx.stroke();
        });

        // Asteroid belt
        if(s.asteroids){
          const br=260*vs;
          if(circleOnScreen(ox,oy,br+60*vs,W,H,0)){
            s.asteroids.forEach(a=>{
              const ax=Math.cos(a.angle+s.time*a.spd)*a.dist;
              const ay=Math.sin(a.angle+s.time*a.spd)*a.dist;
              const scrAx=ox+ax*vs, scrAy=oy+ay*vs;
              if(scrAx<-10||scrAx>W+10||scrAy<-10||scrAy>H+10) return;
              ctx.beginPath(); ctx.arc(ax,ay,Math.max(0.3,a.size/Math.max(0.8,vs)),0,Math.PI*2);
              ctx.fillStyle=`rgba(185,165,130,${a.alpha})`; ctx.fill();
            });
          }
        }

        // Sun
        const SR=28;
        const corona=ctx.createRadialGradient(0,0,0,0,0,SR*5);
        corona.addColorStop(0,'rgba(254,224,71,0.6)'); corona.addColorStop(0.25,'rgba(251,146,60,0.28)');
        corona.addColorStop(0.7,'rgba(251,146,60,0.06)'); corona.addColorStop(1,'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(0,0,SR*5,0,Math.PI*2); ctx.fillStyle=corona; ctx.fill();
        const sunG=ctx.createRadialGradient(-SR*0.3,-SR*0.3,SR*0.05,0,0,SR);
        sunG.addColorStop(0,'#FEFCE8'); sunG.addColorStop(0.4,'#FBBF24'); sunG.addColorStop(1,'#EA580C');
        ctx.beginPath(); ctx.arc(0,0,SR,0,Math.PI*2); ctx.fillStyle=sunG;
        ctx.shadowBlur=50/vs; ctx.shadowColor='#FBBF24'; ctx.fill(); ctx.shadowBlur=0;
        ctx.font=`bold ${Math.max(7,9/vs)}px system-ui`;
        ctx.fillStyle='rgba(254,224,71,0.45)'; ctx.textAlign='center';
        ctx.fillText('Sol',0,SR+11/vs);

        // Planets
        const ssPositions=[];
        PLANETS.forEach(p=>{
          const angle=(s.time/p.period)*Math.PI*2;
          const px=Math.cos(angle)*p.orbitPx, py=Math.sin(angle)*p.orbitPx;
          const scrPx=ox+px*vs, scrPy=oy+py*vs;
          ssPositions.push({name:p.name,x:px,y:py,r:p.r});
          if(!circleOnScreen(scrPx,scrPy,p.r*vs+60,W,H)) return;

          const isHov=s.hoveredPlanet[0]===p.name||s.hoveredPlanet[1]===p.name;
          const isSel=s.selectedPlanet===p.name;

          // Rings
          if(p.ring){
            ctx.save(); ctx.translate(px,py); ctx.scale(1,0.28);
            const ri=p.r*1.55, ro=p.r*2.7;
            const rg=ctx.createRadialGradient(0,0,ri,0,0,ro);
            rg.addColorStop(0,'rgba(250,215,110,0.75)'); rg.addColorStop(0.6,'rgba(240,200,80,0.45)'); rg.addColorStop(1,'rgba(230,180,60,0)');
            ctx.beginPath(); ctx.arc(0,0,ro,0,Math.PI*2); ctx.arc(0,0,ri,0,Math.PI*2,true);
            ctx.fillStyle=rg; ctx.fill(); ctx.restore();
          }
          // Halo
          if(isHov||isSel){
            const halo=ctx.createRadialGradient(px,py,0,px,py,p.r*5);
            halo.addColorStop(0,`${p.glow}55`); halo.addColorStop(1,'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(px,py,p.r*5,0,Math.PI*2); ctx.fillStyle=halo; ctx.fill();
          }
          if(isSel){
            ctx.beginPath(); ctx.arc(px,py,p.r+5/vs,0,Math.PI*2);
            ctx.strokeStyle=p.glow; ctx.lineWidth=1.5/vs;
            ctx.setLineDash([4/vs,4/vs]); ctx.stroke(); ctx.setLineDash([]);
          }
          // Body
          const pg=ctx.createRadialGradient(px-p.r*0.32,py-p.r*0.32,p.r*0.05,px,py,p.r);
          pg.addColorStop(0,lightenHex(p.color,55)); pg.addColorStop(1,p.color);
          ctx.beginPath(); ctx.arc(px,py,p.r,0,Math.PI*2); ctx.fillStyle=pg;
          ctx.shadowBlur=(isHov||isSel?20:5)/vs; ctx.shadowColor=p.glow;
          ctx.fill(); ctx.shadowBlur=0;
          // Earth
          if(p.name==='Tierra'){
            ctx.beginPath(); ctx.ellipse(px,py+p.r*0.1,p.r*0.72,p.r*0.45,0,0,Math.PI*2);
            ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=p.r*0.38; ctx.stroke();
          }
          // Jupiter
          if(p.name==='Júpiter'){
            [-0.35,0,0.35].forEach(ofs=>{
              ctx.save(); ctx.beginPath(); ctx.ellipse(px,py+ofs*p.r,p.r,p.r*0.15,0,0,Math.PI*2); ctx.clip();
              ctx.fillStyle='rgba(160,95,30,0.20)'; ctx.fillRect(px-p.r,py-p.r,p.r*2,p.r*2); ctx.restore();
            });
            ctx.beginPath(); ctx.ellipse(px+p.r*0.25,py+p.r*0.2,p.r*0.18,p.r*0.10,0,0,Math.PI*2);
            ctx.fillStyle='rgba(185,75,40,0.55)'; ctx.fill();
          }
          // Moons
          for(let mi=0;mi<p.moonCount;mi++){
            const mA=s.time*(p.name==='Tierra'?5.5:2.5-mi*0.35)+mi*Math.PI/Math.max(p.moonCount,1);
            const mD=p.r*(2.0+mi*0.9);
            const mx=px+Math.cos(mA)*mD, my=py+Math.sin(mA)*mD;
            if(!circleOnScreen(ox+mx*vs,oy+my*vs,p.moonR*vs+5,W,H)) continue;
            ctx.beginPath(); ctx.arc(mx,my,Math.max(1.5,p.moonR),0,Math.PI*2);
            ctx.fillStyle='#CBD5E1'; ctx.shadowBlur=3/vs; ctx.shadowColor='#94A3B8';
            ctx.fill(); ctx.shadowBlur=0;
          }
          // Label
          if(isHov||isSel||vs>1.7){
            ctx.font='bold 10px system-ui';
            ctx.fillStyle=(isHov||isSel)?'#FFFFFF':'rgba(255,255,255,0.50)';
            ctx.textAlign='center';
            ctx.shadowBlur=8; ctx.shadowColor=p.glow;
            ctx.fillText(p.name,px,py-p.r-6/vs); ctx.shadowBlur=0;
          }
        });
        s.ssPositions=ssPositions;
        ctx.restore(); // end solar system transform

        // ── Process each hand — role-claimed-at-pinch-start ────────────────
        // Role is assigned the moment a pinch begins and released when it ends.
        // This makes the system immune to MediaPipe index reordering between frames.
        // Open hand NEVER triggers movement — only active pinch does.
        //
        //  movementHand  = hand-slot index currently panning  (-1 = unclaimed)
        //  interactHand  = hand-slot index currently selecting/zooming (-1 = unclaimed)
        //
        // Claim rules (no card):
        //   pinch near planet  + interactHand free  → interaction / 'planet'
        //   pinch empty space  + movementHand free  → movement    / 'pan'
        //   pinch empty space  + movementHand taken → second pinch / 'zoom'
        const {cursors=[],gestures=[]}=window.latestHandData||{};
        const cardOpen=!!s.selectedPlanet;
        const cardEl=cardOpen?document.getElementById('solar-info-card'):null;

        for(let i=0;i<2;i++){
          const cursor=cursors[i];
          const gesture=gestures[i];

          if(!cursor?.isVisible){
            // Release any role this slot held
            if(s.movementHand===i) s.movementHand=-1;
            if(s.interactHand===i)  s.interactHand=-1;
            s.prevCursorX[i]=null; s.prevCursorY[i]=null;
            s.hoveredPlanet[i]=null; s.wasPinching[i]=false;
            s.pinchMode[i]=null; s.pinchHandled[i]=true;
            continue;
          }

          const cPx=cursor.x, cPy=cursor.y;
          if(!isFinite(cPx)||!isFinite(cPy)){
            s.prevCursorX[i]=null; s.prevCursorY[i]=null; continue;
          }

          const isPinching=!!gesture?.isPinching;
          const ssX=(cPx-ox)/vs, ssY=(cPy-oy)/vs;

          // ── CARD OPEN: both hands locked to pinch-only ─────────────────
          if(cardOpen){
            s.hoveredPlanet[i]=null;
            if(s.movementHand===i) s.movementHand=-1;
            if(s.interactHand===i)  s.interactHand=-1;

            // Block inputs for 550ms after card opens:
            // 1) The card fly-in animation needs to finish so getBoundingClientRect is stable
            // 2) The carry-over pinch from planet-selection must be released first
            const cardAge=performance.now()-s.cardOpenTime;
            if(cardAge < 550){
              // Still in grace period — just track cursor, no interaction
              s.wasPinching[i]=isPinching;
              s.prevCursorX[i]=cPx; s.prevCursorY[i]=cPy;
              // Draw a "waiting" cursor
              ctx.beginPath(); ctx.arc(cPx,cPy,13,0,Math.PI*2);
              ctx.strokeStyle='rgba(255,255,255,0.20)'; ctx.lineWidth=1.5;
              ctx.setLineDash([2,6]); ctx.stroke(); ctx.setLineDash([]);
              continue;
            }

            if(isPinching&&!s.wasPinching[i]){
              s.pinchHandled[i]=false;
              if(cardEl&&!hitEl(cPx,cPy,cardEl,0)){
                s.selectedPlanet=null; s.infoPage=0; s.paused=false;
                setSelectedInfo(null); setPaused(false);
                s.pinchHandled[i]=true; s.pinchMode[i]=null;
              } else {
                s.pinchMode[i]='card';
              }
            }

            if(isPinching&&!s.pinchHandled[i]&&s.pinchMode[i]==='card'){
              // Large margin (32px) compensates for 30fps detection lag and finger position offset
              const prevBtn=document.getElementById('solar-prev-btn');
              const nextBtn=document.getElementById('solar-next-btn');
              if(prevBtn&&hitEl(cPx,cPy,prevBtn,32)){
                s.pinchHandled[i]=true; goInfoPage(-1);
              } else if(nextBtn&&hitEl(cPx,cPy,nextBtn,32)){
                s.pinchHandled[i]=true; goInfoPage(1);
              } else {
                const planet=PLANETS.find(p=>p.name===s.selectedPlanet);
                if(planet){
                  for(let di=0;di<planet.pages.length;di++){
                    const dot=document.getElementById(`solar-dot-${di}`);
                    if(dot&&hitEl(cPx,cPy,dot,24)){s.pinchHandled[i]=true;setInfoPageFn(di);break;}
                  }
                }
              }
            }

            if(!isPinching&&s.wasPinching[i]){s.pinchMode[i]=null;s.pinchHandled[i]=true;}
            s.wasPinching[i]=isPinching;
            s.prevCursorX[i]=cPx; s.prevCursorY[i]=cPy;

            const cc=isPinching?HAND_COLORS[i]:'rgba(255,255,255,0.28)';
            ctx.beginPath(); ctx.arc(cPx,cPy,isPinching?8:13,0,Math.PI*2);
            ctx.strokeStyle=cc; ctx.lineWidth=2; ctx.setLineDash(isPinching?[]:[3,5]); ctx.stroke(); ctx.setLineDash([]);
            if(isPinching){ctx.beginPath();ctx.arc(cPx,cPy,4,0,Math.PI*2);ctx.fillStyle=cc;ctx.fill();
              ctx.fillStyle=`${cc}BB`;ctx.font='11px system-ui';ctx.textAlign='left';
              ctx.fillText('🤏 Navegar',cPx+18,cPy+4);
            }
            continue;
          }

          // ── NO CARD: hover detection (any hand can show hover) ──────────
          let hover=null, hDist=Infinity;
          s.ssPositions.forEach(pos=>{
            const d=Math.hypot(ssX-pos.x,ssY-pos.y);
            if(d<pos.r*3.5&&d<hDist){hDist=d;hover=pos.name;}
          });
          s.hoveredPlanet[i]=hover;

          // ── Pinch START: claim a role ────────────────────────────────────
          if(isPinching&&!s.wasPinching[i]){
            s.pinchHandled[i]=false;
            if(hover&&s.interactHand===-1){
              // Near a planet and no interaction hand yet → selection
              s.interactHand=i;
              s.pinchMode[i]='planet';
            } else if(!hover&&s.movementHand===-1){
              // Empty space, no movement hand yet → pan
              s.movementHand=i;
              s.pinchMode[i]='pan';
            } else if(!hover&&s.movementHand!==-1&&s.interactHand===-1){
              // Movement already claimed, empty space → zoom with second hand
              s.interactHand=i;
              s.pinchMode[i]='zoom';
              s.pinchStartY[i]=cPy;
              s.pinchStartScale[i]=s.targetScale;
            }
            // All other cases (e.g. near planet but interactHand taken): no role, pinch ignored
          }

          // ── Execute role while pinching ─────────────────────────────────
          if(isPinching&&s.prevCursorX[i]!==null){
            // PAN
            if(s.pinchMode[i]==='pan'&&s.movementHand===i){
              const dx=cPx-s.prevCursorX[i], dy=cPy-s.prevCursorY[i];
              if(isFinite(dx)&&isFinite(dy)){
                s.targetX=Math.max(-800,Math.min(800,s.targetX+dx));
                s.targetY=Math.max(-800,Math.min(800,s.targetY+dy));
              }
            }
            // ZOOM
            if(s.pinchMode[i]==='zoom'&&s.interactHand===i){
              const dy=s.pinchStartY[i]-cPy;
              const t=Math.max(-1,Math.min(1,dy/220));
              s.targetScale=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,s.pinchStartScale[i]*(1+t*1.5)));
            }
            // PLANET SELECT (once per pinch)
            if(s.pinchMode[i]==='planet'&&!s.pinchHandled[i]&&s.interactHand===i&&hover){
              s.pinchHandled[i]=true;
              const planet=PLANETS.find(p=>p.name===hover);
              if(planet){
                const isNew=!s.visited.has(hover);
                if(isNew){s.visited.add(hover);addPointsRef.current(80);setVisited(new Set(s.visited));}
                s.selectedPlanet=hover; s.infoPage=0; s.paused=true;
                s.cardOpenTime=performance.now(); // block card inputs during fly-in + carry-over pinch
                setPaused(true);
                const pos=s.ssPositions.find(p=>p.name===hover);
                if(pos){
                  const scrPX=ox+pos.x*vs, scrPY=oy+pos.y*vs;
                  s.targetX+=W*0.5-scrPX; s.targetY+=H*0.5-scrPY;
                  if(s.targetScale<2.0) s.targetScale=2.4;
                }
                setSelectedInfo({name:planet.name,color:planet.color,glow:planet.glow,pages:planet.pages,currentPage:0});
              }
            }
          }

          // ── Pinch END: free the role ────────────────────────────────────
          if(!isPinching&&s.wasPinching[i]){
            if(s.movementHand===i) s.movementHand=-1;
            if(s.interactHand===i)  s.interactHand=-1;
            s.pinchMode[i]=null; s.pinchHandled[i]=true;
          }

          s.wasPinching[i]=isPinching;
          s.prevCursorX[i]=cPx; s.prevCursorY[i]=cPy;

          // ── Draw cursor with role-based colour ─────────────────────────
          const isMoving =s.movementHand===i;
          const isInteract=s.interactHand===i;
          // purple = movement role, green = interaction role, yellow = hovering planet, white = idle
          const roleColor=isMoving?HAND_COLORS[0]:isInteract?HAND_COLORS[1]:hover?'#FCD34D':'rgba(255,255,255,0.32)';
          ctx.beginPath(); ctx.arc(cPx,cPy,isPinching?9:13,0,Math.PI*2);
          ctx.strokeStyle=roleColor; ctx.lineWidth=2.5;
          ctx.setLineDash(isPinching?[]:[3,5]); ctx.stroke(); ctx.setLineDash([]);
          if(isPinching||hover){ctx.beginPath();ctx.arc(cPx,cPy,4,0,Math.PI*2);ctx.fillStyle=roleColor;ctx.fill();}
          // Hint
          let hint='';
          if(s.pinchMode[i]==='pan')   hint='✋ Moviendo';
          else if(s.pinchMode[i]==='zoom')  hint='🔍 Zoom ↑↓';
          else if(isPinching&&hover)   hint=`🤏 ${hover}`;
          else if(hover)               hint=`☝️ ${hover}`;
          if(hint){
            ctx.fillStyle=`${roleColor}CC`; ctx.font='11px system-ui'; ctx.textAlign='left';
            ctx.fillText(hint,cPx+18,cPy+4);
          }
        } // end for each hand

      } catch(err){ console.warn('[SolarSystem]',err); }
    };

    animId=requestAnimationFrame(loop);
    return ()=>{ cancelAnimationFrame(animId); window.removeEventListener('resize',resize); };
  },[]); // stable

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <span>🪐</span>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/55">Sistema Solar</span>
        {visited.size>0&&(<><div className="w-px h-4 bg-white/20"/>
          <span className="text-[9px] font-black text-amber-400">{visited.size}/{PLANETS.length} planetas</span></>)}
      </div>

      {/* Zoom / pause controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {[
          {fn:zoomIn,    label:'+', title:'Acercar'},
          {fn:zoomOut,   label:'−', title:'Alejar'},
          {fn:resetView, label:'⌂', title:'Restablecer'},
          {fn:togglePause, label:paused?'▶':'⏸', title:paused?'Reanudar':'Pausar'},
        ].map(b=>(
          <button key={b.title} title={b.title} onClick={b.fn}
            className="w-10 h-10 glass rounded-xl border border-white/10 text-white/55 hover:text-white text-base font-black flex items-center justify-center transition-all active:scale-95">
            {b.label}
          </button>
        ))}
      </div>

      {/* ── Info card — large centered modal, backdrop pauses the scene ── */}
      <AnimatePresence>
        {selectedInfo && (
          <>
            {/* Backdrop — semi-transparent, pinch anywhere on it = close */}
            <motion.div
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute inset-0 z-30 bg-black/55 backdrop-blur-sm"
            />

            {/* Large centered card */}
            <motion.div
              id="solar-info-card"
              initial={{opacity:0,scale:0.88,y:24}}
              animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.88,y:24}}
              transition={{type:'spring',stiffness:280,damping:26}}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-[92vw] max-w-[520px] rounded-[36px] border border-white/10 overflow-hidden"
              style={{
                background:'linear-gradient(145deg,rgba(10,10,32,0.96),rgba(5,5,20,0.97))',
                boxShadow:`0 0 90px ${selectedInfo.glow}30, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            >
              {/* Planet header */}
              <div className="flex items-center gap-4 px-7 py-5 border-b border-white/10"
                style={{background:`${selectedInfo.color}14`}}>
                <div className="w-12 h-12 rounded-full flex-shrink-0"
                  style={{background:selectedInfo.color,boxShadow:`0 0 24px ${selectedInfo.glow}`}}/>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-display font-black italic uppercase tracking-tight text-white leading-tight">
                    {selectedInfo.name}
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/35">
                    Página {selectedInfo.currentPage+1} de {selectedInfo.pages.length}
                  </p>
                </div>
                <button onClick={closeInfo}
                  className="text-white/30 hover:text-white transition-colors text-xl font-black w-8 h-8 flex items-center justify-center">✕</button>
              </div>

              {/* Page content */}
              <AnimatePresence mode="wait">
                <motion.div key={selectedInfo.currentPage}
                  initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
                  transition={{duration:0.15}}
                  className="px-7 pt-5 pb-3 min-h-[160px]">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{selectedInfo.pages[selectedInfo.currentPage]?.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.35em]"
                      style={{color:selectedInfo.color}}>
                      {selectedInfo.pages[selectedInfo.currentPage]?.title}
                    </span>
                  </div>
                  <p className="text-[13px] text-white/78 leading-relaxed whitespace-pre-line font-medium">
                    {selectedInfo.pages[selectedInfo.currentPage]?.text}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Page dots */}
              <div className="flex justify-center gap-2.5 py-3">
                {selectedInfo.pages.map((_,i)=>(
                  <button id={`solar-dot-${i}`} key={i}
                    onClick={()=>setInfoPageFn(i)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width:i===selectedInfo.currentPage?'20px':'10px',
                      height:'10px',
                      background:i===selectedInfo.currentPage?selectedInfo.color:'rgba(255,255,255,0.22)',
                    }}/>
                ))}
              </div>

              {/* Nav buttons — large and easy to target with hands */}
              <div className="flex gap-3 px-6 pb-5 pt-1">
                <button id="solar-prev-btn"
                  onClick={()=>goInfoPage(-1)}
                  disabled={selectedInfo.currentPage===0}
                  className="flex-1 py-4 glass rounded-2xl border border-white/10 text-white/55 hover:text-white disabled:opacity-20 text-sm font-black transition-all active:scale-95">
                  ← Anterior
                </button>
                <button id="solar-next-btn"
                  onClick={()=>goInfoPage(1)}
                  disabled={selectedInfo.currentPage===selectedInfo.pages.length-1}
                  className="flex-1 py-4 glass rounded-2xl border border-white/10 text-white/55 hover:text-white disabled:opacity-20 text-sm font-black transition-all active:scale-95">
                  Siguiente →
                </button>
              </div>

              <p className="text-center text-[8.5px] font-black uppercase tracking-[0.25em] text-white/20 pb-4">
                🤏 Pellizca botones · 🤏 Fuera de la tarjeta para cerrar y continuar
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* All visited */}
      <AnimatePresence>
        {visited.size===PLANETS.length&&(
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 px-8 py-3 rounded-2xl border border-amber-500/40 bg-amber-500/10">
            <p className="text-amber-400 font-black uppercase tracking-widest text-[10px] text-center">
              🏆 ¡Exploraste los 8 planetas!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture guide */}
      {!selectedInfo&&(
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 glass px-6 py-2.5 rounded-2xl border border-white/10 animate-pulse">
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.12em]">
            <span className="text-[#A78BFA]">🤏 Pellizca espacio → mover</span>
            <div className="w-px h-3 bg-white/20"/>
            <span className="text-[#34D399]">🤏 Pellizca planeta → explorar</span>
            <div className="w-px h-3 bg-white/20"/>
            <span className="text-white/40">🤏 2ª pinza espacio ↕ → zoom</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default SolarSystemModule;
