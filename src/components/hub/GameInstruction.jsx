import React from 'react';
import { motion } from 'framer-motion';

const GameInstruction = ({ messageEs, messageEn, lang = 'es', icon = '🤏', position = 'bottom' }) => {
  const message = lang === 'es' ? messageEs : (messageEn || messageEs);

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-xl px-6 ${
      position === 'top' ? 'top-16' : 'bottom-6'
    }`}>
      <motion.div
        animate={{ 
          y: [0, -6, 0],
          boxShadow: [
            '0 0 15px rgba(168,85,247,0.3)',
            '0 0 25px rgba(168,85,247,0.6)',
            '0 0 15px rgba(168,85,247,0.3)'
          ]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 3, 
          ease: 'easeInOut' 
        }}
        className="bg-black/85 backdrop-blur-md px-8 py-3.5 rounded-[24px] border-2 border-purple-500/50 flex items-center justify-center gap-4 text-center"
      >
        <span className="text-xl animate-pulse shrink-0">{icon}</span>
        <p className="text-xs md:text-sm font-black uppercase tracking-[0.12em] text-purple-200 font-sans italic leading-snug">
          {message}
        </p>
      </motion.div>
    </div>
  );
};

export default GameInstruction;
