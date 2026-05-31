import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { initDB, login } from '../services/db';
import puceLogo from '../assets/puce.png';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { initDB(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const user = login(username.trim(), password);
      if (user) {
        onLogin(user);
      } else {
        setError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-[#03030b] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/15 blur-[140px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <img src={puceLogo} alt="PUCE Logo" className="h-14 w-auto drop-shadow-lg" />
          <div className="h-10 w-px bg-white/20" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sede Quito</span>
        </div>

        {/* Card */}
        <div className="glass-dark p-10 rounded-[32px] border border-white/10 shadow-2xl flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl border border-white/20">
              🖐️
            </div>
            <h1 className="text-3xl font-display font-black italic uppercase tracking-tighter text-gradient">
              LearnHands
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
              Plataforma Educativa · Fe y Alegría Ecuador
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ej. profesor"
                autoComplete="username"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-white/20 text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-white/20 text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-[11px] font-bold text-center bg-red-500/10 py-2.5 rounded-xl border border-red-500/20"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={16} /> Iniciar Sesión</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-[10px] font-bold uppercase tracking-widest mt-6">
          Fe y Alegría Ecuador © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
