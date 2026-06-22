import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import HandButton from '../HandButton';
import GameInstruction from '../GameInstruction';

const SYSTEMS = [
  { id: 'skeletal',    label: 'Esquelético',   emoji: '🦴', color: '#e8d5b0' },
  { id: 'muscular',   label: 'Muscular',       emoji: '💪', color: '#cc6644' },
  { id: 'circulatory',label: 'Circulatorio',   emoji: '❤️', color: '#dd2244' },
  { id: 'digestive',  label: 'Digestivo',      emoji: '🫃', color: '#88cc44' },
  { id: 'nervous',    label: 'Nervioso',       emoji: '🧠', color: '#bb88ff' },
];

const SYSTEMS_EN = [
  { id: 'skeletal',    label: 'Skeletal',   emoji: '🦴', color: '#e8d5b0' },
  { id: 'muscular',   label: 'Muscular',   emoji: '💪', color: '#cc6644' },
  { id: 'circulatory',label: 'Circulatory',emoji: '❤️', color: '#dd2244' },
  { id: 'digestive',  label: 'Digestive',  emoji: '🫃', color: '#88cc44' },
  { id: 'nervous',    label: 'Nervous',    emoji: '🧠', color: '#bb88ff' },
];

const REGIONS = [
  {
    id: 'brain', label: 'Cerebro', y: 0.08, x: 0.5, r: 0.07,
    info: {
      skeletal:    { title: 'Cráneo', desc: 'El cráneo es el hueso que protege el cerebro. Está formado por 22 huesos soldados entre sí.' },
      muscular:    { title: 'Músculos faciales', desc: 'Más de 40 músculos en la cara controlan las expresiones: sonrisa, ceño, sorpresa.' },
      circulatory: { title: 'Encéfalo vascularizado', desc: 'El cerebro recibe el 20% de toda la sangre del cuerpo. Sin flujo sanguíneo, el cerebro se daña en minutos.' },
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
  {
    id: 'lungs', label: 'Pulmones', y: 0.28, x: 0.53, r: 0.04,
    info: {
      skeletal:    { title: 'Costillas protectoras', desc: 'Las costillas rodean y protegen los pulmones contra golpes externos.' },
      muscular:    { title: 'Diafragma', desc: 'Músculo inferior que se contrae para permitir la entrada de aire a los pulmones.' },
      circulatory: { title: 'Alvéolos pulmonares', desc: 'Donde la sangre suelta dióxido de carbono y absorbe el oxígeno para llevarlo a los órganos.' },
      digestive:   { title: 'Oxigenación del sistema', desc: 'Suministra oxígeno vital para que el estómago y los intestinos realicen la digestión.' },
      nervous:     { title: 'Tallo cerebral respiratorio', desc: 'Envía impulsos nerviosos involuntarios para respirar automáticamente, incluso al dormir.' },
    },
    emoji: '🫁',
  },
  {
    id: 'heart', label: 'Corazón', y: 0.29, x: 0.47, r: 0.035,
    info: {
      skeletal:    { title: 'Escudo del Esternón', desc: 'El esternón y las costillas forman una armadura protectora del corazón.' },
      muscular:    { title: 'Miocardio', desc: 'El músculo cardíaco es el más resistente del cuerpo y bombea sangre continuamente.' },
      circulatory: { title: 'Bomba central', desc: 'Envía sangre a todo el organismo a través de arterias y la recibe por las venas.' },
      digestive:   { title: 'Irrigación digestiva', desc: 'Abastece de sangre a los órganos digestivos para que absorban nutrientes de la comida.' },
      nervous:     { title: 'Sistema autónomo', desc: 'Acelera o desacelera el ritmo de los latidos según las necesidades físicas o emociones.' },
    },
    emoji: '🫀',
  },
  {
    id: 'liver', label: 'Hígado', y: 0.43, x: 0.45, r: 0.032,
    info: {
      skeletal:    { title: 'Protección costal', desc: 'El reborde costal derecho cubre al hígado de traumas físicos.' },
      muscular:    { title: 'Diafragma superior', desc: 'El diafragma empuja levemente al hígado con cada inhalación.' },
      circulatory: { title: 'Sistema porta hepático', desc: 'Filtra la sangre que viene de los intestinos antes de que vuelva al corazón.' },
      digestive:   { title: 'Fábrica química y bilis', desc: 'Produce bilis para digerir grasas y elimina toxinas de lo que consumimos.' },
      nervous:     { title: 'Regulación del azúcar', desc: 'Señales nerviosas le indican cuándo liberar glucosa de reserva en la sangre.' },
    },
    emoji: '🧼',
  },
  {
    id: 'stomach', label: 'Estómago', y: 0.43, x: 0.55, r: 0.032,
    info: {
      skeletal:    { title: 'Soporte torácico inferior', desc: 'Ubicado debajo de las costillas flotantes izquierdas que le dan soporte.' },
      muscular:    { title: 'Capas musculares gástricas', desc: 'Tres capas musculares baten y trituran los alimentos con movimientos mecánicos.' },
      circulatory: { title: 'Arterias gástricas', desc: 'Llevan sangre oxigenada necesaria para producir los ácidos digestivos.' },
      digestive:   { title: 'Descomposición química', desc: 'Produce jugos gástricos y ácidos para deshacer los alimentos en una papilla.' },
      nervous:     { title: 'Nervio vago digestivo', desc: 'Informa al cerebro si el estómago está lleno o vacío y regula los ácidos.' },
    },
    emoji: '🥣',
  },
  {
    id: 'intestines', label: 'Intestinos', y: 0.52, x: 0.50, r: 0.04,
    info: {
      skeletal:    { title: 'Soporte pélvico', desc: 'La pelvis sostiene el peso de todo el intestino en la parte baja.' },
      muscular:    { title: 'Músculo liso intestinal', desc: 'Contracciones automáticas empujan los alimentos a lo largo del tracto.' },
      circulatory: { title: 'Capilares mesentéricos', desc: 'Absorben nutrientes y agua y los envían al torrente sanguíneo.' },
      digestive:   { title: 'Absorción final', desc: 'El intestino delgado absorbe los nutrientes y el grueso extrae agua.' },
      nervous:     { title: 'Sistema nervioso entérico', desc: 'Contiene millones de neuronas que controlan la digestión de forma independiente.' },
    },
    emoji: '🌀',
  },
  {
    id: 'kidneys', label: 'Riñones', y: 0.48, x: 0.50, r: 0.025,
    info: {
      skeletal:    { title: 'Protección lumbar posterior', desc: 'Las costillas flotantes cubren la parte trasera superior de los riñones.' },
      muscular:    { title: 'Apoyo del Psoas', desc: 'Se apoyan sobre los músculos profundos psoas en la espalda baja.' },
      circulatory: { title: 'Arterias renales', desc: 'Vasos principales por donde entra la sangre para ser purificada.' },
      digestive:   { title: 'Excreción de desechos', desc: 'Eliminan el exceso de agua y los residuos que produce el metabolismo.' },
      nervous:     { title: 'Plexo renal autónomo', desc: 'Señales nerviosas regulan la cantidad de agua y sal que los riñones filtran.' },
    },
    emoji: '💧',
  },
  {
    id: 'spine', label: 'Columna vertebral', y: 0.38, x: 0.50, r: 0.015,
    info: {
      skeletal:    { title: 'Vértebras', desc: 'Una cadena de 33 huesos articulados que dan soporte al esqueleto completo.' },
      muscular:    { title: 'Erectores de la columna', desc: 'Fuerte grupo muscular que nos mantiene erguidos y permite girar.' },
      circulatory: { title: 'Arterias espinales', desc: 'Irrigan la médula espinal con sangre para mantenerla saludable.' },
      digestive:   { title: 'Soporte de vísceras', desc: 'Permite mantener la postura recta evitando la compresión de órganos.' },
      nervous:     { title: 'Médula espinal', desc: 'El cable principal de nervios que conecta el cerebro con todo el cuerpo.' },
    },
    emoji: '🦴',
  },
  {
    id: 'pelvis', label: 'Pelvis', y: 0.58, x: 0.50, r: 0.04,
    info: {
      skeletal:    { title: 'Cintura pélvica', desc: 'Hueso en forma de cuenco que soporta el abdomen y conecta con las piernas.' },
      muscular:    { title: 'Suelo pélvico', desc: 'Músculos en forma de hamaca que sostienen los órganos de la vejiga e intestinos.' },
      circulatory: { title: 'Arterias ilíacas', desc: 'Llevan sangre oxigenada a las caderas y miembros inferiores.' },
      digestive:   { title: 'Salida rectal', desc: 'Aloja la última sección del intestino grueso en el canal óseo.' },
      nervous:     { title: 'Plexo sacro', desc: 'Grupo de nervios que emerge para controlar los esfínteres y piernas.' },
    },
    emoji: '🔱',
  },
  {
    id: 'trachea', label: 'Tráquea', y: 0.20, x: 0.50, r: 0.015,
    info: {
      skeletal:    { title: 'Cartílago traqueal', desc: 'Anillos de cartílago en forma de C que mantienen abierta la vía aérea.' },
      muscular:    { title: 'Músculo traqueal posterior', desc: 'Músculo liso que se contrae para toser fuertemente.' },
      circulatory: { title: 'Vascularización traqueal', desc: 'Vasos que calientan y humedecen el aire antes de llegar a los pulmones.' },
      digestive:   { title: 'Válvula Epiglotis', desc: 'Tapa que se cierra al tragar para que la comida no entre a los pulmones.' },
      nervous:     { title: 'Reflejo tusígeno', desc: 'Nervios sensitivos provocan tos si detectan cuerpos extraños en la tráquea.' },
    },
    emoji: '🎤',
  },
  {
    id: 'bladder', label: 'Vejiga', y: 0.62, x: 0.50, r: 0.018,
    info: {
      skeletal:    { title: 'Protección púbica', desc: 'El hueso pubis de la pelvis cubre la parte delantera de la vejiga.' },
      muscular:    { title: 'Músculo Detrusor', desc: 'Músculo elástico que se relaja para almacenar orina y se contrae para expulsarla.' },
      circulatory: { title: 'Vesicales', desc: 'Capilares que alimentan las gruesas paredes de este órgano elástico.' },
      digestive:   { title: 'Excreción urinaria', desc: 'Almacena la orina (agua y desechos del metabolismo filtrados).' },
      nervous:     { title: 'Receptores de estiramiento', desc: 'Nervios avisan al cerebro cuando la vejiga está llena para ir al baño.' },
    },
    emoji: '🎈',
  },
  {
    id: 'pancreas', label: 'Páncreas', y: 0.46, x: 0.50, r: 0.015,
    info: {
      skeletal:    { title: 'Ubicación profunda', desc: 'Protegido detrás del estómago, delante de la columna vertebral.' },
      muscular:    { title: 'Esfínter de Oddi', desc: 'Válvula muscular regulada químicamente que libera enzimas en el duodeno.' },
      circulatory: { title: 'Producción de Insulina', desc: 'Produce hormonas reguladoras del azúcar directo en el torrente sanguíneo.' },
      digestive:   { title: 'Jugo pancreático', desc: 'Secreta enzimas para romper grasas, carbohidratos y proteínas.' },
      nervous:     { title: 'Control digestivo autónomo', desc: 'El nervio vago estimula al páncreas a secretar enzimas al comer.' },
    },
    emoji: '🧪',
  },
  {
    id: 'gallbladder', label: 'Vesícula biliar', y: 0.45, x: 0.48, r: 0.012,
    info: {
      skeletal:    { title: 'Refugio del hígado', desc: 'Resguardada debajo del hígado y protegida por las costillas inferiores.' },
      muscular:    { title: 'Contracción biliar', desc: 'Su pared muscular se contrae al comer alimentos grasos.' },
      circulatory: { title: 'Arteria cística', desc: 'Pequeña arteria dedicada a irrigar la vesícula.' },
      digestive:   { title: 'Concentración de bilis', desc: 'Almacena y concentra la bilis del hígado para disolver grasas.' },
      nervous:     { title: 'Estimulación del Vago', desc: 'El sistema parasimpático ordena exprimir la bilis durante la digestión.' },
    },
    emoji: '🎒',
  },
];

const REGIONS_EN = [
  {
    id: 'brain', label: 'Brain', y: 0.08, x: 0.5, r: 0.07,
    info: {
      skeletal:    { title: 'Skull', desc: 'The skull is the bone that protects the brain. It is made of 22 bones welded together.' },
      muscular:    { title: 'Facial muscles', desc: 'Over 40 muscles in the face control expressions: smiling, frowning, surprise.' },
      circulatory: { title: 'Vascular brain', desc: 'The brain receives 20% of all blood in the body. Without blood flow, the brain is damaged in minutes.' },
      digestive:   { title: 'Brain control', desc: 'The brain coordinates digestion through the vagus nerve, regulating the stomach and intestines.' },
      nervous:     { title: 'Brain', desc: 'The brain weighs ~1.4 kg and has ~86 billion neurons. It is the control center of the human body.' },
    },
    emoji: '🧠',
  },
  {
    id: 'neck', label: 'Neck', y: 0.17, x: 0.5, r: 0.035,
    info: {
      skeletal:    { title: 'Cervical spine', desc: '7 cervical vertebrae form the neck, supporting the head (~5 kg) with great mobility.' },
      muscular:    { title: 'Neck muscles', desc: 'The sternocleidomastoid and trapezius muscles allow turning and flexing the head.' },
      circulatory: { title: 'Carotid arteries', desc: 'The carotid arteries are the main vessels carrying oxygenated blood to the brain.' },
      digestive:   { title: 'Esophagus', desc: 'The esophagus is the tube connecting the mouth to the stomach. It is ~25 cm long and uses peristaltic movements.' },
      nervous:     { title: 'Cervical spinal cord', desc: 'The spinal cord passes through the neck and controls the arms and hands through the cervical nerves.' },
    },
    emoji: '🔵',
  },
  {
    id: 'chest', label: 'Chest', y: 0.30, x: 0.5, r: 0.10,
    info: {
      skeletal:    { title: 'Rib cage', desc: '12 pairs of ribs and the sternum form the rib cage, protecting the heart and lungs.' },
      muscular:    { title: 'Pectoral muscles', desc: 'The pectoralis major and minor cover the chest. The diaphragm —a muscle— allows breathing.' },
      circulatory: { title: 'Heart', desc: 'The heart beats ~100,000 times a day and pumps ~5 liters of blood per minute. It has 4 chambers.' },
      digestive:   { title: 'Thoracic esophagus', desc: 'The esophagus passes through the chest before reaching the stomach, crossing the diaphragm.' },
      nervous:     { title: 'Intercostal nerves', desc: 'Intercostal nerves run between the ribs, controlling the breathing muscles.' },
    },
    emoji: '❤️',
  },
  {
    id: 'abdomen', label: 'Abdomen', y: 0.47, x: 0.5, r: 0.09,
    info: {
      skeletal:    { title: 'Lumbar spine', desc: '5 lumbar vertebrae support the weight of the trunk. It is the area most prone to back injuries.' },
      muscular:    { title: 'Abs', desc: 'The abdominal muscles (rectus, obliques) protect internal organs and allow bending.' },
      circulatory: { title: 'Abdominal aorta', desc: 'The abdominal aorta is the main artery that supplies the stomach, liver, intestines, and kidneys.' },
      digestive:   { title: 'Stomach and intestines', desc: 'The stomach breaks down food with acid. The small intestine (~6 m) absorbs nutrients.' },
      nervous:     { title: 'Solar plexus', desc: 'The solar plexus is a network of nerves in the abdomen. That is why we feel "butterflies" when we are afraid.' },
    },
    emoji: '🫃',
  },
  {
    id: 'leftArm', label: 'Left Arm', y: 0.32, x: 0.30, r: 0.05,
    info: {
      skeletal:    { title: 'Humerus', desc: 'The humerus is the upper arm bone. It articulates with the scapula in the shoulder and the ulna/radius in the elbow.' },
      muscular:    { title: 'Biceps and Triceps', desc: 'The biceps flex the elbow and the triceps extend it. They always work in opposing pairs.' },
      circulatory: { title: 'Brachial artery', desc: 'The brachial artery carries blood to the arm. It is easily felt in the inner elbow.' },
      digestive:   { title: 'No digestive function', desc: 'The arms have no direct digestive function, although hand gestures help in food manipulation.' },
      nervous:     { title: 'Radial and Ulnar nerve', desc: 'The radial, ulnar, and median nerves control sensation and movement of the arm and hand.' },
    },
    emoji: '💪',
  },
  {
    id: 'rightArm', label: 'Right Arm', y: 0.32, x: 0.70, r: 0.05,
    info: {
      skeletal:    { title: 'Humerus', desc: 'The humerus is the upper arm bone. It articulates with the scapula in the shoulder and the ulna/radius in the elbow.' },
      muscular:    { title: 'Biceps and Triceps', desc: 'The biceps flex the elbow and the triceps extend it. They always work in opposing pairs.' },
      circulatory: { title: 'Brachial artery', desc: 'The brachial artery carries blood to the arm. It is easily felt in the inner elbow.' },
      digestive:   { title: 'No digestive function', desc: 'The arms have no direct digestive function, although hand gestures help in food manipulation.' },
      nervous:     { title: 'Radial and Ulnar nerve', desc: 'The radial, ulnar, and median nerves control sensation and movement of the arm and hand.' },
    },
    emoji: '💪',
  },
  {
    id: 'leftLeg', label: 'Left Leg', y: 0.67, x: 0.38, r: 0.06,
    info: {
      skeletal:    { title: 'Femur', desc: 'The femur is the longest and strongest bone in the body. It connects the hip to the knee.' },
      muscular:    { title: 'Quadriceps and Hamstrings', desc: 'The quadriceps extend the knee when walking. The hamstrings flex it. Key for running.' },
      circulatory: { title: 'Femoral artery', desc: 'The femoral artery is the main one in the thigh. Veins return blood to the heart against gravity.' },
      digestive:   { title: 'No digestive function', desc: 'Legs do not participate in digestion, but physical exercise improves intestinal peristalsis.' },
      nervous:     { title: 'Sciatic nerve', desc: 'The sciatic nerve is the longest in the body. It runs from the lower back down to the foot.' },
    },
    emoji: '🦵',
  },
  {
    id: 'rightLeg', label: 'Right Leg', y: 0.67, x: 0.62, r: 0.06,
    info: {
      skeletal:    { title: 'Femur', desc: 'The femur is the longest and strongest bone in the body. It connects the hip to the knee.' },
      muscular:    { title: 'Quadriceps and Hamstrings', desc: 'The quadriceps extend the knee when walking. The hamstrings flex it. Key for running.' },
      circulatory: { title: 'Femoral artery', desc: 'The femoral artery is the main one in the thigh. Veins return blood to the heart against gravity.' },
      digestive:   { title: 'No digestive function', desc: 'Legs do not participate in digestion, but physical exercise improves intestinal peristalsis.' },
      nervous:     { title: 'Sciatic nerve', desc: 'The sciatic nerve is the longest in the body. It runs from the lower back down to the foot.' },
    },
    emoji: '🦵',
  },
  {
    id: 'lungs', label: 'Lungs', y: 0.28, x: 0.53, r: 0.04,
    info: {
      skeletal:    { title: 'Protective Ribs', desc: 'Ribs surround and protect the lungs from external impacts.' },
      muscular:    { title: 'Diaphragm', desc: 'Lower muscle that contracts to allow air to enter the lungs.' },
      circulatory: { title: 'Pulmonary Alveoli', desc: 'Where blood releases carbon dioxide and absorbs oxygen to carry to organs.' },
      digestive:   { title: 'System Oxygenation', desc: 'Supplies vital oxygen for the stomach and intestines to perform digestion.' },
      nervous:     { title: 'Respiratory Brainstem', desc: 'Sends involuntary nerve impulses to breathe automatically, even during sleep.' },
    },
    emoji: '🫁',
  },
  {
    id: 'heart', label: 'Heart', y: 0.29, x: 0.47, r: 0.035,
    info: {
      skeletal:    { title: 'Sternum Shield', desc: 'The sternum and ribs form protective armor for the heart.' },
      muscular:    { title: 'Myocardium', desc: 'The cardiac muscle is the body\'s most resistant muscle, pumping blood continuously.' },
      circulatory: { title: 'Central Pump', desc: 'Sends blood to the entire body through arteries and receives it via veins.' },
      digestive:   { title: 'Digestive Irrigation', desc: 'Supplies blood to digestive organs to absorb nutrients from food.' },
      nervous:     { title: 'Autonomic System', desc: 'Speeds up or slows down heart rate based on physical needs or emotions.' },
    },
    emoji: '🫀',
  },
  {
    id: 'liver', label: 'Liver', y: 0.43, x: 0.45, r: 0.032,
    info: {
      skeletal:    { title: 'Costal Protection', desc: 'The right costal margin covers the liver from physical trauma.' },
      muscular:    { title: 'Upper Diaphragm', desc: 'The diaphragm pushes slightly down on the liver with each inhalation.' },
      circulatory: { title: 'Hepatic Portal System', desc: 'Filters blood coming from the intestines before it returns to the heart.' },
      digestive:   { title: 'Chemical Plant & Bile', desc: 'Produces bile to digest fats and filters toxins from what we consume.' },
      nervous:     { title: 'Sugar Regulation', desc: 'Nerve signals tell it when to release reserve glucose into the blood.' },
    },
    emoji: '🧼',
  },
  {
    id: 'stomach', label: 'Stomach', y: 0.43, x: 0.55, r: 0.032,
    info: {
      skeletal:    { title: 'Lower Thoracic Support', desc: 'Located below the left floating ribs which provide support.' },
      muscular:    { title: 'Gastric Muscle Layers', desc: 'Three muscle layers churn and crush food with mechanical movements.' },
      circulatory: { title: 'Gastric Arteries', desc: 'Carry oxygenated blood needed to produce digestive acids.' },
      digestive:   { title: 'Chemical Breakdown', desc: 'Produces gastric juices and acids to dissolve food into a mush.' },
      nervous:     { title: 'Digestive Vagus Nerve', desc: 'Informs the brain if the stomach is full or empty and regulates acids.' },
    },
    emoji: '🥣',
  },
  {
    id: 'intestines', label: 'Intestines', y: 0.52, x: 0.50, r: 0.04,
    info: {
      skeletal:    { title: 'Pelvic Support', desc: 'The pelvis supports the weight of the entire intestine at the bottom.' },
      muscular:    { title: 'Intestinal Smooth Muscle', desc: 'Automatic contractions push food along the tract.' },
      circulatory: { title: 'Mesenteric Capillaries', desc: 'Absorb nutrients and water and send them to the bloodstream.' },
      digestive:   { title: 'Final Absorption', desc: 'The small intestine absorbs nutrients and the large intestine extracts water.' },
      nervous:     { title: 'Enteric Nervous System', desc: 'Contains millions of neurons that control digestion independently.' },
    },
    emoji: '🌀',
  },
  {
    id: 'kidneys', label: 'Kidneys', y: 0.48, x: 0.50, r: 0.025,
    info: {
      skeletal:    { title: 'Posterior Lumbar Protection', desc: 'Floating ribs cover the upper rear part of the kidneys.' },
      muscular:    { title: 'Psoas Support', desc: 'Rest against the deep psoas muscles in the lower back.' },
      circulatory: { title: 'Renal Arteries', desc: 'Main vessels through which blood enters to be purified.' },
      digestive:   { title: 'Waste Excretion', desc: 'Eliminate excess water and waste products from metabolism.' },
      nervous:     { title: 'Autonomic Renal Plexus', desc: 'Nerve signals regulate the amount of water and salt the kidneys filter.' },
    },
    emoji: '💧',
  },
  {
    id: 'spine', label: 'Spine', y: 0.38, x: 0.50, r: 0.015,
    info: {
      skeletal:    { title: 'Vertebrae', desc: 'A chain of 33 articulated bones that support the entire skeleton.' },
      muscular:    { title: 'Spine Erectors', desc: 'Strong muscle group that keeps us upright and allows twisting.' },
      circulatory: { title: 'Spinal Arteries', desc: 'Supply the spinal cord with blood to keep it healthy.' },
      digestive:   { title: 'Viscera Support', desc: 'Helps maintain a straight posture, preventing compression of organs.' },
      nervous:     { title: 'Spinal Cord', desc: 'The main nerve cable connecting the brain to the entire body.' },
    },
    emoji: '🦴',
  },
  {
    id: 'pelvis', label: 'Pelvis', y: 0.58, x: 0.50, r: 0.04,
    info: {
      skeletal:    { title: 'Pelvic Girdle', desc: 'Bowl-shaped bone that supports the abdomen and connects to the legs.' },
      muscular:    { title: 'Pelvic Floor', desc: 'Hammock-shaped muscles that support the bladder and intestines.' },
      circulatory: { title: 'Iliac Arteries', desc: 'Carry oxygenated blood to the hips and lower limbs.' },
      digestive:   { title: 'Rectal Outlet', desc: 'Houses the last section of the large intestine in the bony canal.' },
      nervous:     { title: 'Sacral Plexus', desc: 'Group of nerves emerging to control sphincters and legs.' },
    },
    emoji: '🔱',
  },
  {
    id: 'trachea', label: 'Trachea', y: 0.20, x: 0.50, r: 0.015,
    info: {
      skeletal:    { title: 'Tracheal Cartilage', desc: 'C-shaped cartilage rings that keep the airway open.' },
      muscular:    { title: 'Posterior Tracheal Muscle', desc: 'Smooth muscle that contracts to cough strongly.' },
      circulatory: { title: 'Tracheal Vascularization', desc: 'Vessels that warm and moisten air before it reaches the lungs.' },
      digestive:   { title: 'Epiglottis Valve', desc: 'Flap that closes when swallowing so food doesn\'t enter lungs.' },
      nervous:     { title: 'Cough Reflex', desc: 'Sensory nerves cause coughing if foreign bodies are detected in trachea.' },
    },
    emoji: '🎤',
  },
  {
    id: 'bladder', label: 'Bladder', y: 0.62, x: 0.50, r: 0.018,
    info: {
      skeletal:    { title: 'Pubic Protection', desc: 'The pubic bone of the pelvis covers the front of the bladder.' },
      muscular:    { title: 'Detrusor Muscle', desc: 'Elastic muscle that relaxes to store urine and contracts to expel it.' },
      circulatory: { title: 'Vesical Capillaries', desc: 'Capillaries feeding the thick walls of this elastic organ.' },
      digestive:   { title: 'Urinary Excretion', desc: 'Stores urine (filtered water and metabolic waste products).' },
      nervous:     { title: 'Stretch Receptors', desc: 'Nerves alert the brain when the bladder is full to go to the bathroom.' },
    },
    emoji: '🎈',
  },
  {
    id: 'pancreas', label: 'Pancreas', y: 0.46, x: 0.50, r: 0.015,
    info: {
      skeletal:    { title: 'Deep Location', desc: 'Protected behind the stomach, in front of the spine.' },
      muscular:    { title: 'Sphincter of Oddi', desc: 'Chemically-regulated muscular valve releasing enzymes into the duodenum.' },
      circulatory: { title: 'Insulin Production', desc: 'Produces sugar-regulating hormones directly into the bloodstream.' },
      digestive:   { title: 'Pancreatic Juice', desc: 'Secretes enzymes to break down fats, carbohydrates, and proteins.' },
      nervous:     { title: 'Autonomic Digestive Control', desc: 'The vagus nerve stimulates the pancreas to secrete enzymes when eating.' },
    },
    emoji: '🧪',
  },
  {
    id: 'gallbladder', label: 'Gallbladder', y: 0.45, x: 0.48, r: 0.012,
    info: {
      skeletal:    { title: 'Liver Refuge', desc: 'Sheltered under the liver and protected by the lower ribs.' },
      muscular:    { title: 'Biliary Contraction', desc: 'Its muscular wall contracts when eating fatty foods.' },
      circulatory: { title: 'Cystic Artery', desc: 'Small artery dedicated to supplying the gallbladder.' },
      digestive:   { title: 'Bile Concentration', desc: 'Stores and concentrates liver bile to dissolve fats.' },
      nervous:     { title: 'Vagus Stimulation', desc: 'The parasimpatic system orders to squeeze bile during digestion.' },
    },
    emoji: '🎒',
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

const FACTS_EN = [
  'The human body has 206 bones in total.',
  'The smallest muscle in the body is in the ear: the stapedius muscle.',
  'The heart beats approximately 3 billion times in a lifetime.',
  'The small intestine is between 6 and 7 meters long.',
  'The human brain can store approximately 2.5 petabytes of information.',
  'There are more than 600 muscles in the human body.',
  'Blood travels through the entire body in just 60 seconds.',
  'Bones are 5 times stronger than steel of the same weight.',
];

const DWELL_MS = 900;

const AnatomyModule = memo(({ addPoints, lang = 'es' }) => {
  const [systemIdx, setSystemIdx] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const lastHoveredRegionId = useRef(null);
  const [explored, setExplored] = useState(new Set());
  const [showIntro, setShowIntro] = useState(true);
  const [factIdx] = useState(() => Math.floor(Math.random() * FACTS.length));

  const addPointsRef = useRef(addPoints);
  addPointsRef.current = addPoints;

  const svgRef = useRef(null);

  const systems = lang === 'es' ? SYSTEMS : SYSTEMS_EN;
  const regions = lang === 'es' ? REGIONS : REGIONS_EN;
  const facts = lang === 'es' ? FACTS : FACTS_EN;

  const selectRegionRef = useRef(null);
  selectRegionRef.current = (reg) => {
    setSelectedRegion(reg);
    setExplored(prev => {
      if (prev.has(reg.id)) return prev;
      addPointsRef.current(15);
      const ns = new Set(prev);
      ns.add(reg.id);
      return ns;
    });
  };

  const system = systems[systemIdx];

  // Hand cursor → hover + dwell activation (no mouse click needed)
  useEffect(() => {
    let frameId;
    let lastTime = performance.now();
    let dwellId = null;
    let dwellProgress = 0;
    let mustLeaveId = null; // anti-double-fire: cursor must leave region after selection

    const loop = (now) => {
      const dt = Math.min(now - lastTime, 80);
      lastTime = now;

      const svgEl = svgRef.current;
      if (!svgEl) { frameId = requestAnimationFrame(loop); return; }

      const rect = svgEl.getBoundingClientRect();
      const hand = window.latestHandData;

      let found = null;
      if (hand?.cursors?.[0]?.isVisible && !showIntro) {
        const cx = hand.cursors[0].x;
        const cy = hand.cursors[0].y;
        // Only process cursor if it's actually inside the SVG area
        if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
          const normX = (cx - rect.left) / rect.width;
          const normY = (cy - rect.top) / rect.height;
          for (const reg of REGIONS) {
            const dx = normX - reg.x;
            const dy = normY - reg.y;
            // Generous hit radius: reg.r + 0.05 in normalised units
            if (Math.sqrt(dx * dx + dy * dy) < reg.r + 0.05) { found = reg; break; }
          }
        }
      }

      const foundId = found?.id ?? null;
      if (foundId !== lastHoveredRegionId.current) {
        setHoveredRegion(foundId);
        lastHoveredRegionId.current = foundId;
      }

      if (found) {
        // Must-leave check: cursor still on last-selected region, skip dwell
        if (found.id === mustLeaveId) {
          dwellId = null;
          dwellProgress = 0;
        } else if (dwellId === found.id) {
          dwellProgress = Math.min(dwellProgress + dt / DWELL_MS, 1);
          if (dwellProgress >= 1) {
            selectRegionRef.current(found);
            dwellProgress = 0;
            dwellId = null;
            mustLeaveId = found.id; // require leaving before re-selecting same region
          }
        } else {
          // New region hovered
          dwellId = found.id;
          dwellProgress = 0;
        }
      } else {
        // Cursor left all regions — clear must-leave so any region can be re-selected
        mustLeaveId = null;
        dwellId = null;
        dwellProgress = 0;
      }

      // Actualizar el anillo de dwell directo en el DOM sin causar re-renders
      REGIONS.forEach(reg => {
        const el = document.getElementById(`anatomy-dwell-ring-${reg.id}`);
        if (el) {
          if (dwellId === reg.id && dwellProgress > 0) {
            const ringR = reg.r * 200 + 5;
            const circumference = 2 * Math.PI * ringR;
            el.setAttribute('stroke-dashoffset', String(circumference * (1 - dwellProgress)));
            el.style.display = 'block';
          } else {
            el.style.display = 'none';
          }
        }
      });

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const currentRegion = selectedRegion ? regions.find(r => r.id === selectedRegion.id) : null;
  const currentInfo = currentRegion ? currentRegion.info[system.id] : null;
  const systemColor = system.color;

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <Heart size={16} className="text-red-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
          {lang === 'es' ? 'Anatomía Interactiva' : 'Interactive Anatomy'}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: systemColor }}>
          {system.emoji} {lang === 'es' ? `Sistema ${system.label}` : `${system.label} System`}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
          {lang === 'es' ? `${explored.size}/${regions.length} explorados` : `${explored.size}/${regions.length} explored`}
        </span>
      </div>

      <div className={`flex-1 flex gap-4 pt-16 pb-2 px-5 ${showIntro ? 'pointer-events-none' : ''}`}>

        {/* Body diagram */}
        <div className="flex-1 relative flex items-center justify-center">
          <svg
            ref={svgRef}
            viewBox="0 0 200 500"
            className="h-full max-h-full"
            style={{ maxWidth: 200 }}
          >
            {/* Body silhouette */}
            <ellipse cx="100" cy="45" rx="32" ry="36" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <rect x="68" y="80" width="64" height="5" rx="3" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <rect x="72" y="84" width="56" height="110" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <rect x="68" y="194" width="64" height="90" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <rect x="34" y="88" width="38" height="100" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <rect x="128" y="88" width="38" height="100" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <rect x="74" y="284" width="22" height="140" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <rect x="104" y="284" width="22" height="140" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />

            {/* Region hotspots — dwell activated, no click */}
            {regions.map(reg => {
              const px = reg.x * 200;
              const py = reg.y * 500;
              const pr = reg.r * 200;
              const isHovered  = hoveredRegion === reg.id;
              const isSelected = selectedRegion?.id === reg.id;
              const alpha = isSelected ? 0.6 : isHovered ? 0.45 : 0.2;
              const ringR = pr + 5;
              const circumference = 2 * Math.PI * ringR;

              return (
                <g key={reg.id}>
                  {/* Main hotspot circle */}
                  <circle
                    cx={px} cy={py} r={pr}
                    fill={systemColor + Math.floor(alpha * 255).toString(16).padStart(2, '0')}
                    stroke={systemColor}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                    style={{
                      filter: isSelected
                        ? `drop-shadow(0 0 10px ${systemColor})`
                        : isHovered
                        ? `drop-shadow(0 0 5px ${systemColor})`
                        : 'none',
                      transition: 'r 0.1s',
                    }}
                  />
                  {/* Dwell progress ring — white arc filling clockwise */}
                  <circle
                    id={`anatomy-dwell-ring-${reg.id}`}
                    cx={px} cy={py}
                    r={ringR}
                    fill="none"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${circumference}`}
                    style={{
                      transform: `rotate(-90deg)`,
                      transformOrigin: `${px}px ${py}px`,
                      display: 'none'
                    }}
                  />
                  {/* Emoji label */}
                  <text
                    x={px} y={py + 1.5}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={pr * 0.8}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {reg.emoji}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hoveredRegion && !selectedRegion && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-dark px-4 py-2 rounded-xl border border-white/10 pointer-events-none">
              <p className="text-[10px] font-black text-white/80">
                {regions.find(r => r.id === hoveredRegion)?.label} — {lang === 'es' ? 'mantén la mano para explorar' : 'hold hand to explore'}
              </p>
            </div>
          )}
        </div>

        {/* Center: info panel */}
        <div className="w-72 flex flex-col gap-3 flex-shrink-0">
          <div
            className={`glass-dark rounded-2xl border p-5 flex-1 flex flex-col gap-3 transition-colors ${selectedRegion ? 'border-white/20' : 'border-white/10'}`}
            style={{ borderColor: selectedRegion ? systemColor + '55' : undefined }}
          >
            {currentRegion && currentInfo ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentRegion.emoji}</span>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">{system.emoji} {lang === 'es' ? `Sistema ${system.label}` : `${system.label} System`}</p>
                    <h3 className="text-lg font-display font-black italic" style={{ color: systemColor }}>{currentInfo.title}</h3>
                    <p className="text-[9px] font-black text-white/50">{currentRegion.label}</p>
                  </div>
                </div>
                <p className="text-[12px] text-white/70 leading-relaxed flex-1">{currentInfo.desc}</p>
                <HandButton
                  onClick={() => setSelectedRegion(null)}
                  dwellMs={700} graceMs={400} variant="default"
                  className="px-4 py-2 text-[10px] !bg-white/5 !border-white/10 self-start"
                >
                  <X size={11} /> {lang === 'es' ? 'Deseleccionar' : 'Deselect'}
                </HandButton>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <Heart size={32} className="text-white/20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                  {lang === 'es' 
                    ? 'Apunta una región del cuerpo y mantén la mano para ver información' 
                    : 'Point to a body region and hold your hand to view information'}
                </p>
                <div className="mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[9px] text-white/50 italic">💡 {facts[factIdx]}</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="glass-dark rounded-xl border border-white/10 p-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">
              {lang === 'es' ? 'Regiones exploradas' : 'Explored Regions'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {regions.map(reg => (
                <div
                  key={reg.id}
                  className={`px-2 py-1 rounded-lg text-[8px] font-black ${explored.has(reg.id) ? 'border bg-white/8' : 'bg-white/3 border border-white/10 opacity-40'}`}
                  style={{ borderColor: explored.has(reg.id) ? systemColor + '88' : undefined }}
                >
                  {reg.emoji} {reg.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: system selector */}
        <div className="w-40 flex flex-col gap-2 flex-shrink-0">
          <div className="text-[8px] font-black uppercase tracking-widest text-white/40 text-center mb-1">
            {lang === 'es' ? 'Sistema' : 'System'}
          </div>
          {systems.map((sys, i) => (
            <HandButton
              key={sys.id}
              onClick={() => { setSystemIdx(i); setSelectedRegion(null); }}
              disabled={showIntro}
              dwellMs={750}
              variant="default"
              className={`px-3 py-3 text-[10px] !rounded-xl flex-col gap-1 h-auto
                ${i === systemIdx ? '!border-2' : '!bg-white/5 !border-white/10'} ${showIntro ? 'opacity-20 cursor-not-allowed' : (i === systemIdx ? '' : 'opacity-60')}`}
              style={i === systemIdx && !showIntro ? { borderColor: sys.color, boxShadow: `0 0 12px ${sys.color}44` } : {}}
            >
              <span className="text-lg">{sys.emoji}</span>
              <span className="font-black text-center text-[9px]">{sys.label}</span>
            </HandButton>
          ))}
        </div>
      </div>

      {/* Intro overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="text-7xl">🫀</div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">
                {lang === 'es' ? 'Anatomía Interactiva' : 'Interactive Anatomy'}
              </h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                {lang === 'es' 
                  ? <>Apunta con tu mano a las partes del cuerpo y <span className="text-white/90 font-black">mantén el cursor</span> sobre ellas para descubrir información. Cambia de <span className="text-red-400 font-black">sistema</span> (esquelético, muscular, circulatorio…) para ver el cuerpo desde distintas perspectivas.</>
                  : <>Point your hand at parts of the body and <span className="text-white/90 font-black">hold the cursor</span> over them to discover information. Change the <span className="text-red-400 font-black">system</span> (skeletal, muscular, circulatory...) to view the body from different perspectives.</>}
              </p>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="red" className="px-10 py-4 text-sm">
                <Heart size={16} /> {lang === 'es' ? '¡Explorar el cuerpo!' : 'Explore the body!'}
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GameInstruction
        messageEs="Apunta tu mano sobre las zonas del cuerpo para explorar los órganos"
        messageEn="Point your hand over the body areas to explore the organs"
        lang={lang}
        icon="🦴"
      />
    </div>
  );
});

export default AnatomyModule;
