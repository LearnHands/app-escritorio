import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, RotateCcw, Info, X, BookOpen } from 'lucide-react';
import HandButton from '../HandButton';

const INITIAL_BALANCE = 500;

const TRANSACTIONS = [
  // Ingresos (income)
  { id: 'salary',    label: 'Sueldo mensual',    amount: +800,  emoji: '💼', type: 'income',  category: 'Trabajo',   desc: 'El dinero que recibes por trabajar se llama sueldo o ingreso.' },
  { id: 'sale',      label: 'Venta de producto', amount: +120,  emoji: '🛍️', type: 'income',  category: 'Ventas',    desc: 'Cuando vendes algo obtienes un ingreso por la venta.' },
  { id: 'gift',      label: 'Regalo / Donación',  amount: +50,   emoji: '🎁', type: 'income',  category: 'Otros',     desc: 'Las donaciones son ingresos que no requieren trabajo directo.' },
  { id: 'interest',  label: 'Interés bancario',  amount: +30,   emoji: '🏦', type: 'income',  category: 'Ahorros',   desc: 'El banco paga un interés por guardar tu dinero.' },
  // Gastos (expenses)
  { id: 'rent',      label: 'Arriendo',          amount: -300,  emoji: '🏠', type: 'expense', category: 'Vivienda',  desc: 'El arriendo es un gasto fijo: se paga cada mes sin falta.' },
  { id: 'food',      label: 'Comida y mercado',  amount: -150,  emoji: '🛒', type: 'expense', category: 'Alimentos', desc: 'Los alimentos son un gasto necesario (básico) de toda persona.' },
  { id: 'transport', label: 'Transporte',         amount: -60,   emoji: '🚌', type: 'expense', category: 'Transporte',desc: 'El costo de movilizarse es un gasto variable según el uso.' },
  { id: 'school',    label: 'Útiles escolares',  amount: -40,   emoji: '📚', type: 'expense', category: 'Educación', desc: 'Invertir en educación es un gasto productivo: genera valor futuro.' },
  { id: 'luxury',    label: 'Ropa de lujo',      amount: -200,  emoji: '👗', type: 'expense', category: 'Lujo',      desc: 'Los gastos de lujo son prescindibles. ¡Cuidado con excederse!' },
  { id: 'phone',     label: 'Teléfono / Internet', amount: -45, emoji: '📱', type: 'expense', category: 'Servicios', desc: 'Los servicios de comunicación son gastos fijos en la era digital.' },
  { id: 'savings',   label: 'Ahorrar en banco',  amount: -100,  emoji: '🐷', type: 'expense', category: 'Ahorro',    desc: 'Ahorrar es guardar dinero para el futuro. ¡No es un gasto perdido!' },
  { id: 'health',    label: 'Médico / Salud',    amount: -80,   emoji: '🏥', type: 'expense', category: 'Salud',     desc: 'Los gastos de salud son fundamentales y deben estar en todo presupuesto.' },
];

const TIPS = [
  { title: 'Presupuesto', text: 'Un presupuesto lista todos tus ingresos y gastos para planificar cómo usar el dinero antes de recibirlo.', emoji: '📋' },
  { title: 'Ingreso vs Gasto', text: 'Ingreso = dinero que entra. Gasto = dinero que sale. La diferencia es tu saldo. Si gastas más de lo que ganas, hay déficit.', emoji: '⚖️' },
  { title: 'Ahorro', text: 'Ahorrar es guardar parte de tus ingresos. La regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro.', emoji: '🐷' },
  { title: 'Deuda', text: 'Una deuda es dinero que debes pagar. Si el saldo baja de 0, estás en deuda. Es importante evitar gastar más de lo que tienes.', emoji: '💳' },
];

const fmt = (n) => (n >= 0 ? '+' : '') + n.toLocaleString('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtAbs = (n) => Math.abs(n).toLocaleString('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const AccountingModule = memo(({ addPoints }) => {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [ledger, setLedger] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [earned, setEarned] = useState(0);

  const addPointsRef = React.useRef(addPoints);
  addPointsRef.current = addPoints;

  const applyTransaction = useCallback((tx) => {
    setBalance(b => b + tx.amount);
    setLedger(prev => [{ ...tx, timestamp: Date.now() }, ...prev.slice(0, 14)]);
    setSelected(tx);
    const pts = tx.type === 'income' ? 10 : 8;
    addPointsRef.current(pts);
    setEarned(e => e + pts);
  }, []);

  const reset = useCallback(() => {
    setBalance(INITIAL_BALANCE);
    setLedger([]);
    setSelected(null);
    setEarned(0);
  }, []);

  const totalIncome  = ledger.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = ledger.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const isProfit = balance >= INITIAL_BALANCE;

  const balanceColor = balance > INITIAL_BALANCE * 1.2 ? '#00ff88' : balance > INITIAL_BALANCE * 0.6 ? '#ffcc00' : balance < 0 ? '#ff4444' : '#88ccff';

  return (
    <div className="w-full h-full relative overflow-hidden select-none flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <DollarSign size={16} className="text-emerald-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Contabilidad Gestual</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: balanceColor }}>
          Saldo: {fmtAbs(balance)}{balance < 0 ? ' (DEUDA)' : ''}
        </span>
        <div className="w-px h-4 bg-white/20" />
        {isProfit
          ? <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400"><TrendingUp size={11} /> Ganancia</span>
          : <span className="flex items-center gap-1 text-[9px] font-black text-red-400"><TrendingDown size={11} /> Pérdida</span>
        }
      </div>

      <div className="flex-1 flex gap-4 pt-16 pb-2 px-5 overflow-hidden">

        {/* Left: Summary + Ledger */}
        <div className="flex flex-col gap-3 w-56 flex-shrink-0">
          {/* Balance card */}
          <div className="glass-dark rounded-2xl border border-white/10 p-4 text-center">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Saldo actual</p>
            <p className="text-3xl font-display font-black italic" style={{ color: balanceColor }}>
              {fmtAbs(balance)}
            </p>
            <div className="flex gap-3 mt-3 text-center">
              <div className="flex-1">
                <p className="text-[7px] font-black uppercase text-emerald-400 tracking-wider">Ingresos</p>
                <p className="text-sm font-black text-emerald-400">{fmtAbs(totalIncome)}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="flex-1">
                <p className="text-[7px] font-black uppercase text-red-400 tracking-wider">Gastos</p>
                <p className="text-sm font-black text-red-400">{fmtAbs(totalExpense)}</p>
              </div>
            </div>
          </div>

          {/* Ledger */}
          <div className="glass-dark rounded-2xl border border-white/10 p-3 flex-1 overflow-hidden flex flex-col">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">Registro ({ledger.length})</p>
            <div className="overflow-y-auto flex-1 space-y-1.5">
              {ledger.length === 0 && <p className="text-[9px] text-white/25 italic">Sin movimientos</p>}
              {ledger.map((tx, i) => (
                <div key={tx.timestamp + i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <span className="text-base">{tx.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black truncate text-white/80">{tx.label}</p>
                  </div>
                  <span className={`text-[10px] font-black ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(tx.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <HandButton onClick={reset} dwellMs={800} variant="red" className="px-4 py-2.5 text-[10px]">
            <RotateCcw size={12} /> Reiniciar
          </HandButton>
          <HandButton onClick={() => setShowTips(true)} dwellMs={800} variant="purple" className="px-4 py-2.5 text-[10px]">
            <BookOpen size={12} /> Aprender
          </HandButton>
        </div>

        {/* Center: Transaction buttons */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          {/* Income */}
          <div className="glass-dark rounded-2xl border border-emerald-500/20 p-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Ingresos — dinero que entra</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TRANSACTIONS.filter(t => t.type === 'income').map(tx => (
                <HandButton key={tx.id} onClick={() => applyTransaction(tx)} dwellMs={750} cooldownMs={600} variant="emerald"
                  className="px-3 py-3 text-[10px] flex-col gap-1 h-auto !rounded-xl">
                  <span className="text-xl">{tx.emoji}</span>
                  <span className="text-center leading-tight">{tx.label}</span>
                  <span className="text-emerald-300 font-black">{fmt(tx.amount)}</span>
                </HandButton>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div className="glass-dark rounded-2xl border border-red-500/20 p-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={13} className="text-red-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Gastos — dinero que sale</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TRANSACTIONS.filter(t => t.type === 'expense').map(tx => (
                <HandButton key={tx.id} onClick={() => applyTransaction(tx)} dwellMs={750} cooldownMs={600} variant="red"
                  className="px-3 py-3 text-[10px] flex-col gap-1 h-auto !rounded-xl">
                  <span className="text-xl">{tx.emoji}</span>
                  <span className="text-center leading-tight">{tx.label}</span>
                  <span className="text-red-300 font-black">{fmt(tx.amount)}</span>
                </HandButton>
              ))}
            </div>
          </div>
        </div>

        {/* Right: selected transaction info */}
        <div className="w-48 flex-shrink-0 flex flex-col gap-3">
          <div className="glass-dark rounded-2xl border border-white/10 p-4 flex flex-col items-center text-center gap-3 min-h-[160px]">
            {selected ? (
              <>
                <span className="text-4xl">{selected.emoji}</span>
                <p className="text-[10px] font-black text-white/80 leading-tight">{selected.label}</p>
                <span className={`text-lg font-black ${selected.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(selected.amount)}</span>
                <p className="text-[9px] text-white/50 leading-relaxed">{selected.desc}</p>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${selected.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{selected.category}</span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/25 mt-4">
                <DollarSign size={28} />
                <p className="text-[9px] font-black uppercase tracking-wider text-center">Activa una transacción para ver su información</p>
              </div>
            )}
          </div>

          {/* Balance bar */}
          <div className="glass-dark rounded-2xl border border-white/10 p-3">
            <p className="text-[7px] font-black uppercase tracking-widest text-white/40 mb-2">Salud financiera</p>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, (balance / (INITIAL_BALANCE * 2)) * 100))}%`, backgroundColor: balanceColor }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[7px] text-red-400 font-black">$0</span>
              <span className="text-[7px] text-emerald-400 font-black">$1000</span>
            </div>
          </div>

          {/* Points */}
          <div className="glass-dark rounded-xl border border-purple-500/20 px-3 py-2 text-center">
            <p className="text-[7px] font-black uppercase tracking-widest text-white/40">Puntos ganados</p>
            <p className="text-2xl font-display font-black text-purple-400 italic">{earned}</p>
          </div>
        </div>
      </div>

      {/* Tips overlay */}
      <AnimatePresence>
        {showTips && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-[32px] border border-purple-500/30 bg-[#0a0a18]/95 shadow-2xl p-7 flex flex-col items-center gap-4 text-center">
              <div className="text-5xl">{TIPS[tipIdx].emoji}</div>
              <h3 className="text-xl font-display font-black italic uppercase text-purple-400">{TIPS[tipIdx].title}</h3>
              <p className="text-[12px] text-white/70 leading-relaxed">{TIPS[tipIdx].text}</p>
              <div className="flex gap-3">
                <HandButton onClick={() => setTipIdx(i => (i - 1 + TIPS.length) % TIPS.length)} dwellMs={700} variant="default" className="px-5 py-2.5 text-[10px] !bg-white/5">← Anterior</HandButton>
                <HandButton onClick={() => setTipIdx(i => (i + 1) % TIPS.length)} dwellMs={700} variant="purple" className="px-5 py-2.5 text-[10px]">Siguiente →</HandButton>
              </div>
              <div className="flex gap-1.5">{TIPS.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === tipIdx ? 'bg-purple-400' : 'bg-white/20'}`} />)}</div>
              <HandButton onClick={() => setShowTips(false)} dwellMs={800} graceMs={600} variant="default" className="px-8 py-3 text-[10px] !bg-white/5">
                <X size={12} /> Cerrar
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro */}
      <AnimatePresence>
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center px-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="text-7xl">💰</div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">Contabilidad Gestual</h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                Aprende a manejar el dinero. Activa <span className="text-emerald-400 font-black">ingresos</span> y <span className="text-red-400 font-black">gastos</span> con tu mano y observa cómo cambia tu saldo.
                ¡La meta es mantener un saldo <span className="text-yellow-400 font-black">positivo y saludable</span>!
              </p>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="emerald" className="px-10 py-4 text-sm">
                <DollarSign size={16} /> ¡Empezar!
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AccountingModule;
