import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, AlertTriangle, Sparkles, RotateCcw, GraduationCap, Beaker, CheckCircle2, BookOpen, Plus, X } from 'lucide-react';
import HandButton from '../HandButton';
import GameInstruction from '../GameInstruction';

// ── Elementos base (tabla periódica) ────────────────────────────────────────
const BASE_ELEMENTS = [
  { sym: 'H',  label: 'H',  name: 'Hidrógeno', num: 1,  color: 'cyan',    desc: 'El elemento más abundante del universo. Muy ligero e inflamable.' },
  { sym: 'O',  label: 'O',  name: 'Oxígeno',   num: 8,  color: 'cyan',    desc: 'Esencial para respirar y para que exista el fuego.' },
  { sym: 'N',  label: 'N',  name: 'Nitrógeno', num: 7,  color: 'cyan',    desc: 'Forma el 78% del aire que respiramos. Muy estable.' },
  { sym: 'C',  label: 'C',  name: 'Carbono',   num: 6,  color: 'purple',  desc: 'La base de toda la vida… ¡y también de los diamantes!' },
  { sym: 'S',  label: 'S',  name: 'Azufre',    num: 16, color: 'orange',  desc: 'Sólido amarillo con olor característico. Base de muchos ácidos.' },
  { sym: 'Na', label: 'Na', name: 'Sodio',      num: 11, color: 'orange',  desc: 'Metal blando que reacciona violentamente con el agua.' },
  { sym: 'Cl', label: 'Cl', name: 'Cloro',      num: 17, color: 'emerald', desc: 'Gas amarillo-verdoso usado para desinfectar el agua.' },
  { sym: 'Fe', label: 'Fe', name: 'Hierro',     num: 26, color: 'orange',  desc: 'Metal con el que se fabrica el acero. Se oxida con el aire.' },
  { sym: 'Cu', label: 'Cu', name: 'Cobre',      num: 29, color: 'orange',  desc: 'Metal rojizo que conduce muy bien la electricidad.' },
  { sym: 'Mg', label: 'Mg', name: 'Magnesio',   num: 12, color: 'cyan',    desc: 'Metal ligero que arde con llama blanca brillante.' },
  { sym: 'Ca', label: 'Ca', name: 'Calcio',     num: 20, color: 'purple',  desc: 'Esencial para los huesos y dientes. Abundante en la naturaleza.' },
  { sym: 'K',  label: 'K',  name: 'Potasio',   num: 19, color: 'emerald', desc: 'Metal alcalino vital para las funciones nerviosas del cuerpo.' },
  { sym: 'Zn', label: 'Zn', name: 'Zinc',       num: 30, color: 'cyan',    desc: 'Metal azulado que protege al hierro de la corrosión.' },
  { sym: 'Al', label: 'Al', name: 'Aluminio',   num: 13, color: 'purple',  desc: 'Metal ligero y resistente usado en aviones y envases.' },
  { sym: 'Si', label: 'Si', name: 'Silicio',    num: 14, color: 'emerald', desc: 'Base de la arena, el vidrio y los chips de computadoras.' },
  { sym: 'P',  label: 'P',  name: 'Fósforo',   num: 15, color: 'orange',  desc: 'Esencial para el ADN y los huesos. Brilla en la oscuridad.' },
];

const BASE_ELEMENTS_EN = [
  { sym: 'H',  label: 'H',  name: 'Hydrogen', num: 1,  color: 'cyan',    desc: 'The most abundant element in the universe. Very light and flammable.' },
  { sym: 'O',  label: 'O',  name: 'Oxygen',   num: 8,  color: 'cyan',    desc: 'Essential for respiration and for fire to exist.' },
  { sym: 'N',  label: 'N',  name: 'Nitrogen', num: 7,  color: 'cyan',    desc: 'Makes up 78% of the air we breathe. Very stable.' },
  { sym: 'C',  label: 'C',  name: 'Carbon',   num: 6,  color: 'purple',  desc: 'The basis of all life... and also of diamonds!' },
  { sym: 'S',  label: 'S',  name: 'Sulfur',    num: 16, color: 'orange',  desc: 'Yellow solid with a characteristic odor. Base of many acids.' },
  { sym: 'Na', label: 'Na', name: 'Sodium',      num: 11, color: 'orange',  desc: 'Soft metal that reacts violently with water.' },
  { sym: 'Cl', label: 'Cl', name: 'Chlorine',      num: 17, color: 'emerald', desc: 'Greenish-yellow gas used to disinfect water.' },
  { sym: 'Fe', label: 'Fe', name: 'Iron',     num: 26, color: 'orange',  desc: 'Metal used to manufacture steel. Rusts in the air.' },
  { sym: 'Cu', label: 'Cu', name: 'Copper',      num: 29, color: 'orange',  desc: 'Reddish metal that conducts electricity very well.' },
  { sym: 'Mg', label: 'Mg', name: 'Magnesium',   num: 12, color: 'cyan',    desc: 'Light metal that burns with a brilliant white flame.' },
  { sym: 'Ca', label: 'Ca', name: 'Calcium',     num: 20, color: 'purple',  desc: 'Essential for bones and teeth. Abundant in nature.' },
  { sym: 'K',  label: 'K',  name: 'Potassium',   num: 19, color: 'emerald', desc: 'Alkali metal vital for the body\'s nerve functions.' },
  { sym: 'Zn', label: 'Zn', name: 'Zinc',       num: 30, color: 'cyan',    desc: 'Bluish metal that protects iron from corrosion.' },
  { sym: 'Al', label: 'Al', name: 'Aluminum',   num: 13, color: 'purple',  desc: 'Light and resistant metal used in planes and packaging.' },
  { sym: 'Si', label: 'Si', name: 'Silicon',    num: 14, color: 'emerald', desc: 'Base of sand, glass, and computer chips.' },
  { sym: 'P',  label: 'P',  name: 'Phosphorus',   num: 15, color: 'orange',  desc: 'Essential for DNA and bones. Glows in the dark.' },
];

// ── Reactivos compuestos (de laboratorio / caseros) ──────────────────────────
const COMPOUND_REAGENTS = [
  { sym: 'NaHCO3',  label: 'NaHCO₃',  name: 'Bicarbonato', compound: true, color: 'purple',  desc: 'Polvo blanco usado en cocina y limpieza.' },
  { sym: 'CH3COOH', label: 'CH₃COOH', name: 'Vinagre',     compound: true, color: 'emerald', desc: 'Ácido suave presente en el vinagre de cocina.' },
  { sym: 'H2O2',    label: 'H₂O₂',    name: 'Agua oxig.',  compound: true, color: 'cyan',    desc: 'Agua oxigenada: antiséptico suave que libera O₂.' },
  { sym: 'NaOH',    label: 'NaOH',    name: 'Sosa cáust.', compound: true, color: 'orange',  desc: 'Hidróxido de sodio: base fuerte usada en jabones y lejía.' },
];

const COMPOUND_REAGENTS_EN = [
  { sym: 'NaHCO3',  label: 'NaHCO₃',  name: 'Baking Soda', compound: true, color: 'purple',  desc: 'White powder used in cooking and cleaning.' },
  { sym: 'CH3COOH', label: 'CH₃COOH', name: 'Vinegar',     compound: true, color: 'emerald', desc: 'Mild acid present in household vinegar.' },
  { sym: 'H2O2',    label: 'H₂O₂',    name: 'Hydrogen per.', compound: true, color: 'cyan',    desc: 'Hydrogen peroxide: mild antiseptic that releases O₂.' },
  { sym: 'NaOH',    label: 'NaOH',    name: 'Caustic soda', compound: true, color: 'orange',  desc: 'Sodium hydroxide: strong base used in soaps and lye.' },
];

// ── Recetario ────────────────────────────────────────────────────────────────
const RECIPES = [
  { comp: { H: 2, O: 1 },              res: 'H₂O',      name: 'Agua',                  emoji: '💧', type: 'safe',   text: '2 hidrógenos + 1 oxígeno forman agua, ¡la molécula esencial para la vida!' },
  { comp: { H: 2 },                    res: 'H₂',       name: 'Gas hidrógeno',         emoji: '🎈', type: 'cool',   text: 'Dos hidrógenos forman H₂, el gas más ligero que existe.' },
  { comp: { O: 2 },                    res: 'O₂',       name: 'Oxígeno molecular',     emoji: '🫁', type: 'safe',   text: 'Dos oxígenos forman O₂, el gas que respiramos.' },
  { comp: { N: 2 },                    res: 'N₂',       name: 'Nitrógeno molecular',   emoji: '💨', type: 'safe',   text: 'El nitrógeno del aire viaja en parejas (N₂), muy estables.' },
  { comp: { Na: 1, Cl: 1 },            res: 'NaCl',     name: 'Sal común',             emoji: '🧂', type: 'cool',   text: 'Sodio + cloro = sal de mesa. ¡Dos elementos peligrosos forman algo que comemos a diario!' },
  { comp: { K: 1, Cl: 1 },             res: 'KCl',      name: 'Cloruro de potasio',    emoji: '🧂', type: 'safe',   text: 'Potasio + cloro forman una sal mineral usada como sustituto de la sal de mesa.' },
  { comp: { Ca: 1, O: 1 },             res: 'CaO',      name: 'Cal viva',              emoji: '🧱', type: 'cool',   text: 'Calcio + oxígeno forman cal viva. Con agua reacciona violentamente generando calor.' },
  { comp: { Mg: 1, O: 1 },             res: 'MgO',      name: 'Óxido de magnesio',     emoji: '✨', type: 'safe',   text: 'El magnesio arde con llama blanca brillante y forma óxido blanco.' },
  { comp: { Zn: 1, O: 1 },             res: 'ZnO',      name: 'Óxido de zinc',         emoji: '☀️', type: 'safe',   text: 'Zinc + oxígeno forman el compuesto blanco de las cremas solares.' },
  { comp: { Cu: 1, O: 1 },             res: 'CuO',      name: 'Óxido de cobre',        emoji: '🟢', type: 'safe',   text: 'Cobre + oxígeno crean la capa verde de estatuas como la de la Libertad.' },
  { comp: { Fe: 2, O: 3 },             res: 'Fe₂O₃',    name: 'Óxido de hierro',       emoji: '🟤', type: 'safe',   text: '2 hierros + 3 oxígenos forman herrumbre, la corrosión naranja de los metals.' },
  { comp: { Al: 2, O: 3 },             res: 'Al₂O₃',    name: 'Alúmina',               emoji: '⬜', type: 'safe',   text: '2 aluminios + 3 oxígenos forman alúmina, base de la cerámica y el rubí.' },
  { comp: { Si: 1, O: 2 },             res: 'SiO₂',     name: 'Sílice (arena)',        emoji: '🏖️', type: 'safe',   text: '1 silicio + 2 oxígenos forman sílice, ¡la arena de la playa y el vidrio!' },
  { comp: { H: 1, Cl: 1 },             res: 'HCl',      name: 'Ácido clorhídrico',     emoji: '⚗️', type: 'danger', text: 'Hidrógeno + cloro forman ácido clorhídrico, muy corrosivo. También está en nuestro estómago.' },
  { comp: { H: 2, S: 1 },              res: 'H₂S',      name: 'Ácido sulfhídrico',     emoji: '🤢', type: 'danger', text: 'Hidrógeno + azufre crean un gas tóxico con olor a huevo podrido. ¡Muy peligroso en espacios cerrados!' },
  { comp: { N: 1, O: 2 },              res: 'NO₂',      name: 'Dióxido de nitrógeno',  emoji: '🏭', type: 'danger', text: 'Gas marrón tóxico causante del smog urbano. Se forma en la combustión de motores.' },
  { comp: { C: 1, O: 1 },              res: 'CO',       name: 'Monóxido de carbono',   emoji: '☠️', type: 'danger', text: 'Con poco oxígeno se forma CO: gas tóxico, incoloro e inodoro. ¡Muy peligroso!' },
  { comp: { C: 1, H: 4 },              res: 'CH₄',      name: 'Metano',                emoji: '🔥', type: 'cool',   text: '1 carbono + 4 hidrógenos forman metano, el gas de cocina y el combustible del futuro.' },
  { comp: { N: 1, H: 3 },              res: 'NH₃',      name: 'Amoníaco',              emoji: '🧪', type: 'safe',   text: '1 nitrógeno + 3 hidrógenos forman amoníaco, base de fertilizantes y limpiadores.' },
  { comp: { C: 1, O: 2 },              res: 'CO₂',      name: 'Dióxido de carbono',    emoji: '🌫️', type: 'safe',   text: '1 carbono + 2 oxígenos. Lo exhalamos al respirar y las plantas lo usan para crecer.' },
  { comp: { S: 1, Fe: 1 },             res: 'FeS',      name: 'Sulfuro de hierro',     emoji: '⚫', type: 'cool',   text: 'Hierro + azufre forman un sólido negro. Reacciona con ácidos liberando H₂S.' },
  { comp: { Al: 1, Cl: 3 },            res: 'AlCl₃',    name: 'Cloruro de aluminio',   emoji: '🧪', type: 'cool',   text: 'Aluminio + 3 cloros. Se usa en desodorantes y como catalizador industrial.' },
  { comp: { P: 1, O: 3 },              res: 'P₄O₆',     name: 'Óxido de fósforo III',  emoji: '💡', type: 'cool',   text: 'Fósforo + oxígeno forman el compuesto que da a los fósforos su capacidad de encender.' },
  { comp: { NaHCO3: 1, CH3COOH: 1 },   res: 'CO₂ + H₂O',name: '¡Volcán de espuma!',   emoji: '🌋', type: 'cool',   text: 'Bicarbonato + vinagre liberan burbujas de CO₂. ¡El experimento más divertido y seguro!' },
  { comp: { Cl: 1, CH3COOH: 1 },       res: 'Cl₂',      name: 'Gas cloro',             emoji: '☠️', type: 'danger', text: 'Lejía (cloro) + vinagre liberan gas cloro tóxico. Un error casero muy peligroso.' },
  { comp: { H2O2: 1, Fe: 1 },          res: 'O₂ + H₂O', name: 'Liberación de oxígeno', emoji: '🫧', type: 'cool',   text: 'El hierro cataliza la descomposición del agua oxigenada liberando burbujas de O₂.' },
  { comp: { NaOH: 1, H: 1, Cl: 1 },   res: 'NaCl + H₂O',name: 'Neutralización',       emoji: '⚖️', type: 'safe',   text: 'Base fuerte (NaOH) + ácido (HCl) se neutralizan formando sal y agua. Temperatura aumenta.' },
];

const RECIPES_EN = [
  { comp: { H: 2, O: 1 },              res: 'H₂O',      name: 'Water',                  emoji: '💧', type: 'safe',   text: '2 hydrogens + 1 oxygen form water, the essential molecule for life!' },
  { comp: { H: 2 },                    res: 'H₂',       name: 'Hydrogen gas',         emoji: '🎈', type: 'cool',   text: 'Two hydrogens form H₂, the lightest gas in existence.' },
  { comp: { O: 2 },                    res: 'O₂',       name: 'Molecular oxygen',     emoji: '🫁', type: 'safe',   text: 'Two oxygens form O₂, the gas we breathe.' },
  { comp: { N: 2 },                    res: 'N₂',       name: 'Molecular nitrogen',   emoji: '💨', type: 'safe',   text: 'Nitrogen in the air travels in pairs (N₂), which are very stable.' },
  { comp: { Na: 1, Cl: 1 },            res: 'NaCl',     name: 'Table salt',             emoji: '🧂', type: 'cool',   text: 'Sodium + chlorine = table salt. Two dangerous elements form something we eat daily!' },
  { comp: { K: 1, Cl: 1 },             res: 'KCl',      name: 'Potassium chloride',    emoji: '🧂', type: 'safe',   text: 'Potassium + chlorine form a mineral salt used as a table salt substitute.' },
  { comp: { Ca: 1, O: 1 },             res: 'CaO',      name: 'Quicklime',              emoji: '🧱', type: 'cool',   text: 'Calcium + oxygen form quicklime. It reacts violently with water, generating heat.' },
  { comp: { Mg: 1, O: 1 },             res: 'MgO',      name: 'Magnesium oxide',     emoji: '✨', type: 'safe',   text: 'Magnesium burns with a bright white flame and forms white oxide.' },
  { comp: { Zn: 1, O: 1 },             res: 'ZnO',      name: 'Zinc oxide',         emoji: '☀️', type: 'safe',   text: 'Zinc + oxygen form the white compound in sunscreens.' },
  { comp: { Cu: 1, O: 1 },             res: 'CuO',      name: 'Copper oxide',        emoji: '🟢', type: 'safe',   text: 'Copper + oxygen create the green layer on statues like the Statue of Liberty.' },
  { comp: { Fe: 2, O: 3 },             res: 'Fe₂O₃',    name: 'Iron oxide',       emoji: '🟤', type: 'safe',   text: '2 irons + 3 oxygens form rust, the orange corrosion of metals.' },
  { comp: { Al: 2, O: 3 },             res: 'Al₂O₃',    name: 'Alumina',               emoji: '⬜', type: 'safe',   text: '2 aluminums + 3 oxygens form alumina, the base of ceramics and rubies.' },
  { comp: { Si: 1, O: 2 },             res: 'SiO₂',     name: 'Silica (sand)',        emoji: '🏖️', type: 'safe',   text: '1 silicon + 2 oxygens form silica, beach sand and glass!' },
  { comp: { H: 1, Cl: 1 },             res: 'HCl',      name: 'Hydrochloric acid',     emoji: '⚗️', type: 'danger', text: 'Hydrogen + chlorine form hydrochloric acid, highly corrosive. It is also in our stomach.' },
  { comp: { H: 2, S: 1 },              res: 'H₂S',      name: 'Hydrogen sulfide',     emoji: '🤢', type: 'danger', text: 'Hydrogen + sulfur create a toxic gas with a rotten egg smell. Very dangerous in enclosed spaces!' },
  { comp: { N: 1, O: 2 },              res: 'NO₂',      name: 'Nitrogen dioxide',  emoji: '🏭', type: 'danger', text: 'Toxic brown gas causing urban smog. Formed in engine combustion.' },
  { comp: { C: 1, O: 1 },              res: 'CO',       name: 'Carbon monoxide',   emoji: '☠️', type: 'danger', text: 'With little oxygen, CO is formed: a toxic, colorless, and odorless gas. Very dangerous!' },
  { comp: { C: 1, H: 4 },              res: 'CH₄',      name: 'Methane',                emoji: '🔥', type: 'cool',   text: '1 carbon + 4 hydrogens form methane, cooking gas and the fuel of the future.' },
  { comp: { N: 1, H: 3 },              res: 'NH₃',      name: 'Ammonia',              emoji: '🧪', type: 'safe',   text: '1 nitrogen + 3 hydrogens form ammonia, the base of fertilizers and cleaners.' },
  { comp: { C: 1, O: 2 },              res: 'CO₂',      name: 'Carbon dioxide',    emoji: '🌫️', type: 'safe',   text: '1 carbon + 2 oxygens. We exhale it when breathing and plants use it to grow.' },
  { comp: { S: 1, Fe: 1 },             res: 'FeS',      name: 'Iron sulfide',     emoji: '⚫', type: 'cool',   text: 'Iron + sulfur form a black solid. Reacts with acids to release H₂S.' },
  { comp: { Al: 1, Cl: 3 },            res: 'AlCl₃',    name: 'Aluminum chloride',   emoji: '🧪', type: 'cool',   text: 'Aluminum + 3 chlorines. Used in deodorants and as an industrial catalyst.' },
  { comp: { P: 1, O: 3 },              res: 'P₄O₆',     name: 'Phosphorus oxide III',  emoji: '💡', type: 'cool',   text: 'Phosphorus + oxygen form the compound that gives matches their ability to ignite.' },
  { comp: { NaHCO3: 1, CH3COOH: 1 },   res: 'CO₂ + H₂O',name: 'Foam volcano!',   emoji: '🌋', type: 'cool',   text: 'Baking soda + vinegar release CO₂ bubbles. The most fun and safe experiment!' },
  { comp: { Cl: 1, CH3COOH: 1 },       res: 'Cl₂',      name: 'Chlorine gas',             emoji: '☠️', type: 'danger', text: 'Bleach (chlorine) + vinegar release toxic chlorine gas. A highly dangerous household mistake.' },
  { comp: { H2O2: 1, Fe: 1 },          res: 'O₂ + H₂O', name: 'Oxygen release', emoji: '🫧', type: 'cool',   text: 'Iron catalyzes the decomposition of hydrogen peroxide, releasing O₂ bubbles.' },
  { comp: { NaOH: 1, H: 1, Cl: 1 },   res: 'NaCl + H₂O',name: 'Neutralization',       emoji: '⚖️', type: 'safe',   text: 'Strong base (NaOH) + acid (HCl) neutralize each other forming salt and water. Temperature increases.' },
];

const compKey = (comp) =>
  Object.keys(comp).filter(k => comp[k] > 0).sort().map(k => `${k}${comp[k]}`).join('_');

const TUTORIAL = [
  { comp: { H: 2, O: 1 },            label: '2 H + 1 O',             goal: 'Crea agua',       emoji: '💧' },
  { comp: { Na: 1, Cl: 1 },          label: '1 Na + 1 Cl',           goal: 'Crea sal común',  emoji: '🧂' },
  { comp: { NaHCO3: 1, CH3COOH: 1 }, label: '1 NaHCO₃ + 1 Vinagre', goal: 'Haz un volcán',   emoji: '🌋' },
];

const TUTORIAL_EN = [
  { comp: { H: 2, O: 1 },            label: '2 H + 1 O',             goal: 'Create water',       emoji: '💧' },
  { comp: { Na: 1, Cl: 1 },          label: '1 Na + 1 Cl',           goal: 'Create table salt',  emoji: '🧂' },
  { comp: { NaHCO3: 1, CH3COOH: 1 }, label: '1 NaHCO₃ + 1 Vinegar', goal: 'Make a volcano',   emoji: '🌋' },
];

const TYPE_STYLE = {
  safe:   { ring: 'border-emerald-500/50', glow: 'shadow-emerald-500/30', text: 'text-emerald-400', chip: 'bg-emerald-500/15', label: 'Reacción segura' },
  cool:   { ring: 'border-purple-500/50',  glow: 'shadow-purple-500/30',  text: 'text-purple-400',  chip: 'bg-purple-500/15',  label: '¡Reacción curiosa!' },
  danger: { ring: 'border-red-500/60',     glow: 'shadow-red-500/40',     text: 'text-red-400',     chip: 'bg-red-500/15',     label: '⚠️ Mezcla peligrosa' },
  info:   { ring: 'border-cyan-500/50',    glow: 'shadow-cyan-500/30',    text: 'text-cyan-400',    chip: 'bg-cyan-500/15',    label: 'Elemento individual' },
  none:   { ring: 'border-white/15',       glow: 'shadow-black/20',       text: 'text-white/50',    chip: 'bg-white/5',        label: 'Sin reacción' },
};

const ELEM_RECHARGE_MS = 1200;
const MAX_TOTAL = 6;

// Helper: dynamic font size for the element symbol label
const lblSize = (label) => {
  const len = label.replace(/[₀-₉⁰-⁹]/g, 'x').length;
  return len > 5 ? 'text-xs' : len > 3 ? 'text-sm' : len > 2 ? 'text-base' : 'text-xl';
};

// ── ElementBtn ────────────────────────────────────────────────────────────────
const ElementBtn = memo(({ el, disabled, onClick }) => (
  <HandButton
    onClick={disabled ? undefined : onClick}
    dwellMs={disabled ? 999999 : 1100}
    cooldownMs={900}
    hitMargin={4}
    variant={el.color}
    className={`relative w-[90px] h-[86px] rounded-2xl flex flex-col items-center justify-center gap-0.5 !p-0 transition-opacity ${disabled ? 'opacity-40' : ''}`}
  >
    <span className="text-[7.5px] font-black text-white/50 self-start ml-2 -mb-0.5">{el.num ?? (el.compound ? '⚗' : '')}</span>
    <span className={`${lblSize(el.label)} font-display font-black italic leading-none`}>{el.label}</span>
    <span className="text-[6px] font-black uppercase tracking-wide text-white/75 leading-tight mt-0.5 px-1 text-center w-full">{el.name}</span>
    <Plus size={9} className="absolute bottom-1 right-1.5 text-white/50" />
  </HandButton>
));

// ══════════════════════════════════════════════════════════════════════════════
const LabModule = memo(({ addPoints, lang = 'es' }) => {
  const [mode, setMode]       = useState('tutorial');
  const [comp, setComp]       = useState({});
  const [result, setResult]   = useState(null);
  const [discovered, setDiscovered] = useState(new Set());
  const [tutorialDone, setTutorialDone] = useState(new Set());
  const [showIntro, setShowIntro] = useState(true);
  const [showRecipes, setShowRecipes] = useState(false);
  const [elemLocked, setElemLocked] = useState(false);

  const addPointsRef  = useRef(addPoints);
  addPointsRef.current = addPoints;
  const lockTimerRef  = useRef(null);

  const baseElements = lang === 'es' ? BASE_ELEMENTS : BASE_ELEMENTS_EN;
  const compoundReagents = lang === 'es' ? COMPOUND_REAGENTS : COMPOUND_REAGENTS_EN;
  const recipes = lang === 'es' ? RECIPES : RECIPES_EN;
  const tutorial = lang === 'es' ? TUTORIAL : TUTORIAL_EN;

  const allElements = [...baseElements, ...compoundReagents];
  const elementBySym = Object.fromEntries(allElements.map(e => [e.sym, e]));
  const recipeByKey = Object.fromEntries(recipes.map(r => [compKey(r.comp), r]));

  const typeStyle = {
    safe:   { ring: 'border-emerald-500/50', glow: 'shadow-emerald-500/30', text: 'text-emerald-400', chip: 'bg-emerald-500/15', label: lang === 'es' ? 'Reacción segura' : 'Safe reaction' },
    cool:   { ring: 'border-purple-500/50',  glow: 'shadow-purple-500/30',  text: 'text-purple-400',  chip: 'bg-purple-500/15',  label: lang === 'es' ? '¡Reacción curiosa!' : 'Curious reaction!' },
    danger: { ring: 'border-red-500/60',     glow: 'shadow-red-500/40',     text: 'text-red-400',     chip: 'bg-red-500/15',     label: lang === 'es' ? '⚠️ Mezcla peligrosa' : '⚠️ Dangerous mixture' },
    info:   { ring: 'border-cyan-500/50',    glow: 'shadow-cyan-500/30',    text: 'text-cyan-400',    chip: 'bg-cyan-500/15',    label: lang === 'es' ? 'Elemento individual' : 'Individual element' },
    none:   { ring: 'border-white/15',       glow: 'shadow-black/20',       text: 'text-white/50',    chip: 'bg-white/5',        label: lang === 'es' ? 'Sin reacción' : 'No reaction' },
  };

  // Scroll gesture for recipe list
  const recipesScrollRef   = useRef(null);
  const prevScrollYRef     = useRef(null);

  useEffect(() => {
    if (!showRecipes) { prevScrollYRef.current = null; return; }
    let animId;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const el = recipesScrollRef.current;
      if (!el) return;
      const { cursors = [] } = window.latestHandData || {};
      const r = el.getBoundingClientRect();
      for (const c of cursors) {
        if (!c?.isVisible) continue;
        if (c.x >= r.left && c.x <= r.right && c.y >= r.top && c.y <= r.bottom) {
          const prev = prevScrollYRef.current;
          if (prev !== null) el.scrollTop -= (c.y - prev) * 1.8;
          prevScrollYRef.current = c.y;
          return;
        }
      }
      prevScrollYRef.current = null;
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [showRecipes]);

  const rechargeElements = useCallback(() => {
    setElemLocked(true);
    clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => setElemLocked(false), ELEM_RECHARGE_MS);
  }, []);
  useEffect(() => () => clearTimeout(lockTimerRef.current), []);

  const totalCount = Object.values(comp).reduce((a, b) => a + b, 0);

  const addElement = useCallback((sym) => {
    setComp(prev => {
      if (Object.values(prev).reduce((a, b) => a + b, 0) >= MAX_TOTAL) return prev;
      return { ...prev, [sym]: (prev[sym] || 0) + 1 };
    });
  }, []);

  const clearBeaker = useCallback(() => { setComp({}); setResult(null); }, []);

  const react = useCallback(() => {
    if (Object.values(comp).reduce((a, b) => a + b, 0) === 0) return;
    const key    = compKey(comp);
    const recipe = recipeByKey[key];
    if (recipe) {
      setResult(recipe);
      setDiscovered(d => {
        if (d.has(key)) return d;
        const nd = new Set(d); nd.add(key);
        addPointsRef.current(recipe.type === 'danger' ? 40 : recipe.type === 'cool' ? 80 : 60);
        return nd;
      });
      if (tutorial.some(t => compKey(t.comp) === key)) {
        setTutorialDone(td => {
          if (td.has(key)) return td;
          const nd = new Set(td); nd.add(key);
          addPointsRef.current(100);
          return nd;
        });
      }
    } else {
      const syms = Object.keys(comp).filter(k => comp[k] > 0);
      if (syms.length === 1 && comp[syms[0]] === 1) {
        const el = elementBySym[syms[0]];
        if (el) setResult({ type: 'info', res: el.label, name: el.name, emoji: '🔬', text: el.desc });
        addPointsRef.current(10);
      } else {
        setResult({ type: 'none', res: '—', name: lang === 'es' ? 'Mezcla desconocida' : 'Unknown mixture', emoji: '🤔',
          text: lang === 'es' ? 'Esta combinación no produce una reacción conocida. ¡Prueba con otras cantidades o elementos!' : 'This combination does not produce a known reaction. Try other amounts or elements!' });
      }
    }
  }, [comp, recipeByKey, elementBySym, tutorial, lang]);

  const closeResult   = useCallback(() => { setResult(null); setComp({}); rechargeElements(); }, [rechargeElements]);
  const startTutorial = useCallback(() => { setShowIntro(false); rechargeElements(); }, [rechargeElements]);
  const skipTutorial  = useCallback(() => { setMode('free'); setShowIntro(false); rechargeElements(); }, [rechargeElements]);
  const openRecipes   = useCallback(() => setShowRecipes(true), []);
  const closeRecipes  = useCallback(() => { setShowRecipes(false); rechargeElements(); }, [rechargeElements]);

  const tutorialComplete = tutorialDone.size >= tutorial.length;
  useEffect(() => {
    if (mode === 'tutorial' && tutorialComplete) {
      const t = setTimeout(() => setMode('free'), 600);
      return () => clearTimeout(t);
    }
  }, [tutorialComplete, mode, tutorial.length]);

  const rs = result ? (typeStyle[result.type] || typeStyle.none) : null;
  const overlayOpen       = !!result || showIntro || showRecipes;
  const elementsDisabled  = elemLocked || overlayOpen;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">

      {/* Cabecera */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <FlaskConical size={16} className="text-cyan-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
          {lang === 'es' ? 'Laboratorio de Química' : 'Chemistry Lab'}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className={`text-[9px] font-black uppercase tracking-widest ${mode === 'tutorial' ? 'text-amber-400' : 'text-cyan-400'}`}>
          {mode === 'tutorial' ? (lang === 'es' ? 'Tutorial' : 'Tutorial') : (lang === 'es' ? 'Modo Libre' : 'Free Mode')}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
          {lang === 'es' 
            ? `${discovered.size}/${recipes.length} descubrimientos` 
            : `${discovered.size}/${recipes.length} discoveries`}
        </span>
      </div>

      {/* Panel tutorial (izquierda) */}
      {mode === 'tutorial' && !showIntro && (
        <div className="absolute top-20 left-6 z-30 w-56 glass-dark rounded-3xl border border-white/10 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={14} className="text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-400">
              {lang === 'es' ? 'Aprende mezclando' : 'Learn by mixing'}
            </span>
          </div>
          <div className="space-y-3">
            {tutorial.map((t) => {
              const done = tutorialDone.has(compKey(t.comp));
              return (
                <div key={t.label} className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${done ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                  <div className="text-lg">{t.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black ${done ? 'text-emerald-400 line-through' : 'text-white/70'}`}>{t.goal}</p>
                    <p className="text-[8px] text-white/35 font-bold uppercase tracking-wider">{t.label}</p>
                  </div>
                  {done && <CheckCircle2 size={16} className="text-emerald-400" />}
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <HandButton onClick={skipTutorial} dwellMs={900} hitMargin={4} variant="default" className="w-full px-3 py-2.5 text-[9px] !bg-white/5 !border-white/10">
              {lang === 'es' ? 'Saltar tutorial →' : 'Skip tutorial →'}
            </HandButton>
          </div>
        </div>
      )}

      {/* Botones derecha */}
      <div className="absolute top-20 right-6 z-30 flex flex-col gap-6 w-44">
        <HandButton onClick={react} dwellMs={900} graceMs={300} hitMargin={4} variant="cyan" className="px-4 py-3.5 text-[11px]">
          <Sparkles size={14} /> {lang === 'es' ? 'Reaccionar' : 'React'}
        </HandButton>
        <HandButton onClick={clearBeaker} dwellMs={800} graceMs={300} hitMargin={4} variant="red" className="px-4 py-3 text-[10px]">
          <RotateCcw size={13} /> {lang === 'es' ? 'Vaciar' : 'Clear'}
        </HandButton>
        <HandButton onClick={openRecipes} dwellMs={900} graceMs={300} hitMargin={4} variant="orange" className="px-4 py-3 text-[10px]">
          <BookOpen size={13} /> {lang === 'es' ? 'Recetario' : 'Recipes'}
        </HandButton>
        {mode === 'free' && (
          <HandButton onClick={() => setMode('tutorial')} dwellMs={1000} graceMs={300} hitMargin={4} variant="default" className="px-4 py-3 text-[9px] !bg-white/5 !border-white/10">
            <GraduationCap size={13} /> {lang === 'es' ? 'Tutorial' : 'Tutorial'}
          </HandButton>
        )}
      </div>

      {/* Mesa de mezcla */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-10 px-6">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
          {lang === 'es' ? 'Mesa de mezcla' : 'Mixing Table'} {totalCount}/{MAX_TOTAL}
        </div>
        <div className="min-h-[110px] min-w-[280px] max-w-2xl flex flex-wrap items-center justify-center gap-3 px-8 py-5 rounded-[32px] border-2 border-dashed border-white/15 bg-white/[0.03]">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center gap-2 text-white/25">
              <Beaker size={36} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {lang === 'es' ? 'Añade elementos abajo' : 'Add elements below'}
              </span>
            </div>
          ) : (
            Object.keys(comp).filter(k => comp[k] > 0).map(sym => {
              const el = elementBySym[sym];
              return (
                <div key={sym} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/8 border border-white/15">
                  <span className="text-xl font-display font-black italic text-white">{el?.label ?? sym}</span>
                  <span className="text-base font-black text-cyan-400">×{comp[sym]}</span>
                </div>
              );
            })
          )}
        </div>
        <p className="text-[8.5px] font-black uppercase tracking-[0.25em] text-white/25 italic">
          {lang === 'es' 
            ? <>Pon cantidades a tu gusto · pulsa <span className="text-cyan-400">Reaccionar</span> para ver qué ocurre</> 
            : <>Add quantities to your liking · press <span className="text-cyan-400">React</span> to see what happens</>}
        </p>
      </div>

      {/* Paleta inferior */}
      <div className="relative z-20 pb-4 px-4 space-y-3">

        {/* ── Elementos base ── */}
        <div>
          <p className="text-center text-[7.5px] font-black uppercase tracking-[0.35em] text-white/25 mb-2">
            {lang === 'es' ? 'Elementos' : 'Elements'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {baseElements.map(el => (
              <ElementBtn key={el.sym} el={el} disabled={elementsDisabled} onClick={() => addElement(el.sym)} />
            ))}
          </div>
        </div>

        {/* ── Reactivos compuestos ── */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-white/10" />
            <p className="text-[7.5px] font-black uppercase tracking-[0.35em] text-amber-400/70">
              {lang === 'es' ? 'Reactivos de laboratorio' : 'Laboratory Reagents'}
            </p>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {compoundReagents.map(el => (
              <ElementBtn key={el.sym} el={el} disabled={elementsDisabled} onClick={() => addElement(el.sym)} />
            ))}
          </div>
        </div>

        {elemLocked && !overlayOpen && (
          <p className="text-center text-[9px] font-black uppercase tracking-widest text-amber-400 animate-pulse">
            {lang === 'es' ? 'Recargando…' : 'Recharging...'}
          </p>
        )}
      </div>

      {/* ── Resultado ── */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/65 flex items-center justify-center px-6">
            <motion.div
              initial={{ scale: 0.85, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 12 }}
              transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
              className={`w-full max-w-md rounded-[34px] border-2 ${rs.ring} bg-[#0a0a18]/95 shadow-2xl ${rs.glow} overflow-hidden`}>
              <div className={`flex items-center gap-2 px-6 py-3 ${rs.chip} border-b ${rs.ring}`}>
                {result.type === 'danger'
                  ? <AlertTriangle size={14} className="text-red-400" />
                  : <Sparkles size={14} className={rs.text} />}
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${rs.text}`}>{rs.label}</span>
              </div>
              <div className="px-7 py-5 flex flex-col items-center text-center gap-3">
                <div className={`text-6xl ${result.type === 'danger' ? 'animate-pulse' : ''}`}>{result.emoji}</div>
                <div>
                  <h3 className={`text-3xl font-display font-black italic uppercase tracking-tight ${rs.text}`}>{result.name}</h3>
                  {result.res && result.res !== '—' && <p className="text-sm font-mono font-black text-white/50 mt-1">{result.res}</p>}
                </div>
                <p className="text-[12px] text-white/70 leading-relaxed">{result.text}</p>
                {result.type === 'danger' && (
                  <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400">
                      {lang === 'es' ? 'Nunca hagas esta mezcla en la vida real' : 'Never make this mixture in real life'}
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-5 flex justify-center">
                <HandButton onClick={closeResult} dwellMs={900} graceMs={700} variant={result.type === 'danger' ? 'red' : 'emerald'} className="px-10 py-4 text-xs">
                  <Beaker size={14} /> {lang === 'es' ? 'Seguir experimentando' : 'Keep experimenting'}
                </HandButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recetario ── */}
      <AnimatePresence>
        {showRecipes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center px-6">
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 8 }}
              transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-2xl max-h-[82%] rounded-[32px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-7 py-4 border-b border-white/10 bg-orange-500/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-orange-400" />
                  <span className="text-sm font-display font-black italic uppercase tracking-tight text-white">
                    {lang === 'es' ? 'Recetario de reacciones' : 'Reaction Recipes'}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                  {lang === 'es' 
                    ? `${recipes.length} recetas · 👆 mueve la mano para desplazar` 
                    : `${recipes.length} recipes · 👆 move hand to scroll`}
                </span>
              </div>
              <div ref={recipesScrollRef} className="overflow-y-auto px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {recipes.map(r => {
                  const st = typeStyle[r.type];
                  const formula = Object.keys(r.comp).map(k => `${r.comp[k]} ${elementBySym[k]?.label ?? k}`).join(' + ');
                  return (
                    <div key={r.res + r.name} className={`flex items-center gap-3 p-3 rounded-2xl border ${st.ring} ${st.chip}`}>
                      <div className="text-2xl">{r.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-black ${st.text} truncate`}>{r.name}</p>
                        <p className="text-[9px] text-white/45 font-bold truncate">{formula}</p>
                      </div>
                      <span className="text-[10px] font-mono font-black text-white/50 shrink-0">{r.res}</span>
                    </div>
                  );
                })}
              </div>
              <div className="px-6 py-4 border-t border-white/10 flex justify-center flex-shrink-0">
                <HandButton onClick={closeRecipes} dwellMs={900} graceMs={600} hitMargin={4} variant="orange" className="px-10 py-3.5 text-xs">
                  <X size={14} /> {lang === 'es' ? 'Cerrar recetario' : 'Close Recipes'}
                </HandButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Intro ── */}
      <AnimatePresence>
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center px-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-lg rounded-[36px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-2xl">
                <FlaskConical size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">
                {lang === 'es' ? 'Laboratorio de Química' : 'Chemistry Lab'}
              </h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                {lang === 'es' 
                  ? <>Selecciona <span className="text-cyan-400 font-black">elementos base</span> y <span className="text-amber-400 font-black">reactivos de laboratorio</span> en las cantidades que quieras (por ejemplo <span className="text-cyan-400 font-black">2 H + 1 O = Agua</span>), luego pulsa <span className="text-cyan-400 font-black">Reaccionar</span>. Hay <span className="text-emerald-400 font-black">{recipes.length} reacciones</span> por descubrir, incluyendo algunas <span className="text-red-400 font-black">mezclas peligrosas que nunca debes hacer</span>.</>
                  : <>Select <span className="text-cyan-400 font-black">base elements</span> and <span className="text-amber-400 font-black">laboratory reagents</span> in the quantities you want (e.g. <span className="text-cyan-400 font-black">2 H + 1 O = Water</span>), then press <span className="text-cyan-400 font-black">React</span>. There are <span className="text-emerald-400 font-black">{recipes.length} reactions</span> to discover, including some <span className="text-red-400 font-black">dangerous mixtures you should never make</span>.</>}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-1">
                <HandButton onClick={startTutorial} dwellMs={900} graceMs={600} hitMargin={4} variant="cyan" className="flex-1 px-6 py-4 text-sm">
                  <GraduationCap size={16} /> {lang === 'es' ? 'Empezar tutorial' : 'Start tutorial'}
                </HandButton>
                <HandButton onClick={skipTutorial} dwellMs={900} graceMs={600} hitMargin={4} variant="default" className="flex-1 px-6 py-4 text-sm !bg-white/5 !border-white/10">
                  {lang === 'es' ? 'Saltar e ir libre →' : 'Skip and play free →'}
                </HandButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GameInstruction
        messageEs="Apunta tu mano sobre los botones de los elementos para añadirlos a la mezcla"
        messageEn="Point your hand over the element buttons to add them to the mix"
        lang={lang}
        icon="🧪"
        position="top"
      />
    </div>
  );
});

export default LabModule;

