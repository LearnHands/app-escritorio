import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Info, RotateCcw, Layers } from 'lucide-react';
import HandButton from '../HandButton';

const SYSTEMS = [
  { id: 'skeletal',    label: 'Esquelético',   emoji: '🦴', color: '#e8d5b0' },
  { id: 'muscular',   label: 'Muscular',       emoji: '💪', color: '#cc6644' },
  { id: 'circulatory',label: 'Circulatorio',   emoji: '❤️', color: '#dd2244' },
  { id: 'digestive',  label: 'Digestivo',      emoji: '🫃', color: '#88cc44' },
  { id: 'nervous',    label: 'Nervioso',       emoji: '🧠', color: '#bb88ff' },
];

// Body regions with info per system
const REGIONS = [
  {
    id: 'brain', label: 'Cerebro', y: 0.08, x: 0.5, r: 0.07,
    info: {
      skeletal:    { title: 'Cráneo', desc: 'El cráneo es el hueso que protege el cerebro. Está formado por 22 huesos soldados entre sí.' },
      muscular:    { title: 'Músculos faciales', desc: 'Más de 40 músculos en la cara controlan las expresiones: sonrisa, ceño, sorpresa.' },
      circulatory: { title: 'Encéfalo vascularizado', desc: 'El cerebro recibe el 20% de toda la sangre del cuerpo. Sin flujo sanguíneo, el cerebro daña en minutos.' },
      digestive:   { title: 'Control cerebral', desc: 'El cerebro coordina la digestión a través del nervio vago, regulando el estómago y los intestinos.' },
      nervous:     { title: 'Cerebro', desc: 'El cerebro pesa ~1.4 kg y tiene ~86 mil millones de neuronas. Es el centro de control del cuerpo humano.' },
    },
    emoji: '🧠',
  },
  {
    id: 'neck', label: 'Cuello', y: 0.17, x: 0.5, r: 0.035,
    info: {
      skeletal:    { title: 'Columna cervical', desc: '7 vértebras cervicales forman el cuello, soportando la cabeza (~5 kg) con gran movilidad.' },
      muscular:    { title: 'Músculos del cuello', desc: 'Los músculos esternocleidomastoideos y trapecios permiten girar y flexionar la cabeza.' },
      circulatory: { title: 'Arterias carótidas', desc: 'Las arterias carótidas son los principales vasos que llevan sangre oxigenada al cerebro.' },
      digestive:   { title: 'Esófago', desc: 'El esófago es el tubo que conecta la boca con el estómago. Mide ~25 cm y usa movimientos peristálticos.' },
      nervous:     { title: 'Médula espinal cervical', desc: 'La médula espinal pasa por el cuello y controla los brazos y manos a través de los nervios cervicales.' },
    },
    emoji: '🔵',
  },
  {
    id: 'chest', label: 'Tórax / Pecho', y: 0.30, x: 0.5, r: 0.10,
    info: {
      skeletal:    { title: 'Caja torácica', desc: '12 pares de costillas y el esternón forman la caja torácica, protegiendo corazón y pulmones.' },
      muscular:    { title: 'Músculos pectorales', desc: 'Los pectorales mayor y menor cubren el pecho. El diafragma —un músculo— permite respirar.' },
      circulatory: { title: 'Corazón', desc: 'El corazón late ~100,000 veces al día y bombea ~5 litros de sangre por minuto. Tiene 4 cámaras.' },
      digestive:   { title: 'Esófago torácico', desc: 'El esófago pasa por el tórax antes de llegar al estómago, atravesando el diafragma.' },
      nervous:     { title: 'Nervios intercostales', desc: 'Los nervios intercostales recorren entre las costillas, controlando los músculos respiratorios.' },
    },
    emoji: '❤️',
  },
  {
    id: 'abdomen', label: 'Abdomen', y: 0.47, x: 0.5, r: 0.09,
    info: {
      skeletal:    { title: 'Columna lumbar', desc: '5 vértebras lumbares soportan el peso del tronco. Es la zona más propensa a lesiones de espalda.' },
      muscular:    { title: 'Abdominales', desc: 'Los músculos abdominales (recto, oblicuos) protegen los órganos internos y permiten doblarse.' },
      circulatory: { title: 'Aorta abdominal', desc: 'La aorta abdominal es la arteria principal que irriga estómago, hígado, intestinos y riñones.' },
      digestive:   { title: 'Estómago e intestinos', desc: 'El estómago descompone los alimentos con ácido. El intestino delgado (~6 m) absorbe nutrientes.' },
      nervous:     { title: 'Plexo solar', desc: 'El plexo solar es una red de nervios en el abdomen. Por eso sentimos "mariposas" cuando tenemos miedo.' },
    },
    emoji: '🫃',
  },
  {
    id: 'leftArm', label: 'Brazo izquierdo', y: 0.32, x: 0.30, r: 0.05,
    info: {
      skeletal:    { title: 'Húmero', desc: 'El húmero es el hueso del brazo superior. Se articula con la escápula en el hombro y el cúbito/radio en el codo.' },
      muscular:    { title: 'Bíceps y Tríceps', desc: 'Los bíceps flexionan el codo y los tríceps lo extienden. Trabajan siempre en parejas opuestas.' },
      circulatory: { title: 'Arteria braquial', desc: 'La arteria braquial lleva sangre al brazo. Se palpa fácilmente en el codo interior.' },
      digestive:   { title: 'Sin función digestiva', desc: 'Los brazos no tienen función digestiva directa, aunque los gestos con las manos ayudan en la manipulación de alimentos.' },
      nervous:     { title: 'Nervio radial y cubital', desc: 'Los nervios radial, cubital y mediano controlan la sensación y el movimiento del brazo y la mano.' },
    },
    emoji: '💪',
  },
  {
    id: 'rightArm', label: 'Brazo derecho', y: 0.32, x: 0.70, r: 0.05,
    info: {
      skeletal:    { title: 'Húmero', desc: 'El húmero es el hueso del brazo superior. Se articula con la escápula en el hombro y el cúbito/radio en el codo.' },
      muscular:    { title: 'Bíceps y Tríceps', desc: 'Los bíceps flexionan el codo y los tríceps lo extienden. Trabajan siempre en parejas opuestas.' },
      circulatory: { title: 'Arteria braquial', desc: 'La arteria braquial lleva sangre al brazo. Se palpa fácilmente en el codo interior.' },
      digestive:   { title: 'Sin función digestiva', desc: 'Los brazos no tienen función digestiva directa, aunque los gestos con las manos ayudan en la manipulación de alimentos.' },
      nervous:     { title: 'Nervio radial y cubital', desc: 'Los nervios radial, cubital y mediano controlan la sensación y el movimiento del brazo y la mano.' },
    },
    emoji: '💪',
  },
  {
    id: 'leftLeg', label: 'Pierna izquierda', y: 0.67, x: 0.38, r: 0.06,
    info: {
      skeletal:    { title: 'Fémur', desc: 'El fémur es el hueso más largo y resistente del cuerpo. Conecta la cadera con la rodilla.' },
      muscular:    { title: 'Cuádriceps y Isquiotibiales', desc: 'Los cuádriceps extienden la rodilla al caminar. Los isquiotibiales la flexionan. Clave para correr.' },
      circulatory: { title: 'Arteria femoral', desc: 'La arteria femoral es la principal del muslo. Las venas devuelven la sangre al corazón contra la gravedad.' },
      digestive:   { title: 'Sin función digestiva', desc: 'Las piernas no participan en la digestión, pero el ejercicio físico mejora el peristaltismo intestinal.' },
      nervous:     { title: 'Nervio ciático', desc: 'El nervio ciático es el más largo del cuerpo. Recorre desde la espalda baja hasta el pie.' },
    },
    emoji: '🦵',
  },
  {
    id: 'rightLeg', label: 'Pierna derecha', y: 0.67, x: 0.62, r: 0.06,
    info: {
      skeletal:    { title: 'Fémur', desc: 'El fémur es el hueso más largo y resistente del cuerpo. Conecta la cadera con la rodilla.' },
      muscular:    { title: 'Cuádriceps y Isquiotibiales', desc: 'Los cuádriceps extienden la rodilla al caminar. Los isquiotibiales la flexionan. Clave para correr.' },
      circulatory: { title: 'Arteria femoral', desc: 'La arteria femoral es la principal del muslo. Las venas devuelven la sangre al corazón contra la gravedad.' },
      digestive:   { title: 'Sin función digestiva', desc: 'Las piernas no participan en la digestión, pero el ejercicio físico mejora el peristaltismo intestinal.' },
      nervous:     { title: 'Nervio ciático', desc: 'El nervio ciático es el más largo del cuerpo. Recorre desde la espalda baja hasta el pie.' },
    },
    emoji: '🦵',
  },
];

const FACTS = [
  'El cuerpo humano tiene 206 huesos en total.',
  'El músculo más pequeño del cuerpo está en el oído: el músculo estapedio.',
  'El corazón late aproximadamente 3 mil millones de veces en una vida.',
  'El intestino delgado mide entre 6 y 7 metros de largo.',
  'El cerebro humano puede almacenar aproximadamente 2.5 petabytes de información.',
  'Hay más de 600 músculos en el cuerpo humano.',
  'La sangre recorre todo el cuerpo en solo 60 segundos.',
  'Los huesos son 5 veces más resistentes que el acero del mismo peso.',
];

const AnatomyModule = memo(({ addPoints }) => {
  const [systemIdx, setSystemIdx] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [explored, setExplored] = useState(new Set());
  const [showIntro, setShowIntro] = useState(true);
  const [factIdx] = useState(() => Math.floor(Math.random() * FACTS.length));

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  const containerRef = useRef(null);

  const system = SYSTEMS[systemIdx];

  // Hand cursor tracking → hover regions
  useEffect(() => {
    let frameId;
    const loop = () => {
      const container = containerRef.current;
      if (!container) { frameId = requestAnimationFrame(loop); return; }
      const rect = container.getBoundingClientRect();
      const hand = window.latestHandData;
      if (hand?.cursors?.[0]?.isVisible) {
        const cx = hand.cursors[0].x;
        const cy = hand.cursors[0].y;
        const normX = (cx - rect.left) / rect.width;
        const normY = (cy - rect.top) / rect.height;
        let found = null;
        for (const reg of REGIONS) {
          const dx = normX - reg.x;
          const dy = normY - reg.y;
          if (Math.sqrt(dx * dx + dy * dy) < reg.r + 0.02) { found = reg; break; }
        }
        setHoveredRegion(found?.id || null);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const selectRegion = useCallback((reg) => {
    setSelectedRegion(reg);
    if (!explored.has(reg.id)) {
      setExplored(prev => { const ns = new Set(prev); ns.add(reg.id); return ns; });
      addPointsRef.current(15);
    }
  }, [explored]);

  const currentInfo = selectedRegion ? selectedRegion.info[system.id] : null;
  const systemColor = system.color;

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <Heart size={16} className="text-red-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Anatomía Interactiva</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: systemColor }}>
          {system.emoji} Sistema {system.label}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{explored.size}/{REGIONS.length} explorados</span>
      </div>

      <div className="flex-1 flex gap-4 pt-16 pb-2 px-5">

        {/* Body diagram */}
        <div ref={containerRef} className="flex-1 relative flex items-center justify-center">
          {/* Silhouette body */}
          <svg viewBox="0 0 200 500" className="h-full max-h-full" style={{ maxWidth: 200 }}>
            {/* Simple body silhouette */}
            <ellipse cx="100" cy="45" rx="32" ry="36" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <rect x="68" y="80" width="64" height="5" rx="3" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <rect x="72" y="84" width="56" height="110" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <rect x="68" y="194" width="64" height="90" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <rect x="34" y="88" width="38" height="100" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <rect x="128" y="88" width="38" height="100" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <rect x="74" y="284" width="22" height="140" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <rect x="104" y="284" width="22" height="140" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />

            {/* Region hotspots */}
            {REGIONS.map(reg => {
              const px = reg.x * 200;
              const py = reg.y * 500;
              const pr = reg.r * 200;
              const isHovered = hoveredRegion === reg.id;
              const isSelected = selectedRegion?.id === reg.id;
              const alpha = isSelected ? 0.6 : isHovered ? 0.45 : 0.2;
              return (
                <g key={reg.id} onClick={() => selectRegion(reg)} style={{ cursor: 'pointer' }}>
                  <circle cx={px} cy={py} r={pr}
                    fill={systemColor + Math.floor(alpha * 255).toString(16).padStart(2, '0')}
                    stroke={systemColor}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                    style={{ filter: isSelected ? `drop-shadow(0 0 8px ${systemColor})` : isHovered ? `drop-shadow(0 0 4px ${systemColor})` : 'none' }}
                  />
                  <text x={px} y={py + 1.5} textAnchor="middle" dominantBaseline="middle" fontSize={pr * 0.8} style={{ pointerEvents: 'none' }}>
                    {reg.emoji}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover label */}
          {hoveredRegion && !selectedRegion && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-dark px-4 py-2 rounded-xl border border-white/10 pointer-events-none">
              <p className="text-[10px] font-black text-white/80">
                {REGIONS.find(r => r.id === hoveredRegion)?.label} — toca para explorar
              </p>
            </div>
          )}
        </div>

        {/* Center: info panel */}
        <div className="w-72 flex flex-col gap-3 flex-shrink-0">
          {/* Info card */}
          <div className={`glass-dark rounded-2xl border p-5 flex-1 flex flex-col gap-3 transition-colors ${selectedRegion ? 'border-white/20' : 'border-white/10'}`}
            style={{ borderColor: selectedRegion ? systemColor + '55' : undefined }}>
            {selectedRegion && currentInfo ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedRegion.emoji}</span>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">{system.emoji} Sistema {system.label}</p>
                    <h3 className="text-lg font-display font-black italic" style={{ color: systemColor }}>{currentInfo.title}</h3>
                    <p className="text-[9px] font-black text-white/50">{selectedRegion.label}</p>
                  </div>
                </div>
                <p className="text-[12px] text-white/70 leading-relaxed flex-1">{currentInfo.desc}</p>
                <HandButton onClick={() => setSelectedRegion(null)} dwellMs={700} variant="default" className="px-4 py-2 text-[10px] !bg-white/5 !border-white/10 self-start">
                  <X size={11} /> Deseleccionar
                </HandButton>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <Heart size={32} className="text-white/20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Toca una región del cuerpo para ver información</p>
                <div className="mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[9px] text-white/50 italic">💡 {FACTS[factIdx]}</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="glass-dark rounded-xl border border-white/10 p-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">Regiones exploradas</p>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map(reg => (
                <div key={reg.id}
                  className={`px-2 py-1 rounded-lg text-[8px] font-black ${explored.has(reg.id) ? 'border bg-white/8' : 'bg-white/3 border border-white/10 opacity-40'}`}
                  style={{ borderColor: explored.has(reg.id) ? systemColor + '88' : undefined }}>
                  {reg.emoji} {reg.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: system selector */}
        <div className="w-40 flex flex-col gap-2 flex-shrink-0">
          <div className="text-[8px] font-black uppercase tracking-widest text-white/40 text-center mb-1">Sistema</div>
          {SYSTEMS.map((sys, i) => (
            <HandButton key={sys.id} onClick={() => { setSystemIdx(i); setSelectedRegion(null); }} dwellMs={750}
              variant={i === systemIdx ? 'default' : 'default'}
              className={`px-3 py-3 text-[10px] !rounded-xl flex-col gap-1 h-auto
                ${i === systemIdx ? '!border-2' : '!bg-white/5 !border-white/10 opacity-60'}`}
              style={i === systemIdx ? { borderColor: sys.color, boxShadow: `0 0 12px ${sys.color}44` } : {}}
            >
              <span className="text-lg">{sys.emoji}</span>
              <span className="font-black text-center text-[9px]">{sys.label}</span>
            </HandButton>
          ))}
        </div>
      </div>

      {/* Intro */}
      <AnimatePresence>
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="text-7xl">🫀</div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">Anatomía Interactiva</h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                Apunta con tu mano a las partes del cuerpo y tócalas para descubrir información.
                Cambia de <span className="text-red-400 font-black">sistema</span> (esquelético, muscular, circulatorio…) para ver el cuerpo desde distintas perspectivas.
              </p>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="red" className="px-10 py-4 text-sm">
                <Heart size={16} /> ¡Explorar el cuerpo!
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AnatomyModule;
