import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, RotateCcw, Info, X, BookOpen } from 'lucide-react';
import HandButton from '../HandButton';
import GameInstruction from '../GameInstruction';

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

const TRANSACTIONS_EN = [
  // Income
  { id: 'salary',    label: 'Monthly salary',    amount: +800,  emoji: '💼', type: 'income',  category: 'Work',      desc: 'The money you receive for working is called salary or income.' },
  { id: 'sale',      label: 'Product sale',      amount: +120,  emoji: '🛍️', type: 'income',  category: 'Sales',     desc: 'When you sell something, you obtain an income from the sale.' },
  { id: 'gift',      label: 'Gift / Donation',   amount: +50,   emoji: '🎁', type: 'income',  category: 'Other',     desc: 'Donations are income that does not require direct work.' },
  { id: 'interest',  label: 'Bank interest',     amount: +30,   emoji: '🏦', type: 'income',  category: 'Savings',   desc: 'The bank pays interest for keeping your money.' },
  // Expenses
  { id: 'rent',      label: 'Rent',              amount: -300,  emoji: '🏠', type: 'expense', category: 'Housing',   desc: 'Rent is a fixed expense: it is paid every month without fail.' },
  { id: 'food',      label: 'Food & Groceries',  amount: -150,  emoji: '🛒', type: 'expense', category: 'Food',      desc: 'Food is a necessary (basic) expense for everyone.' },
  { id: 'transport', label: 'Transportation',    amount: -60,   emoji: '🚌', type: 'expense', category: 'Transport', desc: 'The cost of moving around is a variable expense depending on use.' },
  { id: 'school',    label: 'School supplies',   amount: -40,   emoji: '📚', type: 'expense', category: 'Education', desc: 'Investing in education is a productive expense: it generates future value.' },
  { id: 'luxury',    label: 'Luxury clothing',   amount: -200,  emoji: '👗', type: 'expense', category: 'Luxury',    desc: 'Luxury expenses are dispensable. Careful not to overspend!' },
  { id: 'phone',     label: 'Phone / Internet',  amount: -45,   emoji: '📱', type: 'expense', category: 'Services',  desc: 'Communication services are fixed expenses in the digital age.' },
  { id: 'savings',   label: 'Save in bank',      amount: -100,  emoji: '🐷', type: 'expense', category: 'Saving',    desc: 'Saving is setting money aside for the future. It is not lost expense!' },
  { id: 'health',    label: 'Doctor / Health',   amount: -80,   emoji: '🏥', type: 'expense', category: 'Health',    desc: 'Health expenses are essential and should be in every budget.' },
];

const TIPS = [
  { title: 'Presupuesto', text: 'Un presupuesto lista todos tus ingresos y gastos para planificar cómo usar el dinero antes de recibirlo.', emoji: '📋' },
  { title: 'Ingreso vs Gasto', text: 'Ingreso = dinero que entra. Gasto = dinero que sale. La diferencia es tu saldo. Si gastas más de lo que ganas, hay déficit.', emoji: '⚖️' },
  { title: 'Ahorro', text: 'Ahorrar es guardar parte de tus ingresos. La regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro.', emoji: '🐷' },
  { title: 'Deuda', text: 'Una deuda es dinero que debes pagar. Si el saldo baja de 0, estás en deuda. Es importante evitar gastar más de lo que tienes.', emoji: '💳' },
];

const TIPS_EN = [
  { title: 'Budget', text: 'A budget lists all your income and expenses to plan how to use money before receiving it.', emoji: '📋' },
  { title: 'Income vs Expense', text: 'Income = money coming in. Expense = money going out. The difference is your balance. If you spend more than you earn, there is a deficit.', emoji: '⚖️' },
  { title: 'Savings', text: 'Saving is setting aside part of your income. The 50/30/20 rule: 50% needs, 30% wants, 20% savings.', emoji: '🐷' },
  { title: 'Debt', text: 'A debt is money you must pay back. If your balance drops below 0, you are in debt. It is important to avoid spending more than you have.', emoji: '💳' },
];

const fmt = (n, lang) => (n >= 0 ? '+' : '') + n.toLocaleString(lang === 'es' ? 'es-EC' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtAbs = (n, lang) => Math.abs(n).toLocaleString(lang === 'es' ? 'es-EC' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const AccountingModule = memo(({ addPoints, lang = 'es' }) => {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [ledger, setLedger] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [earned, setEarned] = useState(0);
  const overlayOpen = showIntro || showTips;

  const addPointsRef = React.useRef(addPoints);
  addPointsRef.current = addPoints;

  const transactions = lang === 'es' ? TRANSACTIONS : TRANSACTIONS_EN;
  const tips = lang === 'es' ? TIPS : TIPS_EN;

  const applyTransaction = useCallback((tx) => {
    setBalance(b => b + tx.amount);
    setLedger(prev => [{ id: tx.id, amount: tx.amount, type: tx.type, emoji: tx.emoji, timestamp: Date.now() }, ...prev.slice(0, 14)]);
    setSelected(tx.id);
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

  const selectedTx = transactions.find(t => t.id === selected);

  return (
    <div className={`w-full h-full relative overflow-hidden select-none flex flex-col ${overlayOpen ? 'pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 glass-dark px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl">
        <DollarSign size={16} className="text-emerald-400" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">
          {lang === 'es' ? 'Contabilidad Gestual' : 'Gesture Accounting'}
        </span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: balanceColor }}>
          {lang === 'es' ? 'Saldo' : 'Balance'}: {fmtAbs(balance, lang)}{balance < 0 ? (lang === 'es' ? ' (DEUDA)' : ' (DEBT)') : ''}
        </span>
        <div className="w-px h-4 bg-white/20" />
        {isProfit
          ? <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400"><TrendingUp size={11} /> {lang === 'es' ? 'Ganancia' : 'Profit'}</span>
          : <span className="flex items-center gap-1 text-[9px] font-black text-red-400"><TrendingDown size={11} /> {lang === 'es' ? 'Pérdida' : 'Loss'}</span>
        }
      </div>

      <div className={`flex-1 flex gap-4 pt-16 pb-2 px-5 overflow-hidden ${overlayOpen ? 'pointer-events-none' : ''}`}>

        {/* Left: Summary + Ledger */}
        <div className="flex flex-col gap-3 w-56 flex-shrink-0">
          {/* Balance card */}
          <div className="glass-dark rounded-2xl border border-white/10 p-4 text-center">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">
              {lang === 'es' ? 'Saldo actual' : 'Current Balance'}
            </p>
            <p className="text-3xl font-display font-black italic" style={{ color: balanceColor }}>
              {fmtAbs(balance, lang)}
            </p>
            <div className="flex gap-3 mt-3 text-center">
              <div className="flex-1">
                <p className="text-[7px] font-black uppercase text-emerald-400 tracking-wider">
                  {lang === 'es' ? 'Ingresos' : 'Income'}
                </p>
                <p className="text-sm font-black text-emerald-400">{fmtAbs(totalIncome, lang)}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="flex-1">
                <p className="text-[7px] font-black uppercase text-red-400 tracking-wider">
                  {lang === 'es' ? 'Gastos' : 'Expenses'}
                </p>
                <p className="text-sm font-black text-red-400">{fmtAbs(totalExpense, lang)}</p>
              </div>
            </div>
          </div>

          {/* Ledger */}
          <div className="glass-dark rounded-2xl border border-white/10 p-3 flex-1 overflow-hidden flex flex-col">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">
              {lang === 'es' ? `Registro (${ledger.length})` : `Ledger (${ledger.length})`}
            </p>
            <div className="overflow-y-auto flex-1 space-y-1.5">
              {ledger.length === 0 && <p className="text-[9px] text-white/25 italic">{lang === 'es' ? 'Sin movimientos' : 'No transactions'}</p>}
              {ledger.map((item, i) => {
                const tx = transactions.find(t => t.id === item.id);
                if (!tx) return null;
                return (
                  <div key={item.timestamp + i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${item.type === 'income' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <span className="text-base">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black truncate text-white/80">{tx.label}</p>
                    </div>
                    <span className={`text-[10px] font-black ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt(item.amount, lang)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <HandButton onClick={reset} disabled={overlayOpen} dwellMs={800} variant="red" className="px-4 py-2.5 text-[10px]">
            <RotateCcw size={12} /> {lang === 'es' ? 'Reiniciar' : 'Reset'}
          </HandButton>
          <HandButton onClick={() => setShowTips(true)} disabled={overlayOpen} dwellMs={800} variant="purple" className="px-4 py-2.5 text-[10px]">
            <BookOpen size={12} /> {lang === 'es' ? 'Aprender' : 'Learn'}
          </HandButton>
        </div>

        {/* Center: Transaction buttons */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          {/* Income */}
          <div className="glass-dark rounded-2xl border border-emerald-500/20 p-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                {lang === 'es' ? 'Ingresos — dinero que entra' : 'Income — money coming in'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {transactions.filter(t => t.type === 'income').map(tx => (
                <HandButton key={tx.id} onClick={() => applyTransaction(tx)} disabled={overlayOpen} dwellMs={750} cooldownMs={600} variant="emerald"
                  className="px-3 py-3 text-[10px] flex-col gap-1 h-auto !rounded-xl">
                  <span className="text-xl">{tx.emoji}</span>
                  <span className="text-center leading-tight">{tx.label}</span>
                  <span className="text-emerald-300 font-black">{fmt(tx.amount, lang)}</span>
                </HandButton>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div className="glass-dark rounded-2xl border border-red-500/20 p-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={13} className="text-red-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-red-400">
                {lang === 'es' ? 'Gastos — dinero que sale' : 'Expenses — money going out'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {transactions.filter(t => t.type === 'expense').map(tx => (
                <HandButton key={tx.id} onClick={() => applyTransaction(tx)} disabled={overlayOpen} dwellMs={750} cooldownMs={600} variant="red"
                  className="px-3 py-3 text-[10px] flex-col gap-1 h-auto !rounded-xl">
                  <span className="text-xl">{tx.emoji}</span>
                  <span className="text-center leading-tight">{tx.label}</span>
                  <span className="text-red-300 font-black">{fmt(tx.amount, lang)}</span>
                </HandButton>
              ))}
            </div>
          </div>
        </div>

        {/* Right: selected transaction info */}
        <div className="w-48 flex-shrink-0 flex flex-col gap-3">
          <div className="glass-dark rounded-2xl border border-white/10 p-4 flex flex-col items-center text-center gap-3 min-h-[160px]">
            {selectedTx ? (
              <>
                <span className="text-4xl">{selectedTx.emoji}</span>
                <p className="text-[10px] font-black text-white/80 leading-tight">{selectedTx.label}</p>
                <span className={`text-lg font-black ${selectedTx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(selectedTx.amount, lang)}</span>
                <p className="text-[9px] text-white/50 leading-relaxed">{selectedTx.desc}</p>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${selectedTx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{selectedTx.category}</span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/25 mt-4">
                <DollarSign size={28} />
                <p className="text-[9px] font-black uppercase tracking-wider text-center">
                  {lang === 'es' ? 'Activa una transacción para ver su información' : 'Activate a transaction to view its details'}
                </p>
              </div>
            )}
          </div>

          {/* Balance bar */}
          <div className="glass-dark rounded-2xl border border-white/10 p-3">
            <p className="text-[7px] font-black uppercase tracking-widest text-white/40 mb-2">
              {lang === 'es' ? 'Salud financiera' : 'Financial Health'}
            </p>
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
            <p className="text-[7px] font-black uppercase tracking-widest text-white/40">
              {lang === 'es' ? 'Puntos ganados' : 'Points Earned'}
            </p>
            <p className="text-2xl font-display font-black text-purple-400 italic">{earned}</p>
          </div>
        </div>
      </div>

      {/* Tips overlay */}
      <AnimatePresence>
        {showTips && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center px-8 pointer-events-auto">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-[32px] border border-purple-500/30 bg-[#0a0a18]/95 shadow-2xl p-7 flex flex-col items-center gap-4 text-center">
              <div className="text-5xl">{tips[tipIdx].emoji}</div>
              <h3 className="text-xl font-display font-black italic uppercase text-purple-400">{tips[tipIdx].title}</h3>
              <p className="text-[12px] text-white/70 leading-relaxed">{tips[tipIdx].text}</p>
              <div className="flex gap-3">
                <HandButton onClick={() => setTipIdx(i => (i - 1 + tips.length) % tips.length)} dwellMs={700} variant="default" className="px-5 py-2.5 text-[10px] !bg-white/5">
                  {lang === 'es' ? '← Anterior' : '← Previous'}
                </HandButton>
                <HandButton onClick={() => setTipIdx(i => (i + 1) % tips.length)} dwellMs={700} variant="purple" className="px-5 py-2.5 text-[10px]">
                  {lang === 'es' ? 'Siguiente →' : 'Next →'}
                </HandButton>
              </div>
              <div className="flex gap-1.5">{tips.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === tipIdx ? 'bg-purple-400' : 'bg-white/20'}`} />)}</div>
              <HandButton onClick={() => setShowTips(false)} dwellMs={800} graceMs={600} variant="default" className="px-8 py-3 text-[10px] !bg-white/5">
                <X size={12} /> {lang === 'es' ? 'Cerrar' : 'Close'}
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro */}
      <AnimatePresence>
        {showIntro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center px-8 pointer-events-auto">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-[36px] border border-white/10 bg-[#0a0a18]/96 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
              <div className="text-7xl">💰</div>
              <h2 className="text-3xl font-display font-black italic uppercase tracking-tight text-gradient">
                {lang === 'es' ? 'Contabilidad Gestual' : 'Gesture Accounting'}
              </h2>
              <p className="text-[12px] text-white/60 leading-relaxed">
                {lang === 'es' 
                  ? <>Aprende a manejar el dinero. Activa <span className="text-emerald-400 font-black">ingresos</span> y <span className="text-red-400 font-black">gastos</span> con tu mano y observa cómo cambia tu saldo. ¡La meta es mantener un saldo <span className="text-yellow-400 font-black">positivo y saludable</span>!</>
                  : <>Learn to manage money. Activate <span className="text-emerald-400 font-black">income</span> and <span className="text-red-400 font-black">expenses</span> with your hand and watch your balance change. The goal is to keep a <span className="text-yellow-400 font-black">positive and healthy</span> balance!</>}
              </p>
              <HandButton onClick={() => setShowIntro(false)} dwellMs={900} graceMs={600} variant="emerald" className="px-10 py-4 text-sm">
                <DollarSign size={16} /> {lang === 'es' ? '¡Empezar!' : 'Start!'}
              </HandButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GameInstruction
        messageEs="Apunta tu mano sobre los botones de ingresos y gastos para utilizarlos"
        messageEn="Point your hand over the income and expense buttons to use them"
        lang={lang}
        icon="💵"
      />
    </div>
  );
});

export default AccountingModule;
